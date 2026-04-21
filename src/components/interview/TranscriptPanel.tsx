"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, Bot, User, Globe } from "lucide-react";

export interface TranscriptMessage {
    speaker: "ai" | "candidate";
    text: string;
    language?: string;       // ISO code e.g. "te", "hi"
    languageName?: string;   // Human name e.g. "Telugu", "Hindi"
}

interface TranscriptPanelProps {
    messages: TranscriptMessage[];
    isAiSpeaking: boolean;
    liveTranscript?: string;
}

export function TranscriptPanel({ messages, isAiSpeaking, liveTranscript }: TranscriptPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, liveTranscript]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col h-full min-h-[200px]"
        >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10 shrink-0">
                <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-400" /> Live Transcript
                </h3>
                {liveTranscript && (
                    <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Listening
                    </span>
                )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className="text-sm flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.speaker === "ai" ? "bg-indigo-500/20" : "bg-blue-500/20"}`}>
                            {msg.speaker === "ai" ? <Bot className="w-3 h-3 text-indigo-400" /> : <User className="w-3 h-3 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-semibold ${msg.speaker === "ai" ? "text-indigo-400" : "text-blue-400"}`}>
                                    {msg.speaker === "ai" ? "AI" : "You"}:
                                </span>
                                {/* Language Badge — shown for non-English candidate messages */}
                                {msg.speaker === "candidate" && msg.language && msg.language !== "en" && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                                        <Globe className="w-2.5 h-2.5" />
                                        {msg.languageName || msg.language}
                                    </span>
                                )}
                            </div>
                            <span className="text-white/80 leading-relaxed whitespace-pre-line break-words">{msg.text}</span>
                        </div>
                    </div>
                ))}

                {/* Live transcript (interim) */}
                {liveTranscript && (
                    <div className="text-sm flex items-start gap-2 opacity-60">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-blue-500/20">
                            <User className="w-3 h-3 text-blue-400" />
                        </div>
                        <div>
                            <span className="font-semibold mr-2 text-blue-400">You:</span>
                            <span className="text-white/60 italic">{liveTranscript}</span>
                        </div>
                    </div>
                )}

                {/* AI Typing Indicator */}
                <AnimatePresence>
                    {isAiSpeaking && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-sm flex items-center gap-2 text-white/60 pt-2"
                        >
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span className="italic">AI is thinking...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
