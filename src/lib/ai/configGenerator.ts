import { generateJson } from "./client";
import { InterviewConfig } from "./types";

// Canonical topic catalog. Aliases (right side) normalize to canonical (left).
const TOPIC_ALIASES: Record<string, string> = {
    // Web fundamentals
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "sass": "CSS",
    "scss": "CSS",
    "tailwind": "CSS",
    "tailwindcss": "CSS",

    // JavaScript family
    "javascript": "JavaScript",
    "js": "JavaScript",
    "es6": "JavaScript",
    "ecmascript": "JavaScript",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Node.js",
    "expressjs": "Node.js",
    "typescript": "TypeScript",
    "ts": "TypeScript",

    // Frontend frameworks
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "React",
    "next.js": "React",
    "next": "React",
    "vue": "Vue",
    "vuejs": "Vue",
    "vue.js": "Vue",
    "angular": "Angular",
    "angularjs": "Angular",
    "svelte": "React",

    // Backend / general purpose
    "python": "Python",
    "py": "Python",
    "django": "Python",
    "flask": "Python",
    "fastapi": "Python",

    "java": "Java",
    "spring": "Java",
    "springboot": "Java",

    "c++": "C++",
    "cpp": "C++",
    "c plus plus": "C++",
    "cplusplus": "C++",

    "c": "C",
    "c#": "C#",
    "csharp": "C#",
    ".net": "C#",
    "dotnet": "C#",

    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "kotlin": "Kotlin",
    "swift": "Swift",
    "ruby": "Ruby",
    "rails": "Ruby",
    "php": "PHP",
    "laravel": "PHP",

    // Databases
    "sql": "SQL",
    "mysql": "SQL",
    "postgres": "SQL",
    "postgresql": "SQL",
    "sqlite": "SQL",
    "database": "SQL",
    "databases": "SQL",
    "dbms": "SQL",
    "mongodb": "SQL",
    "mongo": "SQL",
    "nosql": "SQL",

    // CS fundamentals
    "dsa": "DSA",
    "data structures": "DSA",
    "algorithms": "DSA",
    "data structures and algorithms": "DSA",
    "leetcode": "DSA",
    "competitive programming": "DSA",

    "system design": "System Design",
    "systemdesign": "System Design",
    "design": "System Design",
    "architecture": "System Design",

    "os": "Operating Systems",
    "operating system": "Operating Systems",
    "operating systems": "Operating Systems",

    "networking": "Computer Networks",
    "computer networks": "Computer Networks",
    "networks": "Computer Networks",

    "oop": "OOP",
    "object oriented": "OOP",
    "object oriented programming": "OOP",

    // Data / ML
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "ai": "Machine Learning",
    "deep learning": "Machine Learning",
    "data science": "Machine Learning",

    // DevOps
    "devops": "DevOps",
    "docker": "DevOps",
    "kubernetes": "DevOps",
    "k8s": "DevOps",
    "aws": "DevOps",
    "cloud": "DevOps",
    "azure": "DevOps",
    "gcp": "DevOps",
};

const VALID_CANONICAL_TOPICS = Array.from(new Set(Object.values(TOPIC_ALIASES)));

function normalizeTopic(input: string): string | null {
    if (!input) return null;
    const cleaned = input.trim().toLowerCase().replace(/\s+/g, " ");

    // Direct alias hit
    if (TOPIC_ALIASES[cleaned]) return TOPIC_ALIASES[cleaned];

    // Canonical hit (case-insensitive)
    const canonicalHit = VALID_CANONICAL_TOPICS.find(t => t.toLowerCase() === cleaned);
    if (canonicalHit) return canonicalHit;

    // Substring fallback — pick the longest matching alias keyword inside the input
    const matches = Object.keys(TOPIC_ALIASES)
        .filter(k => cleaned.includes(k))
        .sort((a, b) => b.length - a.length);
    if (matches.length > 0) return TOPIC_ALIASES[matches[0]];

    return null;
}

export async function generateInterviewConfig(prompt: string, enforcedTopic?: string): Promise<InterviewConfig> {
    // Try local normalization first — saves a round-trip when the prompt clearly names a topic.
    const localNormalized = !enforcedTopic ? normalizeTopic(prompt) : null;

    const systemPrompt = `You are an AI Interview Config Generator.
Your job is to parse the user's request and structure it into a technical interview configuration.

USER PROMPT: "${prompt}"

REQUIRED LOGIC:
1. Identify the core technical topic requested.
2. ${enforcedTopic
            ? `The primary_topic MUST EXACTLY BE: "${enforcedTopic}". Do NOT deviate from this topic.`
            : `The primary_topic MUST be ONE of these canonical topics (pick the closest match): [${VALID_CANONICAL_TOPICS.join(", ")}].
   Common aliases: reactjs/nextjs/next.js -> React, c++/cpp -> C++, nodejs/express -> Node.js, ts -> TypeScript, golang -> Go, mysql/postgres/mongodb -> SQL, machine learning/ai -> Machine Learning, docker/kubernetes/aws -> DevOps.`}
3. If the user asks for entirely non-technical topics (e.g. "movies", "baking", "cooking"), set primary_topic to "INVALID".
4. Determine 3 to 5 realistic subtopics for the given primary_topic.
5. Create a professional, engaging title (e.g. "Python Backend Engineer", "React Frontend Developer", "C++ Systems Programmer").
6. Create a short 1-sentence description explaining what the interview tests.
7. Set duration to exactly 45.
8. Set difficulty to exactly "easy" (it will evolve based on candidate performance).
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
        const parsed = await generateJson(systemPrompt);

        // ─── STRICT VALIDATION (POST-AI) ───

        if (!parsed.title || typeof parsed.title !== "string" || parsed.title.trim() === "") {
            throw new Error("Invalid or missing title");
        }

        if (!parsed.primary_topic || typeof parsed.primary_topic !== "string") {
            throw new Error("Invalid or missing primary_topic");
        }

        const rawTopic = parsed.primary_topic.trim();
        if (rawTopic.toUpperCase() === "INVALID") {
            throw new Error("INVALID_PROMPT");
        }

        // Resolve via alias normalizer; fall back to local hit; fall back to enforced.
        let primaryTopic =
            normalizeTopic(rawTopic) ||
            localNormalized ||
            null;

        if (enforcedTopic) {
            primaryTopic = enforcedTopic;
        }

        if (!primaryTopic) {
            throw new Error(`Invalid primary_topic generated: ${parsed.primary_topic}`);
        }

        if (!Array.isArray(parsed.subtopics) || parsed.subtopics.length === 0) {
            throw new Error("Invalid or missing subtopics array");
        }

        return {
            title: parsed.title,
            description: typeof parsed.description === "string"
                ? parsed.description
                : `A comprehensive technical interview focusing on ${primaryTopic}.`,
            primary_topic: primaryTopic,
            subtopics: parsed.subtopics.slice(0, 5) as string[],
            difficulty: "easy",
            duration: 45,
            type: "technical"
        };
    } catch (error: any) {
        console.warn("[configGenerator] Validation/Generation failed.", error instanceof Error ? error.message : "Unknown");

        if (error.message === "INVALID_PROMPT") {
            throw error;
        }

        throw new Error("Failed to generate a valid interview configuration. Please try again.");
    }
}
