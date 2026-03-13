"use client";

import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

interface CodingChallenge {
    question: string;
    topic: string;
    difficulty: string;
    hints: string[];
}

interface CodingQuestionPanelProps {
    sessionId: string;
    type: string;
}

export function CodingQuestionPanel({ sessionId, type }: CodingQuestionPanelProps) {
    const [challenge, setChallenge] = useState<CodingChallenge | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem(`coding_challenge_${sessionId}`);
        if (stored) {
            try {
                setChallenge(JSON.parse(stored));
            } catch (err) {
                console.error("Failed to parse stored challenge");
            }
        } else {
            // Fallback challenge if none was generated
            setChallenge({
                question: "Write a function to solve the Two Sum problem. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]",
                topic: "Arrays, Hash Table",
                difficulty: "Medium",
                hints: ["Consider using a Hash map to store elements you have already seen.", "What is the time complexity of a nested loop?"]
            });
        }
    }, [sessionId]);

    const requirements = [
        "Ensure your solution matches the expected function signature.",
        "Consider edge cases (empty inputs, negative numbers, etc).",
        "Optimize for Time and Space Complexity where possible."
    ];

    if (!challenge) {
        return (
            <div className="w-[400px] shrink-0 h-full bg-[#1a1b26] border-r border-white/10 flex items-center justify-center p-6 text-white/50">
                Loading problem statement...
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-[400px] shrink-0 h-full bg-[#1a1b26] border-r border-white/10 flex flex-col p-6 overflow-y-auto custom-scrollbar"
        >
            <div className="flex items-center gap-2 mb-6 text-indigo-400">
                <BookOpen className="w-5 h-5" />
                <h2 className="font-semibold tracking-wide uppercase text-sm">Problem Statement</h2>
            </div>

            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-white mb-2 leading-snug">
                        AI Generated Challenge
                    </h1>
                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                        <span className={`px-2 py-1 rounded capitalize ${
                            challenge.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 
                            challenge.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                        }`}>
                            {challenge.difficulty || "Medium"}
                        </span>
                        <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 uppercase">
                            {type}
                        </span>
                        <span className="px-2 py-1 rounded bg-white/5 text-white/50 truncate max-w-[150px]">
                            {challenge.topic}
                        </span>
                    </div>
                </div>

                <div className="prose prose-invert prose-sm">
                    <p className="text-white/85 leading-relaxed whitespace-pre-wrap font-sans">
                        {challenge.question}
                    </p>
                </div>

                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-white/90">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Requirements & Guidelines
                    </h3>
                    <ul className="space-y-2">
                        {requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span className="flex-1">{req}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {challenge.hints && challenge.hints.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-[#facc15]/90">
                            <Lightbulb className="w-4 h-4 text-[#facc15]" />
                            Interview Hints
                        </h3>
                        <ul className="space-y-2">
                            {challenge.hints.map((hint, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-white/60">
                                    <span className="w-1 h-1 rounded-full bg-[#facc15]/50 mt-2 shrink-0" />
                                    <span className="flex-1">{hint}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
