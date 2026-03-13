// ═══════════════════════════════════════════════════════
// AI Evaluator — LLM-Based Answer Evaluation
// ═══════════════════════════════════════════════════════

import { getJsonModel } from "./client";
import { buildEvaluationPrompt, buildFinalEvaluationPrompt } from "./prompts";
import { serializeMemory } from "./memory";
import type { ConversationMemory, AnswerEvaluation, FinalEvaluation } from "./types";

/**
 * Evaluate a single candidate answer using the LLM.
 */
export async function evaluateAnswer(
    memory: ConversationMemory,
    question: string,
    answer: string
): Promise<AnswerEvaluation> {
    const model = getJsonModel();
    const conversationSummary = serializeMemory(memory);

    const prompt = buildEvaluationPrompt(
        memory.interviewType,
        memory.difficulty,
        question,
        answer,
        conversationSummary
    );

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const parsed = JSON.parse(text);

        return {
            score: clampScore(parsed.score),
            feedback: parsed.feedback || "Answer acknowledged.",
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            nextQuestionTopic: parsed.nextQuestionTopic || "general",
        };
    } catch (error) {
        console.error("Failed to evaluate answer:", error);
        return getFallbackEvaluation();
    }
}

/**
 * Generate a comprehensive final evaluation for the entire interview session.
 */
export async function generateFinalEvaluation(
    memory: ConversationMemory
): Promise<FinalEvaluation> {
    const model = getJsonModel();
    const fullSummary = serializeMemory(memory);

    const prompt = buildFinalEvaluationPrompt(
        memory.interviewType,
        memory.difficulty,
        fullSummary
    );

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const parsed = JSON.parse(text);

        return {
            technicalScore: clampScore(parsed.technicalScore),
            communicationScore: clampScore(parsed.communicationScore),
            problemSolvingScore: clampScore(parsed.problemSolvingScore),
            confidenceScore: clampScore(parsed.confidenceScore),
            overallScore: clampScore(parsed.overallScore),
            strongTopics: Array.isArray(parsed.strongTopics) ? parsed.strongTopics : memory.detectedStrengths,
            weakTopics: Array.isArray(parsed.weakTopics) ? parsed.weakTopics : memory.detectedWeaknesses,
            feedbackSummary: parsed.feedbackSummary || "Interview completed.",
            detailedFeedback: parsed.detailedFeedback || "No detailed feedback available.",
            recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps) ? parsed.recommendedNextSteps : [],
        };
    } catch (error) {
        console.error("Failed to generate final evaluation:", error);
        return getFallbackFinalEvaluation(memory);
    }
}

// ─── Helpers ───────────────────────────────────────
function clampScore(score: unknown): number {
    const num = Number(score);
    if (isNaN(num)) return 5;
    return Math.max(1, Math.min(10, Math.round(num)));
}

function getFallbackEvaluation(): AnswerEvaluation {
    return {
        score: 5,
        feedback: "Your answer has been recorded. Let's move on to the next question.",
        strengths: [],
        weaknesses: [],
        nextQuestionTopic: "general",
    };
}

function getFallbackFinalEvaluation(memory: ConversationMemory): FinalEvaluation {
    const avgScore = memory.topicsAsked.length > 0
        ? Math.round(memory.topicsAsked.reduce((sum, t) => sum + (t.score || 5), 0) / memory.topicsAsked.length)
        : 5;

    return {
        technicalScore: avgScore,
        communicationScore: avgScore,
        problemSolvingScore: avgScore,
        confidenceScore: avgScore,
        overallScore: avgScore,
        strongTopics: memory.detectedStrengths,
        weakTopics: memory.detectedWeaknesses,
        feedbackSummary: "Interview completed. Based on the session, the candidate showed varying levels of competency.",
        detailedFeedback: `The candidate covered ${memory.topicsAsked.length} topics during the interview. Strengths were observed in ${memory.detectedStrengths.join(", ") || "no specific areas"}. Areas for improvement include ${memory.detectedWeaknesses.join(", ") || "none specifically identified"}.`,
        recommendedNextSteps: [
            "Practice more coding problems",
            "Review weak topics identified",
            "Take another mock interview to track improvement",
        ],
    };
}
