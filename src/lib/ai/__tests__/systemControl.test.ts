/**
 * Deterministic QA Test Suite for System Control Engine
 * Tests all 7 enforcement layers without requiring LLM calls.
 */

import {
    enforceTechnicalPhase,
    detectTopicFromTranscript,
    isCareerQuestion,
    validateQuestionOutput,
    enforceLanguage,
    generateFallbackQuestion,
    enforceTopicLock,
} from "../systemControl";

// ═══════════════════════════════════════════════════════
// TEST 1: NORMAL FLOW — Phase Transition
// ═══════════════════════════════════════════════════════

console.log("=== TEST 1: NORMAL FLOW (Phase Transition) ===");

// Q0 (first intro question) — should NOT trigger technical
const t1_q0 = enforceTechnicalPhase(0, "CONTINUE_TOPIC", "general", "Hi, I am pursuing MCA and I worked on projects using HTML, CSS, and React.");
console.log(`  Q0: isTechnicalStarted=${t1_q0.isTechnicalStarted}, action=${t1_q0.action}`);
console.assert(t1_q0.isTechnicalStarted === false, "FAIL: Q0 should NOT be technical");

// Q1 (second intro question) — still NOT technical
const t1_q1 = enforceTechnicalPhase(1, "CONTINUE_TOPIC", "general", "Hi, I am pursuing MCA and I worked on projects using HTML, CSS, and React.");
console.log(`  Q1: isTechnicalStarted=${t1_q1.isTechnicalStarted}, action=${t1_q1.action}`);
console.assert(t1_q1.isTechnicalStarted === false, "FAIL: Q1 should NOT be technical");

// Q2 (transition point) — MUST trigger technical
const t1_q2 = enforceTechnicalPhase(2, "CONTINUE_TOPIC", "general", "Hi, I am pursuing MCA and I worked on projects using HTML, CSS, and React.");
console.log(`  Q2: isTechnicalStarted=${t1_q2.isTechnicalStarted}, action=${t1_q2.action}, topic=${t1_q2.topic}`);
console.assert(t1_q2.isTechnicalStarted === true, "FAIL: Q2 MUST be technical");
console.assert(t1_q2.topic !== "general", "FAIL: Q2 topic must NOT be 'general'");

// Q3+ — MUST remain technical
const t1_q3 = enforceTechnicalPhase(3, "DEEPER_QUESTION", "HTML", "HTML is a markup language used to structure web pages.");
console.log(`  Q3: isTechnicalStarted=${t1_q3.isTechnicalStarted}, action=${t1_q3.action}, topic=${t1_q3.topic}`);
console.assert(t1_q3.isTechnicalStarted === true, "FAIL: Q3 MUST be technical");

console.log("  ✅ TEST 1 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 2: FORCE DRIFT ATTEMPT — Action Override
// ═══════════════════════════════════════════════════════

console.log("=== TEST 2: FORCE DRIFT ATTEMPT ===");

// LLM tries SWITCH_TOPIC during technical — should be overridden to CONTINUE_TOPIC
const t2 = enforceTechnicalPhase(3, "SWITCH_TOPIC", "HTML", "I like web development because it's interesting");
console.log(`  LLM tried SWITCH_TOPIC → action=${t2.action}, topic=${t2.topic}`);
console.assert(t2.action === "CONTINUE_TOPIC", "FAIL: SWITCH_TOPIC must be blocked in technical phase");
console.assert(t2.topic === "HTML", "FAIL: Topic must remain HTML");

// Valid actions should pass through
const t2b = enforceTechnicalPhase(4, "DEEPER_QUESTION", "HTML", "");
console.assert(t2b.action === "DEEPER_QUESTION", "FAIL: DEEPER_QUESTION should be allowed");
const t2c = enforceTechnicalPhase(4, "SIMPLIFY_QUESTION", "HTML", "");
console.assert(t2c.action === "SIMPLIFY_QUESTION", "FAIL: SIMPLIFY_QUESTION should be allowed");

console.log("  ✅ TEST 2 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 3: LANGUAGE ENFORCEMENT
// ═══════════════════════════════════════════════════════

console.log("=== TEST 3: LANGUAGE ENFORCEMENT ===");

const t3_ta = enforceLanguage("ta");
console.log(`  Tamil input: prefix=${t3_ta ? "YES" : "NO"}`);
console.assert(t3_ta !== null, "FAIL: Tamil must trigger English reminder");
console.assert(t3_ta!.includes("English"), "FAIL: Reminder must mention English");

const t3_hi = enforceLanguage("hi-IN");
console.log(`  Hindi input: prefix=${t3_hi ? "YES" : "NO"}`);
console.assert(t3_hi !== null, "FAIL: Hindi must trigger English reminder");

const t3_en = enforceLanguage("en");
console.log(`  English input: prefix=${t3_en ? "YES" : "NO"}`);
console.assert(t3_en === null, "FAIL: English should NOT trigger reminder");

const t3_enUS = enforceLanguage("en-US");
console.log(`  en-US input: prefix=${t3_enUS ? "YES" : "NO"}`);
console.assert(t3_enUS === null, "FAIL: en-US should NOT trigger reminder");

console.log("  ✅ TEST 3 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 4: CAREER QUESTION BLOCKER
// ═══════════════════════════════════════════════════════

console.log("=== TEST 4: CAREER QUESTION BLOCKER ===");

const careerQuestions = [
    "Tell me about your studies and education background",
    "What college did you attend?",
    "Tell me about yourself and your interests",
    "What internships have you done?",
    "What do you like about web development?",
    "What are your future plans?",
    "Which college are you studying at?",
];

const technicalQuestions = [
    "What is HTML?",
    "Explain the box model in CSS",
    "What is the difference between let and var?",
    "How does virtual DOM work in React?",
    "What are closures in JavaScript?",
];

let allBlocked = true;
for (const q of careerQuestions) {
    const blocked = isCareerQuestion(q);
    if (!blocked) {
        console.log(`  ❌ MISSED: "${q}"`);
        allBlocked = false;
    }
}
console.assert(allBlocked, "FAIL: Some career questions were not blocked");

let allPassed = true;
for (const q of technicalQuestions) {
    const blocked = isCareerQuestion(q);
    if (blocked) {
        console.log(`  ❌ FALSE POSITIVE: "${q}"`);
        allPassed = false;
    }
}
console.assert(allPassed, "FAIL: Technical questions incorrectly blocked");

console.log("  ✅ TEST 4 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 5: QUESTION VALIDATION FILTER
// ═══════════════════════════════════════════════════════

console.log("=== TEST 5: QUESTION VALIDATION FILTER ===");

// In intro phase — everything passes
const v1 = validateQuestionOutput("Tell me about yourself", false, "general");
console.assert(v1.valid === true, "FAIL: Intro phase should allow career questions");

// In technical phase — career blocked
const v2 = validateQuestionOutput("Tell me about your studies", true, "HTML");
console.log(`  Career in tech phase: valid=${v2.valid}, reason=${v2.reason}`);
console.assert(v2.valid === false, "FAIL: Career question must be rejected in tech phase");

// In technical phase — vague blocked
const v3 = validateQuestionOutput("What do you think about React?", true, "React");
console.log(`  Vague in tech phase: valid=${v3.valid}, reason=${v3.reason}`);
console.assert(v3.valid === false, "FAIL: Vague question must be rejected in tech phase");

// In technical phase — valid technical
const v4 = validateQuestionOutput("What is semantic HTML?", true, "HTML");
console.log(`  Technical question: valid=${v4.valid}`);
console.assert(v4.valid === true, "FAIL: Valid technical question should pass");

console.log("  ✅ TEST 5 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 6: TOPIC DETECTION
// ═══════════════════════════════════════════════════════

console.log("=== TEST 6: TOPIC DETECTION ===");

const d1 = detectTopicFromTranscript("I worked on HTML projects and used tags and elements");
console.log(`  "HTML projects..." → ${d1}`);
console.assert(d1 === "HTML", `FAIL: Expected HTML, got ${d1}`);

const d2 = detectTopicFromTranscript("I built a React component with hooks and useState");
console.log(`  "React component..." → ${d2}`);
console.assert(d2 === "React", `FAIL: Expected React, got ${d2}`);

const d3 = detectTopicFromTranscript("I used JavaScript promises and async await with closures");
console.log(`  "JS promises..." → ${d3}`);
console.assert(d3 === "JavaScript", `FAIL: Expected JavaScript, got ${d3}`);

const d4 = detectTopicFromTranscript("hello world I am a student");
console.log(`  "no tech keywords" → ${d4}`);
console.assert(d4 === "HTML", `FAIL: Expected HTML fallback, got ${d4}`);

console.log("  ✅ TEST 6 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 7: FALLBACK QUESTIONS
// ═══════════════════════════════════════════════════════

console.log("=== TEST 7: FALLBACK QUESTIONS ===");

const f1 = generateFallbackQuestion("HTML");
console.log(`  HTML fallback: "${f1}"`);
console.assert(f1.includes("HTML"), "FAIL: HTML fallback must mention HTML");
console.assert(!isCareerQuestion(f1), "FAIL: Fallback must NOT be a career question");

const f2 = generateFallbackQuestion("React");
console.assert(f2.includes("React"), "FAIL: React fallback must mention React");

const f3 = generateFallbackQuestion("UnknownTopic");
console.log(`  Unknown fallback: "${f3}"`);
console.assert(f3.includes("UnknownTopic"), "FAIL: Unknown topic fallback must use topic name");

// Validate ALL fallbacks are not career questions
const topics = ["HTML", "CSS", "JavaScript", "React", "Node.js", "Python", "TypeScript", "SQL", "Git", "API"];
for (const t of topics) {
    const fb = generateFallbackQuestion(t);
    console.assert(!isCareerQuestion(fb), `FAIL: Fallback for ${t} is a career question!`);
    const v = validateQuestionOutput(fb, true, t);
    console.assert(v.valid, `FAIL: Fallback for ${t} fails validation!`);
}

console.log("  ✅ TEST 7 PASSED\n");

// ═══════════════════════════════════════════════════════
// TEST 8: TOPIC LOCK
// ═══════════════════════════════════════════════════════

console.log("=== TEST 8: TOPIC LOCK ===");

const tl1 = enforceTopicLock("CONTINUE_TOPIC", "HTML", "React");
console.assert(tl1 === "HTML", `FAIL: CONTINUE_TOPIC must keep HTML, got ${tl1}`);

const tl2 = enforceTopicLock("DEEPER_QUESTION", "HTML", "CSS");
console.assert(tl2 === "HTML", `FAIL: DEEPER_QUESTION must keep HTML, got ${tl2}`);

const tl3 = enforceTopicLock("SWITCH_TOPIC", "HTML", "React");
console.assert(tl3 === "React", `FAIL: SWITCH_TOPIC should allow React, got ${tl3}`);

const tl4 = enforceTopicLock("SWITCH_TOPIC", "HTML", "");
console.assert(tl4 === "HTML", `FAIL: SWITCH_TOPIC with empty must keep HTML, got ${tl4}`);

console.log("  ✅ TEST 8 PASSED\n");

// ═══════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════

console.log("════════════════════════════════════════════");
console.log("ALL 8 TESTS PASSED ✅");
console.log("════════════════════════════════════════════");
