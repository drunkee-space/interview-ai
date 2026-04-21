// ═══════════════════════════════════════════════════════
// Conversation Memory System
// ═══════════════════════════════════════════════════════

import type {
    ConversationMemory,
    TopicRecord,
    CodingAttemptRecord,
    InterviewerPersonality,
    InterviewDifficulty,
    CandidateLevel,
    AnswerEvaluation,
} from "./types";

/**
 * Create a fresh conversation memory for a new interview session.
 */
export function createMemory(
    sessionId: string,
    interviewType: string,
    personality: InterviewerPersonality = "friendly",
    difficulty: InterviewDifficulty = "medium",
    candidateLevel: CandidateLevel = "mid",
    maxQuestions: number = 8
): ConversationMemory {
    return {
        sessionId,
        interviewType,
        personality,
        difficulty,
        candidateLevel,
        conversationHistory: [],
        topicsAsked: [],
        skippedTopics: [],
        detectedStrengths: [],
        detectedWeaknesses: [],
        codingAttempts: [],
        questionCount: 0,
        maxQuestions,
        overallImpressionSoFar: "",
        confidenceScoreDeduction: 0,
        consecutiveStruggles: 0,
        isTechnicalStarted: false,
        isComplete: false,
        irrelevantCount: 0,
        lowScoreStreak: 0,
        // Concept-aware memory (Phase 2 upgrade)
        phase: "INTRO",
        currentConcept: undefined,
        conceptQueue: deriveConceptQueue(interviewType),
        visitedConcepts: [],
        conceptAttempts: {},
        weakConcepts: [],
        strongConcepts: [],
        scoreHistory: [],
        lastQuestion: "",
        lastUserAnswer: "",
        lastScore: undefined,
        motivationLevel: "neutral",
    };
}

/**
 * Derive a default concept queue from an interview type / topic.
 * Falls back to a generic queue if topic isn't recognized.
 */
export function deriveConceptQueue(interviewType: string): string[] {
    const t = (interviewType || "").toLowerCase();
    const concepts: Record<string, string[]> = {
        react: ["components", "props", "state", "hooks", "lifecycle", "context", "performance"],
        javascript: ["variables", "functions", "closures", "async", "promises", "prototypes", "event_loop"],
        typescript: ["types", "interfaces", "generics", "narrowing", "utility_types"],
        node: ["modules", "event_loop", "streams", "async", "express_basics", "error_handling"],
        python: ["data_types", "functions", "comprehensions", "oop", "decorators", "generators"],
        sql: ["select_basics", "joins", "aggregations", "subqueries", "indexes", "transactions"],
        html: ["tags", "semantic_html", "forms", "accessibility", "meta_tags"],
        css: ["selectors", "box_model", "flexbox", "grid", "positioning", "responsive"],
    };
    for (const key of Object.keys(concepts)) {
        if (t.includes(key)) return concepts[key];
    }
    return ["fundamentals", "core_concepts", "common_patterns", "advanced_topics", "real_world_usage"];
}

/**
 * Add a turn to conversation history.
 */
export function addTurn(
    memory: ConversationMemory,
    role: "interviewer" | "candidate",
    content: string
): ConversationMemory {
    return {
        ...memory,
        conversationHistory: [
            ...memory.conversationHistory,
            {
                role,
                content,
                timestamp: new Date().toISOString(),
            },
        ],
    };
}

/**
 * Update memory after evaluating an answer.
 */
export function updateMemoryWithEvaluation(
    memory: ConversationMemory,
    evaluation: AnswerEvaluation,
    questionTopic: string
): ConversationMemory {
    // Merge strengths — deduplicate
    const newStrengths = [...new Set([
        ...memory.detectedStrengths,
        ...evaluation.strengths,
    ])];

    // Merge weaknesses — deduplicate
    const newWeaknesses = [...new Set([
        ...memory.detectedWeaknesses,
        ...evaluation.weaknesses,
    ])];

    // Update topic record
    const existingTopic = memory.topicsAsked.find(t => t.topic === questionTopic);
    let newTopics: TopicRecord[];
    if (existingTopic) {
        newTopics = memory.topicsAsked.map(t =>
            t.topic === questionTopic
                ? {
                    ...t,
                    score: Math.min(10, Math.max(0, evaluation.score || 5)),
                    clarity: Math.min(10, Math.max(0, evaluation.clarity || 5)),
                    depth: Math.min(10, Math.max(0, evaluation.depth || 5)),
                    feedback: evaluation.explanation || "Score calculated.",
                }
                : t
        );
    } else {
        newTopics = [
            ...memory.topicsAsked,
            {
                topic: questionTopic,
                asked: true,
                score: Math.min(10, Math.max(0, evaluation.score || 5)),
                clarity: Math.min(10, Math.max(0, evaluation.clarity || 5)),
                depth: Math.min(10, Math.max(0, evaluation.depth || 5)),
                feedback: evaluation.explanation || "Score calculated.",
            },
        ];
    }

    // Build overall impression
    const avgScore = newTopics.reduce((sum, t) => sum + (t.score || 0), 0) / (newTopics.length || 1);
    const impression = avgScore >= 7
        ? "Candidate is performing well overall with solid technical knowledge."
        : avgScore >= 5
            ? "Candidate shows moderate understanding with some gaps."
            : "Candidate is struggling and needs more guidance.";

    let deduction = 0;
    if (evaluation.skipped || evaluation.intent === "NO_ANSWER") deduction += 5;
    if (evaluation.clarity && evaluation.clarity <= 3) deduction += 2; // VERY short or repetitive penalty
    if (evaluation.depth && evaluation.depth <= 3) deduction += 2;

    // Handle consecutive struggles logic
    let struggles = memory.consecutiveStruggles || 0;
    if (evaluation.score <= 4 || evaluation.skipped) {
        struggles += 1;
    } else if (evaluation.score >= 6) {
        struggles = 0;
    }

    // Track answer validation state
    let irrelevantCount = memory.irrelevantCount || 0;
    let lowScoreStreak = memory.lowScoreStreak || 0;

    if (!evaluation.is_relevant) {
        irrelevantCount += 1;
    }

    if (evaluation.score <= 3) {
        lowScoreStreak += 1;
    } else {
        lowScoreStreak = 0;
    }

    // ─── Concept-aware tracking ───
    const score = Math.min(10, Math.max(0, evaluation.score || 0));
    const concept = (memory.currentConcept || questionTopic || "general").toLowerCase();
    const conceptAttempts = { ...(memory.conceptAttempts || {}) };
    // Increment attempts only on weak performance — these are "retries on same concept"
    if (score < 4) {
        conceptAttempts[concept] = (conceptAttempts[concept] || 0) + 1;
    }
    const scoreHistory = [...(memory.scoreHistory || []), score];

    const weakConcepts = new Set(memory.weakConcepts || []);
    const strongConcepts = new Set(memory.strongConcepts || []);
    if (score < 4) weakConcepts.add(concept);
    if (score >= 7) strongConcepts.add(concept);

    // Motivation tone (rule from spec)
    const motivationLevel: ConversationMemory["motivationLevel"] =
        score < 4 ? "supportive" : score >= 7 ? "challenging" : "neutral";

    return {
        ...memory,
        detectedStrengths: newStrengths,
        detectedWeaknesses: newWeaknesses,
        topicsAsked: newTopics,
        questionCount: memory.questionCount + 1,
        consecutiveStruggles: struggles,
        confidenceScoreDeduction: (memory.confidenceScoreDeduction || 0) + deduction,
        overallImpressionSoFar: impression,
        isComplete: memory.questionCount + 1 >= memory.maxQuestions,
        irrelevantCount,
        lowScoreStreak,
        // concept-aware fields
        conceptAttempts,
        scoreHistory,
        weakConcepts: Array.from(weakConcepts),
        strongConcepts: Array.from(strongConcepts),
        lastScore: score,
        motivationLevel,
    };
}

/**
 * Add a coding attempt to memory.
 */
export function addCodingAttempt(
    memory: ConversationMemory,
    attempt: CodingAttemptRecord
): ConversationMemory {
    return {
        ...memory,
        codingAttempts: [...memory.codingAttempts, attempt],
    };
}

/**
 * Serialize the conversation memory into a prompt-friendly string.
 * This is what gets passed to the LLM so it has full context.
 */
export function serializeMemory(memory: ConversationMemory): string {
    const parts: string[] = [];

    parts.push(`Interview Type: ${memory.interviewType}`);
    parts.push(`Difficulty: ${memory.difficulty}`);
    parts.push(`Candidate Level: ${memory.candidateLevel}`);
    parts.push(`Question ${memory.questionCount}/${memory.maxQuestions}`);
    parts.push("");

    // Conversation History (last 8 turns for full context awareness)
    const recentHistory = memory.conversationHistory.slice(-8);
    if (recentHistory.length > 0) {
        parts.push("=== Full Conversation So Far ===");
        for (const turn of recentHistory) {
            const label = turn.role === "interviewer" ? "Interviewer" : "Candidate";
            parts.push(`${label}: ${turn.content}`);
        }
        parts.push("");
    }

    // Concepts the candidate has already explained — DO NOT re-ask these
    const candidateTurns = memory.conversationHistory
        .filter(t => t.role === "candidate")
        .map(t => t.content)
        .join(" ");
    if (candidateTurns.trim()) {
        parts.push("=== Concepts Candidate Already Explained ===");
        parts.push("(Do NOT ask about these again — the candidate has already addressed them)");
        parts.push(candidateTurns.substring(0, 600)); // cap to save tokens
        parts.push("");
    }

    // Topics covered
    if (memory.topicsAsked.length > 0) {
        parts.push("=== Topics Covered ===");
        for (const topic of memory.topicsAsked) {
            const scoreStr = topic.score !== null ? ` (Score: ${topic.score}/10)` : "";
            parts.push(`- ${topic.topic}${scoreStr}`);
        }
        parts.push("");
    }

    // Strengths
    if (memory.detectedStrengths.length > 0) {
        parts.push(`Detected Strengths: ${memory.detectedStrengths.join(", ")}`);
    }

    // Weaknesses
    if (memory.detectedWeaknesses.length > 0) {
        parts.push(`Detected Weaknesses: ${memory.detectedWeaknesses.join(", ")}`);
    }

    // Skipped Topics (candidate said "I don't know")
    if (memory.skippedTopics && memory.skippedTopics.length > 0) {
        parts.push(`Skipped Topics (do NOT re-ask): ${memory.skippedTopics.join(", ")}`);
    }

    // Coding attempts
    if (memory.codingAttempts.length > 0) {
        parts.push(`\nCoding Attempts: ${memory.codingAttempts.length}`);
        parts.push(`Successful: ${memory.codingAttempts.filter(a => a.passed).length}`);
    }

    // Overall impression
    if (memory.overallImpressionSoFar) {
        parts.push(`\nOverall Impression: ${memory.overallImpressionSoFar}`);
    }

    return parts.join("\n");
}
