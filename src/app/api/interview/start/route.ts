// ═══════════════════════════════════════════════════════
// POST /api/interview/start — Start Interview Session
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createMemory, addTurn } from "@/lib/ai/memory";
import { generateGreeting } from "@/lib/ai/interviewer";
import type { StartInterviewRequest, StartInterviewResponse } from "@/lib/ai/types";
import { createClient } from "@/lib/supabase/server";
import { saveSessionState, appendTranscript } from "@/lib/interviewLogger";

export async function POST(request: NextRequest) {
    try {
        const body: StartInterviewRequest = await request.json();
        const {
            sessionId,
            interviewType,
            personality = "friendly",
            candidateLevel = "mid",
            config,
        } = body;
        
        let difficulty = config?.difficulty || body.difficulty || "easy";
        let detailedInterviewType = interviewType;

        if (config && config.subtopics && config.subtopics.length > 0) {
            detailedInterviewType = `${config.primary_topic} (Focus areas: ${config.subtopics.join(", ")})`;
        }

        if (!sessionId || !interviewType) {
            return NextResponse.json(
                { error: "sessionId and interviewType are required" },
                { status: 400 }
            );
        }

        // ─── Fetch previous weak topics from past interviews ───
        let previousWeakTopics: string[] = [];
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get the most recent evaluations for this user
                const { data: pastEvals } = await supabase
                    .from("interview_evaluations")
                    .select("weak_topics, strong_topics, overall_score")
                    .eq("candidate_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (pastEvals && pastEvals.length > 0) {
                    // Aggregate frequency of weak topics with Recency Decay and Mastery Detection
                    const weaknessScores: Record<string, number> = {};
                    let totalScore = 0;
                    
                    pastEvals.forEach((e: { weak_topics: string[] | null, strong_topics: string[] | null, overall_score: number }, index) => {
                        const recencyWeight = pastEvals.length - index; // e.g. 5 for latest, 1 for oldest
                        
                        // Increase weakness score
                        (e.weak_topics || []).forEach(w => {
                            weaknessScores[w] = (weaknessScores[w] || 0) + recencyWeight;
                        });
                        
                        // Mastery detection: if it's in strong topics, significantly reduce priority
                        (e.strong_topics || []).forEach(s => {
                            weaknessScores[s] = (weaknessScores[s] || 0) - (recencyWeight * 2);
                        });
                        
                        totalScore += e.overall_score || 50;
                    });

                    // Sort by highest weakness score and pick top 3 (must be > 0)
                    previousWeakTopics = Object.entries(weaknessScores)
                        .filter(([_, score]) => score > 0)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(entry => entry[0]);
                        
                    // We DO NOT override difficulty here anymore. It's handled by Progressive Tracks engine.
                }
            }
        } catch (err) {
            console.warn("Could not fetch previous weak topics (table may not exist):", err);
        }

        // Create fresh conversation memory with minimum 8 questions
        let memory = createMemory(
            sessionId,
            detailedInterviewType,
            personality,
            difficulty as any,
            candidateLevel,
            8 // minimum 8 questions
        );

        // Inject previous weak topics into memory so the AI can focus on them
        if (previousWeakTopics.length > 0) {
            memory = {
                ...memory,
                detectedWeaknesses: previousWeakTopics,
            };
        }

        // Generate personalized AI greeting
        const greeting = await generateGreeting(memory, previousWeakTopics);

        // Store the greeting in memory
        memory = addTurn(memory, "interviewer", greeting);
        
        // ─── Save Session to DB ───
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            await saveSessionState(
                sessionId,
                "DISCUSSION",
                "general",
                memory,
                user ? user.id : undefined,
                supabase
            );
            await appendTranscript(sessionId, "AI", greeting, supabase);
        } catch (dbErr) {
            console.error("Failed to persist initial session to DB:", dbErr);
        }

        const response: StartInterviewResponse = {
            greeting,
            memory,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("Interview start error:", error);
        return NextResponse.json(
            { error: "Failed to start interview" },
            { status: 500 }
        );
    }
}
