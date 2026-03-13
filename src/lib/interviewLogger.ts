import { createClient } from "@/lib/supabase/client";
import type { AnswerEvaluation, FinalEvaluation } from "@/lib/gemini/types";

const supabase = createClient();

// ─── Types ───────────────────────────────────────────
export interface TranscriptEntry {
    speaker: "ai" | "candidate";
    message: string;
    timestamp?: string;
}

export interface CodeAttemptEntry {
    question: string;
    code: string;
    run_count: number;
    error_count: number;
    success: boolean;
    execution_output?: string;
}

export interface ActivityLogEntry {
    activity_type: string;
    description: string;
}

export interface QuestionEntry {
    question: string;
    question_type: "conceptual" | "coding" | "behavioral";
}

// ─── Save Transcripts ────────────────────────────────
export async function saveTranscripts(sessionId: string, transcripts: TranscriptEntry[]) {
    if (transcripts.length === 0) return;

    const rows = transcripts.map((t) => ({
        session_id: sessionId,
        speaker: t.speaker,
        message: t.message,
    }));

    const { error } = await supabase.from("interview_transcripts").insert(rows);
    if (error) console.error("Failed to save transcripts:", error);
}

// ─── Save Code Attempts ─────────────────────────────
export async function saveCodeAttempts(sessionId: string, attempts: CodeAttemptEntry[]) {
    if (attempts.length === 0) return;

    const rows = attempts.map((a) => ({
        session_id: sessionId,
        question: a.question,
        code: a.code,
        run_count: a.run_count,
        error_count: a.error_count,
        success: a.success,
        execution_output: a.execution_output || "",
    }));

    const { error } = await supabase.from("code_attempts").insert(rows);
    if (error) console.error("Failed to save code attempts:", error);
}

// ─── Save Activity Logs ─────────────────────────────
export async function saveActivityLogs(sessionId: string, logs: ActivityLogEntry[]) {
    if (logs.length === 0) return;

    const rows = logs.map((l) => ({
        session_id: sessionId,
        activity_type: l.activity_type,
        description: l.description,
    }));

    const { error } = await supabase.from("interview_activity_logs").insert(rows);
    if (error) console.error("Failed to save activity logs:", error);
}

// ─── Save Questions ─────────────────────────────────
export async function saveQuestions(sessionId: string, questions: QuestionEntry[]) {
    if (questions.length === 0) return;

    const rows = questions.map((q) => ({
        session_id: sessionId,
        question: q.question,
        question_type: q.question_type,
    }));

    const { error } = await supabase.from("interview_questions").insert(rows);
    if (error) console.error("Failed to save questions:", error);
}

// ─── Save Evaluation Result (per-answer) ────────────
export async function saveEvaluationResult(
    sessionId: string,
    questionNumber: number,
    question: string,
    answer: string,
    evaluation: AnswerEvaluation
) {
    const { error } = await supabase.from("evaluation_results").insert({
        session_id: sessionId,
        question_number: questionNumber,
        question,
        candidate_answer: answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        next_question_topic: evaluation.nextQuestionTopic,
    });

    if (error) console.error("Failed to save evaluation result:", error);
}

// ─── Save Final Evaluation ──────────────────────────
export async function saveFinalEvaluation(
    sessionId: string,
    candidateId: string,
    evaluation: FinalEvaluation
) {
    const { error } = await supabase.from("interview_evaluations").upsert({
        session_id: sessionId,
        candidate_id: candidateId,
        technical_score: evaluation.technicalScore * 10,
        coding_score: evaluation.problemSolvingScore * 10,
        communication_score: evaluation.communicationScore * 10,
        confidence_score: evaluation.confidenceScore * 10,
        strong_topics: evaluation.strongTopics,
        weak_topics: evaluation.weakTopics,
        feedback_summary: evaluation.feedbackSummary,
        detailed_feedback: evaluation.detailedFeedback,
        overall_score: evaluation.overallScore * 10,
    }, { onConflict: "session_id" });

    if (error) console.error("Failed to save final evaluation:", error);
}

// ─── Save Coding Behavior ──────────────────────────
export async function saveCodingBehavior(
    sessionId: string,
    data: {
        totalAttempts: number;
        successfulAttempts: number;
        totalErrors: number;
        averageTimePerAttempt: number;
        language: string;
    }
) {
    const { error } = await supabase.from("coding_behavior").insert({
        session_id: sessionId,
        total_attempts: data.totalAttempts,
        successful_attempts: data.successfulAttempts,
        total_errors: data.totalErrors,
        average_time_per_attempt: data.averageTimePerAttempt,
        language: data.language,
    });

    if (error) console.error("Failed to save coding behavior:", error);
}

// ─── Complete Session ───────────────────────────────
export async function completeSession(sessionId: string, startTime: Date) {
    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    const { error } = await supabase
        .from("interview_sessions")
        .update({
            status: "completed",
            end_time: endTime.toISOString(),
            duration: durationSeconds,
        })
        .eq("id", sessionId);

    if (error) console.error("Failed to complete session:", error);
}
