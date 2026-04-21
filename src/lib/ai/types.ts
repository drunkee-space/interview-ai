// ═══════════════════════════════════════════════════════
// Dynamic AI Interviewer — Shared Types
// ═══════════════════════════════════════════════════════

// ─── Interviewer Personalities ──────────────────────
export type InterviewerPersonality =
    | "friendly"
    | "strict_faang"
    | "startup_technical"
    | "behavioral";

// ─── AI Generated Config Types ──────────────────────
export interface InterviewConfig {
    title: string;
    description: string;
    primary_topic: string;
    subtopics: string[];
    difficulty: InterviewDifficulty;
    duration: number;
    type: "technical";
}

export interface InterviewTrack {
    id: string;
    user_id: string;
    generated_interview_id: string;
    title: string;
    primary_topic: string;
    difficulty: InterviewDifficulty;
    progress_level: number;
    attempts: number;
    last_score: number;
}

export type InterviewDifficulty = "easy" | "medium" | "hard" | "expert";
export type CandidateLevel = "junior" | "mid" | "senior" | "lead";

// ─── Conversation Memory ───────────────────────────
export interface ConversationTurn {
    role: "interviewer" | "candidate";
    content: string;
    timestamp: string;
}

export interface CleanTranscriptResult {
    corrected_text: string;
    confidence: "high" | "medium" | "low";
}

export interface TopicRecord {
    topic: string;
    asked: boolean;
    score: number | null;       // 0–10 from evaluation
    clarity: number | null;     // 0-10
    depth: number | null;       // 0-10
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
    skippedTopics: string[];        // Topics candidate said "I don't know" to
    detectedStrengths: string[];
    detectedWeaknesses: string[];
    codingAttempts: CodingAttemptRecord[];
    questionCount: number;
    maxQuestions: number;
    overallImpressionSoFar: string;
    confidenceScoreDeduction: number;
    consecutiveStruggles: number;
    isTechnicalStarted: boolean;
    isComplete: boolean;
    // ─── Answer Validation Tracking ───
    irrelevantCount: number;        // Total irrelevant answers this session
    lowScoreStreak: number;         // Consecutive low-score answers
    lowConfidenceCount?: number;    // Tracks current transcript failure loop
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
    score: number;              // 1–10 (Technical completeness)
    clarity: number;            // 1–10 (Communication logic)
    depth: number;              // 1–10 (Conceptual depth)
    explanation: string;        // Max 120 chars: "Why this score?"
    strengths: string[];
    weaknesses: string[];       // Upper_Snake_Case tags
    improvement_tip: string;    // Actionable tip based on weakness
    skipped: boolean;
    concepts_detected: string[];
    is_relevant: boolean;       
    relevance_score: number;    
    intent?: "VALID_ANSWER" | "PARTIAL_ANSWER" | "CONFUSED" | "IRRELEVANT" | "NO_ANSWER";
}

export interface DecisionActionResult {
    action: "CONTINUE_TOPIC" | "DEEPER_QUESTION" | "SIMPLIFY_QUESTION" | "SWITCH_TOPIC" | "MOVE_TO_CODING" | "REASK" | "CLARIFY" | "WARN" | "END_INTERVIEW";
    next_topic: string;
    difficulty: "easy" | "medium" | "hard";
    reason: string;
    message?: string;           // Optional inline message to the candidate (e.g. "Let me ask that again")
}

export interface CodeEvaluationResult {
    correct: boolean;
    time_complexity: string;
    space_complexity: string;
    score: number;
    feedback: string;
    improvements: string[];
}

export interface FinalEvaluation {
    summary: string;
    topics: string[];
    strengths: string[];
    weaknesses: string[];
    strong_topics: string[];
    weak_topics: string[];
    improvement_plan: string[];
    technical_score: number;     // 1–100
    coding_score: number;        // 1–100
    communication_score: number; // 1–100
    confidence_score: number;    // 1–100
    depth_score: number;         // 1-100
    overall_score: number;       // 1-100 (Math computed)
}

// ─── API Request/Response Types ────────────────────
export interface StartInterviewRequest {
    sessionId: string;
    interviewType: string;
    personality?: InterviewerPersonality;
    difficulty?: InterviewDifficulty;
    candidateLevel?: CandidateLevel;
    config?: InterviewConfig;
}

export interface StartInterviewResponse {
    greeting: string;
    memory: ConversationMemory;
}

export interface RespondRequest {
    sessionId: string;
    candidateAnswer: string;
    memory: ConversationMemory;
    detectedLanguage?: string;
}

export interface RespondResponse {
    evaluation?: AnswerEvaluation;
    nextQuestion?: string;
    updatedMemory: ConversationMemory;
    shouldEndInterview: boolean;
    nextStep?: "CODING" | "FINISHED";
    message?: string;
    sessionId?: string;
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
    question: string;
    expected_concepts: string[];
    user_answer: string;
    score: number;
    weakness: string[];
    difficulty: string;
    follow_up_question: string;
    final_outcome: string;
}

export interface DatasetGenerateRequest {
    interviewType: string;
    difficulty: InterviewDifficulty;
    candidateLevel: CandidateLevel;
    count: number;
}
