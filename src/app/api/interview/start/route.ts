// ═══════════════════════════════════════════════════════
// POST /api/interview/start — Start Interview Session
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createMemory, addTurn } from "@/lib/gemini/memory";
import { generateGreeting } from "@/lib/gemini/interviewer";
import type { StartInterviewRequest, StartInterviewResponse } from "@/lib/gemini/types";

export async function POST(request: NextRequest) {
    try {
        const body: StartInterviewRequest = await request.json();
        const {
            sessionId,
            interviewType,
            personality = "friendly",
            difficulty = "medium",
            candidateLevel = "mid",
        } = body;

        if (!sessionId || !interviewType) {
            return NextResponse.json(
                { error: "sessionId and interviewType are required" },
                { status: 400 }
            );
        }

        // Create fresh conversation memory
        let memory = createMemory(
            sessionId,
            interviewType,
            personality,
            difficulty,
            candidateLevel
        );

        // Generate personalized AI greeting via Gemini
        const greeting = await generateGreeting(memory);

        // Store the greeting in memory
        memory = addTurn(memory, "interviewer", greeting);

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
