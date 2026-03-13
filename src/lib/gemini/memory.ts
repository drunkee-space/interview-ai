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
        detectedStrengths: [],
        detectedWeaknesses: [],
        codingAttempts: [],
        questionCount: 0,
        maxQuestions,
        overallImpressionSoFar: "",
        isComplete: false,
    };
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
                ? { ...t, score: evaluation.score, feedback: evaluation.feedback }
                : t
        );
    } else {
        newTopics = [
            ...memory.topicsAsked,
            {
                topic: questionTopic,
                asked: true,
                score: evaluation.score,
                feedback: evaluation.feedback,
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

    return {
        ...memory,
        detectedStrengths: newStrengths,
        detectedWeaknesses: newWeaknesses,
        topicsAsked: newTopics,
        questionCount: memory.questionCount + 1,
        overallImpressionSoFar: impression,
        isComplete: memory.questionCount + 1 >= memory.maxQuestions,
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

    // Conversation History (last 10 turns to keep context manageable)
    const recentHistory = memory.conversationHistory.slice(-10);
    if (recentHistory.length > 0) {
        parts.push("=== Recent Conversation ===");
        for (const turn of recentHistory) {
            const label = turn.role === "interviewer" ? "Interviewer" : "Candidate";
            parts.push(`${label}: ${turn.content}`);
        }
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
