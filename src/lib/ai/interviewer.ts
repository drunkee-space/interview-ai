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
 */
export async function decideNextAction(
    memory: ConversationMemory,
    lastEvaluation: AnswerEvaluation,
    currentTopic: string
): Promise<DecisionActionResult> {
    
    // 1. END Priority
    if (memory.questionCount >= memory.maxQuestions) {
        return {
            action: "END_INTERVIEW",
            next_topic: currentTopic,
            difficulty: (memory.difficulty as any) || "medium",
            reason: "Max questions reached"
        };
    }

    // 2. WARN Priority
    const irrelevantCount = memory.irrelevantCount || 0;
    if (irrelevantCount >= 4) {
        return {
            action: "WARN",
            next_topic: currentTopic,
            difficulty: (memory.difficulty as any) || "medium",
            reason: "Excessive irrelevant answers"
        };
    }

    // Map intent to core action — use SCORE to determine progression, not just intent
    const intent = lastEvaluation.intent || "VALID_ANSWER";
    const score = lastEvaluation.score || 5;
    let action: DecisionActionResult["action"] = "CONTINUE_TOPIC";
    
    if (intent === "IRRELEVANT") {
        action = "REASK";
    } else if (intent === "PARTIAL_ANSWER") {
        // Partial answers: if score is decent, continue; if poor, simplify
        action = score >= 5 ? "CONTINUE_TOPIC" : "SIMPLIFY_QUESTION";
    } else if (intent === "CONFUSED" || intent === "NO_ANSWER") {
        action = "SIMPLIFY_QUESTION";
    } else {
        // VALID_ANSWER — use score to decide progression
        if (score >= 8) {
            action = "DEEPER_QUESTION";
        } else if (score >= 5) {
            action = "CONTINUE_TOPIC";
        } else {
            action = "SIMPLIFY_QUESTION";
        }
    }

    return {
        action,
        next_topic: currentTopic,
        difficulty: score >= 8 ? "hard" : score >= 5 ? "medium" : "easy",
        reason: `Score ${score}/10, intent: ${intent} → ${action}`
    };
}

/**
 * Generate the literal text string for the next question.
 */
export async function generateNextQuestion(
    memory: ConversationMemory,
    decision: DecisionActionResult,
    lastQuestion: string
): Promise<{ transition: string; question: string; topic: string }> {
    const conversationSummary = serializeMemory(memory);
    
    const prompt = buildQuestionPrompt(
        decision.action,
        decision.next_topic,
        decision.difficulty,
        memory.detectedWeaknesses,
        [], // past weak topics are implicitly injected
        conversationSummary,
        lastQuestion,
        memory.questionCount
    );

    try {
        const parsed = await generateJson(prompt);

        return {
            transition: "", // Optional transition logic
            question: typeof parsed.question === "string" ? parsed.question : "Can you tell me more about your experience?",
            topic: typeof parsed.topic === "string" ? parsed.topic : decision.next_topic,
        };
    } catch (error) {
        console.error("Failed to generate next question:", error);
        return {
            transition: "Let's continue.",
            question: `Can you tell me more about ${decision.next_topic}?`,
            topic: decision.next_topic,
        };
    }
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
