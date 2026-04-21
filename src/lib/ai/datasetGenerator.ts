// ═══════════════════════════════════════════════════════
// Dataset Generator — Generate Training Data via LLM
// ═══════════════════════════════════════════════════════

import { generateJson } from "./client";
import { buildDatasetGenerationPrompt } from "./prompts";
import type { DatasetEntry, InterviewDifficulty, CandidateLevel } from "./types";

/**
 * Generate a synthetic dataset entry based on the current interview round.
 */
export async function generateDatasetEntry(
    question: string,
    answer: string,
    score: number,
    topic: string,
    difficulty: string
): Promise<DatasetEntry> {
    const prompt = buildDatasetGenerationPrompt(
        question,
        answer,
        score,
        topic,
        difficulty
    );

    try {
        const parsed = await generateJson(prompt);
        return {
            question: typeof parsed.question === "string" ? parsed.question : question,
            expected_concepts: Array.isArray(parsed.expected_concepts) ? parsed.expected_concepts : [],
            user_answer: typeof parsed.user_answer === "string" ? parsed.user_answer : answer,
            score: typeof parsed.score === "number" ? parsed.score : score,
            weakness: Array.isArray(parsed.weakness) ? parsed.weakness : [],
            difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty : difficulty,
            follow_up_question: typeof parsed.follow_up_question === "string" ? parsed.follow_up_question : "",
            final_outcome: typeof parsed.final_outcome === "string" ? parsed.final_outcome : "Reviewed",
        };
    } catch (error) {
        console.error("Failed to generate dataset entry:", error);
        return {
            question,
            expected_concepts: [],
            user_answer: answer,
            score,
            weakness: [],
            difficulty,
            follow_up_question: "",
            final_outcome: "Fallback generation due to error"
        };
    }
}
/**
 * Generate a batch of synthetic interview conversation turns.
 */
export async function generateDatasetBatch(
    interviewType: string,
    difficulty: InterviewDifficulty,
    candidateLevel: CandidateLevel,
    batchSize: number = 3,
    totalRounds: number = 5
): Promise<DatasetEntry[]> {
    const dataset: DatasetEntry[] = [];
    
    for (let i = 1; i <= batchSize; i++) {
        // We simulate a basic Q&A for the dataset
        const question = `Generative question for ${interviewType} (${difficulty})`;
        const answer = "Synthetic answer for training.";
        
        try {
            const entry = await generateDatasetEntry(
                question,
                answer,
                7, // default score for synthetic data
                interviewType,
                difficulty
            );
            dataset.push(entry);
        } catch (error) {
            console.error(`Failed to generate dataset round ${i}:`, error);
        }
    }
    
    return dataset;
}
