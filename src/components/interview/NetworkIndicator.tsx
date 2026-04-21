"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NetworkQuality = "strong" | "fair" | "poor" | "offline";

interface NetworkState {
    quality: NetworkQuality;
    latencyMs: number | null;
    isOnline: boolean;
}

function getQualityColor(quality: NetworkQuality): string {
    switch (quality) {
        case "strong": return "text-emerald-400";
        case "fair": return "text-yellow-400";
        case "poor": return "text-red-400";
        case "offline": return "text-gray-500";
    }
}

function getQualityBg(quality: NetworkQuality): string {
    switch (quality) {
        case "strong": return "bg-emerald-500/10 border-emerald-500/20";
        case "fair": return "bg-yellow-500/10 border-yellow-500/20";
        case "poor": return "bg-red-500/10 border-red-500/20";
        case "offline": return "bg-gray-500/10 border-gray-500/20";
    }
}

function getQualityLabel(quality: NetworkQuality): string {
    switch (quality) {
        case "strong": return "Strong";
        case "fair": return "Fair";
        case "poor": return "Poor";
        case "offline": return "Offline";
    }
}

function SignalBars({ quality }: { quality: NetworkQuality }) {
    const barCount = 3;
    const activeBars = quality === "strong" ? 3 : quality === "fair" ? 2 : quality === "poor" ? 1 : 0;

    return (
        <div className="flex items-end gap-[2px] h-3">
            {Array.from({ length: barCount }, (_, i) => (
                <motion.div
                    key={i}
                    className={`w-[3px] rounded-sm transition-colors duration-300 ${
                        i < activeBars
                            ? quality === "strong"
                                ? "bg-emerald-400"
                                : quality === "fair"
                                    ? "bg-yellow-400"
                                    : "bg-red-400"
                            : "bg-white/10"
                    }`}
                    style={{ height: `${((i + 1) / barCount) * 100}%` }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.2 }}
                />
            ))}
        </div>
    );
}

export function NetworkIndicator() {
    const [network, setNetwork] = useState<NetworkState>({
        quality: "strong",
        latencyMs: null,
        isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    });
    const [showTooltip, setShowTooltip] = useState(false);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const latencyHistoryRef = useRef<number[]>([]);

    const measureLatency = useCallback(async () => {
        if (!navigator.onLine) {
            setNetwork({ quality: "offline", latencyMs: null, isOnline: false });
            return;
        }

        try {
            const start = performance.now();
            const res = await fetch("/api/health", {
                method: "GET",
                cache: "no-store",
                signal: AbortSignal.timeout(5000),
            });

            if (!res.ok) throw new Error("Health check failed");

            const latency = Math.round(performance.now() - start);

            // Keep a rolling window of last 5 measurements for smoothing
            latencyHistoryRef.current.push(latency);
            if (latencyHistoryRef.current.length > 5) {
                latencyHistoryRef.current.shift();
            }

            // Use average latency for smoother quality assessment
            const avgLatency = Math.round(
                latencyHistoryRef.current.reduce((a, b) => a + b, 0) /
                latencyHistoryRef.current.length
            );

            let quality: NetworkQuality;
            if (avgLatency < 150) quality = "strong";
            else if (avgLatency < 400) quality = "fair";
            else quality = "poor";

            setNetwork({ quality, latencyMs: avgLatency, isOnline: true });
        } catch {
            // Fetch failed — could be offline or server down
            if (!navigator.onLine) {
                setNetwork({ quality: "offline", latencyMs: null, isOnline: false });
            } else {
                setNetwork((prev) => ({
                    ...prev,
                    quality: "poor",
                    latencyMs: null,
                }));
            }
        }
    }, []);

    useEffect(() => {
        // Initial measurement
        measureLatency();

        // Periodic measurements every 15 seconds
        pingIntervalRef.current = setInterval(measureLatency, 15000);

        // Online/offline event listeners
        const handleOnline = () => {
            setNetwork((prev) => ({ ...prev, isOnline: true }));
            measureLatency();
        };
        const handleOffline = () => {
            setNetwork({ quality: "offline", latencyMs: null, isOnline: false });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [measureLatency]);

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Badge */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md cursor-default transition-colors duration-300 ${getQualityBg(network.quality)}`}
            >
                {network.isOnline ? (
                    <Wifi className={`w-3.5 h-3.5 ${getQualityColor(network.quality)}`} />
                ) : (
                    <WifiOff className="w-3.5 h-3.5 text-gray-500" />
                )}
                <SignalBars quality={network.quality} />
                <span className={`text-[10px] font-semibold tracking-wide ${getQualityColor(network.quality)}`}>
                    {getQualityLabel(network.quality)}
                </span>
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[180px]"
                    >
                        <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-semibold">
                            Network Status
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Latency</span>
                                <span className={`font-mono font-semibold ${getQualityColor(network.quality)}`}>
                                    {network.latencyMs !== null ? `${network.latencyMs}ms` : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Quality</span>
                                <span className={`font-semibold ${getQualityColor(network.quality)}`}>
                                    {getQualityLabel(network.quality)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Status</span>
                                <span className={network.isOnline ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                                    {network.isOnline ? "Connected" : "Disconnected"}
                                </span>
                            </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#1a1b26] border-l border-t border-white/10" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
