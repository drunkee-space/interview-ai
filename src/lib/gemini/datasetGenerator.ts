// ═══════════════════════════════════════════════════════
// Dataset Generator — Synthetic Interview Conversations
// ═══════════════════════════════════════════════════════

import { getJsonModel } from "./client";
import { buildDatasetGenerationPrompt } from "./prompts";
import type { DatasetEntry, InterviewDifficulty, CandidateLevel } from "./types";
import { v4Fallback } from "./utils";

/**
 * Generate a batch of synthetic interview conversation entries for training data.
 */
export async function generateSyntheticConversation(
    interviewType: string,
    difficulty: InterviewDifficulty,
    candidateLevel: CandidateLevel,
    rounds: number = 5
): Promise<DatasetEntry[]> {
    const model = getJsonModel();
    const conversationId = v4Fallback();
    const entries: DatasetEntry[] = [];

    for (let i = 1; i <= rounds; i++) {
        const prompt = buildDatasetGenerationPrompt(
            interviewType,
            difficulty,
            candidateLevel,
            i,
            rounds
        );

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const parsed = JSON.parse(text);

            entries.push({
                conversationId,
                interviewType,
                difficultyLevel: difficulty,
                candidateLevel,
                question: parsed.question || `Question ${i}`,
                candidateAnswer: parsed.candidateAnswer || "No answer provided",
                evaluationScore: Math.max(1, Math.min(10, Number(parsed.evaluationScore) || 5)),
                feedback: parsed.feedback || "No feedback",
                weakTopics: Array.isArray(parsed.weakTopics) ? parsed.weakTopics : [],
                strongTopics: Array.isArray(parsed.strongTopics) ? parsed.strongTopics : [],
            });
        } catch (error) {
            console.error(`Failed to generate dataset entry ${i}:`, error);
            // Skip failed entries instead of breaking
            continue;
        }

        // Small delay between API calls to respect rate limits
        if (i < rounds) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return entries;
}

/**
 * Generate multiple synthetic conversations in batch.
 */
export async function generateDatasetBatch(
    interviewType: string,
    difficulty: InterviewDifficulty,
    candidateLevel: CandidateLevel,
    conversationCount: number = 3,
    roundsPerConversation: number = 5
): Promise<DatasetEntry[]> {
    const allEntries: DatasetEntry[] = [];

    for (let c = 0; c < conversationCount; c++) {
        const entries = await generateSyntheticConversation(
            interviewType,
            difficulty,
            candidateLevel,
            roundsPerConversation
        );
        allEntries.push(...entries);

        // Delay between conversations
        if (c < conversationCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return allEntries;
}
