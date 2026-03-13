// ═══════════════════════════════════════════════════════
// POST /api/dataset/generate — Generate Synthetic Dataset
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateDatasetBatch } from "@/lib/gemini/datasetGenerator";
import type { DatasetGenerateRequest } from "@/lib/gemini/types";

export async function POST(request: NextRequest) {
    try {
        const body: DatasetGenerateRequest = await request.json();
        const {
            interviewType,
            difficulty = "medium",
            candidateLevel = "mid",
            count = 3,
        } = body;

        if (!interviewType) {
            return NextResponse.json(
                { error: "interviewType is required" },
                { status: 400 }
            );
        }

        // Limit count to prevent excessive API usage on free tier
        const safeCount = Math.min(count, 5);

        const dataset = await generateDatasetBatch(
            interviewType,
            difficulty,
            candidateLevel,
            safeCount,
            5 // rounds per conversation
        );

        return NextResponse.json({
            success: true,
            count: dataset.length,
            dataset,
        });
    } catch (error) {
        console.error("Dataset generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate dataset" },
            { status: 500 }
        );
    }
}
