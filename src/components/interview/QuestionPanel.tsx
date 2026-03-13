"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface QuestionPanelProps {
    question: string;
}

export function QuestionPanel({ question }: QuestionPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full relative group"
        >
            {/* Soft Glow Behind Card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative w-full bg-[#1e1e2e]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-8">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Current Question</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                    {question}
                </h2>
            </div>
        </motion.div>
    );
}
