"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";
import { Camera, Mic, AlertCircle, CheckCircle2, Loader2, VideoOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeviceCheck() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const type = searchParams.get("type");

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const [cameraStatus, setCameraStatus] = useState<"pending" | "granted" | "denied">("pending");
    const [micStatus, setMicStatus] = useState<"pending" | "granted" | "denied">("pending");
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [errorDetails, setErrorDetails] = useState("");

    const config = MOCK_INTERVIEWS.find((i) => i.id === type);
    const supabase = createClient();

    useEffect(() => {
        if (!type || !config) {
            router.push("/candidate/mock-interviews");
            return;
        }

        async function requestPermissions() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                setCameraStatus("granted");
                setMicStatus("granted");
            } catch (error: unknown) {
                const err = error as Error;
                console.error("Error accessing devices:", err);
                setErrorDetails(err.message || "Please ensure your browser has permission to access the camera and microphone.");

                // Attempt to figure out which one failed
                if (err.name === "NotAllowedError" || err.name === "NotFoundError") {
                    setCameraStatus("denied");
                    setMicStatus("denied");
                }
            }
        }

        requestPermissions();

        return () => {
            // Cleanup stream tracks when leaving page
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const handleCreateSession = async () => {
        if (!type) return;
        setIsCreatingSession(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Create Interview Session in Supabase
            const { data, error } = await supabase
                .from("interview_sessions")
                .insert([
                    { user_id: user.id, interview_type: type, status: 'active', start_time: new Date().toISOString() }
                ])
                .select()
                .single();

            if (error) throw error;

            // Stop webcam stream before navigating 
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Navigate to the full-screen premium AI interview room
            router.push(`/interview/${data.id}?type=${type}`);

        } catch (err) {
            console.error("Failed to create session:", err);
            setErrorDetails("Failed to create interview session. Please try again.");
            setIsCreatingSession(false);
        }
    };

    const getStatusIcon = (status: string, defaultIcon: React.ReactNode) => {
        if (status === "granted") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        if (status === "denied") return <AlertCircle className="w-5 h-5 text-red-500" />;
        return defaultIcon;
    };

    if (!config) return null; // Prevent flicker during redirect

    return (
        <div className="w-full flex flex-col items-center justify-center pt-8 pb-12">
            <div className="w-full max-w-3xl flex flex-col items-center text-center mb-10">
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Device Readiness Check</h1>
                <p className="text-muted-foreground">Please grant camera and microphone permissions before joining the {config.title}.</p>
            </div>

            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Video Preview */}
                <div className="flex flex-col space-y-4">
                    <div className={`aspect-video w-full rounded-2xl border-2 flex items-center justify-center overflow-hidden bg-black/50 ${cameraStatus === "granted" ? "border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : "border-border"
                        }`}>
                        {cameraStatus === "granted" ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover -scale-x-100" // Mirrors the webcam
                            />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                                <VideoOff className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-sm">Camera preview offline</p>
                            </div>
                        )}
                    </div>

                    {/* Status Boxes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border flex items-center space-x-3 transition-colors ${cameraStatus === "granted" ? "bg-green-500/10 border-green-500/20" :
                            cameraStatus === "denied" ? "bg-red-500/10 border-red-500/20" :
                                "bg-secondary border-border"
                            }`}>
                            {getStatusIcon(cameraStatus, <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />)}
                            <div>
                                <p className="text-sm font-semibold text-foreground leading-tight">Camera</p>
                                <p className="text-xs text-muted-foreground capitalize">{cameraStatus}</p>
                            </div>
                        </div>
                        <div className={`p-4 rounded-xl border flex items-center space-x-3 transition-colors ${micStatus === "granted" ? "bg-green-500/10 border-green-500/20" :
                            micStatus === "denied" ? "bg-red-500/10 border-red-500/20" :
                                "bg-secondary border-border"
                            }`}>
                            {getStatusIcon(micStatus, <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />)}
                            <div>
                                <p className="text-sm font-semibold text-foreground leading-tight">Microphone</p>
                                <p className="text-xs text-muted-foreground capitalize">{micStatus}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info & Actions */}
                <div className="flex flex-col p-8 rounded-3xl border border-border bg-card/50 glass justify-between">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-1">Interview Details</h3>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span className="px-2 py-0.5 rounded-full bg-secondary border border-border">{config.difficulty}</span>
                                <span>•</span>
                                <span>{config.duration}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start text-sm">
                                <div className="p-1 rounded bg-primary/10 mr-3 mt-0.5">
                                    <Camera className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-muted-foreground"><strong className="text-foreground">Required:</strong> We need access to your camera to simulate a real interview accurately.</p>
                            </div>
                            <div className="flex items-start text-sm">
                                <div className="p-1 rounded bg-primary/10 mr-3 mt-0.5">
                                    <Mic className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-muted-foreground"><strong className="text-foreground">Required:</strong> The AI needs a working microphone to process your spoken responses.</p>
                            </div>
                        </div>

                        {errorDetails && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {errorDetails}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 block">
                        <button
                            onClick={handleCreateSession}
                            disabled={cameraStatus !== "granted" || micStatus !== "granted" || isCreatingSession}
                            className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
                        >
                            {isCreatingSession ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Session...</>
                            ) : (
                                "Join Interview Room"
                            )}
                        </button>
                        <p className="text-xs text-center text-muted-foreground mt-4">By joining, you agree to our Terms of Service.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
