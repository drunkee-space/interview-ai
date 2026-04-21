import { createClient } from "@/lib/supabase/client";
import type { AnswerEvaluation, FinalEvaluation } from "@/lib/ai/types";

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

// ─── Append Single Transcript ────────────────────────
export async function appendTranscript(sessionId: string, role: "AI" | "USER", message: string, customSupabase?: any) {
    if (!message) return;

    const db = customSupabase || supabase;
    const { error } = await db.from("interview_transcripts").insert({
        session_id: sessionId,
        speaker: role === "AI" ? "ai" : "candidate",
        message: message,
    });
    if (error) console.error("Failed to append transcript:", error);
}

// ─── Session State Sync ──────────────────────────────
export async function saveSessionState(
    sessionId: string,
    current_state: "DISCUSSION" | "CODING" | "FINISHED",
    current_topic: string,
    memory_json: any,
    user_id?: string,
    customSupabase?: any
) {
    const payload: Record<string, any> = {
        status: current_state,
        interview_type: current_topic,
        memory_json: memory_json,
        updated_at: new Date().toISOString(),
    };

    if (user_id) payload.user_id = user_id;

    const db = customSupabase || supabase;
    const { error } = await db
        .from("interview_sessions")
        .update(payload)
        .eq("id", sessionId);
        
    if (error) console.error("[saveSessionState] Failed to persist session:", error);
}

// ─── Fetch Session Data ──────────────────────────────
export async function fetchSessionData(sessionId: string) {
    const [sessionRes, transcriptsRes] = await Promise.all([
        supabase.from("interview_sessions").select("id, user_id, status, interview_type, start_time, end_time, duration, memory_json, config_snapshot, track_id, created_at, updated_at").eq("id", sessionId).single(),
        supabase.from("interview_transcripts").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true })
    ]);

    if (sessionRes.error && sessionRes.error.code !== "PGRST116") {
        console.error("Error fetching session:", sessionRes.error);
    }
    
    // PGRST116 means no rows found, which is fine if it's new.
    return {
        session: sessionRes.data,
        transcripts: transcriptsRes.error ? [] : transcriptsRes.data || [],
    };
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

// ─── Save Question Analysis (Adaptive Engine) ───────
export async function saveQuestionAnalysis(
    sessionId: string,
    question: string,
    topic: string,
    userAnswer: string,
    evaluation: AnswerEvaluation,
    difficulty: string,
    customSupabase?: any
) {
    const db = customSupabase || supabase;
    const { error } = await db.from("interview_question_analysis").insert({
        session_id: sessionId,
        question: question,
        topic: topic,
        user_answer: userAnswer,
        score: evaluation.score,
        clarity: evaluation.clarity || 5,
        depth: evaluation.depth || 5,
        weakness_tag: evaluation.weaknesses.join(", "),
        improvement_tip: evaluation.improvement_tip || "Review this topic again.",
        explanation: evaluation.explanation || "Score generated automatically.",
        concepts_detected: evaluation.concepts_detected || [],
        difficulty: difficulty,
    }); // timestamp + id are handled automatically by DB default values

    if (error) {
        // Supabase sometimes returns empty error objects {} for missing tables/RLS
        const errMsg = error.message || error.details || "Table missing or RLS policy blocked insert";
        console.warn(`[InterviewLogger] Non-fatal: Could not save adaptive analysis (${errMsg})`);
    }
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
        feedback: evaluation.explanation || `Depth: ${evaluation.depth}, Clarity: ${evaluation.clarity}`,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        next_question_topic: "auto-deciding",
    });

    if (error) console.error("Failed to save evaluation result:", error);
}

// ─── Save Final Evaluation ──────────────────────────
export async function saveFinalEvaluation(
    sessionId: string,
    candidateId: string,
    evaluation: FinalEvaluation,
    customSupabase?: any
) {
    const db = customSupabase || supabase;
    const { error } = await db.from("interview_evaluations").upsert({
        session_id: sessionId,
        candidate_id: candidateId,
        technical_score: evaluation.technical_score,
        coding_score: evaluation.coding_score,
        communication_score: evaluation.communication_score,
        confidence_score: evaluation.confidence_score,
        depth_score: evaluation.depth_score || 50,
        overall_score: evaluation.overall_score || 50,
        strong_topics: evaluation.strong_topics || evaluation.strengths || [],
        weak_topics: evaluation.weak_topics || evaluation.weaknesses || [],
        improvement_plan: evaluation.improvement_plan || [],
        feedback_summary: evaluation.summary,
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
export async function completeSession(sessionId: string, startTime: Date, customSupabase?: any) {
    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    const db = customSupabase || supabase;
    const { error } = await db
        .from("interview_sessions")
        .update({
            status: "completed",
            end_time: endTime.toISOString(),
            duration: durationSeconds,
        })
        .eq("id", sessionId);

    if (error) console.error("Failed to complete session:", error);
}
