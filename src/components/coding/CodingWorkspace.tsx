"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CodingQuestionPanel } from "./CodingQuestionPanel";
import { EditorPanel } from "./EditorPanel";
import { ConsolePanel } from "./ConsolePanel";
import { CandidateCamera } from "../interview/CandidateCamera";
import { Loader2, Clock, ChevronLeft, Play, Mic, MicOff, Video, VideoOff, PhoneOff, Shield, Zap, Download } from "lucide-react";
import { motion } from "framer-motion";
import { completeSession, saveCodeAttempts, saveActivityLogs, CodeAttemptEntry, ActivityLogEntry } from "@/lib/interviewLogger";
import { executeInBrowser, isRuntimeReady, getEngineName } from "@/lib/execution/browserExecutor";
import { sanitizeCode } from "@/lib/security/codeSanitizer";

import { getLanguageConfig } from "@/lib/languageConfig";

interface CodingWorkspaceProps {
    sessionId: string;
    type: string;
    trackId?: string;
}

interface ExecutionMeta {
    durationMs?: number;
    memoryKB?: number;
    cpuTime?: number;
    exitCode?: number;
    rateLimitRemaining?: number;
    rateLimitTotal?: number;
    warnings?: string[];
}

const STORAGE_KEY_PREFIX = "coding_state_";

const ControlBtn = ({ icon: Icon, isActive, onClick, danger, label }: { icon: React.ComponentType<{ className?: string }>, isActive?: boolean, onClick: () => void, danger?: boolean, label: string }) => {
    let cn = "w-11 h-11 rounded-full flex items-center justify-center border transition-all ";
    if (danger) cn += "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white";
    else if (isActive === false) cn += "bg-red-500 hover:bg-red-400 border-red-400 text-white shadow-md shadow-red-500/20";
    else cn += "bg-white/10 hover:bg-white/20 border-white/10 text-white backdrop-blur-md";

    return (
        <div className="flex flex-col items-center gap-1.5">
            <button onClick={onClick} className={cn}>
                <Icon className="w-4 h-4" />
            </button>
            <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider">{label}</span>
        </div>
    );
};

export function CodingWorkspace({ sessionId, type, trackId }: CodingWorkspaceProps) {
    const router = useRouter();
    const config = getLanguageConfig(type);

    const [isInitializing, setIsInitializing] = useState(true);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const [executionMeta, setExecutionMeta] = useState<ExecutionMeta>({});
    const [isRunning, setIsRunning] = useState(false);
    const [restoredCode, setRestoredCode] = useState<string | undefined>(undefined);
    const [runtimeLoading, setRuntimeLoading] = useState(false);
    const centerRef = useRef<HTMLDivElement>(null);
    const codeRef = useRef<string>(""); // Holds current code from editor

    // Media Stream State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const sessionStartTime = useRef(new Date());
    const codeAttemptsRef = useRef<CodeAttemptEntry[]>([]);
    const activityLogsRef = useRef<ActivityLogEntry[]>([]);
    const runCountRef = useRef(0);
    const errorCountRef = useRef(0);

    // Timer State — 15 minutes for coding round
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    const editorLanguage = config?.runtimeLanguage || "javascript";

    // ─── Persist coding state to sessionStorage ───
    const persistCodingState = useCallback(() => {
        try {
            const state = {
                code: codeRef.current,
                consoleOutput,
                executionMeta,
                runCount: runCountRef.current,
                errorCount: errorCountRef.current,
                codeAttempts: codeAttemptsRef.current,
                activityLogs: activityLogsRef.current,
                timeLeft,
                savedAt: Date.now(),
            };
            sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}`, JSON.stringify(state));
        } catch (e) {
            // sessionStorage might be full or unavailable
        }
    }, [sessionId, consoleOutput, executionMeta, timeLeft]);

    // ─── Restore coding state from sessionStorage ───
    const restoreCodingState = useCallback((): boolean => {
        try {
            const stored = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
            if (!stored) return false;

            const state = JSON.parse(stored);
            
            // Only restore if saved within last 30 minutes (session still valid)
            if (Date.now() - state.savedAt > 30 * 60 * 1000) {
                sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
                return false;
            }

            if (state.code) {
                codeRef.current = state.code;
                setRestoredCode(state.code); // Pass to EditorPanel
            }
            if (state.consoleOutput) setConsoleOutput(state.consoleOutput);
            if (state.executionMeta) setExecutionMeta(state.executionMeta);
            if (state.runCount) runCountRef.current = state.runCount;
            if (state.errorCount) errorCountRef.current = state.errorCount;
            if (state.codeAttempts) codeAttemptsRef.current = state.codeAttempts;
            if (state.activityLogs) activityLogsRef.current = state.activityLogs;
            if (state.timeLeft !== undefined) setTimeLeft(state.timeLeft);

            return true;
        } catch (e) {
            return false;
        }
    }, [sessionId]);

    // Auto-persist every 10 seconds
    useEffect(() => {
        if (isInitializing) return;
        const interval = setInterval(persistCodingState, 10000);
        return () => clearInterval(interval);
    }, [isInitializing, persistCodingState]);

    // Persist on visibility change (tab switch, minimize)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "hidden") {
                persistCodingState();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, [persistCodingState]);

    // Persist before unload (page refresh, close)
    useEffect(() => {
        const handleBeforeUnload = () => {
            persistCodingState();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [persistCodingState]);

    // Timer countdown — ONLY runs in coding mode (this component)
    useEffect(() => {
        if (isInitializing) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isInitializing]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Initialize hardware + restore state
    useEffect(() => {
        let activeStream: MediaStream | null = null;

        const initHardware = async () => {
            // Restore previous coding state first
            const restored = restoreCodingState();
            if (restored) {
                console.log("[CodingWorkspace] Restored coding state from session storage");
            }

            try {
                activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(activeStream);
            } catch (err) {
                console.error("Coding Room: Failed to acquire media", err);
                setIsMicOn(false);
                setIsVideoOn(false);
            }
            setIsInitializing(false);
        };
        const timer = setTimeout(() => { initHardware(); }, 800);
        return () => {
            clearTimeout(timer);
            if (activeStream) activeStream.getTracks().forEach(track => track.stop());
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => { track.enabled = !isMicOn; });
            setIsMicOn(!isMicOn);
        }
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

    const handleEndInterview = async () => {
        if (stream) stream.getTracks().forEach(t => t.stop());

        // Persist final state
        persistCodingState();

        try {
            await Promise.all([
                saveCodeAttempts(sessionId, codeAttemptsRef.current),
                saveActivityLogs(sessionId, activityLogsRef.current),
                completeSession(sessionId, sessionStartTime.current),
            ]);
        } catch (err) {
            console.error("Failed to save coding data:", err);
        }

        // Clean up session storage on completion
        try { sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${sessionId}`); } catch (_) {}

        router.push(`/candidate/analytics/${sessionId}`);
    };

    const handleBackToInterview = () => {
        // Persist state before navigating away
        persistCodingState();
        const codingType = encodeURIComponent(type);
        router.push(`/interview/${sessionId}?trackId=${trackId || ""}`);
    };

    // ─── IN-BROWSER CODE EXECUTION ───
    const handleRunCode = useCallback(async () => {
        if (isRunning) return;
        
        setIsRunning(true);
        runCountRef.current += 1;
        
        const currentCode = codeRef.current;
        
        if (!currentCode.trim()) {
            setConsoleOutput(["▸ Error: No code to execute. Write some code first."]);
            setExecutionMeta({ exitCode: 1 });
            setIsRunning(false);
            return;
        }

        // ─── Client-Side Code Sanitization ───
        const sanitizeResult = sanitizeCode(currentCode, editorLanguage);
        if (!sanitizeResult.safe) {
            const errorLines = [
                "⛔ Code execution blocked for safety reasons:",
                "",
                ...sanitizeResult.violations,
            ];
            if (sanitizeResult.warnings.length > 0) {
                errorLines.push("", ...sanitizeResult.warnings);
            }
            errorLines.push(
                "",
                "This is an interview environment. System-level operations,",
                "network access, and file manipulation are not permitted.",
                "Focus on algorithmic logic and data structures."
            );
            setConsoleOutput(errorLines);
            setExecutionMeta({ exitCode: 1 });
            setIsRunning(false);
            return;
        }

        // Show loading message if runtime needs to download
        if (!isRuntimeReady(editorLanguage)) {
            setRuntimeLoading(true);
            setConsoleOutput([`▸ Downloading ${getEngineName(editorLanguage)} runtime... (first run only)`]);
        } else {
            setConsoleOutput(["▸ Executing code..."]);
        }
        setExecutionMeta({});

        try {
            const result = await executeInBrowser(editorLanguage, currentCode);
            setRuntimeLoading(false);

            const outputLines: string[] = [];

            if (result.stdout) {
                outputLines.push(...result.stdout.split("\n"));
            }
            
            if (result.stderr) {
                errorCountRef.current += 1;
                outputLines.push("");
                outputLines.push(...result.stderr.split("\n").map((l: string) => {
                    if (l.startsWith("Error:") || l.startsWith("⛔") || l.startsWith("🚫") || l.startsWith("⚠") || l.startsWith("SQL Error:") || l.startsWith("Time Limit")) return l;
                    return `Error: ${l}`;
                }));
            }

            if (result.exitCode === 0 && !result.stderr) {
                outputLines.push("");
                outputLines.push(`✓ Execution completed successfully (in ${result.durationMs}ms) [${result.engine}]`);
            } else if (result.exitCode !== 0) {
                outputLines.push("");
                outputLines.push(`✗ Process exited with code ${result.exitCode} (in ${result.durationMs}ms)`);
            }

            setConsoleOutput(outputLines);
            setExecutionMeta({
                durationMs: result.durationMs,
                exitCode: result.exitCode,
            });

            // Track the attempt
            codeAttemptsRef.current.push({
                question: "coding_challenge",
                code: currentCode,
                run_count: runCountRef.current,
                error_count: errorCountRef.current,
                success: result.exitCode === 0 && !result.stderr,
                execution_output: (result.stdout || "") + (result.stderr || ""),
            });

            activityLogsRef.current.push({
                activity_type: "code_run",
                description: `Run #${runCountRef.current}: ${result.exitCode === 0 ? "success" : "error"} [${result.engine}]`,
            });

            // Persist state after each run
            setTimeout(() => persistCodingState(), 100);
        } catch (err: any) {
            setRuntimeLoading(false);
            setConsoleOutput([
                "▸ Execution failed",
                "",
                `Error: ${err.message || "Unknown error during code execution."}`,
            ]);
            setExecutionMeta({ exitCode: 1 });
        } finally {
            setIsRunning(false);
        }
    }, [isRunning, editorLanguage, persistCodingState]);

    // Callback for editor code changes
    const handleCodeChange = useCallback((code: string) => {
        codeRef.current = code;
    }, []);

    // Global keyboard shortcut for Ctrl+Enter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleRunCode();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleRunCode]);

    if (isInitializing) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0f111a] text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 animate-pulse border-2 border-[#0f111a]" />
                    </div>
                    <h2 className="text-lg font-bold mb-1 tracking-tight">Initializing Coding Workspace</h2>
                    <p className="text-sm text-indigo-200/50">Setting up your IDE and connecting to the execution engine...</p>
                    <div className="flex items-center gap-4 mt-6 text-[10px] text-white/20">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Sandboxed</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Low Latency</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0f111a] text-white">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center max-w-md text-center">
                    <PhoneOff className="w-12 h-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Unsupported Topic</h2>
                    <p className="text-sm text-white/70 mb-6">
                        The requested topic &ldquo;{type}&rdquo; is not supported as a dynamic coding environment. Please choose a valid technical topic like React, Python, or SQL.
                    </p>
                    <button 
                        onClick={handleBackToInterview}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors border border-white/10"
                    >
                        Return to Interview
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-[#0f111a] text-white font-sans flex flex-col overflow-hidden">

            {/* ═══════ TOP BAR ═══════ */}
            <div className="h-14 shrink-0 bg-[#161b22] border-b border-white/[0.06] flex items-center justify-between px-5 z-30">
                {/* Left: Back Button */}
                <button
                    onClick={handleBackToInterview}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-sm font-medium transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Return to Interview
                </button>

                {/* Center: Timer + Security Badge */}
                <div className="flex items-center gap-3">
                    {runtimeLoading && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400/80 font-medium animate-pulse">
                            <Download className="w-3 h-3" />
                            Loading Runtime...
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400/80 font-medium">
                        <Shield className="w-3 h-3" />
                        In-Browser Sandbox
                    </div>
                    <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full border font-mono text-sm tracking-widest ${timeLeft < 120 ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white/80'}`}>
                        <Clock className="w-4 h-4 opacity-60" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Right: Run Button */}
                <button
                    onClick={() => handleRunCode()}
                    disabled={isRunning || !config.canExecute}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all text-sm font-semibold border shadow-lg ${
                        !config.canExecute
                            ? 'bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed'
                            : isRunning 
                                ? 'bg-yellow-500/20 border-yellow-500/20 text-yellow-400 cursor-wait'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/20 shadow-green-500/5 hover:shadow-green-500/10'
                    }`}
                >
                    {!config.canExecute ? <Clock className="w-4 h-4" /> : isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {!config.canExecute ? "Execution Disabled" : isRunning ? "Running..." : config.mode === "QUERY_MODE" ? "Run Query" : "Run Code"}
                    {!isRunning && config.canExecute && (
                        <span className="text-[10px] text-white/20 ml-1 font-normal">⌃↵</span>
                    )}
                </button>
            </div>

            {config.mode === "CONCEPTUAL_MODE" && (
                <div className="bg-blue-500/10 border-y border-blue-500/20 px-5 py-1.5 flex items-center justify-center text-xs text-blue-300 font-medium">
                    React coding is conceptual. Focus on logic and explanation.
                </div>
            )}

            {/* ═══════ CENTER AREA ═══════ */}
            <div ref={centerRef} className="flex-1 flex min-h-0 relative">
                {/* Left: Question Panel */}
                <CodingQuestionPanel sessionId={sessionId} type={type} />

                {/* Right: Editor + Console */}
                <div className="flex-1 flex flex-col min-w-0">
                    <EditorPanel type={type} onCodeChange={handleCodeChange} onRunCode={handleRunCode} restoredCode={restoredCode} />
                    <ConsolePanel output={consoleOutput} isRunning={isRunning} executionMeta={executionMeta} />
                </div>

                {/* Floating Draggable Camera (constrained to center area) */}
                <motion.div
                    drag
                    dragConstraints={centerRef}
                    dragElastic={0.05}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="absolute bottom-4 right-4 z-40 w-52 cursor-move"
                >
                    <CandidateCamera stream={stream} isVideoOn={isVideoOn} isMicOn={isMicOn} isFloating={false} />
                </motion.div>
            </div>

            {/* ═══════ BOTTOM BAR ═══════ */}
            <div className="h-20 shrink-0 bg-[#161b22] border-t border-white/[0.06] flex items-center justify-center gap-6 z-30">
                <ControlBtn icon={isMicOn ? Mic : MicOff} isActive={isMicOn} onClick={handleToggleMic} label="Mic" />
                <ControlBtn icon={isVideoOn ? Video : VideoOff} isActive={isVideoOn} onClick={handleToggleVideo} label="Camera" />
                <div className="w-px h-8 bg-white/10 mx-2"></div>
                <ControlBtn icon={PhoneOff} danger onClick={handleEndInterview} label="End" />
            </div>
        </div>
    );
}
