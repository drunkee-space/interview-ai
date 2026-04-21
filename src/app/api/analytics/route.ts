import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all sessions for this user with evaluations
        const { data: sessions, error } = await supabase
            .from("interview_sessions")
            .select("id, user_id, status, created_at, updated_at, config_snapshot, track_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch sessions:", error.message, error.details, error.hint);
            return NextResponse.json({ error: "Failed to fetch sessions: " + error.message }, { status: 500 });
        }

        // Fetch evaluations for all sessions
        const sessionIds = (sessions || []).map(s => s.id);
        let evaluations: any[] = [];
        if (sessionIds.length > 0) {
            const { data: evals } = await supabase
                .from("interview_evaluations")
                .select("session_id, technical_score, coding_score, communication_score, confidence_score, depth_score, strong_topics, weak_topics, feedback_summary, overall_score, improvement_plan")
                .in("session_id", sessionIds);
            evaluations = evals || [];
        }

        // Merge evaluations into sessions
        const enrichedSessions = (sessions || []).map(s => {
            const evalData = evaluations.find(e => e.session_id === s.id);
            return { ...s, evaluation: evalData || null };
        });

        // Compute aggregate stats
        const completedSessions = enrichedSessions.filter(s => s.evaluation);
        const totalInterviews = enrichedSessions.length;
        const avgScore = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.evaluation?.overall_score || 0), 0) / completedSessions.length)
            : 0;
        const avgTechnical = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.evaluation?.technical_score || 0), 0) / completedSessions.length)
            : 0;
        const avgCommunication = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.evaluation?.communication_score || 0), 0) / completedSessions.length)
            : 0;
        const avgConfidence = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.evaluation?.confidence_score || 0), 0) / completedSessions.length)
            : 0;
        const avgDepth = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.evaluation?.depth_score || 0), 0) / completedSessions.length)
            : 0;

        // ─── Trend Detection ───
        let trend = "neutral";
        if (completedSessions.length >= 2) {
            const latest = completedSessions[0]?.evaluation?.overall_score || 0;
            const previous = completedSessions[1]?.evaluation?.overall_score || 0;
            if (latest > previous) trend = "improving";
            else if (latest < previous) trend = "declining";
        }

        // ─── Global Weak/Strong Topics ───
        const allStrongTopics: string[] = [];
        const allWeakTopics: string[] = [];
        completedSessions.forEach(s => {
            if (s.evaluation?.strong_topics) allStrongTopics.push(...s.evaluation.strong_topics);
            if (s.evaluation?.weak_topics) allWeakTopics.push(...s.evaluation.weak_topics);
        });

        return NextResponse.json({
            sessions: enrichedSessions,
            stats: {
                totalInterviews,
                completedInterviews: completedSessions.length,
                avgScore,
                avgTechnical,
                avgCommunication,
                avgConfidence,
                avgDepth,
                trend,
                topStrongTopics: [...new Set(allStrongTopics)].slice(0, 5),
                topWeakTopics: [...new Set(allWeakTopics)].slice(0, 5),
            }
        });
    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
