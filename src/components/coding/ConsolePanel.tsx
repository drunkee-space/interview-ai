"use client";

import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

interface ConsolePanelProps {
    output: string[];
}

export function ConsolePanel({ output }: ConsolePanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[200px] shrink-0 bg-[#0d1117] border-t border-white/[0.06] flex flex-col font-mono text-sm"
        >
            <div className="h-9 bg-[#161b22] flex items-center justify-between px-4 border-b border-white/[0.04] shrink-0">
                <div className="flex items-center gap-2 text-white/60 text-xs">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Console</span>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-white/70 space-y-0.5 text-xs leading-relaxed">
                {output.length === 0 ? (
                    <p className="text-white/30 italic">▸ Run your code to see output here...</p>
                ) : (
                    output.map((line, idx) => (
                        <p key={idx} className={line.startsWith("Error") || line.startsWith("Traceback") ? "text-red-400" : line.startsWith("✓") ? "text-green-400" : "text-white/70"}>
                            {line}
                        </p>
                    ))
                )}
            </div>
        </motion.div>
    );
}
