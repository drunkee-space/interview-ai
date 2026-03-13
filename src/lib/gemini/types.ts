// ═══════════════════════════════════════════════════════
// Dynamic AI Interviewer — Shared Types
// ═══════════════════════════════════════════════════════

// ─── Interviewer Personalities ──────────────────────
export type InterviewerPersonality =
    | "friendly"
    | "strict_faang"
    | "startup_technical"
    | "behavioral";

export type InterviewDifficulty = "easy" | "medium" | "hard" | "expert";
export type CandidateLevel = "junior" | "mid" | "senior" | "lead";

// ─── Conversation Memory ───────────────────────────
export interface ConversationTurn {
    role: "interviewer" | "candidate";
    content: string;
    timestamp: string;
}

export interface TopicRecord {
    topic: string;
    asked: boolean;
    score: number | null;       // 1–10 from evaluation
    feedback: string | null;
}

export interface ConversationMemory {
    sessionId: string;
    interviewType: string;
    personality: InterviewerPersonality;
    difficulty: InterviewDifficulty;
    candidateLevel: CandidateLevel;
    conversationHistory: ConversationTurn[];
    topicsAsked: TopicRecord[];
    detectedStrengths: string[];
    detectedWeaknesses: string[];
    codingAttempts: CodingAttemptRecord[];
    questionCount: number;
    maxQuestions: number;
    overallImpressionSoFar: string;
    isComplete: boolean;
}

export interface CodingAttemptRecord {
    question: string;
    code: string;
    language: string;
    passed: boolean;
    errorMessages: string[];
}

// ─── Evaluation Result ─────────────────────────────
export interface AnswerEvaluation {
    score: number;              // 1–10
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    nextQuestionTopic: string;
}

export interface FinalEvaluation {
    technicalScore: number;     // 1–10
    communicationScore: number; // 1–10
    problemSolvingScore: number;// 1–10
    confidenceScore: number;    // 1–10
    overallScore: number;       // 1–10
    strongTopics: string[];
    weakTopics: string[];
    feedbackSummary: string;
    detailedFeedback: string;
    recommendedNextSteps: string[];
}

// ─── API Request/Response Types ────────────────────
export interface StartInterviewRequest {
    sessionId: string;
    interviewType: string;
    personality?: InterviewerPersonality;
    difficulty?: InterviewDifficulty;
    candidateLevel?: CandidateLevel;
}

export interface StartInterviewResponse {
    greeting: string;
    memory: ConversationMemory;
}

export interface RespondRequest {
    sessionId: string;
    candidateAnswer: string;
    memory: ConversationMemory;
}

export interface RespondResponse {
    evaluation: AnswerEvaluation;
    nextQuestion: string;
    updatedMemory: ConversationMemory;
    shouldEndInterview: boolean;
}

export interface EndInterviewRequest {
    sessionId: string;
    memory: ConversationMemory;
}

export interface EndInterviewResponse {
    finalEvaluation: FinalEvaluation;
}

// ─── Dataset Generator Types ───────────────────────
export interface DatasetEntry {
    conversationId: string;
    interviewType: string;
    difficultyLevel: string;
    candidateLevel: string;
    question: string;
    candidateAnswer: string;
    evaluationScore: number;
    feedback: string;
    weakTopics: string[];
    strongTopics: string[];
}

export interface DatasetGenerateRequest {
    interviewType: string;
    difficulty: InterviewDifficulty;
    candidateLevel: CandidateLevel;
    count: number;
}
