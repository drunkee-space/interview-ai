import { generateJson } from "./client";
import type { CleanTranscriptResult } from "./types";

const SYSTEM_PROMPT = `You are an AI speech correction engine.

Your job is to convert imperfect spoken sentences into clear, natural English.
DO NOT change meaning.
DO NOT hallucinate extra information.
DO NOT add filler words.

If the answer is a clear admission of lack of knowledge (e.g. "I don't know HTML"), that is HIGH confidence because you understood them. Set confidence to "high".

If the input is heavily broken, completely unintelligible noise, or purely vague filler (e.g. "wow", "umm", "ok"), set confidence to "low".

OUTPUT STRICT JSON:
{
    "corrected_text": "string",
    "confidence": "high" | "medium" | "low"
}`;

/**
 * Cleans a raw transcript utilizing a Hybrid Confidence Model (LLM + Deterministic).
 */
export async function cleanTranscript(rawTranscript: string): Promise<CleanTranscriptResult> {
    const defaultResponse: CleanTranscriptResult = { corrected_text: rawTranscript, confidence: "medium" };
    
    const safeRaw = (rawTranscript || "").trim();
    if (!safeRaw || safeRaw.length === 0) {
        return { corrected_text: "", confidence: "low" }; // Deterministic override
    }

    const userPrompt = `${SYSTEM_PROMPT}\n\nInput:\n"${safeRaw}"`;
    
    try {
        const cleanedRaw = await generateJson(userPrompt, "llama-3.3-70b-versatile");
        const cleaned = cleanedRaw as unknown as CleanTranscriptResult;
        
        let processedText = typeof cleaned.corrected_text === "string" ? cleaned.corrected_text.trim() : safeRaw;
        let finalConfidence = ["high", "medium", "low"].includes(cleaned.confidence) ? cleaned.confidence as "high" | "medium" | "low" : "medium";

        // Hybrid Deterministic Overrides
        const wordCount = processedText.split(/\s+/).length;
        if (processedText === "" || wordCount === 0) {
            finalConfidence = "low";
        } else if (wordCount === 1) {
            // Single words: valid if they look like a technical term, invalid if filler
            const fillerWords = ["wow", "umm", "ok", "okay", "hmm", "uh", "ah", "yeah", "yes", "no", "like", "so"];
            if (fillerWords.includes(processedText.toLowerCase())) {
                finalConfidence = "low";
            }
            // Otherwise trust the LLM confidence — single technical terms like "HTML", "flexbox" are valid
        }

        if (processedText.includes("**LOW_CONFIDENCE**")) {
            processedText = "";
            finalConfidence = "low";
        }
        
        return {
            corrected_text: processedText,
            confidence: finalConfidence
        };
    } catch (err) {
        console.warn("Failed to clean transcript. Falling back to deterministic estimation.", err);
        const wordCount = safeRaw.split(/\s+/).length;
        return {
            corrected_text: safeRaw,
            confidence: wordCount < 3 ? "low" : "medium"
        };
    }
}
