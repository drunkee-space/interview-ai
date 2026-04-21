import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params;
        
        if (!sessionId) {
            return NextResponse.json({ error: "No session ID provided" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [sessionRes, transcriptsRes] = await Promise.all([
            supabase.from("interview_sessions").select("id, user_id, status, interview_type, start_time, end_time, duration, memory_json, config_snapshot, track_id, created_at, updated_at").eq("id", sessionId).eq("user_id", user.id).single(),
            supabase.from("interview_transcripts").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true }),
        ]);

        if (sessionRes.error || !sessionRes.data) {
            console.warn("Session lookup returned:", sessionRes.error?.message);
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({
            memory: sessionRes.data.memory_json,
            transcripts: transcriptsRes.data || [],
            state: sessionRes.data.status || "DISCUSSION",
            config_snapshot: sessionRes.data.config_snapshot,
            track_id: sessionRes.data.track_id,
        });
    } catch (error) {
        console.error("Fetch session error:", error);
        return NextResponse.json(
            { error: "Failed to fetch session" },
            { status: 500 }
        );
    }
}
