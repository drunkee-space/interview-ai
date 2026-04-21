// ═══════════════════════════════════════════════════════
// POST /api/interview/end — End Interview + Final Eval
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateFinalEvaluation } from "@/lib/ai/evaluator";
import { saveFinalEvaluation, completeSession } from "@/lib/interviewLogger";
import { createClient } from "@/lib/supabase/server";
import type { EndInterviewRequest, EndInterviewResponse } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: EndInterviewRequest = await request.json();
        const { sessionId, memory } = body;

        if (!sessionId || !memory) {
            return NextResponse.json(
                { error: "sessionId and memory are required" },
                { status: 400 }
            );
        }

        // Generate comprehensive final evaluation via Gemini
        const finalEvaluation = await generateFinalEvaluation(memory);

        // ─── Save Results to Database ───
        await saveFinalEvaluation(sessionId, user.id, finalEvaluation, supabase);
        
        // Mark session as fully completed via start time lookup if available (pass new Date if missing)
        await completeSession(sessionId, new Date(), supabase);

        // ─── PROGRESSIVE LEARNING ENGINE ───
        // 1. Get track_id from session
        const { data: sessionData } = await supabase
            .from("interview_sessions")
            .select("track_id")
            .eq("id", sessionId)
            .single();

        if (sessionData?.track_id) {
            const trackId = sessionData.track_id;
            
            // 2. Fetch current track data
            const { data: trackData } = await supabase
                .from("interview_tracks")
                .select("attempts, difficulty, progress_level")
                .eq("id", trackId)
                .single();
                
            if (trackData) {
                const newAttempts = (trackData.attempts || 0) + 1;
                
                // 3. Compute performance_score
                const perfScore = Math.round((
                    finalEvaluation.technical_score + 
                    finalEvaluation.coding_score + 
                    finalEvaluation.communication_score + 
                    finalEvaluation.confidence_score
                ) / 4);
                
                // 4. Progress Difficulty Deterministically
                let newDifficulty = trackData.difficulty;
                let newLevel = trackData.progress_level || 1;

                if (perfScore >= 85 && newAttempts >= 4) {
                    newDifficulty = "hard";
                    newLevel = 3;
                } else if (perfScore >= 75 && newAttempts >= 2) {
                    newDifficulty = "medium";
                    newLevel = 2;
                }
                
                // Downgrade Rule
                if (perfScore < 50) {
                    if (newDifficulty === "hard") { newDifficulty = "medium"; newLevel = 2; }
                    else if (newDifficulty === "medium") { newDifficulty = "easy"; newLevel = 1; }
                }
                
                // 5. Update DB
                await supabase
                    .from("interview_tracks")
                    .update({
                        attempts: newAttempts,
                        last_score: perfScore,
                        difficulty: newDifficulty,
                        progress_level: newLevel,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", trackId);
            }
        }

        const response: EndInterviewResponse = {
            finalEvaluation,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Interview end error:", error);
        return NextResponse.json(
            { error: "Failed to generate final evaluation" },
            { status: 500 }
        );
    }
}
