import { NextResponse } from "next/server";
import { generateCodingQuestion } from "@/lib/ai/interviewer";
import type { ConversationMemory } from "@/lib/ai/types";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { difficulty, ...memoryFields } = body;
        const memory: ConversationMemory = memoryFields;

        if (!memory || !memory.interviewType) {
            return NextResponse.json(
                { error: "Invalid conversation memory provided" },
                { status: 400 }
            );
        }

        // Override memory difficulty with adaptive difficulty from discussion performance
        if (difficulty) {
            memory.difficulty = difficulty;
        }

        const challenge = await generateCodingQuestion(memory);

        return NextResponse.json({ challenge });
    } catch (error) {
        console.error("Coding question generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate coding question" },
            { status: 500 }
        );
    }
}
