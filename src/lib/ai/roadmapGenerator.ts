// ═══════════════════════════════════════════════════════
// AI Roadmap Generator v2 — Concept-Aware, Flexible Count
// ═══════════════════════════════════════════════════════

import { generateJson } from "./client";

export interface RoadmapQuestion {
    question: string;
    topic: string;
    concept: string;
}

export interface RoadmapLevel {
    level: "easy" | "medium" | "hard";
    questions: RoadmapQuestion[];
}

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 10;

/**
 * Generate a structured roadmap of questions for a given topic.
 * Creates 5-10 questions per level (easy/medium/hard).
 * Each question includes a specific concept for tracking.
 */
export async function generateRoadmap(
    primaryTopic: string,
    subtopics: string[]
): Promise<RoadmapLevel[]> {
    const systemPrompt = `You are an AI Interview Roadmap Generator.
Generate a structured set of interview questions for: "${primaryTopic}"
Subtopics to cover: ${subtopics.join(", ")}

RULES:
1. Generate between ${MIN_QUESTIONS} and ${MAX_QUESTIONS} questions for EACH difficulty level (easy, medium, hard).
2. Questions must cover ALL subtopics across each level.
3. Easy = fundamental concepts, definitions, basic usage.
4. Medium = practical application, problem-solving, comparisons.
5. Hard = advanced concepts, system design, optimization, edge cases.
6. Each question must have a specific "concept" field (e.g., "hooks", "closures", "joins").
7. Each question must be a clear, standalone technical interview question.
8. Do NOT repeat questions across levels.

OUTPUT STRICT JSON:
{
  "easy": [
    { "question": "string", "topic": "subtopic_name", "concept": "specific_concept" }
  ],
  "medium": [
    { "question": "string", "topic": "subtopic_name", "concept": "specific_concept" }
  ],
  "hard": [
    { "question": "string", "topic": "subtopic_name", "concept": "specific_concept" }
  ]
}

${MIN_QUESTIONS}-${MAX_QUESTIONS} questions per level.`;

    try {
        const parsed = await generateJson(systemPrompt, "llama-3.3-70b-versatile");

        const levels: RoadmapLevel[] = [];

        for (const level of ["easy", "medium", "hard"] as const) {
            const rawQuestions = (parsed[level] as any[]) || [];
            
            // Validate and normalize — accept 5-10
            const questions: RoadmapQuestion[] = rawQuestions
                .filter((q: any) => q.question && typeof q.question === "string")
                .slice(0, MAX_QUESTIONS)
                .map((q: any) => ({
                    question: q.question.trim(),
                    topic: (q.topic || primaryTopic).trim(),
                    concept: (q.concept || q.topic || "general").trim().toLowerCase(),
                }));

            // Pad to minimum if AI returned fewer
            while (questions.length < MIN_QUESTIONS) {
                const subtopic = subtopics[questions.length % subtopics.length];
                questions.push({
                    question: `Explain a key concept related to ${subtopic} in ${primaryTopic}.`,
                    topic: subtopic,
                    concept: subtopic.toLowerCase(),
                });
            }

            levels.push({ level, questions });
        }

        return levels;
    } catch (error) {
        console.error("[roadmapGenerator] Failed to generate roadmap:", error);
        return generateFallbackRoadmap(primaryTopic, subtopics);
    }
}

/**
 * Fallback roadmap if AI generation fails.
 */
function generateFallbackRoadmap(primaryTopic: string, subtopics: string[]): RoadmapLevel[] {
    const levels: RoadmapLevel[] = [];
    
    const templates = {
        easy: [
            { q: "What is {topic}?", c: "definition" },
            { q: "Explain the basic concepts of {topic}.", c: "fundamentals" },
            { q: "What are the main features of {topic}?", c: "features" },
            { q: "How does {topic} work at a fundamental level?", c: "mechanics" },
            { q: "What is the purpose of {topic} in {primary}?", c: "purpose" },
            { q: "Give an example of {topic} usage.", c: "usage" },
            { q: "What are the advantages of using {topic}?", c: "advantages" },
        ],
        medium: [
            { q: "Explain a practical use case for {topic} in a real project.", c: "application" },
            { q: "How would you debug a common issue with {topic}?", c: "debugging" },
            { q: "Compare {topic} with a similar approach.", c: "comparison" },
            { q: "What are the performance considerations when using {topic}?", c: "performance" },
            { q: "How do you handle errors when working with {topic}?", c: "error_handling" },
            { q: "What are common mistakes developers make with {topic}?", c: "pitfalls" },
            { q: "How would you test {topic} in a production environment?", c: "testing" },
        ],
        hard: [
            { q: "Design a system architecture using {topic} at scale.", c: "architecture" },
            { q: "How would you optimize {topic} for high-traffic applications?", c: "optimization" },
            { q: "Explain the internal implementation details of {topic}.", c: "internals" },
            { q: "What are the security implications of {topic}?", c: "security" },
            { q: "How would you migrate a legacy system to use {topic}?", c: "migration" },
            { q: "Solve a complex problem using advanced {topic} patterns.", c: "patterns" },
            { q: "How does {topic} handle concurrency and race conditions?", c: "concurrency" },
        ],
    };

    for (const level of ["easy", "medium", "hard"] as const) {
        const questions: RoadmapQuestion[] = templates[level].map((t, i) => ({
            question: t.q
                .replace(/{topic}/g, subtopics[i % subtopics.length])
                .replace(/{primary}/g, primaryTopic),
            topic: subtopics[i % subtopics.length],
            concept: t.c,
        }));
        levels.push({ level, questions });
    }

    return levels;
}
