"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    primary = false,
    isHovered
}: {
    icon: React.ElementType<{ className?: string }>,
    label: string,
    isActive?: boolean,
    onClick: () => void,
    danger?: boolean,
    primary?: boolean,
    isHovered: boolean
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
        <div className="flex flex-col items-center gap-1">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={`relative rounded-full flex items-center justify-center border border-white/10 transition-all backdrop-blur-md ${bgClass} ${isHovered ? 'w-12 h-12' : 'w-8 h-8'}`}
            >
                <Icon className={isHovered ? 'w-5 h-5' : 'w-4 h-4'} />
            </motion.button>
            <AnimatePresence>
                {isHovered && (
                    <motion.span 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] font-medium text-white/50 tracking-wider uppercase overflow-hidden"
                    >
                        {label}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
};

export function ControlBar({ onEndInterview, isMicOn, isVideoOn, onToggleMic, onToggleVideo, onStartCoding }: ControlBarProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 transition-all duration-300 ${isHovered ? 'px-8 py-4 shadow-2xl shadow-indigo-500/10' : 'px-4 py-2 opacity-60 hover:opacity-100 shadow-lg'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex items-center gap-2 pr-4 border-r border-white/10 transition-all ${isHovered ? 'sm:gap-4 pr-6' : ''}`}>
                <ControlButton
                    icon={isMicOn ? Mic : MicOff}
                    label="Mic"
                    isActive={isMicOn}
                    onClick={onToggleMic}
                    isHovered={isHovered}
                />
                <ControlButton
                    icon={isVideoOn ? Video : VideoOff}
                    label="Camera"
                    isActive={isVideoOn}
                    onClick={onToggleVideo}
                    isHovered={isHovered}
                />
            </div>

            <div className={`flex items-center px-1 transition-all ${isHovered ? 'gap-2 sm:gap-4 px-2' : ''}`}>
                <ControlButton
                    icon={Code2}
                    label="Code"
                    onClick={onStartCoding}
                    isHovered={isHovered}
                />
            </div>

            <div className={`flex items-center pl-4 border-l border-white/10 transition-all ${isHovered ? 'pl-6' : ''}`}>
                <ControlButton
                    icon={PhoneOff}
                    label="End"
                    danger
                    onClick={onEndInterview}
                    isHovered={isHovered}
                />
            </div>
        </motion.div>
    );
}
