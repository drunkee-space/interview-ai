// ═══════════════════════════════════════════════════════
// AI Interviewer — Dynamic Question Generation via LLM
// ═══════════════════════════════════════════════════════

import { generateText, generateJson } from "./client";
import {
    buildGreetingPrompt,
    buildDecisionPrompt,
    buildQuestionPrompt,
    buildCodingQuestionPrompt,
} from "./prompts";
import { serializeMemory } from "./memory";
import type { ConversationMemory, AnswerEvaluation, DecisionActionResult } from "./types";

/**
 * Generate a personalized greeting to start the interview.
 */
export async function generateGreeting(
    memory: ConversationMemory,
    previousWeakTopics?: string[]
): Promise<string> {
    const prompt = buildGreetingPrompt(
        memory.personality,
        memory.interviewType,
        memory.difficulty,
        previousWeakTopics,
        memory.interviewType.split(" ")[0] // Extract primary topic (e.g. "SQL" from "SQL (Focus areas: ...)")
    );

    try {
        const text = await generateText(prompt);
        return text.trim() || getFallbackGreeting(memory.interviewType);
    } catch (error) {
        console.error("Failed to generate greeting:", error);
        return getFallbackGreeting(memory.interviewType);
    }
}

/**
 * Run the Decision Engine to determine the next interview action deterministically.
 *
 * Implements the upgraded concept-aware decision rules:
 *   - score >= 7   → DEEPER_QUESTION (stay on concept, raise difficulty)
 *   - score 4-6    → CLARIFY (same concept, simpler follow-up)
 *   - score < 4    → mark concept WEAK; if attempts on same concept >= 2 → SWITCH_CONCEPT
 *   - IRRELEVANT   → REASK
 *   - NO_ANSWER / CONFUSED → CLARIFY/SIMPLIFY
 *   - irrelevantCount >= 4 → WARN
 *   - questionCount >= maxQuestions → END_INTERVIEW
 */
export async function decideNextAction(
    memory: ConversationMemory,
    lastEvaluation: AnswerEvaluation,
    currentTopic: string
): Promise<DecisionActionResult> {

    const difficultyDefault = (memory.difficulty as any) || "medium";

    // 1. END Priority
    if (memory.questionCount >= memory.maxQuestions) {
        return {
            action: "END_INTERVIEW",
            next_topic: currentTopic,
            difficulty: difficultyDefault,
            reason: "Max questions reached",
        };
    }

    // 2. WARN Priority
    const irrelevantCount = memory.irrelevantCount || 0;
    if (irrelevantCount >= 4) {
        return {
            action: "WARN",
            next_topic: currentTopic,
            difficulty: difficultyDefault,
            reason: "Excessive irrelevant answers",
        };
    }

    const intent = lastEvaluation.intent || "VALID_ANSWER";
    const score = lastEvaluation.score ?? 5;
    const concept = (memory.currentConcept || currentTopic || "general").toLowerCase();
    const attemptsOnConcept = (memory.conceptAttempts || {})[concept] || 0;

    // 3. Irrelevant → REASK (re-phrase same question)
    if (intent === "IRRELEVANT" || lastEvaluation.is_relevant === false) {
        return {
            action: "REASK",
            next_topic: currentTopic,
            difficulty: "easy",
            reason: "Answer was not relevant",
            motivation: "supportive",
        };
    }

    // 4. NO_ANSWER → simplify and gentle support
    if (intent === "NO_ANSWER" || lastEvaluation.skipped) {
        // After 2+ low attempts on same concept, switch concept
        if (attemptsOnConcept >= 2) {
            return pickConceptSwitch(memory, currentTopic, "supportive",
                `Skipped ${attemptsOnConcept}x on "${concept}", switching concept`);
        }
        return {
            action: "SIMPLIFY_QUESTION",
            next_topic: currentTopic,
            difficulty: "easy",
            reason: "No answer / skipped — simplifying on same concept",
            motivation: "supportive",
        };
    }

    // 5. Apply spec thresholds on score
    if (score >= 7) {
        return {
            action: "DEEPER_QUESTION",
            next_topic: currentTopic,
            difficulty: "hard",
            reason: `Strong answer (${score}/10) → go deeper on "${concept}"`,
            motivation: "challenging",
        };
    }

    if (score >= 4) {
        // Partial understanding — clarify on same concept
        return {
            action: "CLARIFY",
            next_topic: currentTopic,
            difficulty: "medium",
            reason: `Partial answer (${score}/10) → clarify on "${concept}"`,
            motivation: "neutral",
        };
    }

    // score < 4 → mark weak; switch concept after 2 attempts, otherwise simplify
    if (attemptsOnConcept >= 2) {
        return pickConceptSwitch(memory, currentTopic, "supportive",
            `Low score on "${concept}" after ${attemptsOnConcept} attempts → switch concept`);
    }

    return {
        action: "SIMPLIFY_QUESTION",
        next_topic: currentTopic,
        difficulty: "easy",
        reason: `Low score (${score}/10) on "${concept}", attempt ${attemptsOnConcept + 1}/2`,
        motivation: "supportive",
    };
}

/**
 * Pull the next concept off the queue (skipping ones already visited / current),
 * and return a SWITCH_CONCEPT decision.
 */
function pickConceptSwitch(
    memory: ConversationMemory,
    currentTopic: string,
    motivation: "supportive" | "neutral" | "challenging",
    reason: string
): DecisionActionResult {
    const queue = memory.conceptQueue || [];
    const visited = new Set([
        ...(memory.visitedConcepts || []),
        ...(memory.currentConcept ? [memory.currentConcept.toLowerCase()] : []),
    ]);
    const nextConcept = queue.find(c => !visited.has(c.toLowerCase()));

    if (!nextConcept) {
        // No concepts left → just continue (will move toward coding once question count hits cap)
        return {
            action: "CONTINUE_TOPIC",
            next_topic: currentTopic,
            difficulty: "easy",
            reason: `${reason}; no more concepts in queue → continue topic`,
            motivation,
        };
    }

    return {
        action: "SWITCH_CONCEPT",
        next_topic: currentTopic,
        next_concept: nextConcept,
        difficulty: "easy",
        reason,
        message: `Let's move to another concept. Can you explain ${nextConcept}?`,
        motivation,
    };
}

/**
 * Generate the literal text string for the next question.
 *
 * Implements anti-repetition guard: if the generated question is too similar
 * to the previous one, regenerate once with a stronger "be different" hint.
 * Always falls back to a safe sentence if both attempts fail.
 */
export async function generateNextQuestion(
    memory: ConversationMemory,
    decision: DecisionActionResult,
    lastQuestion: string
): Promise<{ transition: string; question: string; topic: string }> {
    const conversationSummary = serializeMemory(memory);
    const motivation = decision.motivation || memory.motivationLevel || "neutral";
    const targetConcept = decision.next_concept || memory.currentConcept || decision.next_topic;

    const buildPrompt = (extraHint = "") =>
        buildQuestionPrompt(
            decision.action,
            decision.next_topic,
            decision.difficulty,
            memory.detectedWeaknesses,
            [], // past weak topics are implicitly injected
            conversationSummary,
            lastQuestion,
            memory.questionCount,
            motivation,
            targetConcept,
            extraHint
        );

    const tryGenerate = async (extraHint = ""): Promise<{ question: string; topic: string } | null> => {
        try {
            const parsed = await generateJson(buildPrompt(extraHint));
            const q = typeof parsed.question === "string" ? parsed.question.trim() : "";
            if (!q) return null;
            return {
                question: q,
                topic: typeof parsed.topic === "string" ? parsed.topic : decision.next_topic,
            };
        } catch (error) {
            console.error("Failed to generate next question:", error);
            return null;
        }
    };

    let result = await tryGenerate();

    // Anti-repetition guard: regenerate once if too similar to last question
    if (result && isTooSimilar(result.question, lastQuestion)) {
        const retry = await tryGenerate(
            `IMPORTANT: Your previous draft was nearly identical to the last question ("${lastQuestion}"). ` +
            `Generate a clearly DIFFERENT question — different wording AND a different angle.`
        );
        if (retry && !isTooSimilar(retry.question, lastQuestion)) {
            result = retry;
        }
    }

    if (!result) {
        // Fail-safe per spec
        return {
            transition: "",
            question: `No worries, let's continue — what is ${targetConcept}?`,
            topic: decision.next_topic,
        };
    }

    return {
        transition: "",
        question: result.question,
        topic: result.topic,
    };
}

/**
 * Lightweight similarity check used by the anti-repetition guard.
 * Returns true when two questions look nearly identical (case-insensitive,
 * whitespace-normalized) or share a >85% Jaccard token overlap.
 */
function isTooSimilar(a: string, b: string): boolean {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    const na = norm(a);
    const nb = norm(b);
    if (!na || !nb) return false;
    if (na === nb) return true;

    const ta = new Set(na.split(" ").filter(w => w.length > 2));
    const tb = new Set(nb.split(" ").filter(w => w.length > 2));
    if (ta.size === 0 || tb.size === 0) return false;
    let inter = 0;
    ta.forEach(w => { if (tb.has(w)) inter++; });
    const union = ta.size + tb.size - inter;
    return union > 0 && inter / union >= 0.85;
}

/**
 * Generate a coding challenge question based on interview context.
 */
export async function generateCodingQuestion(
    memory: ConversationMemory
): Promise<{ question: string; topic: string; hints: string[] }> {
    const topicsCovered = memory.topicsAsked.map(t => t.topic);
    const weaknesses = memory.detectedWeaknesses;

    // Strong topics = topics where the candidate scored >= 6 during discussion
    const strongTopics = memory.topicsAsked
        .filter(t => t.score !== null && (t.score ?? 0) >= 6)
        .map(t => t.topic);

    const prompt = buildCodingQuestionPrompt(
        memory.interviewType,
        memory.difficulty,
        topicsCovered,
        weaknesses,
        strongTopics
    );

    try {
        const parsed = await generateJson(prompt);

        return {
            question: typeof parsed.question === "string" ? parsed.question : "Write a function to reverse a string without using built-in reverse methods.",
            topic: typeof parsed.topic === "string" ? parsed.topic : "coding",
            hints: Array.isArray(parsed.hints) ? parsed.hints : [],
        };
    } catch (error) {
        console.error("Failed to generate coding question:", error);
        return {
            question: "Write a function to reverse a string without using built-in reverse methods.",
            topic: "coding",
            hints: ["Think about iterating from the end", "Consider using two pointers"],
        };
    }
}

// ─── Fallback ──────────────────────────────────────
function getFallbackGreeting(interviewType: string): string {
    return `Hello! Welcome to your ${interviewType} mock interview. I'll be your interviewer today. We'll go through a series of questions. Let's start — tell me about yourself and your experience.`;
}
