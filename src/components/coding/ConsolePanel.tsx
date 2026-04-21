"use client";

import { motion } from "framer-motion";
import { Terminal, Copy, Trash2, CheckCircle2, XCircle, Clock, Cpu, HardDrive, ChevronUp, ChevronDown, GripHorizontal } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

interface ExecutionMeta {
    durationMs?: number;
    memoryKB?: number;
    cpuTime?: number;
    exitCode?: number;
    rateLimitRemaining?: number;
    rateLimitTotal?: number;
    warnings?: string[];
}

interface ConsolePanelProps {
    output: string[];
    isRunning?: boolean;
    executionMeta?: ExecutionMeta;
}

type ConsoleTab = "output" | "testcases";

export function ConsolePanel({ output, isRunning = false, executionMeta }: ConsolePanelProps) {
    const [activeTab, setActiveTab] = useState<ConsoleTab>("output");
    const [copied, setCopied] = useState(false);
    const [height, setHeight] = useState(220);
    const [isResizing, setIsResizing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeStartY = useRef(0);
    const resizeStartHeight = useRef(0);

    // Attempt to parse SQL JSON
    let parsedTableData: Array<Record<string, any>> | null = null;
    let fallbackConsole: string[] = output;

    if (output.length > 0) {
        try {
            const rawOutputCount = output.filter(l => !l.startsWith("✓") && !l.startsWith("✗") && !l.startsWith("⛔") && !l.startsWith("⚠")).join("");
            if (rawOutputCount.startsWith("[{") && rawOutputCount.endsWith("}]")) {
                const parsed = JSON.parse(rawOutputCount);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsedTableData = parsed;
                }
            }
        } catch (e) {
            // Not structured JSON. Fallback to raw text
        }
    }

    // Auto-scroll to bottom on new output
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [output]);

    // Copy output to clipboard
    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(output.join("\n"));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }, [output]);

    // Resize handling
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        resizeStartY.current = e.clientY;
        resizeStartHeight.current = height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = resizeStartY.current - moveEvent.clientY;
            const newHeight = Math.min(500, Math.max(100, resizeStartHeight.current + delta));
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, [height]);

    // Classify line for coloring
    const getLineStyle = (line: string): string => {
        if (line.startsWith("Error") || line.startsWith("Traceback") || line.includes("error:") || line.includes("Error:")) {
            return "text-red-400";
        }
        if (line.startsWith("✓")) return "text-green-400 font-semibold";
        if (line.startsWith("✗")) return "text-red-400 font-semibold";
        if (line.startsWith("⛔")) return "text-red-400 font-bold";
        if (line.startsWith("🚫")) return "text-red-400";
        if (line.startsWith("⚠️") || line.startsWith("⚠")) return "text-yellow-400";
        if (line.startsWith("▸")) return "text-indigo-400";
        if (line.startsWith("Warning:") || line.startsWith("warning:")) return "text-yellow-400";
        return "text-white/70";
    };

    const hasOutput = output.length > 0;
    const hasError = executionMeta?.exitCode !== undefined && executionMeta.exitCode !== 0;
    const isSuccess = executionMeta?.exitCode === 0;

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ height: `${height}px` }}
            className="shrink-0 bg-[#0d1117] border-t border-white/[0.06] flex flex-col font-mono text-sm relative"
        >
            {/* ─── Resize Handle ─── */}
            <div
                onMouseDown={handleResizeStart}
                className={`absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-10 flex items-center justify-center group
                    ${isResizing ? "bg-indigo-500/30" : "hover:bg-indigo-500/20"} transition-colors`}
            >
                <GripHorizontal className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
            </div>

            {/* ─── Header ─── */}
            <div className="h-9 bg-[#161b22] flex items-center justify-between px-4 border-b border-white/[0.04] shrink-0 mt-1">
                {/* Tabs */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab("output")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded transition-colors
                            ${activeTab === "output"
                                ? "bg-white/10 text-white/80"
                                : "text-white/40 hover:text-white/60 hover:bg-white/5"}`}
                    >
                        <Terminal className="w-3 h-3" />
                        {parsedTableData ? "Query Results" : "Console"}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Execution meta pills */}
                    {executionMeta && hasOutput && !isRunning && (
                        <div className="flex items-center gap-2 mr-2">
                            {executionMeta.durationMs !== undefined && (
                                <span className="flex items-center gap-1 text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                    <Clock className="w-2.5 h-2.5" />
                                    {executionMeta.durationMs}ms
                                </span>
                            )}
                            {executionMeta.memoryKB !== undefined && executionMeta.memoryKB > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded">
                                    <HardDrive className="w-2.5 h-2.5" />
                                    {(executionMeta.memoryKB / 1024).toFixed(1)}MB
                                </span>
                            )}
                            {isSuccess && (
                                <span className="flex items-center gap-1 text-[10px] text-green-400/60 bg-green-500/10 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Passed
                                </span>
                            )}
                            {hasError && (
                                <span className="flex items-center gap-1 text-[10px] text-red-400/60 bg-red-500/10 px-2 py-0.5 rounded">
                                    <XCircle className="w-2.5 h-2.5" />
                                    Exit {executionMeta.exitCode}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        disabled={!hasOutput}
                        className={`p-1 rounded transition-colors ${
                            copied
                                ? "text-green-400"
                                : hasOutput
                                    ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                                    : "text-white/10 cursor-not-allowed"
                        }`}
                        title="Copy output"
                    >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Rate limit indicator */}
                    {executionMeta?.rateLimitRemaining !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono
                            ${executionMeta.rateLimitRemaining <= 5
                                ? "text-red-400/60 bg-red-500/10"
                                : executionMeta.rateLimitRemaining <= 10
                                    ? "text-yellow-400/60 bg-yellow-500/10"
                                    : "text-white/20 bg-white/5"}`}
                        >
                            {executionMeta.rateLimitRemaining}/{executionMeta.rateLimitTotal} runs left
                        </span>
                    )}
                </div>
            </div>

            {/* ─── Console Output ─── */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto text-white/70 space-y-0.5 text-xs leading-relaxed custom-scrollbar">
                {/* Running indicator */}
                {isRunning && (
                    <div className="flex items-center gap-2 text-indigo-400 py-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-xs font-medium">Executing code...</span>
                    </div>
                )}

                {/* Empty state */}
                {!isRunning && output.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Terminal className="w-8 h-8 text-white/10 mb-2" />
                        <p className="text-white/20 text-xs">Run your code to see output here</p>
                        <p className="text-white/10 text-[10px] mt-1">Press Ctrl+Enter or click the Run button</p>
                    </div>
                )}

                {/* SQL Table Results */}
                {!isRunning && parsedTableData && (
                    <>
                        {/* Show status lines first */}
                        {output.filter(l => l.startsWith("✓") || l.startsWith("✗")).map((line, idx) => (
                            <p key={`status-${idx}`} className={getLineStyle(line)}>{line}</p>
                        ))}
                        <div className="w-full overflow-x-auto rounded border border-white/10 mt-2">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        {Object.keys(parsedTableData[0]).map((key) => (
                                            <th key={key} className="px-3 py-2 font-semibold text-white/80">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedTableData.map((row, i) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                            {Object.values(row).map((val, j) => (
                                                <td key={j} className="px-3 py-1.5 text-white/70 whitespace-nowrap">
                                                    {String(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Regular Console Output */}
                {!isRunning && !parsedTableData && fallbackConsole.map((line, idx) => (
                    <p key={idx} className={getLineStyle(line)}>
                        {line || "\u00A0"}
                    </p>
                ))}

                {/* Warnings */}
                {!isRunning && executionMeta?.warnings && executionMeta.warnings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-yellow-500/20">
                        {executionMeta.warnings.map((w, i) => (
                            <p key={`warn-${i}`} className="text-yellow-400/70 text-[11px]">{w}</p>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
