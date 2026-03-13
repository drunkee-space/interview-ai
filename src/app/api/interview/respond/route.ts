// ═══════════════════════════════════════════════════════
// POST /api/interview/respond — Process Candidate Answer
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { addTurn, updateMemoryWithEvaluation } from "@/lib/gemini/memory";
import { evaluateAnswer } from "@/lib/gemini/evaluator";
import { generateNextQuestion } from "@/lib/gemini/interviewer";
import type { RespondRequest, RespondResponse, ConversationMemory } from "@/lib/gemini/types";

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

        let memory: ConversationMemory = { ...incomingMemory };

        // 1. Add candidate's answer to conversation history
        memory = addTurn(memory, "candidate", candidateAnswer);

        // 2. Get the last interviewer question from history
        const lastQuestion = getLastInterviewerMessage(memory);

        // 3. Evaluate the answer using Gemini LLM
        const evaluation = await evaluateAnswer(memory, lastQuestion, candidateAnswer);

        // 4. Update memory with evaluation results
        const currentTopic = evaluation.nextQuestionTopic || "general";
        memory = updateMemoryWithEvaluation(memory, evaluation, currentTopic);

        // 5. Check if interview should end
        const shouldEndInterview = memory.isComplete || memory.questionCount >= memory.maxQuestions;

        // 6. Generate next question (unless interview is ending)
        let nextQuestion = "";
        if (!shouldEndInterview) {
            const questionResult = await generateNextQuestion(memory, evaluation);
            nextQuestion = questionResult.transition
                ? `${questionResult.transition}\n\n${questionResult.question}`
                : questionResult.question;

            // Add AI's next question to memory
            memory = addTurn(memory, "interviewer", nextQuestion);
        } else {
            nextQuestion = "Thank you for completing the interview! Your responses are being evaluated now. Great job today!";
            memory = addTurn(memory, "interviewer", nextQuestion);
            memory = { ...memory, isComplete: true };
        }

        const response: RespondResponse = {
            evaluation,
            nextQuestion,
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

// ─── Helper ────────────────────────────────────────
function getLastInterviewerMessage(memory: ConversationMemory): string {
    const interviewerMessages = memory.conversationHistory.filter(
        (t) => t.role === "interviewer"
    );
    return interviewerMessages.length > 0
        ? interviewerMessages[interviewerMessages.length - 1].content
        : "Tell me about yourself";
}
