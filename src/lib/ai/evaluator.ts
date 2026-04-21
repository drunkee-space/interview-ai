// ═══════════════════════════════════════════════════════
// AI Evaluator — Deterministic Evaluation Engine
// ═══════════════════════════════════════════════════════

import { generateJson, DEEPSEEK_MODEL } from "./client";
import { buildEvaluationPrompt, buildFinalEvaluationPrompt, buildCodeEvaluationPrompt } from "./prompts";
import { serializeMemory } from "./memory";
import type { ConversationMemory, AnswerEvaluation, FinalEvaluation, CodeEvaluationResult } from "./types";

// ─── Validation Constants ──────────────────────────
const FALLBACK_EVALUATION: AnswerEvaluation = {
    score: 5,
    clarity: 5,
    depth: 5,
    explanation: "Correct idea but missing explanation of key concept.",
    strengths: [],
    weaknesses: ["NEEDS_CLEARER_EXPLANATION"],
    improvement_tip: "Try explaining step-by-step.",
    skipped: false,
    concepts_detected: [],
    is_relevant: true,
    relevance_score: 5,
    intent: "NO_ANSWER",
};

/**
 * Clamp a value to integer within [0, 10]. Returns 5 on invalid input.
 */
function clampScore(score: unknown): number {
    const num = Number(score);
    if (isNaN(num)) return 5;
    return Math.max(0, Math.min(10, Math.round(num)));
}

/**
 * Clamp a value to integer within [0, 100]. Returns 50 on invalid input.
 */
function clamp100(score: unknown): number {
    const num = Number(score);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, Math.round(num)));
}

/**
 * Normalize a weakness string into UPPER_SNAKE_CASE tag.
 */
function normalizeWeaknessTag(raw: string): string {
    if (typeof raw !== "string" || !raw.trim()) return "GENERAL_WEAKNESS";
    return raw
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .substring(0, 40); // cap length
}

/**
 * Ensure array has max N items, all non-empty strings.
 */
function safeStringArray(arr: unknown, maxLen: number = 5): string[] {
    if (!Array.isArray(arr)) return [];
    return arr
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .slice(0, maxLen);
}

/**
 * Evaluate a single candidate answer with strict validation.
 */
export async function evaluateAnswer(
    question: string,
    answer: string,
    topic: string
): Promise<AnswerEvaluation> {
    const prompt = buildEvaluationPrompt(question, answer, topic);

    try {
        const parsed = await generateJson(prompt, DEEPSEEK_MODEL);

        const score = clampScore(parsed.score);
        const clarity = clampScore(parsed.clarity);
        const depth = clampScore(parsed.depth);
        const explanation = typeof parsed.explanation === "string" && parsed.explanation.trim().length > 0
            ? parsed.explanation.trim().substring(0, 120)
            : FALLBACK_EVALUATION.explanation;
        const improvement_tip = typeof parsed.improvement_tip === "string" && parsed.improvement_tip.trim().length > 0
            ? parsed.improvement_tip.trim()
            : FALLBACK_EVALUATION.improvement_tip;
        const weaknesses = safeStringArray(parsed.weaknesses).map(normalizeWeaknessTag);

        return {
            score,
            clarity,
            depth,
            explanation,
            strengths: safeStringArray(parsed.strengths),
            weaknesses: weaknesses.length > 0 ? weaknesses : FALLBACK_EVALUATION.weaknesses,
            improvement_tip,
            skipped: parsed.skipped === true,
            concepts_detected: safeStringArray(parsed.concepts_detected),
            is_relevant: parsed.is_relevant !== false,
            relevance_score: clampScore(parsed.relevance_score ?? 7),
            intent: ["VALID_ANSWER", "PARTIAL_ANSWER", "CONFUSED", "IRRELEVANT", "NO_ANSWER"].includes(parsed.intent as string)
                ? (parsed.intent as AnswerEvaluation["intent"])
                : "VALID_ANSWER",
        };
    } catch (error) {
        console.error("Failed to evaluate answer:", error);
        return { ...FALLBACK_EVALUATION };
    }
}

// ═══════════════════════════════════════════════════════
// DETERMINISTIC FINAL EVALUATION — Weighted Math Engine
// ═══════════════════════════════════════════════════════

/**
 * Generate a comprehensive final evaluation using deterministic weighted scoring.
 * 
 * Formula:
 *   technical_score   = avg(topicRecord.score) * 10
 *   communication_score = avg(topicRecord.clarity) * 10
 *   depth_score        = avg(topicRecord.depth) * 10
 *   overall_score      = 0.5 * technical + 0.25 * communication + 0.25 * depth
 *   confidence_score   = 100 - deductions (behavioral)
 */
export async function generateFinalEvaluation(
    memory: ConversationMemory
): Promise<FinalEvaluation> {
    const fullSummary = serializeMemory(memory);
    const prompt = buildFinalEvaluationPrompt(fullSummary);

    // ─── Step 1: Deterministic Score Aggregation from Topic Records ───
    const topics = memory.topicsAsked.filter(t => t.asked && t.score !== null);
    
    const avgScore = topics.length > 0
        ? topics.reduce((sum, t) => sum + (t.score || 5), 0) / topics.length
        : 5;
    const avgClarity = topics.length > 0
        ? topics.reduce((sum, t) => sum + (t.clarity || 5), 0) / topics.length
        : 5;
    const avgDepth = topics.length > 0
        ? topics.reduce((sum, t) => sum + (t.depth || 5), 0) / topics.length
        : 5;

    const technicalScore = clamp100(Math.round(avgScore * 10));
    const communicationScore = clamp100(Math.round(avgClarity * 10));
    const depthScore = clamp100(Math.round(avgDepth * 10));
    const overallScore = clamp100(Math.round(
        (0.5 * technicalScore) + (0.25 * communicationScore) + (0.25 * depthScore)
    ));

    // ─── Step 2: Deterministic Confidence Score ───
    const confidenceScore = clamp100(100 - (memory.confidenceScoreDeduction || 0));

    // ─── Step 3: Deterministic Coding Score ───
    let codingScore = 50; // Neutral baseline
    if (memory.codingAttempts && memory.codingAttempts.length > 0) {
        const successes = memory.codingAttempts.filter(a => a.passed).length;
        codingScore = clamp100(Math.round((successes / memory.codingAttempts.length) * 100));
    }

    // ─── Step 4: Topic Classification ───
    const strongTopics = topics.filter(t => (t.score || 0) >= 7).map(t => t.topic);
    const weakTopics = topics.filter(t => (t.score || 0) <= 5).map(t => t.topic);

    // ─── Step 5: LLM-Generated Qualitative Feedback Only ───
    let summary = "Interview completed.";
    let strengths = memory.detectedStrengths.slice(0, 5);
    let weaknesses = memory.detectedWeaknesses.slice(0, 5);
    let improvementPlan: string[] = [];

    try {
        const parsed = await generateJson(prompt, DEEPSEEK_MODEL);
        summary = typeof parsed.summary === "string" && parsed.summary.length > 0
            ? parsed.summary
            : summary;
        strengths = safeStringArray(parsed.strengths).length > 0
            ? safeStringArray(parsed.strengths)
            : strengths;
        weaknesses = safeStringArray(parsed.weaknesses).length > 0
            ? safeStringArray(parsed.weaknesses).map(normalizeWeaknessTag)
            : weaknesses;
        improvementPlan = safeStringArray(parsed.improvement_plan).length > 0
            ? safeStringArray(parsed.improvement_plan)
            : weakTopics.map(t => `Review and practice ${t} fundamentals.`);
    } catch (error) {
        console.error("Failed to generate qualitative feedback. Using deterministic fallback.", error);
        improvementPlan = weakTopics.map(t => `Review and practice ${t} fundamentals.`);
    }

    return {
        summary,
        topics: memory.topicsAsked.map(t => t.topic),
        strengths,
        weaknesses,
        strong_topics: strongTopics,
        weak_topics: weakTopics,
        improvement_plan: improvementPlan.slice(0, 5),
        technical_score: technicalScore,
        coding_score: codingScore,
        communication_score: communicationScore,
        confidence_score: confidenceScore,
        depth_score: depthScore,
        overall_score: overallScore,
    };
}

/**
 * Evaluate coding phase submissions.
 */
export async function evaluateCode(
    problem: string,
    code: string
): Promise<CodeEvaluationResult> {
    const prompt = buildCodeEvaluationPrompt(problem, code);

    try {
        const parsed = await generateJson(prompt, DEEPSEEK_MODEL);

        return {
            correct: parsed.correct === true,
            time_complexity: typeof parsed.time_complexity === "string" ? parsed.time_complexity : "Unknown",
            space_complexity: typeof parsed.space_complexity === "string" ? parsed.space_complexity : "Unknown",
            score: clampScore(parsed.score),
            feedback: typeof parsed.feedback === "string" ? parsed.feedback : "Code submitted.",
            improvements: safeStringArray(parsed.improvements),
        };
    } catch (error) {
        console.error("Failed to evaluate code:", error);
        return {
            correct: false,
            time_complexity: "Unknown",
            space_complexity: "Unknown",
            score: 5,
            feedback: "Failed to evaluate code due to system error.",
            improvements: ["Parse error: manual review required."],
        };
    }
}
