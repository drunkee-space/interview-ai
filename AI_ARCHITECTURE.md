# Interview AI — Architecture & Logic Breakdown

This document provides a comprehensive technical breakdown of the Interview AI application's underlying logic, state management, memory, and data architecture. It answers critical questions regarding how the system controls AI behavior, evaluates candidates dynamically, prevents repetition, and persists interview lifecycles.

## 1. AI Engine: Controlling AI Behavior
**Question:** *How exactly are you enforcing the AI behavior? Is it just a single prompt or structured state?*

The system **does not** rely on a single massive prompt to maintain the interview. It uses a decoupled, state-driven workflow anchored by a strictly typed `ConversationMemory` object.

### The `ConversationMemory` State
The entire interview context is maintained in memory (and passed between the client and server on each turn) using this structure:
```typescript
interface ConversationMemory {
    sessionId: string;
    interviewType: string;
    difficulty: string;
    conversationHistory: { role: 'interviewer' | 'candidate'; content: string }[];
    topicsAsked: { topic: string; score: number; feedback: string }[];
    skippedTopics: string[];
    detectedStrengths: string[];
    detectedWeaknesses: string[];
    overallImpressionSoFar: string; // Dynamic calculation based on average score
    questionCount: number;
    maxQuestions: number;
}
```

### The Feedback Loop
AI behavior is enforced through a strictly choreographed loop rather than a single prompt:
1. **Understand State:** The candidate submits an answer.
2. **Evaluate:** The `evaluateAnswer()` function uses an LLM to score the answer out of 10 and extract strengths/weaknesses.
3. **Update State:** Reducers in `memory.ts` update `topicsAsked`, deduplicate newly detected weaknesses, and calculate the `overallImpressionSoFar`.
4. **Generate Next:** The updated `ConversationMemory` is serialized. `generateNextQuestion()` passes this structured summary to the LLM along with explicit rules (e.g., "Adjust difficulty based on the last answer...").

---

## 2. Dynamic Evaluation: Deciding When a User is "Struggling"
**Question:** *What logic decides the user is struggling?*

The system determines struggle through **direct LLM evaluation and scoring heuristics**, supplemented by explicit intent detection.

1. **Explicit Scoring (1-10 Scale):** 
   Every verbal response is run through a dedicated `buildEvaluationPrompt`. The LLM grades the answer:
   * **1-3:** Incorrect, off-topic, unable to answer.
   * **4-5:** Partial understanding, notable gaps.
   * **6-7:** Mostly correct.
   * **8-10:** Strong, accurate, clear.

2. **Overall Impression Aggregation:**
   In `memory.ts`, the system averages the running scores of all `topicsAsked`. If the average drops below `5`, the `overallImpressionSoFar` is dynamically set to: `"Candidate is struggling and needs more guidance."` This string is injected into the prompt for the next question, signaling the AI to ease up or pivot.

3. **Explicit Skip Detection:**
   If a candidate explicitly says "I don't know" or "can we skip this", the evaluator prompt is instructed to flag `candidateSkipped: true`. The routing logic then immediately pushes the active topic into `skippedTopics` and forcefully adds it to `detectedWeaknesses`.

---

## 3. Context & Repetition: Preventing Repetitive Questions
**Question:** *How do you prevent repetitive questions within a session and across new sessions?*

### Within the Same Session
Repetition is blocked contextually in the prompt generation step (`buildQuestionPrompt`). 
* All previously covered topics (`topicsAsked`) and specific dialogue history are stringified into the prompt.
* If a candidate skipped a topic, it is injected via a hard constraint: *"Skipped topics for this session: [Topic]. Do not ask about these again in this round. Switch to a clearly different concept."*
* The prompt strictly mandates: *"Never repeat the same question, same concept, or a trivial rewording of an earlier question."*

### Across Multiple Sessions (The Persistence Loop)
To ensure the AI remembers a candidate from a past interview:
* When `/api/interview/start` is initialized, the system queries the Supabase `interview_evaluations` table for the user's past 3 sessions.
* It extracts all historical `weak_topics` associated with that user's ID.
* These are injected into the fresh `ConversationMemory` as `previousWeakTopics`.
* The AI's prompt is modified to say: *"\nPrevious weak areas from past sessions: [Topics]. Revisit some of them naturally, but mix them with fresh topics."*

---

## 4. Data & Memory: Storage Architecture
**Question:** *Where are you storing interview data? Be specific.*

Interview data is stored in **PostgreSQL databases hosted on Supabase**. The schema guarantees high relational integrity and separates ephemeral dialogue from analytical metrics.

**Core Tables:**
1. **`interview_sessions`**: The top-level parent record holding `user_id`, `interview_type`, `start_time`, `end_time`, and `duration`.
2. **`interview_transcripts`**: Appended line-by-line during the interview. Contains `speaker` (AI vs Candidate) and `message`.
3. **`evaluation_results`**: Contains deep micro-data per turn. It stores the `question`, `candidate_answer`, `score`, `feedback`, `strengths` array, and `weaknesses` array. Used for granular playback in the UI.
4. **`interview_evaluations`**: The macro report generated when the user clicks 'End Interview'. Scores communication, technical acumen, and problem-solving holistically out of 100.
5. **`code_attempts` & `coding_behavior`**: Used specifically during technical rounds to log syntax success rates, total compilation errors, and exact keystroke history/execution outputs.

## 5. Voice & Transcription Pipeline Execution
1. **Audio Capture:** Standard browser `MediaRecorder` API (`useAudioRecording.ts`) captures chunks.
2. **Transcription:** Sent to `/api/interview/transcribe` via `FormData()`. Handled seamlessly by Groq's `whisper-large-v3-turbo` model for high-speed, multilingual inference.
3. **TTS (Text-to-Speech):** Native browser `window.speechSynthesis` is utilized over external APIs to eradicate latency and manage dynamic interruptions. Simulated buffering visual effects overlay the wait time while the LLM generates the response.
