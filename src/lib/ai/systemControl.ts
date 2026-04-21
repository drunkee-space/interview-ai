// ═══════════════════════════════════════════════════════
// System Control Engine — Deterministic Hard Guardrails
// ═══════════════════════════════════════════════════════

import type { ConversationTurn } from "./types";

export interface TranscriptionValidationResult {
    final_language: string;
    is_reliable: boolean;
    action: "USE" | "RETRY" | "FALLBACK";
}

export interface StateTransitionResult {
    state: "DISCUSSION" | "CODING" | "FINISHED";
    nextStep?: "CODING" | "FINISHED";
    message?: string;
    sessionId: string;
}

/**
 * 1. LANGUAGE DETECTION CONTROL
 * Ensures the transcription language mapping is correct and prevents low-confidence drift.
 */
export function validateTranscription(
    detectedLanguage: string,
    confidenceScore: number, // 0.0 to 1.0 (or similar likelihood metric)
    preferredLanguage?: string
): TranscriptionValidationResult {
    const LOW_CONFIDENCE_THRESHOLD = 0.4;
    
    // Normalize preference
    const prefLangBase = preferredLanguage ? preferredLanguage.toLowerCase() : "";

    // Hard Rule: If preferred language = Tamil -> Force language = "ta-IN" (or ta)
    // Applied to standard mapping logic.
    if (prefLangBase === "tamil" || prefLangBase === "ta") {
        return {
            final_language: "ta",
            is_reliable: confidenceScore >= LOW_CONFIDENCE_THRESHOLD,
            action: confidenceScore < LOW_CONFIDENCE_THRESHOLD ? "FALLBACK" : "USE"
        };
    }

    // Default Fallback mapping
    const isReliable = confidenceScore >= LOW_CONFIDENCE_THRESHOLD;

    return {
        final_language: detectedLanguage || "en",
        is_reliable: isReliable,
        action: isReliable ? "USE" : "FALLBACK"
    };
}

/**
 * 2. INTERVIEW STATE CONTROL & 3. CODING TRANSITION CONTROL
 * Maintains a strict session state and formats the transition cleanly.
 */
export function enforceStateTransition(
    decisionAction: string,
    sessionId: string,
    isCodingComplete: boolean = false
): StateTransitionResult {
    if (isCodingComplete) {
        return {
            state: "FINISHED",
            nextStep: "FINISHED",
            message: "The interview is now complete.",
            sessionId
        };
    }

    if (decisionAction === "MOVE_TO_CODING") {
        return {
            state: "CODING",
            nextStep: "CODING",
            message: "Let's move to the coding round",
            sessionId
        };
    }

    // Default state
    return {
        state: "DISCUSSION",
        sessionId
    };
}

/**
 * 4. HARD TOPIC LOCK ENFORCEMENT
 * Never allow topic drift unless explicitly switching.
 */
export function enforceTopicLock(
    decisionAction: string,
    currentTopic: string,
    requestedNextTopic: string
): string {
    if (decisionAction !== "SWITCH_TOPIC") {
        return currentTopic;
    }
    
    // Safeguard to ensure we don't switch to a blank topic
    if (!requestedNextTopic || requestedNextTopic.trim() === "") {
        return currentTopic;
    }

    return requestedNextTopic;
}

// ═══════════════════════════════════════════════════════
// 5. DETERMINISTIC TOPIC DETECTION (FAIL-SAFE)
// Scans a transcript string for known technical keywords.
// ═══════════════════════════════════════════════════════

const TOPIC_KEYWORDS: Record<string, string[]> = {
    "HTML": ["html", "hypertext", "markup", "tags", "elements", "dom"],
    "CSS": ["css", "stylesheet", "flexbox", "grid", "responsive", "media query", "box model", "selector"],
    "JavaScript": ["javascript", "js", "es6", "arrow function", "promise", "async", "await", "closure", "prototype", "event loop"],
    "React": ["react", "jsx", "component", "hooks", "usestate", "useeffect", "virtual dom", "props", "state"],
    "Node.js": ["node", "nodejs", "express", "middleware", "npm", "backend", "server"],
    "Python": ["python", "django", "flask", "pip", "pandas", "numpy"],
    "TypeScript": ["typescript", "ts", "interface", "type", "generic", "enum"],
    "SQL": ["sql", "database", "query", "join", "select", "table", "postgres", "mysql", "supabase"],
    "Git": ["git", "github", "commit", "branch", "merge", "pull request"],
    "API": ["api", "rest", "graphql", "endpoint", "fetch", "axios", "http"],
};

export function detectTopicFromTranscript(transcript: string): string {
    const lower = transcript.toLowerCase();
    let bestTopic = "";
    let bestCount = 0;

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        let count = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) count++;
        }
        if (count > bestCount) {
            bestCount = count;
            bestTopic = topic;
        }
    }

    // Fallback if nothing detected
    return bestTopic || "HTML";
}

// ═══════════════════════════════════════════════════════
// 6. CAREER QUESTION BLOCKER
// Scans LLM-generated question text for forbidden patterns.
// Returns true if the question is a career/personal question.
// ═══════════════════════════════════════════════════════

const CAREER_BLOCKLIST = [
    "study", "studies", "college", "university", "school",
    "interest", "interests", "internship", "internships",
    "about yourself", "tell me about you",
    "your background", "your education",
    "what do you like", "what interests you",
    "career", "future plans", "hobbies",
    "where did you", "which college", "what degree",
];

export function isCareerQuestion(question: string): boolean {
    const lower = question.toLowerCase();
    return CAREER_BLOCKLIST.some(phrase => lower.includes(phrase));
}

// ═══════════════════════════════════════════════════════
// 7. QUESTION VALIDATION FILTER
// Ensures the generated question is technical and topic-related.
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════

export function validateQuestionOutput(
    question: string,
    isTechnicalStarted: boolean,
    currentTopic: string
): { valid: boolean; reason: string } {
    if (!isTechnicalStarted) {
        return { valid: true, reason: "Still in intro phase" };
    }

    // Block career questions in technical phase
    if (isCareerQuestion(question)) {
        return { valid: false, reason: "Career/personal question detected in technical phase" };
    }

    // Block vague opinion questions
    const vaguePatterns = [
        "what do you think about",
        "how do you feel about",
        "what's your opinion on",
        "do you enjoy",
    ];
    const lower = question.toLowerCase();
    for (const pattern of vaguePatterns) {
        if (lower.includes(pattern)) {
            return { valid: false, reason: "Vague/opinion-based question detected" };
        }
    }

    return { valid: true, reason: "Question is valid" };
}

// ═══════════════════════════════════════════════════════
// 7.5 POST-RESPONSE VALIDATOR
// Strips repeated greetings, limits to 2 sentences, prevents duplication.
// ═══════════════════════════════════════════════════════

export function cleanPostResponseOutput(
    rawResponse: string,
    history: ConversationTurn[]
): string {
    let clean = rawResponse.trim();

    if (!clean) return "";

    // 1. Remove duplicate greetings ONLY if well past intro (>4 turns)
    if (history.length > 4) {
        const greetings = ["Hi there,", "Hello!", "Welcome", "Nice to meet you", "Great to meet you"];
        for (const g of greetings) {
            if (clean.toLowerCase().startsWith(g.toLowerCase())) {
                clean = clean.substring(g.length).trim();
            }
        }
    }

    // 2. Remove internal sentence duplicates (e.g. "Nice try. Nice try. What is HTML?")
    const sentences = clean.split(/(?<=[.!?])\s+(?=[A-Z])/);
    const uniqueSentences: string[] = [];
    const seenLower = new Set<string>();
    for (const s of sentences) {
        const lower = s.toLowerCase().trim();
        if (!seenLower.has(lower)) {
            seenLower.add(lower);
            uniqueSentences.push(s);
        }
    }
    
    // 3. Allow up to 4 sentences for natural conversation flow
    const trimmed = uniqueSentences.slice(0, 4).join(" ");
    
    // 4. Only block EXACT identical short responses (< 50 chars) from previous turns
    //    Long responses are unlikely to be true duplicates
    if (trimmed.length < 50) {
        for (const turn of history.filter(t => t.role === "interviewer")) {
            if (trimmed.toLowerCase() === turn.content.toLowerCase()) {
                return ""; // Only trigger on short exact duplicates
            }
        }
    }

    return trimmed;
}

// ═══════════════════════════════════════════════════════
// 8. LANGUAGE ENFORCEMENT
// Returns prefix instruction if non-English detected.
// ═══════════════════════════════════════════════════════

export function enforceLanguage(detectedLanguage: string): string | null {
    const lang = (detectedLanguage || "en").toLowerCase().split("-")[0];
    if (lang !== "en") {
        return "You're doing well. For this interview, please try to answer in English so I can evaluate you better.";
    }
    return null;
}

// ═══════════════════════════════════════════════════════
// 9. PHASE ENFORCEMENT (DETERMINISTIC)
// Overrides decision engine output based on questionCount.
// ═══════════════════════════════════════════════════════

export function enforceTechnicalPhase(
    questionCount: number,
    currentAction: string,
    currentTopic: string,
    fullTranscript: string
): { isTechnicalStarted: boolean; action: string; topic: string } {
    if (questionCount < 2) {
        return {
            isTechnicalStarted: false,
            action: currentAction,
            topic: currentTopic,
        };
    }

    // After Q2, technical mode is LOCKED 
    const detectedTopic = (currentTopic && currentTopic !== "general")
        ? currentTopic
        : detectTopicFromTranscript(fullTranscript);

    // Override action: only CONTINUE_TOPIC, DEEPER_QUESTION, SIMPLIFY_QUESTION, or MOVE_TO_CODING allowed
    const allowedActions = ["CONTINUE_TOPIC", "DEEPER_QUESTION", "SIMPLIFY_QUESTION", "MOVE_TO_CODING"];
    const safeAction = allowedActions.includes(currentAction) ? currentAction : "CONTINUE_TOPIC";

    return {
        isTechnicalStarted: true,
        action: safeAction,
        topic: detectedTopic,
    };
}

// ═══════════════════════════════════════════════════════
// 10. FAIL-SAFE FALLBACK QUESTION
// ═══════════════════════════════════════════════════════

export function generateFallbackQuestion(topic: string): string {
    const fallbacks: Record<string, string> = {
        "HTML": "What is HTML and what role does it play in web development?",
        "CSS": "What is CSS and how does it style a webpage?",
        "JavaScript": "What is JavaScript and what are its core data types?",
        "React": "What is React and what problem does it solve?",
        "Node.js": "What is Node.js and how does it differ from browser JavaScript?",
        "Python": "What is Python and what are its primary use cases?",
        "TypeScript": "What is TypeScript and how does it differ from JavaScript?",
        "SQL": "What is SQL and what are the basic operations you can perform?",
        "Git": "What is Git and why is version control important?",
        "API": "What is a REST API and how does it work?",
    };

    return fallbacks[topic] || `What is ${topic} and how is it used in software development?`;
}
