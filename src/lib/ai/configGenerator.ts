import { generateJson } from "./client";
import { InterviewConfig } from "./types";

const VALID_TOPICS = ["HTML", "CSS", "JavaScript", "React", "Python", "SQL", "DSA"];

export async function generateInterviewConfig(prompt: string, enforcedTopic?: string): Promise<InterviewConfig> {
    const systemPrompt = `You are an AI Interview Config Generator.
Your job is to parse the user's request and structure it into a technical interview configuration.

USER PROMPT: "${prompt}"

REQUIRED LOGIC:
1. Identify the core technical topic requested.
2. ${enforcedTopic ? `The primary_topic MUST EXACTLY BE: "${enforcedTopic}". Do NOT deviate from this topic.` : `The primary_topic MUST exactly match one of these valid topics: [${VALID_TOPICS.join(", ")}].`}
3. If the user asks for entirely non-technical topics (e.g. "movies", "baking"), or something completely unrecognized, set primary_topic to "INVALID".
4. Determine 3 to 5 realistic subtopics for the given primary_topic.
5. Create a professional, engaging title (e.g. "Python Backend Engineer", "React Frontend Developer").
6. Create a short 1-sentence description explaining what the interview tests.
7. Set duration to exactly 45.
8. Set difficulty to exactly "easy" (it will evolve later based on performance).
9. Set type to exactly "technical".

OUTPUT STRICT JSON:
{
  "title": "string",
  "description": "string",
  "primary_topic": "string",
  "subtopics": ["string", "string", "string"],
  "difficulty": "easy",
  "duration": 45,
  "type": "technical"
}`;

    try {
        const parsed = await generateJson(systemPrompt, "llama-3.3-70b-versatile");

        // ─── STRICT VALIDATION (POST-AI) ───
        
        // 1. Title verification
        if (!parsed.title || typeof parsed.title !== "string" || parsed.title.trim() === "") {
            throw new Error("Invalid or missing title");
        }

        // 2. Primary Topic verification
        if (!parsed.primary_topic || typeof parsed.primary_topic !== "string") {
            throw new Error("Invalid or missing primary_topic");
        }
        
        const topicUpper = (parsed.primary_topic as string).toUpperCase();
        
        if (topicUpper === "INVALID") {
            throw new Error("INVALID_PROMPT");
        }
        
        let primaryTopic = VALID_TOPICS.includes(topicUpper) 
            ? topicUpper 
            : null;

        // Strict Enforced Topic Override Override
        if (enforcedTopic) {
            primaryTopic = enforcedTopic;
        }
            
        if (!primaryTopic) {
            throw new Error(`Invalid primary_topic generated: ${parsed.primary_topic}`);
        }

        // 3. Subtopics verification
        if (!Array.isArray(parsed.subtopics) || parsed.subtopics.length === 0) {
            throw new Error("Invalid or missing subtopics array");
        }

        return {
            title: parsed.title,
            description: typeof parsed.description === "string" ? parsed.description : `A comprehensive technical interview focusing on ${primaryTopic}.`,
            primary_topic: primaryTopic,
            subtopics: parsed.subtopics.slice(0, 5) as string[],
            difficulty: "easy", // Enforce initial difficulty
            duration: 45,
            type: "technical"
        };
    } catch (error: any) {
        console.warn("[configGenerator] Validation/Generation failed.", error instanceof Error ? error.message : "Unknown");
        
        // Re-throw explicit rejections so the frontend can catch them directly
        if (error.message === "INVALID_PROMPT") {
            throw error;
        }

        throw new Error("Failed to generate a valid interview configuration. Please try again.");
    }
}
