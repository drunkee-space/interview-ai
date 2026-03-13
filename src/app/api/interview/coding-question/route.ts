import { NextResponse } from "next/server";
import { generateCodingQuestion } from "@/lib/gemini/interviewer";
import type { ConversationMemory } from "@/lib/gemini/types";

export async function POST(req: Request) {
    try {
        const memory: ConversationMemory = await req.json();

        if (!memory || !memory.interviewType) {
            return NextResponse.json(
                { error: "Invalid conversation memory provided" },
                { status: 400 }
            );
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
