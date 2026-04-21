import { NextRequest, NextResponse } from "next/server";
import { groqClient } from "@/lib/ai/client";
import { toFile } from "groq-sdk/uploads";
import { validateTranscription } from "@/lib/ai/systemControl";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioBlob = formData.get("audio");
        const preferredLanguage = formData.get("preferredLanguage")?.toString() || "English";
        const promptContext = formData.get("promptContext")?.toString() || "";

        if (!audioBlob || !(audioBlob instanceof Blob)) {
            return NextResponse.json({ error: "No audio blob provided" }, { status: 400 });
        }

        // Convert the web Blob into a format the Groq SDK accepts
        const arrayBuffer = await audioBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const file = await toFile(buffer, "recording.webm", { type: "audio/webm" });

        // Auto-detect spoken language — no language hint so Whisper
        // correctly identifies Telugu, Hindi, Tamil, etc.
        let basePrompt = "The candidate is in a software engineering technical interview. They will speak English or another language.";
        if (promptContext) {
            basePrompt += ` The context of their speech revolves around answering this specific question/topic: "${promptContext}". Expect technical terminology matching this question.`;
        }

        const transcription = await groqClient.audio.transcriptions.create({
            file,
            model: "whisper-large-v3-turbo",
            response_format: "verbose_json",
            prompt: basePrompt,
            temperature: 0.0,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = transcription as any;

        // Map ISO 639-1 codes to human-readable language names
        const languageMap: Record<string, string> = {
            en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil",
            kn: "Kannada", ml: "Malayalam", mr: "Marathi", bn: "Bengali",
            gu: "Gujarati", pa: "Punjabi", ur: "Urdu", ar: "Arabic",
            es: "Spanish", fr: "French", de: "German", ja: "Japanese",
            ko: "Korean", zh: "Chinese", pt: "Portuguese", ru: "Russian",
            it: "Italian", nl: "Dutch", tr: "Turkish", th: "Thai",
        };

        const detectedCode = result.language || "en";
        
        // Calculate a rough confidence score from verbose_json segments if available
        let confidenceScore = 1.0;
        if (result.segments && Array.isArray(result.segments) && result.segments.length > 0) {
            const avgLogProb = result.segments.reduce((acc: number, seg: any) => acc + (seg.avg_logprob || 0), 0) / result.segments.length;
            confidenceScore = Math.exp(avgLogProb);
        }

        const controlResult = validateTranscription(detectedCode, confidenceScore, preferredLanguage);
        
        const finalCode = controlResult.final_language;
        const detectedName = languageMap[finalCode] || finalCode.toUpperCase();

        return NextResponse.json({
            text: result.text || "",
            language: finalCode,
            languageName: detectedName,
            isReliable: controlResult.is_reliable,
            action: controlResult.action
        });

    } catch (err: unknown) {
        console.error("Whisper transcription failed:", err);
        return NextResponse.json(
            { error: "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
