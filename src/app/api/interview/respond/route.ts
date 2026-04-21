// ═══════════════════════════════════════════════════════
// POST /api/interview/respond — Process Candidate Answer
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { addTurn, updateMemoryWithEvaluation } from "@/lib/ai/memory";
import { evaluateAnswer } from "@/lib/ai/evaluator";
import { decideNextAction, generateNextQuestion } from "@/lib/ai/interviewer";
import { generateDatasetEntry } from "@/lib/ai/datasetGenerator";
import { enforceTopicLock, enforceStateTransition, enforceTechnicalPhase, validateQuestionOutput, generateFallbackQuestion, enforceLanguage, cleanPostResponseOutput } from "@/lib/ai/systemControl";
import { saveSessionState, appendTranscript, saveQuestionAnalysis } from "@/lib/interviewLogger";
import { cleanTranscript } from "@/lib/ai/transcriptCleaner";
import type { RespondRequest, RespondResponse, ConversationMemory } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const body: RespondRequest = await request.json();
        const { sessionId, candidateAnswer, memory: incomingMemory } = body;

        if (!sessionId || !candidateAnswer || !incomingMemory) {
            return NextResponse.json(
                { error: "sessionId, candidateAnswer, and memory are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        let memory: ConversationMemory = { ...incomingMemory };

        // 1. Clean the audio transcript to fix grammar and clarify syntax
        const cleanResult = await cleanTranscript(candidateAnswer);
        let cleanedAnswer = cleanResult.corrected_text;
        const confidence = cleanResult.confidence;

        // 2. Add processed candidate's answer to conversation history
        memory = addTurn(memory, "candidate", cleanedAnswer);
        await appendTranscript(sessionId, "USER", cleanedAnswer, supabase);

        // 3. Get the last interviewer question from history
        const lastQuestionTurn = memory.conversationHistory.filter(t => t.role === "interviewer").pop();
        const lastQuestion = memory.lastQuestion || (lastQuestionTurn ? lastQuestionTurn.content : "Tell me about yourself");

        const currentTopic = memory.topicsAsked.length > 0 
            ? memory.topicsAsked[memory.topicsAsked.length - 1].topic 
            : "general";

        // Track raw user answer in memory (used by anti-repetition + UI)
        memory.lastUserAnswer = cleanedAnswer;
        memory.lastQuestion = lastQuestion;

        // ─── CONFIDENCE LOOP INTERCEPTION (CRITICAL) ───
        if (confidence === "high" || confidence === "medium") {
            memory.lowConfidenceCount = 0;
        } else {
            memory.lowConfidenceCount = (memory.lowConfidenceCount || 0) + 1;
        }

        if (confidence === "low" || cleanedAnswer === "") {
            const lowCount = memory.lowConfidenceCount || 1;
            let interceptMessage = "";

            if (lowCount === 1) interceptMessage = "I didn’t catch that clearly. Could you repeat?";
            else if (lowCount === 2) interceptMessage = "Could you say that a bit more clearly?";
            else if (lowCount === 3) interceptMessage = "Try speaking a bit slower and clearly so I can understand better.";
            
            if (lowCount < 4) {
                memory = addTurn(memory, "interviewer", interceptMessage);
                await appendTranscript(sessionId, "AI", interceptMessage, supabase);
                await saveSessionState(sessionId, "DISCUSSION", currentTopic, memory, undefined, supabase);

                return NextResponse.json({
                    evaluation: {
                        score: 5, clarity: 5, depth: 5, explanation: "Audio was unclear.", strengths: [], weaknesses: ["UNCLEAR_AUDIO"], improvement_tip: "Speak clearly into the microphone.", skipped: false, concepts_detected: [], is_relevant: true, relevance_score: 5, intent: "NO_ANSWER"
                    },
                    nextQuestion: interceptMessage,
                    updatedMemory: memory,
                    shouldEndInterview: false
                });
            } else {
                // Loop break: Smart Fallback for Unclear Input
                let fallbackQuestion = `No worries, let's continue — what is ${currentTopic}?`;
                if (!currentTopic || currentTopic === "general") fallbackQuestion = "No worries, let's continue — tell me a bit more about your experience.";
                
                memory = addTurn(memory, "interviewer", fallbackQuestion);
                await appendTranscript(sessionId, "AI", fallbackQuestion, supabase);
                await saveSessionState(sessionId, "DISCUSSION", currentTopic, memory, undefined, supabase);

                return NextResponse.json({
                    evaluation: {
                        score: 5, clarity: 5, depth: 5, explanation: "Audio loop break triggered.", strengths: [], weaknesses: ["UNCLEAR_AUDIO"], improvement_tip: "Ensure microphone is working properly.", skipped: true, concepts_detected: [], is_relevant: true, relevance_score: 5, intent: "NO_ANSWER"
                    },
                    nextQuestion: fallbackQuestion,
                    updatedMemory: memory,
                    shouldEndInterview: false
                });
            }
        }

        // 4. Evaluate the cleaned answer
        const evaluation = await evaluateAnswer(lastQuestion, cleanedAnswer, currentTopic);

        // 3.5 Save Adaptive Analysis silently in background
        saveQuestionAnalysis(
            sessionId,
            lastQuestion,
            currentTopic,
            cleanedAnswer,
            evaluation,
            memory.difficulty,
            supabase
        ).catch(err => console.error("Non-fatal: failed to save adaptive question analysis", err));

        // 4. Update memory with evaluation results
        memory = updateMemoryWithEvaluation(memory, evaluation, currentTopic);

        // Handle candidate skip ("I don't know")
        if (evaluation.skipped) {
            const existingSkipped = memory.skippedTopics || [];
            if (!existingSkipped.includes(currentTopic)) {
                memory = {
                    ...memory,
                    skippedTopics: [...existingSkipped, currentTopic],
                    detectedWeaknesses: [...new Set([...(memory.detectedWeaknesses || []), currentTopic])],
                };
            }
        }

        // 5. Decision Engine
        const decision = await decideNextAction(memory, evaluation, currentTopic);

        // System Control: Hard Topic Lock Enforcement
        decision.next_topic = enforceTopicLock(decision.action, currentTopic, decision.next_topic);

        // ─── Concept tracking: apply switch decision to memory ───
        if (decision.action === "SWITCH_CONCEPT" && decision.next_concept) {
            const previousConcept = (memory.currentConcept || "").toLowerCase();
            const visited = new Set([...(memory.visitedConcepts || [])]);
            if (previousConcept) visited.add(previousConcept);
            const remainingQueue = (memory.conceptQueue || []).filter(
                c => c.toLowerCase() !== decision.next_concept!.toLowerCase()
            );
            memory = {
                ...memory,
                currentConcept: decision.next_concept,
                visitedConcepts: Array.from(visited),
                conceptQueue: remainingQueue,
            };
        } else if (!memory.currentConcept) {
            // First technical turn — seed the current concept from the queue
            const queue = memory.conceptQueue || [];
            if (queue.length > 0) {
                memory = {
                    ...memory,
                    currentConcept: queue[0],
                    conceptQueue: queue.slice(1),
                };
            }
        }

        // Phase progression: after q1 we're past INTRO, otherwise stay in TECHNICAL
        memory.phase = memory.questionCount >= 2 ? "TECHNICAL" : "INTRO";

        // ═══ ANSWER VALIDATION INTERCEPTION ═══
        // ═══ TERMINAL STATE INTERCEPTION ═══
        if (decision.action === "END_INTERVIEW" || (decision.action === "WARN" && (memory.irrelevantCount || 0) >= 4)) {
            const terminationMessage = decision.message || 
                "I appreciate your time, but it seems we are having difficulty proceeding. Let's wrap up this discussion phase.";
            
            memory = addTurn(memory, "interviewer", terminationMessage);
            await appendTranscript(sessionId, "AI", terminationMessage, supabase);
            await saveSessionState(sessionId, "CODING", currentTopic, memory, undefined, supabase);

            return NextResponse.json({
                evaluation,
                updatedMemory: memory,
                shouldEndInterview: false,
                nextStep: "CODING",
                message: terminationMessage,
                sessionId: sessionId,
            });
        }

        // ═══ DETERMINISTIC PHASE ENFORCEMENT ═══
        const fullTranscript = memory.conversationHistory.map(t => t.content).join(" ");
        const phaseResult = enforceTechnicalPhase(
            memory.questionCount,
            decision.action,
            decision.next_topic,
            fullTranscript
        );
        decision.action = phaseResult.action as any;
        decision.next_topic = phaseResult.topic;
        memory = { ...memory, isTechnicalStarted: phaseResult.isTechnicalStarted };

        const isCodingRoundReady = memory.isComplete || memory.questionCount >= memory.maxQuestions;
        
        // System Control: Strict Session State Checks
        const stateControl = enforceStateTransition(decision.action, sessionId, false);
        
        // If ready, force transition regardless of LLM hallucination
        if (isCodingRoundReady || stateControl.state === "CODING") {
             const forcedState = enforceStateTransition("MOVE_TO_CODING", sessionId, false);
             
             // ─── Save Session to DB as CODING ───
             await saveSessionState(sessionId, "CODING", currentTopic, memory, undefined, supabase);

             const codingResponse: RespondResponse = {
                 evaluation,
                 updatedMemory: memory,
                 shouldEndInterview: false,
                 nextStep: forcedState.nextStep as any,
                 message: forcedState.message,
                 sessionId: sessionId
             };
             return NextResponse.json(codingResponse);
        }

        // 7. Generate next question via Unified Human-Like Pass
        let rawNextQuestionText: string;
        if (decision.action === "REASK") {
            const reaskPhrases = ["I think we drifted a bit.", "Let's reset.", "We might be off-track.", "Let me ask that again."];
            const randomReask = reaskPhrases[Math.floor(Math.random() * reaskPhrases.length)];
            
            // Do not repeat massive 5-sentence intro blocks. Grab the last sentence.
            let safeQuestion = lastQuestion.trim();
            if (memory.questionCount <= 1 && safeQuestion.length > 100) {
                 const parts = safeQuestion.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
                 if (parts.length > 0) {
                     safeQuestion = parts[parts.length - 1]; // Extract purely the question
                     // Ensure it ends with a question mark if it doesn't have one
                     if (!safeQuestion.endsWith("?")) safeQuestion += "?";
                 }
            }
            
            rawNextQuestionText = `${randomReask} ${safeQuestion}`;
        } else {
            const questionResult = await generateNextQuestion(memory, decision, lastQuestion);
            rawNextQuestionText = questionResult.transition
                ? `${questionResult.transition}\n\n${questionResult.question}`
                : questionResult.question;
        }

        // 7.5 Post-Response Validator
        let nextQuestionText = cleanPostResponseOutput(rawNextQuestionText, memory.conversationHistory);
        if (!nextQuestionText) {
            console.warn("Post-Response cleaning failed or detected harsh loops. Using fail-safe fallback.");
            nextQuestionText = `No worries. Let's try this — What is ${decision.next_topic}?`;
        }

        // ═══ DETERMINISTIC QUESTION VALIDATION ═══
        const validation = validateQuestionOutput(
            nextQuestionText,
            memory.isTechnicalStarted,
            decision.next_topic
        );
        if (!validation.valid) {
            console.warn(`Question rejected (${validation.reason}). Using fallback.`);
            nextQuestionText = generateFallbackQuestion(decision.next_topic);
        }

        // ═══ LANGUAGE ENFORCEMENT ═══
        const langPrefix = enforceLanguage(body.detectedLanguage || "en");
        if (langPrefix) {
            nextQuestionText = `${langPrefix}\n\n${nextQuestionText}`;
        }

        const shouldEndInterview = false;

        // Add to memory + persist as latest question for anti-repetition next turn
        memory = addTurn(memory, "interviewer", nextQuestionText);
        memory.lastQuestion = nextQuestionText;

        // ─── Save transcripts and session to DB as DISCUSSION ───
        await appendTranscript(sessionId, "AI", nextQuestionText, supabase);
        await saveSessionState(sessionId, "DISCUSSION", decision.next_topic, memory, undefined, supabase);

        // 8. Background Dataset Generation
        generateDatasetEntry(
            lastQuestion,
            candidateAnswer,
            evaluation.score,
            currentTopic,
            decision.difficulty
        ).then(entry => {
            // Placeholder: Could save 'entry' to Supabase dataset table here
        });

        const response: RespondResponse = {
            evaluation,
            nextQuestion: nextQuestionText,
            updatedMemory: memory,
            shouldEndInterview,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Interview respond error:", error);
        return NextResponse.json(
            { error: "Failed to process response" },
            { status: 500 }
        );
    }
}
