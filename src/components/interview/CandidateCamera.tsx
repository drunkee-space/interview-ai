"use client";

import { motion } from "framer-motion";
import { User, VideoOff, Mic, MicOff } from "lucide-react";
import { useEffect, useRef } from "react";

interface CandidateCameraProps {
    stream: MediaStream | null;
    isVideoOn: boolean;
    isMicOn: boolean;
    isFloating?: boolean;
    isListening?: boolean;
}

export function CandidateCamera({ stream, isVideoOn, isMicOn, isFloating = true, isListening = false }: CandidateCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const content = (
        <>
            {/* Fallback avatar if stream fails or camera is off */}
            {(!stream || !isVideoOn) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e2e] z-20 backdrop-blur-sm">
                    {isVideoOn ? (
                        <User className="w-12 h-12 text-white/20 mb-2" />
                    ) : (
                        <VideoOff className="w-10 h-10 text-red-500/80 mb-2" />
                    )}
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="relative z-10 w-full h-full object-cover -scale-x-100 mix-blend-screen"
            />
            
            {/* Listening Indicator Overlay Ring */}
            {isListening && isMicOn && (
                <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl z-30 pointer-events-none shadow-[inset_0_0_20px_rgba(16,185,129,0.3)] animate-pulse"></div>
            )}

            <div className="absolute bottom-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none">
                <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <div className="relative flex h-1.5 w-1.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isListening ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                    </div>
                    <span className="text-xs font-medium text-white shadow-sm">You</span>
                </div>

                {/* Mic Indicator */}
                <div className={`p-1.5 rounded-full backdrop-blur-md border transition-colors ${isMicOn ? 'bg-black/40 border-white/10 text-white/80' : 'bg-red-500/80 border-red-500 text-white'}`}>
                    {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </div>
            </div>

            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                <div className="w-8 h-1 bg-white/30 rounded-full mt-2"></div>
            </div>
        </>
    );

    if (!isFloating) {
        return (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-[#1a1b26] group flex items-center justify-center p-0">
                {content}
            </div>
        );
    }

    return (
        <motion.div
            drag
            dragConstraints={{ left: -500, right: 0, top: -500, bottom: 0 }}
            dragElastic={0.1}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`fixed bottom-32 right-8 z-50 w-64 aspect-video rounded-2xl overflow-hidden border shadow-2xl shadow-black/40 bg-[#1a1b26] cursor-move group flex items-center justify-center p-0 transition-colors duration-500 ${isListening && isMicOn ? 'border-emerald-500/50' : 'border-white/20'}`}
        >
            {content}
        </motion.div>
    );
}
