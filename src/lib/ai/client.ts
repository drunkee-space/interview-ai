// ═══════════════════════════════════════════════════════
// AI SDK Client — Groq Integration
// ═══════════════════════════════════════════════════════

import Groq from "groq-sdk";

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
    console.warn("⚠️  GROQ_API_KEY is not set. AI interviewer will not work.");
}

export const groqClient = new Groq({ apiKey: API_KEY || "" });

export const LLAMA_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const DEEPSEEK_MODEL = "deepseek-r1-distill-llama-70b";

const DEFAULT_MODEL = LLAMA_MODEL;

const DEFAULT_SYSTEM_PROMPT = "You are a polished mock interviewer. Speak naturally, stay concise, and avoid repetitive filler.";

const JSON_SYSTEM_PROMPT = [
    "You are a precise API assistant.",
    "Return only valid JSON that matches the requested schema.",
    "Do not include markdown fences or extra commentary.",
].join(" ");

function extractJsonObject(text: string): string {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        return text;
    }
    return text.slice(start, end + 1);
}

/**
 * Generate standard text using Groq.
 */
export async function generateText(prompt: string, modelName: string = DEFAULT_MODEL, systemPrompt?: string): Promise<string> {
    try {
        const completion = await groqClient.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ],
        });
        return completion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("[generateText] Groq Error:", error);
        return "";
    }
}

/**
 * Generate JSON output using Groq's JSON mode.
 */
export async function generateJson(prompt: string, modelName: string = DEFAULT_MODEL, maxRetries: number = 2): Promise<Record<string, unknown>> {
    let attempt = 0;
    while (attempt <= maxRetries) {
        try {
            const completion = await groqClient.chat.completions.create({
                model: modelName,
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: JSON_SYSTEM_PROMPT },
                    { role: "user", content: prompt + "\n\nCRITICAL: Return exactly one valid JSON object. No markdown, no prose, no code fences." },
                ],
            });

            const text = completion.choices[0]?.message?.content || "{}";
            return JSON.parse(extractJsonObject(text.trim()));
        } catch (e) {
            attempt++;
            console.warn(`[generateJson] Attempt ${attempt} failed for Groq. Retrying...`, e);
            if (attempt > maxRetries) {
                console.error("[generateJson] All retries exhausted.");
                throw new Error("Failed to generate valid JSON after retries.");
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
    }

    throw new Error("Failed to generate valid JSON after retries.");
}

export default groqClient;
