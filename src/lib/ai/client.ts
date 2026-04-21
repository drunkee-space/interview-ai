// ═══════════════════════════════════════════════════════
// AI SDK Client — Gemini Integration
// ═══════════════════════════════════════════════════════

import { GoogleGenerativeAI } from "@google/genai";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️  GOOGLE_GENERATIVE_AI_API_KEY is not set. AI interviewer will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

// Using gemini-1.5-flash as the default powerful but fast model
const DEFAULT_MODEL = "gemini-1.5-flash";

const JSON_SYSTEM_PROMPT = [
    "You are a precise API assistant.",
    "Return only valid JSON that matches the requested schema.",
    "Do not include markdown fences or extra commentary.",
].join(" ");

function extractJsonObject(text: string): string {
    let cleanText = text;
    // Handle potential reasoning blocks or markdown fences
    const start = cleanText.indexOf("{");
    const end = cleanText.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        return cleanText;
    }

    return cleanText.slice(start, end + 1);
}

/**
 * Generate standard text using Gemini.
 */
export async function generateText(prompt: string, modelName: string = DEFAULT_MODEL, systemPrompt?: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: systemPrompt || "You are a polished mock interviewer. Speak naturally, stay concise, and avoid repetitive filler."
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text() || "";
    } catch (error) {
        console.error("[generateText] Gemini Error:", error);
        return "";
    }
}

/**
 * Generate JSON output using Gemini's native JSON mode.
 */
export async function generateJson(prompt: string, modelName: string = DEFAULT_MODEL, maxRetries: number = 2): Promise<Record<string, unknown>> {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt + "\n\nCRITICAL: Return exactly one valid JSON object. No markdown, no prose, no code fences." }] }],
            });

            const text = result.response.text() || "{}";
            return JSON.parse(extractJsonObject(text.trim()));
        } catch (e) {
            attempt++;
            console.warn(`[generateJson] Attempt ${attempt} failed for Gemini. Retrying...`, e);
            if (attempt > maxRetries) {
                console.error("[generateJson] All retries exhausted.");
                throw new Error("Failed to generate valid JSON after retries.");
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
    }
    
    throw new Error("Failed to generate valid JSON after retries.");
}

export default genAI;
