"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Trophy, Target, MessageSquare, Shield, ChevronLeft,
    ArrowRight, FileText, Sparkles, AlertCircle,
} from "lucide-react";

interface SessionData {
    memory: any;
    transcripts: { role: string; message: string; created_at: string }[];
    state: string;
}

interface EvaluationData {
    technical_score: number;
    communication_score: number;
    confidence_score: number;
    coding_score: number;
    feedback_summary: string;
    strong_topics: string[];
    weak_topics: string[];
    overall_score: number;
    depth_score: number;
    improvement_plan: string[];
}

export default function InterviewReportPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTranscript, setShowTranscript] = useState(false);

    useEffect(() => {
        async function fetchReport() {
            try {
                const [sessionRes, analyticsRes] = await Promise.all([
                    fetch(`/api/interview/session/${id}`),
                    fetch(`/api/analytics`),
                ]);

                if (sessionRes.ok) {
                    const data = await sessionRes.json();
                    setSessionData(data);
                }

                if (analyticsRes.ok) {
                    const analytics = await analyticsRes.json();
                    const match = analytics.sessions?.find((s: any) => s.id === id);
                    if (match?.evaluation) {
                        setEvaluation(match.evaluation);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch report:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReport();
    }, [id]);

    function getScoreColor(score: number): string {
        if (score >= 70) return "text-emerald-400";
        if (score >= 50) return "text-amber-400";
        return "text-red-400";
    }

    function getScoreGradient(score: number): string {
        if (score >= 70) return "from-emerald-500 to-emerald-600";
        if (score >= 50) return "from-amber-500 to-amber-600";
        return "from-red-500 to-red-600";
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground text-sm">Loading report...</p>
            </div>
        );
    }

    const topic = sessionData?.memory?.topicsAsked?.[sessionData.memory.topicsAsked.length - 1]?.topic || sessionData?.memory?.interviewType || "General";
    const questionCount = sessionData?.memory?.questionCount || 0;
    const transcripts = sessionData?.transcripts || [];

    return (
        <div className="w-full pb-12">
            {/* Back Navigation */}
            <button onClick={() => router.push("/candidate/analytics")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back to Analytics
            </button>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Interview Report</h1>
                </div>
                <p className="text-muted-foreground text-sm">
                    Topic: <span className="text-foreground font-medium">{topic}</span> · {questionCount} questions · Session ID: <span className="font-mono text-xs">{id.slice(0, 8)}...</span>
                </p>
            </motion.div>

            {/* Score Cards */}
            {evaluation && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Technical", score: evaluation.technical_score, icon: Target },
                        { label: "Communication", score: evaluation.communication_score, icon: MessageSquare },
                        { label: "Confidence", score: evaluation.confidence_score, icon: Shield },
                        { label: "Overall", score: evaluation.overall_score, icon: Trophy },
                    ].map(({ label, score, icon: Icon }) => (
                        <div key={label} className="relative bg-card/50 glass border border-border rounded-2xl p-5 text-center overflow-hidden">
                            <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${getScoreGradient(score)}`} />
                            <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                            <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</p>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">{label}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Feedback */}
            {evaluation && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 mb-10">
                    {evaluation.feedback_summary && (
                        <div className="bg-card/50 glass border border-border rounded-2xl p-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">AI Feedback Summary</h3>
                            <p className="text-foreground/80 leading-relaxed text-sm">{evaluation.feedback_summary}</p>
                        </div>
                    )}

                    {(evaluation.improvement_plan && evaluation.improvement_plan.length > 0) && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Targeted Improvement Plan</h3>
                            <ul className="space-y-3">
                                {evaluation.improvement_plan.map((plan, idx) => (
                                    <li key={idx} className="flex gap-3 text-sm text-foreground/80">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <p>{plan}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 mb-3">Strengths</h3>
                            <ul className="space-y-2">
                                {(evaluation.strong_topics || []).map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> {s}
                                    </li>
                                ))}
                                {(!evaluation.strong_topics?.length) && <li className="text-sm text-muted-foreground italic">None recorded</li>}
                            </ul>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-3">Areas to Improve</h3>
                            <ul className="space-y-2">
                                {(evaluation.weak_topics || []).map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" /> {w}
                                    </li>
                                ))}
                                {(!evaluation.weak_topics?.length) && <li className="text-sm text-muted-foreground italic">None recorded</li>}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            )}

            {!evaluation && (
                <div className="bg-card/50 glass border border-border rounded-2xl p-8 text-center mb-10">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Evaluation data is not available for this session.</p>
                </div>
            )}

            {/* Transcript Toggle */}
            {transcripts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <button onClick={() => setShowTranscript(!showTranscript)}
                        className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-4">
                        <MessageSquare className="w-4 h-4" />
                        {showTranscript ? "Hide Transcript" : "Show Full Transcript"} ({transcripts.length} messages)
                    </button>

                    {showTranscript && (
                        <div className="bg-card/50 glass border border-border rounded-2xl p-5 space-y-3 max-h-[500px] overflow-y-auto">
                            {transcripts.map((t, i) => (
                                <div key={i} className={`flex ${t.role === "ai" ? "justify-start" : "justify-end"}`}>
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                        t.role === "ai"
                                            ? "bg-secondary text-foreground rounded-bl-none"
                                            : "bg-primary text-primary-foreground rounded-br-none"
                                    }`}>
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">
                                            {t.role === "ai" ? "Interviewer" : "You"}
                                        </p>
                                        {t.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <Link href="/candidate/mock-interviews" className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/20 transition-all text-sm hover:opacity-90">
                    <Sparkles className="w-4 h-4" /> Practice Again
                    <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/candidate/analytics" className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground border border-border font-semibold rounded-full transition-all text-sm hover:bg-secondary/80">
                    <Trophy className="w-4 h-4" /> All Analytics
                </Link>
            </motion.div>
        </div>
    );
}
