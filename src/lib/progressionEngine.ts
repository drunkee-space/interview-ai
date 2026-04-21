// ═══════════════════════════════════════════════════════
// Progression Engine v2 — Mastery-Based Level Gating
// ═══════════════════════════════════════════════════════

// ─── Question Status Model ───
export type QuestionStatus = "NOT_ATTEMPTED" | "ATTEMPTED" | "MASTERED" | "WEAK";

export const MASTERY_THRESHOLD = 6;  // Score out of 10 to be considered mastered
export const MAX_RETRIES = 3;
export const MEDIUM_UNLOCK_AVG = 60; // % average score needed to unlock medium
export const HARD_UNLOCK_AVG = 75;   // % average score needed to unlock hard

export interface TrackQuestion {
    id: string;
    track_id: string;
    level: "easy" | "medium" | "hard";
    question_index: number;
    question: string;
    topic: string;
    concept: string;
    status: QuestionStatus;
    score: number;
    attempts: number;
    max_attempts: number;
    last_answer?: string;
    first_attempted_at?: string;
    last_attempted_at?: string;
}

export interface LevelProgress {
    level: string;
    totalQuestions: number;
    masteredQuestions: number;
    weakQuestions: number;
    attemptedQuestions: number;
    progress: number; // 0-100 (only MASTERED counts)
    avgScore: number;
    unlocked: boolean;
    canUnlockNext: boolean;
}

export interface ConceptMastery {
    concept: string;
    totalQuestions: number;
    mastered: number;
    weak: number;
    avgScore: number;
    status: "strong" | "weak" | "in_progress" | "not_started";
}

// ─── Progress Calculation (MASTERED only) ───

/**
 * Progress = (MASTERED questions / total questions) * 100
 * WEAK and ATTEMPTED do NOT count toward progress.
 */
export function computeProgress(questions: TrackQuestion[]): number {
    if (questions.length === 0) return 0;
    const mastered = questions.filter(q => q.status === "MASTERED").length;
    return Math.round((mastered / questions.length) * 100);
}

/**
 * Average score across MASTERED questions only.
 */
export function computeAvgScore(questions: TrackQuestion[]): number {
    const mastered = questions.filter(q => q.status === "MASTERED");
    if (mastered.length === 0) return 0;
    const avgRaw = mastered.reduce((sum, q) => sum + q.score, 0) / mastered.length;
    return Math.round((avgRaw / 10) * 100); // Convert to percentage
}

// ─── Question State Transitions ───

/**
 * Determine the new status of a question after an evaluation.
 */
export function evaluateQuestionStatus(
    currentStatus: QuestionStatus,
    score: number,
    currentAttempts: number,
    maxAttempts: number = MAX_RETRIES
): { newStatus: QuestionStatus; shouldRetry: boolean; hint: string | null } {
    const newAttempts = currentAttempts + 1;

    // Score meets mastery threshold → MASTERED
    if (score >= MASTERY_THRESHOLD) {
        return { newStatus: "MASTERED", shouldRetry: false, hint: null };
    }

    // Below threshold but retries remain → ATTEMPTED (retry)
    if (newAttempts < maxAttempts) {
        let hint: string;
        if (newAttempts === 1) {
            hint = "Let me simplify this a bit. Try focusing on the core concept.";
        } else if (newAttempts === 2) {
            hint = "Here's a hint: think about the fundamental principle behind this. Try once more.";
        } else {
            hint = "Let me give you a small example to help you understand this concept better.";
        }
        return { newStatus: "ATTEMPTED", shouldRetry: true, hint };
    }

    // All retries exhausted → WEAK
    return { newStatus: "WEAK", shouldRetry: false, hint: null };
}

// ─── Level Unlock Logic (STRICT) ───

/**
 * Check if a level can be unlocked.
 * Requirements:
 *   - 100% mastered (all questions MASTERED)
 *   - Average score ≥ threshold
 *   - NO WEAK questions remain
 */
export function canUnlockLevel(
    targetLevel: "easy" | "medium" | "hard",
    previousLevelQuestions: TrackQuestion[]
): boolean {
    if (targetLevel === "easy") return true;

    const progress = computeProgress(previousLevelQuestions);
    const avgScore = computeAvgScore(previousLevelQuestions);
    const hasWeak = previousLevelQuestions.some(q => q.status === "WEAK");

    // FORBIDDEN: Do NOT unlock if any WEAK questions exist
    if (hasWeak) return false;

    if (targetLevel === "medium") {
        return progress >= 100 && avgScore >= MEDIUM_UNLOCK_AVG;
    }

    if (targetLevel === "hard") {
        return progress >= 100 && avgScore >= HARD_UNLOCK_AVG;
    }

    return false;
}

// ─── Next Question Logic ───

/**
 * Get the next question to ask. Priority:
 * 1. ATTEMPTED (retry — user hasn't mastered it yet)
 * 2. NOT_ATTEMPTED (new question)
 * Returns null if all questions are MASTERED or WEAK.
 */
export function getNextQuestion(questions: TrackQuestion[]): TrackQuestion | null {
    // First: retry ATTEMPTED questions (they need another chance)
    const retryable = questions.find(q => q.status === "ATTEMPTED");
    if (retryable) return retryable;

    // Second: new untouched questions
    const fresh = questions.find(q => q.status === "NOT_ATTEMPTED");
    if (fresh) return fresh;

    return null; // All mastered or weak
}

// ─── Concept-Level Tracking ───

/**
 * Compute mastery per concept across questions.
 */
export function computeConceptMastery(questions: TrackQuestion[]): ConceptMastery[] {
    const conceptMap = new Map<string, TrackQuestion[]>();

    questions.forEach(q => {
        const existing = conceptMap.get(q.concept) || [];
        existing.push(q);
        conceptMap.set(q.concept, existing);
    });

    const results: ConceptMastery[] = [];

    conceptMap.forEach((qs, concept) => {
        const mastered = qs.filter(q => q.status === "MASTERED").length;
        const weak = qs.filter(q => q.status === "WEAK").length;
        const scoredQs = qs.filter(q => q.score > 0);
        const avgScore = scoredQs.length > 0
            ? Math.round(scoredQs.reduce((s, q) => s + q.score, 0) / scoredQs.length)
            : 0;

        let status: ConceptMastery["status"] = "not_started";
        if (mastered === qs.length) status = "strong";
        else if (weak > 0) status = "weak";
        else if (mastered > 0 || scoredQs.length > 0) status = "in_progress";

        results.push({
            concept,
            totalQuestions: qs.length,
            mastered,
            weak,
            avgScore,
            status,
        });
    });

    return results;
}

/**
 * Extract strong and weak concept lists from concept mastery data.
 */
export function extractConceptLists(mastery: ConceptMastery[]): {
    strongConcepts: string[];
    weakConcepts: string[];
} {
    return {
        strongConcepts: mastery.filter(c => c.status === "strong").map(c => c.concept),
        weakConcepts: mastery.filter(c => c.status === "weak").map(c => c.concept),
    };
}

// ─── Level Summary ───

/**
 * Compute full level progress summary for a track.
 */
export function computeLevelSummary(
    allQuestions: TrackQuestion[],
    easyUnlocked: boolean,
    mediumUnlocked: boolean,
    hardUnlocked: boolean
): LevelProgress[] {
    const levels: LevelProgress[] = [];

    for (const level of ["easy", "medium", "hard"] as const) {
        const levelQuestions = allQuestions.filter(q => q.level === level);
        const unlocked = level === "easy" ? easyUnlocked : level === "medium" ? mediumUnlocked : hardUnlocked;
        const progress = computeProgress(levelQuestions);
        const avgScore = computeAvgScore(levelQuestions);
        const hasWeak = levelQuestions.some(q => q.status === "WEAK");

        let canUnlockNext = false;
        if (level === "easy") canUnlockNext = progress >= 100 && avgScore >= MEDIUM_UNLOCK_AVG && !hasWeak;
        if (level === "medium") canUnlockNext = progress >= 100 && avgScore >= HARD_UNLOCK_AVG && !hasWeak;

        levels.push({
            level,
            totalQuestions: levelQuestions.length,
            masteredQuestions: levelQuestions.filter(q => q.status === "MASTERED").length,
            weakQuestions: levelQuestions.filter(q => q.status === "WEAK").length,
            attemptedQuestions: levelQuestions.filter(q => q.status === "ATTEMPTED").length,
            progress,
            avgScore,
            unlocked,
            canUnlockNext,
        });
    }

    return levels;
}

// ─── Blocking Messages ───

/**
 * Get the blocking message if user tries to advance too early.
 */
export function getLevelBlockMessage(
    targetLevel: "medium" | "hard",
    previousLevelQuestions: TrackQuestion[]
): string | null {
    const progress = computeProgress(previousLevelQuestions);
    const avgScore = computeAvgScore(previousLevelQuestions);
    const weakCount = previousLevelQuestions.filter(q => q.status === "WEAK").length;
    const prevLevel = targetLevel === "medium" ? "Easy" : "Medium";
    const threshold = targetLevel === "medium" ? MEDIUM_UNLOCK_AVG : HARD_UNLOCK_AVG;

    if (weakCount > 0) {
        return `You have ${weakCount} weak question${weakCount > 1 ? 's' : ''} in ${prevLevel} level. Review and retry them before moving to ${targetLevel}.`;
    }

    if (progress < 100) {
        return `Complete all ${prevLevel} level questions before moving to ${targetLevel}. Current progress: ${progress}%`;
    }

    if (avgScore < threshold) {
        return `Your average score in ${prevLevel} level is ${avgScore}%. You need at least ${threshold}% to unlock ${targetLevel}.`;
    }

    return null;
}
