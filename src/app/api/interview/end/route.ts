// ═══════════════════════════════════════════════════════
// POST /api/interview/end — End Interview + Final Eval
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateFinalEvaluation } from "@/lib/gemini/evaluator";
import type { EndInterviewRequest, EndInterviewResponse } from "@/lib/gemini/types";

export async function POST(request: NextRequest) {
    try {
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
