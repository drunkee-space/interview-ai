"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TimerBadge } from "./TimerBadge";
import { CandidateCamera } from "./CandidateCamera";
import { TranscriptPanel, TranscriptMessage } from "./TranscriptPanel";
import { ControlBar } from "./ControlBar";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";
import { completeSession, saveTranscripts, saveActivityLogs, TranscriptEntry, ActivityLogEntry, saveEvaluationResult } from "@/lib/interviewLogger";
import { createClient } from "@/lib/supabase/client";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { ConversationMemory, StartInterviewResponse, RespondResponse } from "@/lib/gemini/types";
import { Volume2, VolumeX, Gauge, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface InterviewRoomProps {
    sessionId: string;
    type: string;
}

export function InterviewRoom({ sessionId, type }: InterviewRoomProps) {
    const router = useRouter();
    const [isInitializing, setIsInitializing] = useState(true);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [messages, setMessages] = useState<TranscriptMessage[]>([]);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

    // AI Voice Controls
    const [aiVolume, setAiVolume] = useState<number>(1.0); // 1.0 (on) or 0 (muted)
    const [aiSpeed, setAiSpeed] = useState<number>(1.0); // 1.0, 1.25, 1.5
    
    // Conversation State
    const [memory, setMemory] = useState<ConversationMemory | null>(null);

    const sessionStartTime = useRef(new Date());
    const transcriptsRef = useRef<TranscriptEntry[]>([]);
    const activityLogsRef = useRef<ActivityLogEntry[]>([]);
    
    // Refs for TTS to prevent overlapping speech
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const config = MOCK_INTERVIEWS.find((i) => i.id === type);

    // Speech recognition
    const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();

    // ─── Text-to-Speech Helper ────────────────────────
    const speakMessage = useCallback((text: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // If muted, we don't speak, but we still simulate the AI speaking state time so logs/UI work
        if (aiVolume === 0) {
            setIsAiSpeaking(true);
            setTimeout(() => {
                setIsAiSpeaking(false);
            }, text.length * 50); // rough estimate of speaking time based on length
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a good female English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || (v.lang === "en-US" && v.name.includes("Female")));
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = aiSpeed;
        utterance.volume = aiVolume;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => {
            setIsAiSpeaking(true);
        };
        
        utterance.onend = () => {
            setIsAiSpeaking(false);
        };
        
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsAiSpeaking(false);
        };

        activeUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [aiVolume, aiSpeed]);

    // Apply speed changes instantly to currently active speech if it exists
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
            // Safari/Chrome need this to load voices properly
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
        
        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // ─── Initialize AI + Media Stream ─────────────────
    useEffect(() => {
        let activeStream: MediaStream | null = null;
        let isMounted = true;

        const initRoom = async () => {
            try {
                activeStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (isMounted) setStream(activeStream);
            } catch (err) {
                console.error("Failed to acquire media stream:", err);
                if (isMounted) {
                    setIsMicOn(false);
                    setIsVideoOn(false);
                }
            }

            try {
                // Call API to start interview and get initial greeting
                const res = await fetch("/api/interview/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId,
                        interviewType: type,
                        personality: "friendly", // Could make this selectable in UI later
                        difficulty: config?.difficulty.toLowerCase() || "medium",
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
                    
                    // Speak the greeting
                    speakMessage(data.greeting);

                    // Start listening for candidate speech after a short delay
                    setTimeout(() => startListening(), 2000);
                }
            } catch (err) {
                console.error("Failed to initialize AI:", err);
                if (isMounted) setIsInitializing(false); // Let them in anyway to avoid infinite loading
            }
        };

        if (isMounted && isInitializing && !messages.length) {
          initRoom();
        }

        return () => {
            isMounted = false;
            // Do NOT stop media stream on unmount or re-renders
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Stop streams properly only when actually navigating away or destroying the room completely
    useEffect(() => {
         return () => {
             if (stream && !window.location.href.includes(sessionId)) {
                 stream.getTracks().forEach(track => track.stop());
             }
         }
    }, [stream, sessionId]);

    // ─── Handle Candidate Speech Submission ───────────
    const handleSubmitSpeech = useCallback(async () => {
        if (!transcript.trim() || !memory || isWaitingForResponse || isAiSpeaking) return;

        const candidateText = transcript.trim();
        stopListening();
        setIsWaitingForResponse(true);

        // Add candidate message to UI immediately
        const candidateMsg: TranscriptMessage = { speaker: "candidate", text: candidateText };
        setMessages(prev => [...prev, candidateMsg]);
        transcriptsRef.current.push({ speaker: "candidate", message: candidateText });
        resetTranscript();

        setIsAiSpeaking(true); // Show thinking state

        try {
            const res = await fetch("/api/interview/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    candidateAnswer: candidateText,
                    memory,
                }),
            });

            if (!res.ok) throw new Error("Failed to process response");

            const data: RespondResponse = await res.json();
            
            setMemory(data.updatedMemory);

            // Save evaluation to DB
            const lastQuestion = messages.filter(m => m.speaker === "ai").pop()?.text || "";
            await saveEvaluationResult(sessionId, data.updatedMemory.questionCount, lastQuestion, candidateText, data.evaluation);

            // Add AI response to UI
            const aiMsg: TranscriptMessage = { speaker: "ai", text: data.nextQuestion };
            setMessages(prev => [...prev, aiMsg]);
            transcriptsRef.current.push({ speaker: "ai", message: data.nextQuestion });

            if (data.shouldEndInterview) {
                speakMessage(data.nextQuestion);
                setTimeout(() => handleEndInterview(), 5000);
            } else {
                speakMessage(data.nextQuestion);
                // Resume listening after a delay
                setTimeout(() => startListening(), 1000);
            }

        } catch (err) {
            console.error("Failed to get AI response:", err);
            setIsAiSpeaking(false);
            startListening();
        } finally {
            setIsWaitingForResponse(false);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript, memory, isWaitingForResponse, isAiSpeaking, sessionId, messages, speakMessage, startListening, stopListening, resetTranscript]);

    // ─── Auto-submit when candidate pauses ────────────
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTranscriptRef = useRef("");

    useEffect(() => {
        if (!isListening || !transcript || isAiSpeaking) return;

        // If transcript hasn't changed in 3.5 seconds, auto-submit
        if (transcript !== lastTranscriptRef.current) {
            lastTranscriptRef.current = transcript;

            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                if (transcript.trim().length > 5) {
                    handleSubmitSpeech();
                }
            }, 3500);
        }

        return () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, [transcript, isListening, handleSubmitSpeech, isAiSpeaking]);

    // ─── Toggle Handlers ──────────────────────────────
    const handleToggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMicOn;
            });
            setIsMicOn(!isMicOn);
        }

        if (isMicOn) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleToggleVideo = async () => {
        if (isVideoOn) {
            if (stream) {
                stream.getVideoTracks().forEach(track => {
                    track.stop();
                    stream.removeTrack(track);
                });
                setStream(new MediaStream(stream.getTracks()));
            }
            setIsVideoOn(false);
        } else {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (stream) {
                    stream.addTrack(newVideoTrack);
                    setStream(new MediaStream(stream.getTracks()));
                } else {
                    setStream(newStream);
                }
                setIsVideoOn(true);
            } catch (err) {
                console.error("Failed to re-acquire video:", err);
            }
        }
    };
    
    const handleToggleAiVolume = () => {
        setAiVolume(prev => prev === 0 ? 1.0 : 0);
    };

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
        stopListening();
        if (synthRef.current) synthRef.current.cancel();
        
        activityLogsRef.current.push({ activity_type: "coding_started", description: "Candidate entered coding mode" });

        try {
            // Dynamically generate coding question based on memory
            const res = await fetch("/api/interview/coding-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(memory),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.challenge) {
                    sessionStorage.setItem(`coding_challenge_${sessionId}`, JSON.stringify(data.challenge));
                }
            }
        } catch (err) {
            console.error("Failed to generate code problem:", err);
        }

        router.push(`/interview/${sessionId}/code?type=${type}`);
    };

    const handleEndInterview = async () => {
        stopListening();
        if (synthRef.current) synthRef.current.cancel();
        if (stream) stream.getTracks().forEach(t => t.stop());

        activityLogsRef.current.push({ activity_type: "interview_ended", description: "Interview session completed" });

        try {
            await Promise.all([
                saveTranscripts(sessionId, transcriptsRef.current),
                saveActivityLogs(sessionId, activityLogsRef.current),
                completeSession(sessionId, sessionStartTime.current),
            ]);

            // Request final comprehensive evaluation from Gemini
            if (memory) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    // We don't wait for this to finish to avoid blocking navigation
                    fetch("/api/interview/end", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId, memory }),
                    }).then(res => res.json()).then(({ finalEvaluation }) => {
                        import("@/lib/interviewLogger").then(m => {
                            m.saveFinalEvaluation(sessionId, user.id, finalEvaluation);
                        });
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Failed to save interview data:", err);
        }

        router.push("/candidate/history");
    };

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
            {/* Dynamic Background Dark Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-900/10 blur-[120px]"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-900/15 blur-[120px]"></div>
            </div>

            <TimerBadge duration={config?.duration || "45 mins"} />

            {/* Main Studio Area */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 pb-32">
                <div className="w-full max-w-5xl flex flex-col items-center gap-8">

                    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-4xl space-y-12">
                        {/* AI Avatar */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative w-48 h-48 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center mb-6 shadow-2xl">
                                <div className={`absolute inset-0 rounded-full border-2 border-indigo-500/50 transition-all duration-1000 ${isAiSpeaking ? "scale-110 opacity-0" : "scale-100 opacity-100"}`}></div>
                                <div className={`absolute inset-0 rounded-full border border-purple-500/30 transition-all duration-1000 delay-100 ${isAiSpeaking ? "scale-125 opacity-0" : "scale-100 opacity-100"}`}></div>
                                <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_40px_rgba(99,102,241,0.6)] ${isAiSpeaking || isWaitingForResponse ? "animate-pulse" : ""}`}></div>
                            </div>
                            <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                                {isWaitingForResponse ? "AI Thinking..." : "AI Interviewer"}
                            </span>
                            {memory && (
                                <span className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
                                    Question {memory.questionCount + 1} of {memory.maxQuestions}
                                </span>
                            )}

                            {/* AI Controls */}
                            <div className="mt-6 flex items-center gap-3 z-50">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleToggleAiSpeed}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-white/80 backdrop-blur-md transition-colors shadow-lg"
                                >
                                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                                    Speed: {aiSpeed}x
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleToggleAiVolume}
                                    className={`flex items-center justify-center w-8 h-8 rounded-full border backdrop-blur-md transition-colors shadow-lg ${
                                        aiVolume > 0 
                                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80' 
                                        : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-500'
                                    }`}
                                >
                                    {aiVolume > 0 ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                </motion.button>
                            </div>

                            {/* Done Speaking Button */}
                            {isListening && transcript.trim().length > 0 && !isAiSpeaking && (
                                <motion.button
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleSubmitSpeech}
                                    className="mt-6 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 text-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Done Speaking
                                </motion.button>
                            )}
                        </div>

                        <div className="w-full">
                            <TranscriptPanel
                                messages={messages}
                                isAiSpeaking={isAiSpeaking}
                                liveTranscript={isListening ? transcript : undefined}
                            />
                        </div>
                    </div>

                </div>
            </div>

            <CandidateCamera stream={stream} isVideoOn={isVideoOn} isMicOn={isMicOn} isListening={isListening} />

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
