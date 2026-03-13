"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Video, Clock, CheckCircle2, ShieldAlert, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";

export default function InterviewInstructions({
    params,
}: {
    params: Promise<{ type: string }>;
}) {
    const router = useRouter();
    const { type } = use(params);

    // Find the requested configuration
    const config = MOCK_INTERVIEWS.find((i) => i.id === type);

    // If completely unfound, render a clean error fallback
    if (!config) {
        return (
            <div className="w-full flex flex-col items-center justify-center pt-20">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-foreground">Interview Not Found</h1>
                <p className="text-muted-foreground mb-6">We couldn&apos;t locate the interview type you requested.</p>
                <Link href="/candidate/mock-interviews" className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium">
                    Browse valid interviews
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto pt-4 pb-12">
            <Link
                href="/candidate/mock-interviews"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to available interviews
            </Link>

            <div className="bg-card/50 glass border border-border rounded-3xl overflow-hidden shadow-xl shadow-primary/5">

                {/* Header */}
                <div className="p-8 md:p-10 border-b border-border bg-secondary/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-primary/20">
                                Preparation Phase
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">{config.title}</h1>
                            <p className="text-muted-foreground text-lg leading-relaxed">{config.description}</p>
                        </div>

                        <div className="flex items-center space-x-6 text-muted-foreground bg-background/50 px-6 py-4 rounded-2xl border border-border/50 shrink-0">
                            <div className="flex flex-col items-center">
                                <Clock className="w-6 h-6 mb-1 text-primary" />
                                <span className="text-sm font-semibold">{config.duration}</span>
                            </div>
                            <div className="w-px h-10 bg-border"></div>
                            <div className="flex flex-col items-center">
                                <Video className="w-6 h-6 mb-1 text-primary" />
                                <span className="text-sm font-semibold">Camera On</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-10">
                    <h2 className="text-xl font-bold text-foreground mb-6">Before you begin</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-foreground">AI Reviewer</p>
                                    <p className="text-sm text-muted-foreground">You will be conversing with an advanced AI. Speak naturally and clearly.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle2 className="w-6 h-6 text-green-500 mr-3 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-foreground">Interactive Editor</p>
                                    <p className="text-sm text-muted-foreground">A synced code editor will be available for any required technical challenges.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start">
                                <ShieldAlert className="w-6 h-6 text-primary mr-3 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-foreground">Local Processing</p>
                                    <p className="text-sm text-muted-foreground">Your camera feed is only visible to you. We capture audio to process your spoken responses.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <ShieldAlert className="w-6 h-6 text-primary mr-3 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-foreground">Strict Timing</p>
                                    <p className="text-sm text-muted-foreground">Treat this like a real interview. The session will automatically conclude when the {config.duration} runs out.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="bg-secondary/50 rounded-2xl p-6 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="font-bold text-foreground">Ready to start?</p>
                            <p className="text-sm text-muted-foreground">Make sure you are in a quiet environment.</p>
                        </div>

                        <button
                            onClick={() => router.push(`/candidate/device-check?type=${type}`)}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 group"
                        >
                            Configure Devices
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
