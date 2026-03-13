"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface CodingMediaControlsProps {
    sessionId: string;
    type: string;
    isMicOn: boolean;
    isVideoOn: boolean;
    onToggleMic: () => void;
    onToggleVideo: () => void;
    onEndInterview: () => void;
}

const ControlBtn = ({ icon: Icon, isActive, onClick, danger }: { icon: React.ElementType<{ className?: string }>, isActive?: boolean, onClick: () => void, danger?: boolean }) => {
    let cn = "w-10 h-10 rounded-full flex items-center justify-center border transition-all text-white ";
    if (danger) {
        cn += "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white";
    } else if (isActive === false) {
        cn += "bg-red-500 hover:bg-red-400 border-red-400 shadow-md shadow-red-500/20";
    } else {
        cn += "bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md";
    }

    return (
        <button onClick={onClick} className={cn}>
            <Icon className="w-4 h-4" />
        </button>
    );
};

export function CodingMediaControls({
    sessionId, type, isMicOn, isVideoOn, onToggleMic, onToggleVideo, onEndInterview
}: CodingMediaControlsProps) {
    const router = useRouter();

    const handleBackToInterview = () => {
        router.push(`/interview/${sessionId}?type=${type}`);
    };



    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3 w-full"
        >
            <button
                onClick={handleBackToInterview}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1b26] border border-indigo-500/30 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 text-sm font-semibold transition-all shadow-lg"
            >
                <ChevronLeft className="w-4 h-4" />
                Return to Interview
            </button>

            <div className="flex items-center justify-between p-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="flex gap-2">
                    <ControlBtn icon={isMicOn ? Mic : MicOff} isActive={isMicOn} onClick={onToggleMic} />
                    <ControlBtn icon={isVideoOn ? Video : VideoOff} isActive={isVideoOn} onClick={onToggleVideo} />
                </div>
                <div className="w-px h-6 bg-white/20 mx-2"></div>
                <ControlBtn icon={PhoneOff} danger onClick={onEndInterview} />
            </div>
        </motion.div>
    );
}
