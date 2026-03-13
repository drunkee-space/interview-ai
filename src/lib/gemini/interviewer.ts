// ═══════════════════════════════════════════════════════
// AI Interviewer — Dynamic Question Generation via LLM
// ═══════════════════════════════════════════════════════

import { getModel, getJsonModel } from "./client";
import {
    buildGreetingPrompt,
    buildQuestionPrompt,
    buildCodingQuestionPrompt,
} from "./prompts";
import { serializeMemory } from "./memory";
import type { ConversationMemory, AnswerEvaluation } from "./types";

/**
 * Generate a personalized greeting to start the interview.
 */
export async function generateGreeting(
    memory: ConversationMemory,
    previousWeakTopics?: string[]
): Promise<string> {
    const model = getModel();
    const prompt = buildGreetingPrompt(
        memory.personality,
        memory.interviewType,
        memory.difficulty,
        previousWeakTopics
    );

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text || getFallbackGreeting(memory.interviewType);
    } catch (error) {
        console.error("Failed to generate greeting:", error);
        return getFallbackGreeting(memory.interviewType);
    }
}

/**
 * Generate the next interview question based on conversation memory and latest evaluation.
 */
export async function generateNextQuestion(
    memory: ConversationMemory,
    evaluation: AnswerEvaluation
): Promise<{ transition: string; question: string; topic: string }> {
    const model = getJsonModel();
    const conversationSummary = serializeMemory(memory);
    const evaluationHint = `
Score: ${evaluation.score}/10
Feedback: ${evaluation.feedback}
Strengths shown: ${evaluation.strengths.join(", ") || "none"}
Weaknesses shown: ${evaluation.weaknesses.join(", ") || "none"}
Suggested next topic: ${evaluation.nextQuestionTopic}
    `.trim();

    const prompt = buildQuestionPrompt(
        memory.personality,
        memory.interviewType,
        memory.difficulty,
        conversationSummary,
        evaluationHint
    );

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const parsed = JSON.parse(text);

        return {
            transition: parsed.transition || "",
            question: parsed.question || "Can you tell me more about your experience?",
            topic: parsed.topic || evaluation.nextQuestionTopic || "general",
        };
    } catch (error) {
        console.error("Failed to generate next question:", error);
        return {
            transition: "Let's continue with another topic.",
            question: `Can you tell me about your experience with ${evaluation.nextQuestionTopic || memory.interviewType}?`,
            topic: evaluation.nextQuestionTopic || "general",
        };
    }
}

/**
 * Generate a coding challenge question based on interview context.
 */
export async function generateCodingQuestion(
    memory: ConversationMemory
): Promise<{ question: string; topic: string; hints: string[] }> {
    const model = getJsonModel();
    const topicsCovered = memory.topicsAsked.map(t => t.topic);
    const weaknesses = memory.detectedWeaknesses;

    const prompt = buildCodingQuestionPrompt(
        memory.interviewType,
        memory.difficulty,
        topicsCovered,
        weaknesses
    );

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const parsed = JSON.parse(text);

        return {
            question: parsed.question || "Write a function to reverse a string without using built-in reverse methods.",
            topic: parsed.topic || "coding",
            hints: parsed.hints || [],
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
    return `Hello! Welcome to your ${interviewType} mock interview. I'll be your interviewer today. We'll go through a series of questions to assess your knowledge and skills. Let's start with a simple question — tell me about yourself and your experience.`;
}
