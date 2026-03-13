"use client";

import { motion } from "framer-motion";
import { Clock, Wifi } from "lucide-react";

export function TimerBadge({ duration }: { duration: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/20"
        >
            <div className="flex items-center gap-2 border-r border-white/20 pr-3">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs font-medium text-white/80">Excellent</span>
            </div>

            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="font-mono text-sm font-semibold text-white tracking-wider">
                    {duration.replace(" mins", "")}:00
                </span>
            </div>
        </motion.div>
    );
}
