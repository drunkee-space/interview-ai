// ═══════════════════════════════════════════════════════
// Gemini SDK Client — Singleton
// ═══════════════════════════════════════════════════════

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY is not set. AI interviewer will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

// Safety settings tuned for interview context — allow professional discussion
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];

/**
 * Get the Gemini 1.5 Flash model for text generation.
 */
export function getModel() {
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        safetySettings,
        generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 1024,
        },
    });
}

/**
 * Get the model configured for JSON output (structured responses).
 */
export function getJsonModel() {
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        safetySettings,
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        },
    });
}
