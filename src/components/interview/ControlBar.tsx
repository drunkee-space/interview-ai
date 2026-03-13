"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, Code2, PhoneOff } from "lucide-react";

interface ControlBarProps {
    onEndInterview: () => void;
    isMicOn: boolean;
    isVideoOn: boolean;
    onToggleMic: () => void;
    onToggleVideo: () => void;
    onStartCoding: () => void;
}

const ControlButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    danger = false,
    primary = false
}: {
    icon: React.ElementType<{ className?: string }>,
    label: string,
    isActive?: boolean,
    onClick: () => void,
    danger?: boolean,
    primary?: boolean
}) => {

    // Determine exact styling based on state
    let bgClass = "bg-white/10 hover:bg-white/20 text-white";
    if (danger) {
        bgClass = "bg-red-500/20 hover:bg-red-500/40 text-red-500 hover:text-red-400 border-red-500/30";
    } else if (primary) {
        bgClass = "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20";
    } else if (isActive === false) {
        bgClass = "bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20";
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center border border-white/10 transition-colors backdrop-blur-md ${bgClass}`}
            >
                <Icon className="w-5 h-5" />
            </motion.button>
            <span className="text-[10px] font-medium text-white/50 tracking-wider uppercase">{label}</span>
        </div>
    );
};

export function ControlBar({ onEndInterview, isMicOn, isVideoOn, onToggleMic, onToggleVideo, onStartCoding }: ControlBarProps) {



    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-8 py-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-indigo-500/10"
        >
            <div className="flex items-center gap-2 sm:gap-4 pr-6 border-r border-white/10">
                <ControlButton
                    icon={isMicOn ? Mic : MicOff}
                    label="Mic"
                    isActive={isMicOn}
                    onClick={onToggleMic}
                />
                <ControlButton
                    icon={isVideoOn ? Video : VideoOff}
                    label="Camera"
                    isActive={isVideoOn}
                    onClick={onToggleVideo}
                />
            </div>

            <div className="flex items-center gap-2 sm:gap-4 px-2">
                <ControlButton
                    icon={Code2}
                    label="Code"
                    onClick={onStartCoding}
                />
            </div>

            <div className="flex items-center pl-6 border-l border-white/10">
                <ControlButton
                    icon={PhoneOff}
                    label="End"
                    danger
                    onClick={onEndInterview}
                />
            </div>
        </motion.div>
    );
}
