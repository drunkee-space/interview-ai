"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CandidateCamera } from "./CandidateCamera";
import { TranscriptPanel, TranscriptMessage } from "./TranscriptPanel";
import { ControlBar } from "./ControlBar";
import { completeSession, saveTranscripts, saveActivityLogs, TranscriptEntry, ActivityLogEntry, saveQuestionAnalysis, saveSessionState } from "@/lib/interviewLogger";
import { createClient } from "@/lib/supabase/client";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import type { ConversationMemory, StartInterviewResponse, RespondResponse } from "@/lib/ai/types";
import { Volume2, VolumeX, Gauge, CheckCircle2, AudioLines, ArrowRight, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NetworkIndicator } from "./NetworkIndicator";

interface InterviewRoomProps {
    sessionId: string;
    trackId: string;
}

export function InterviewRoom({ sessionId, trackId }: InterviewRoomProps) {
    const router = useRouter();
    const [isInitializing, setIsInitializing] = useState(true);
    const [roomError, setRoomError] = useState<string | null>(null);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [messages, setMessages] = useState<TranscriptMessage[]>([]);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

    // AI Voice Controls
    const [aiVolume, setAiVolume] = useState<number>(1.0);
    const [aiSpeed, setAiSpeed] = useState<number>(1.0);
    
    // Conversation State
    const [memory, setMemory] = useState<ConversationMemory | null>(null);

    // ─── New: "Ready for next question?" confirmation state ──
    const [waitingForReady, setWaitingForReady] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false); // Locking discussion phase

    const sessionStartTime = useRef(new Date());
    const initRef = useRef(false);
    const transcriptsRef = useRef<TranscriptEntry[]>([]);
    const activityLogsRef = useRef<ActivityLogEntry[]>([]);
    
    // Refs for TTS
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const [config, setConfig] = useState<any>(null);

    // ─── Whisper-powered Audio Recording ──────────────
    const { isRecording, isTranscribing, startRecording, stopRecording, audioLevel } = useAudioRecording();

    // ─── Text-to-Speech Helper ────────────────────────
    const speakMessage = useCallback((text: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        if (aiVolume === 0) {
            setIsAiSpeaking(true);
            setTimeout(() => { setIsAiSpeaking(false); }, text.length * 50);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || (v.lang === "en-US" && v.name.includes("Female")));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = aiSpeed;
        utterance.volume = aiVolume;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => { setIsAiSpeaking(true); };
        utterance.onend = () => { setIsAiSpeaking(false); };
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.warn("TTS Notice:", e.error);
            }
            setIsAiSpeaking(false);
        };

        activeUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [aiVolume, aiSpeed]);

    useEffect(() => {
        if (isAiSpeaking && synthRef.current && activeUtteranceRef.current) {
            synthRef.current.cancel();
            speakMessage(activeUtteranceRef.current.text);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aiSpeed, aiVolume]);

    // ─── Initialize Room & Load Voices ────────────────
    useEffect(() => {
        if (typeof window !== "undefined") {
            synthRef.current = window.speechSynthesis;
            window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
        }
        return () => { if (synthRef.current) synthRef.current.cancel(); };
    }, []);

    // ─── Initialize AI + Media Stream ─────────────────
    useEffect(() => {
        let activeStream: MediaStream | null = null;
        let isMounted = true;

        if (initRef.current) return;
        initRef.current = true;

        const initRoom = async () => {
            try {
                activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (isMounted) setStream(activeStream);
            } catch (err) {
                console.error("Failed to acquire media stream:", err);
                if (isMounted) { setIsMicOn(false); setIsVideoOn(false); }
            }

            try {
                // ─── Attempt to Rehydrate from Session API ───
                console.log("[InterviewRoom] Fetching session data for:", sessionId);
                const sessionRes = await fetch(`/api/interview/session/${sessionId}`);
                
                if (!sessionRes.ok) {
                    console.warn("[InterviewRoom] Session fetch failed:", sessionRes.status);
                    if (isMounted) setRoomError("Failed to load interview session. Please try again.");
                    return;
                }

                const sessionData = await sessionRes.json();
                console.log("[InterviewRoom] Session data received. Config topic:", sessionData.config_snapshot?.primary_topic);
                
                // ─── Critical Validation: Fallback Config Prevention ───
                if (!sessionData.config_snapshot || !sessionData.config_snapshot.primary_topic || sessionData.config_snapshot.primary_topic === "INVALID") {
                    console.error("[InterviewRoom] FATAL CONFIG ERROR. Missing or invalid configuration.");
                    if (isMounted) setRoomError("Interview configuration is missing or invalid. Please generate a new interview.");
                    return;
                }
                
                if (isMounted) setConfig(sessionData.config_snapshot);

                if (isMounted && sessionData.memory) {
                    setMemory(sessionData.memory);
                    
                    const safeTranscripts = sessionData.transcripts || [];

                    // Map the backend DB structure 'ai'/'candidate' to TranscriptMessage format
                    const restoredMessages: TranscriptMessage[] = safeTranscripts.map((t: any) => ({
                        speaker: t.speaker === "ai" ? "ai" : "candidate",
                        text: t.message,
                    }));
                    
                    setMessages(restoredMessages);
                    transcriptsRef.current = safeTranscripts.map((t: any) => ({
                        speaker: t.speaker,
                        message: t.message
                    }));
                    
                    if (sessionData.state === "CODING") {
                        setIsReadOnly(true);
                        // Redirect to coding page if session is in CODING state
                        setIsInitializing(false);
                        const codingType = sessionData.config_snapshot?.primary_topic || trackId || "python";
                        router.push(`/interview/${sessionId}/code?type=${encodeURIComponent(codingType)}&trackId=${trackId}`);
                        return;
                    }

                    setIsInitializing(false);

                    // Give them 1.5 seconds before asking them to start speaking again on reload
                    setTimeout(() => setWaitingForReady(true), 1500); 
                    return; // Exit here, do not call start!
                }

                const loadedConfig = sessionData.config_snapshot || null;
                setConfig(loadedConfig);

                // ─── If no session found or no memory, initialize fresh ───
                console.log("[InterviewRoom] No memory found, calling /api/interview/start...");
                const res = await fetch("/api/interview/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        interviewType: loadedConfig?.primary_topic || trackId,
                        personality: "friendly",
                        config: loadedConfig
                    }),
                });

                if (!res.ok) throw new Error("Failed to start AI interview");
                const data: StartInterviewResponse = await res.json();
                
                if (isMounted) {
                    setMemory(data.memory);
                    const aiMsg: TranscriptMessage = { speaker: "ai", text: data.greeting };
                    setMessages([aiMsg]);
                    transcriptsRef.current.push({ speaker: "ai", message: data.greeting });
                    activityLogsRef.current.push({ activity_type: "interview_started", description: "AI interview session began" });
                    setIsInitializing(false);
                    speakMessage(data.greeting);

                    // After greeting, wait for user to click "Ready" before recording
                    setTimeout(() => setWaitingForReady(true), 3000);
                }
            } catch (err) {
                console.error("Failed to initialize AI:", err);
                if (isMounted) setIsInitializing(false);
            }
        };

        if (isMounted && isInitializing && !messages.length) {
          initRoom();
        }

        return () => {
            isMounted = false;
            initRef.current = false; // Allow re-init on React Strict Mode remount
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
         return () => {
             if (stream && !window.location.href.includes(sessionId)) {
                 stream.getTracks().forEach(track => track.stop());
             }
         }
    }, [stream, sessionId]);

    // ─── User clicks "I'm Ready" → start recording ───
    const handleReadyForQuestion = useCallback(() => {
        setWaitingForReady(false);
        startRecording();
    }, [startRecording]);

    // ─── Handle Candidate Speech Submission (Whisper) ─
    const handleSubmitSpeech = useCallback(async () => {
        if (!memory || isWaitingForResponse || isAiSpeaking || isTranscribing) return;

        setIsWaitingForResponse(true);

        const lastQuestion = messages.filter(m => m.speaker === "ai").pop()?.text || "";

        const result = await stopRecording(lastQuestion);

        if (!result.text.trim()) {
            setIsWaitingForResponse(false);
            startRecording();
            return;
        }

        const candidateText = result.text.trim();

        // Add candidate message to UI — shows exact native script + detected language
        const candidateMsg: TranscriptMessage = {
            speaker: "candidate",
            text: candidateText,
            language: result.language,
            languageName: result.languageName,
        };
        setMessages(prev => [...prev, candidateMsg]);
        transcriptsRef.current.push({ speaker: "candidate", message: candidateText });

        setIsAiSpeaking(true);

        try {
            const res = await fetch("/api/interview/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, candidateAnswer: candidateText, memory }),
            });

            if (!res.ok) throw new Error("Failed to process response");
            const data: RespondResponse = await res.json();
            
            setMemory(data.updatedMemory);

            // ─── PERSIST MEMORY TO DB AFTER EVERY TURN ───
            let currentTopic = config?.primary_topic || "general";
            try {
                currentTopic = data.updatedMemory.topicsAsked?.length > 0
                    ? data.updatedMemory.topicsAsked[data.updatedMemory.topicsAsked.length - 1].topic
                    : config?.primary_topic || "general";
                await saveSessionState(sessionId, "DISCUSSION", currentTopic, data.updatedMemory);
            } catch (persistErr) {
                console.warn("[InterviewRoom] Non-fatal: failed to persist memory to DB", persistErr);
            }

            // Save evaluation to DB (with error handling)
            if (data.evaluation) {
                try {
                    await saveQuestionAnalysis(
                        sessionId,
                        lastQuestion,
                        currentTopic,
                        candidateText,
                        data.evaluation,
                        config?.current_level || "easy"
                    );
                } catch (evalErr) {
                    console.warn("Could not save evaluation (table may not exist yet):", evalErr);
                }
            }

            if (data.nextStep === "CODING") {
                const codingMsg = data.message || "Let's move to the coding round now.";
                speakMessage(codingMsg);
                setMessages(prev => [...prev, { speaker: "ai", text: codingMsg }]);
                transcriptsRef.current.push({ speaker: "ai", message: codingMsg });
                
                // Persist state as CODING before navigating
                try {
                    await saveSessionState(sessionId, "CODING", config?.primary_topic || "general", data.updatedMemory);
                } catch (_) {}
                
                setTimeout(() => handleStartCoding(), 3000);
                return;
            }

            const nextQ = data.nextQuestion || "Let's continue.";

            // Add AI response to UI
            const aiMsg: TranscriptMessage = { speaker: "ai", text: nextQ };
            setMessages(prev => [...prev, aiMsg]);
            transcriptsRef.current.push({ speaker: "ai", message: nextQ });

            if (data.shouldEndInterview) {
                speakMessage(nextQ);
                setTimeout(() => handleEndInterview(), 5000);
            } else {
                speakMessage(nextQ);
                // After AI speaks, show "Ready for Next Question?"
                setTimeout(() => setWaitingForReady(true), 2000);
            }

        } catch (err) {
            console.error("Failed to get AI response:", err);
            setIsAiSpeaking(false);
            setWaitingForReady(true);
        } finally {
            setIsWaitingForResponse(false);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memory, isWaitingForResponse, isAiSpeaking, isTranscribing, sessionId, messages, speakMessage, stopRecording, startRecording]);

    // ─── Toggle Handlers ──────────────────────────────
    const handleToggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => { track.enabled = !isMicOn; });
            setIsMicOn(!isMicOn);
        }
        if (isMicOn) { stopRecording(); } else { startRecording(); }
    };

    const handleToggleVideo = async () => {
        if (isVideoOn) {
            if (stream) {
                stream.getVideoTracks().forEach(track => { track.stop(); stream.removeTrack(track); });
                setStream(new MediaStream(stream.getTracks()));
            }
            setIsVideoOn(false);
        } else {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (stream) { stream.addTrack(newVideoTrack); setStream(new MediaStream(stream.getTracks())); }
                else { setStream(newStream); }
                setIsVideoOn(true);
            } catch (err) { console.error("Failed to re-acquire video:", err); }
        }
    };
    
    const handleToggleAiVolume = () => { setAiVolume(prev => prev === 0 ? 1.0 : 0); };

    const handleToggleAiSpeed = () => {
        setAiSpeed(prev => {
            if (prev === 0.5) return 0.75;
            if (prev === 0.75) return 1.0;
            if (prev === 1.0) return 1.25;
            if (prev === 1.25) return 1.5;
            return 0.5;
        });
    };

    const handleStartCoding = async () => {
        await stopRecording();
        if (synthRef.current) synthRef.current.cancel();
        activityLogsRef.current.push({ activity_type: "coding_started", description: "Candidate entered coding mode" });

        // ─── CODING DIFFICULTY = AVG ACTUAL PERFORMANCE ───
        // Use the candidate's demonstrated performance (average of question scores).
        // This guarantees the coding round matches what they actually proved they can handle,
        // and never picks a wildly easier/harder problem based on a single answer.
        const scores = (memory?.topicsAsked || [])
            .map((t: any) => Number(t?.score))
            .filter((s: number) => !isNaN(s));
        const avgScore = scores.length > 0
            ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
            : 5;
        let codingDifficulty: "easy" | "medium" | "hard";
        if (avgScore >= 7.5) codingDifficulty = "hard";
        else if (avgScore >= 5) codingDifficulty = "medium";
        else codingDifficulty = "easy";

        // Cap by the track's current_level so users can't unlock above their track's tier.
        const trackLevel = (config?.current_level || "easy") as "easy" | "medium" | "hard";
        const order = { easy: 1, medium: 2, hard: 3 } as const;
        if (order[codingDifficulty] > order[trackLevel]) {
            codingDifficulty = trackLevel;
        }
        console.log(`[InterviewRoom] Coding difficulty derived from avgScore=${avgScore.toFixed(2)} (capped by track=${trackLevel}) → ${codingDifficulty}`);

        try {
            const res = await fetch("/api/interview/coding-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...memory, difficulty: codingDifficulty }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.challenge) sessionStorage.setItem(`coding_challenge_${sessionId}`, JSON.stringify(data.challenge));
            }
        } catch (err) { console.error("Failed to generate code problem:", err); }

        const codingType = config?.primary_topic || trackId || "python";
        router.push(`/interview/${sessionId}/code?type=${encodeURIComponent(codingType)}&trackId=${trackId}`);
    };

    const handleEndInterview = async () => {
        await stopRecording();
        if (synthRef.current) synthRef.current.cancel();
        if (stream) stream.getTracks().forEach(t => t.stop());

        activityLogsRef.current.push({ activity_type: "interview_ended", description: "Interview session completed" });

        try {
            // Transcripts are persisted turn-by-turn by /api/interview/start and /api/interview/respond.
            // Only save activity logs and mark the session complete here to avoid duplicate rows.
            await Promise.all([
                saveActivityLogs(sessionId, activityLogsRef.current),
                completeSession(sessionId, sessionStartTime.current),
            ]);

            // ─── FETCH LATEST DB STATE FOR COMPLETE EVALUATION ───
            // Use the DB memory (source of truth) instead of potentially stale in-memory state
            let evalMemory = memory;
            try {
                const sessionRes = await fetch(`/api/interview/session/${sessionId}`);
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData.memory) {
                        evalMemory = sessionData.memory;
                    }
                }
            } catch (_) {
                console.warn("[InterviewRoom] Could not fetch DB memory for evaluation, using in-memory state.");
            }

            if (evalMemory) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    try {
                        const endRes = await fetch("/api/interview/end", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId, memory: evalMemory }),
                        });
                        
                        if (!endRes.ok) {
                            console.error("[InterviewRoom] /end API failed:", endRes.status);
                        }
                        // Evaluation is saved server-side by /api/interview/end
                        // No need to call saveFinalEvaluation again on client
                    } catch (e) {
                        console.warn("Final evaluation failed:", e);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to save interview data:", err);
        }

        // Redirect to analytics page for immediate session feedback
        router.push(`/candidate/analytics/${sessionId}`);
    };

    // ─── Render States ─────────────────────────────────
    if (roomError) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center shadow-2xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Session Integrity Failure</h2>
                    <p className="text-muted-foreground text-sm mb-6">{roomError}</p>
                    <button 
                        onClick={() => router.push("/candidate/mock-interviews")}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity w-full"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ─── Loading Screen ───────────────────────────────
    if (isInitializing) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0f111a] text-white">
                <div className="relative flex items-center justify-center mb-8">
                    <div className="absolute w-24 h-24 border-4 border-indigo-500/20 rounded-full animate-ping"></div>
                    <div className="absolute w-16 h-16 border-4 border-indigo-500/40 rounded-full animate-ping" style={{ animationDelay: "200ms" }}></div>
                    <div className="relative w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                </div>
                <h2 className="text-xl font-bold mb-2 tracking-tight">Connecting to AI Interviewer...</h2>
                <p className="text-sm text-indigo-200/60">Establishing secure media streams for {config?.title}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-[#0f111a] overflow-hidden font-sans">
            {/* Dynamic Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-900/10 blur-[120px]"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-900/15 blur-[120px]"></div>
            </div>


            {/* ═══ Network Indicator — Top Right ═══ */}
            <div className="absolute top-4 right-4 z-30">
                <NetworkIndicator />
            </div>

            {/* ═══ Two-Column Layout ═══ */}
            <div className="relative z-10 w-full h-full flex flex-col lg:flex-row p-4 sm:p-6 pb-24 lg:pb-6 gap-6">

                {/* ─── Left Column: AI Avatar & Controls ─── */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0">
                    <div className="flex flex-col items-center justify-center w-full max-w-2xl">
                        
                        {/* AI Avatar */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-36 h-36 lg:w-48 lg:h-48 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center mb-6 shadow-2xl">
                                <div className={`absolute inset-0 rounded-full border-2 border-indigo-500/50 transition-all duration-1000 ${isAiSpeaking ? "scale-110 opacity-0" : "scale-100 opacity-100"}`}></div>
                                <div className={`absolute inset-0 rounded-full border border-purple-500/30 transition-all duration-1000 delay-100 ${isAiSpeaking ? "scale-125 opacity-0" : "scale-100 opacity-100"}`}></div>
                                <div className={`w-16 h-16 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_40px_rgba(99,102,241,0.6)] ${isAiSpeaking || isWaitingForResponse ? "animate-pulse" : ""}`}></div>
                            </div>
                            <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                                {isTranscribing ? "Transcribing..." : isWaitingForResponse ? "AI Thinking..." : "AI Interviewer"}
                            </span>
                            {memory && (
                                <span className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                                    Question {memory.questionCount + 1} of {memory.maxQuestions}
                                </span>
                            )}

                            {/* AI Controls */}
                            <div className="mt-6 flex items-center gap-3 z-50">
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleToggleAiSpeed}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-white/80 backdrop-blur-md transition-colors shadow-lg">
                                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                                    Speed: {aiSpeed}x
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleToggleAiVolume}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border backdrop-blur-md transition-colors shadow-lg ${
                                        aiVolume > 0 ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80' : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-500'
                                    }`}>
                                    {aiVolume > 0 ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                </motion.button>
                            </div>

                            {/* Read Only Banner */}
                            {isReadOnly && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 px-6 py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500/90 rounded-2xl flex flex-col items-center gap-3">
                                    <span className="text-sm font-semibold text-center">Discussion Locked: You are in the Coding Round</span>
                                    <button onClick={() => router.push(`/interview/${sessionId}/code?type=${encodeURIComponent(config?.primary_topic || trackId || 'python')}&trackId=${trackId}`)}
                                        className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 font-semibold rounded-full shadow-md text-xs transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                        Resume Coding
                                    </button>
                                </motion.div>
                            )}

                            {/* ═══ "I'm Ready" Button — User controls when recording starts ═══ */}
                            <AnimatePresence>
                                {waitingForReady && !isAiSpeaking && !isReadOnly && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                        onClick={handleReadyForQuestion}
                                        className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 text-sm"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        I&apos;m Ready — Start Answering
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* Audio Waveform — shows when candidate is speaking */}
                            {isRecording && !isAiSpeaking && !isReadOnly && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-1 h-8">
                                        {[...Array(12)].map((_, i) => (
                                            <motion.div key={i} className="w-1 rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300"
                                                animate={{ height: Math.max(4, audioLevel * 32 * (0.5 + Math.sin(Date.now() / 200 + i) * 0.5)) }}
                                                transition={{ duration: 0.1 }} />
                                        ))}
                                        <AudioLines className="w-4 h-4 text-emerald-400 ml-2" />
                                    </div>
                                    <span className="text-xs text-emerald-400/80 font-medium tracking-wide">Listening... Speak now</span>
                                </motion.div>
                            )}

                            {/* Transcribing Spinner */}
                            {isTranscribing && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-indigo-400/80 font-medium">Processing your speech...</span>
                                </motion.div>
                            )}

                            {/* Done Speaking Button — only while recording */}
                            {isRecording && !isAiSpeaking && !isTranscribing && !isReadOnly && (
                                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleSubmitSpeech}
                                    className="mt-4 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done Speaking
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Right Column: Transcript Panel ─── */}
                <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 h-[280px] lg:h-full lg:max-h-[calc(100vh-48px)] lg:mb-0 mb-4">
                    <TranscriptPanel
                        messages={messages}
                        isAiSpeaking={isAiSpeaking}
                        liveTranscript={isTranscribing ? "Processing your speech..." : undefined}
                    />
                </div>
            </div>

            <CandidateCamera stream={stream} isVideoOn={isVideoOn} isMicOn={isMicOn} isListening={isRecording} />

            <ControlBar
                onEndInterview={handleEndInterview}
                isMicOn={isMicOn}
                isVideoOn={isVideoOn}
                onToggleMic={handleToggleMic}
                onToggleVideo={handleToggleVideo}
                onStartCoding={handleStartCoding}
            />
        </div>
    );
}
