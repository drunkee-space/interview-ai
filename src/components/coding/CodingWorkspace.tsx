"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CodingQuestionPanel } from "./CodingQuestionPanel";
import { EditorPanel } from "./EditorPanel";
import { ConsolePanel } from "./ConsolePanel";
import { CandidateCamera } from "../interview/CandidateCamera";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";
import { Loader2, Clock, ChevronLeft, Play, Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { motion } from "framer-motion";
import { completeSession, saveCodeAttempts, saveActivityLogs, CodeAttemptEntry, ActivityLogEntry } from "@/lib/interviewLogger";

interface CodingWorkspaceProps {
    sessionId: string;
    type: string;
}

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

export function CodingWorkspace({ sessionId, type }: CodingWorkspaceProps) {
    const router = useRouter();
    const [isInitializing, setIsInitializing] = useState(true);
    const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
    const centerRef = useRef<HTMLDivElement>(null);

    // Media Stream State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const sessionStartTime = useRef(new Date());
    const codeAttemptsRef = useRef<CodeAttemptEntry[]>([]);
    const activityLogsRef = useRef<ActivityLogEntry[]>([]);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(45 * 60);

    const config = MOCK_INTERVIEWS.find((i) => i.id === type) || MOCK_INTERVIEWS[0];

    // Timer countdown
    useEffect(() => {
        if (isInitializing) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [isInitializing]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Initialize hardware
    useEffect(() => {
        let activeStream: MediaStream | null = null;
        const initHardware = async () => {
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
        const timer = setTimeout(() => { initHardware(); }, 1200);
        return () => {
            clearTimeout(timer);
            if (activeStream) activeStream.getTracks().forEach(track => track.stop());
        };
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

        try {
            await Promise.all([
                saveCodeAttempts(sessionId, codeAttemptsRef.current),
                saveActivityLogs(sessionId, activityLogsRef.current),
                completeSession(sessionId, sessionStartTime.current),
            ]);

            // Note: Evaluation is now handled by the AI Core when completing the overall interview.
            // Future feature: Trigger code-specific evaluation via AI Engine APIs if desired.
        } catch (err) {
            console.error("Failed to save coding data:", err);
        }

        router.push("/candidate/history");
    };

    const handleBackToInterview = () => {
        router.push(`/interview/${sessionId}?type=${type}`);
    };

    const handleRunCode = useCallback(() => {
        setConsoleOutput(["▸ Executing code...", ""]);
        setTimeout(() => {
            setConsoleOutput([
                "▸ Executing code...", "",
                ">>> twoSum([2, 7, 11, 15], 9)",
                "[0, 1]", "",
                "✓ Execution completed in 0.02s"
            ]);
        }, 800);
    }, []);

    // Control button helper


    if (isInitializing) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0f111a] text-white">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <h2 className="text-lg font-bold mb-1 tracking-tight">Initializing Coding Workspace...</h2>
                <p className="text-sm text-indigo-200/50">Booting syntax engines for {config.title}</p>
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

                {/* Center: Timer */}
                <div className={`flex items-center gap-2.5 px-5 py-2 rounded-full border font-mono text-sm tracking-widest ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-white/80'}`}>
                    <Clock className="w-4 h-4 opacity-60" />
                    <span>{formatTime(timeLeft)}</span>
                </div>

                {/* Right: Run Button */}
                <button
                    onClick={() => handleRunCode()}
                    className="flex items-center gap-2 px-5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-all text-sm font-semibold border border-green-500/20 shadow-lg shadow-green-500/5 hover:shadow-green-500/10"
                >
                    <Play className="w-4 h-4" />
                    Run Code
                </button>
            </div>

            {/* ═══════ CENTER AREA ═══════ */}
            <div ref={centerRef} className="flex-1 flex min-h-0 relative">
                {/* Left: Question Panel */}
                <CodingQuestionPanel sessionId={sessionId} type={type} />

                {/* Right: Editor + Console */}
                <div className="flex-1 flex flex-col min-w-0">
                    <EditorPanel type={type} />
                    <ConsolePanel output={consoleOutput} />
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
