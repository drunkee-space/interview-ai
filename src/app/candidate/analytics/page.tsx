"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Trophy, Target, MessageSquare, Shield, TrendingUp, TrendingDown, Minus,
    Clock, ArrowRight, BarChart3, Sparkles, AlertCircle, RefreshCw, Zap
} from "lucide-react";

interface SessionItem {
    id: string;
    interview_type: string;
    status: string;
    start_time: string;
    current_topic: string;
    created_at: string;
    evaluation: {
        technical_score: number;
        communication_score: number;
        confidence_score: number;
        overall_score: number;
        strong_topics: string[];
        weak_topics: string[];
    } | null;
}

interface Stats {
    totalInterviews: number;
    completedInterviews: number;
    avgScore: number;
    avgTechnical: number;
    avgCommunication: number;
    avgConfidence: number;
}

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const res = await fetch("/api/analytics");
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data.sessions || []);
                    setStats(data.stats || null);
                    setError(null);
                } else {
                    const errData = await res.json().catch(() => ({}));
                    if (res.status === 401) {
                        setError("Unauthorized. Please log in to view your analytics.");
                    } else {
                        setError(errData.error || "Failed to load your analytics data.");
                    }
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
                setError("A network error occurred while loading analytics.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    function getScoreColor(score: number): string {
        if (score >= 70) return "text-emerald-400";
        if (score >= 50) return "text-amber-400";
        return "text-red-400";
    }

    function getScoreBg(score: number): string {
        if (score >= 70) return "bg-emerald-500";
        if (score >= 50) return "bg-amber-500";
        return "bg-red-500";
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground text-sm">Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Something went wrong</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90">
                    <RefreshCw className="w-4 h-4" /> Try Again
                </button>
            </div>
        );
    }

    // --- Computed Insights ---
    const completedSessions = sessions.filter(s => !!s.evaluation);
    
    // 1. Top Topics
    const strengthsCount: Record<string, number> = {};
    const weaknessesCount: Record<string, number> = {};
    completedSessions.forEach(s => {
        (s.evaluation!.strong_topics || []).forEach(t => { strengthsCount[t] = (strengthsCount[t] || 0) + 1 });
        (s.evaluation!.weak_topics || []).forEach(t => { weaknessesCount[t] = (weaknessesCount[t] || 0) + 1 });
    });
    const topStrengths = Object.entries(strengthsCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const topWeaknesses = Object.entries(weaknessesCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);

    // 2. Improvement Insight
    let insightMessage = null;
    let insightTrend: 'up' | 'down' | 'flat' = 'flat';
    
    if (completedSessions.length >= 2) {
        const latest = completedSessions[0];
        const previous = completedSessions[1];
        const diff = latest.evaluation!.overall_score - previous.evaluation!.overall_score;
        if (diff > 0) {
            insightMessage = `Great job! Your overall score improved by ${diff} points compared to your previous session.`;
            insightTrend = 'up';
        } else if (diff < 0) {
            insightMessage = `Your overall score dropped by ${Math.abs(diff)} points. Review your weak topics to bounce back!`;
            insightTrend = 'down';
        } else {
            insightMessage = `Your score held steady compared to your last session. Keep practicing to break through!`;
            insightTrend = 'flat';
        }
    }

    return (
        <div className="w-full">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Performance Analytics</h1>
                </div>
                <p className="text-muted-foreground text-sm">Track your interview progress and identify areas for improvement.</p>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Total Interviews", value: stats.totalInterviews, icon: Clock, suffix: "" },
                        { label: "Avg Technical", value: stats.avgTechnical, icon: Target, suffix: "/100" },
                        { label: "Avg Communication", value: stats.avgCommunication, icon: MessageSquare, suffix: "/100" },
                        { label: "Avg Confidence", value: stats.avgConfidence, icon: Shield, suffix: "/100" },
                    ].map(({ label, value, icon: Icon, suffix }, i) => (
                        <div key={label} className="bg-card/50 glass border border-border rounded-2xl p-5 flex flex-col items-center text-center">
                            <Icon className="w-5 h-5 text-muted-foreground mb-2" />
                            <p className={`text-2xl md:text-3xl font-bold ${i === 0 ? "text-foreground" : getScoreColor(value)}`}>
                                {value}{suffix}
                            </p>
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">{label}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Overall Score Banner */}
            {stats && stats.avgScore > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-primary/15 rounded-2xl p-6 mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Trophy className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Average Overall Score</p>
                            <p className={`text-3xl font-bold ${getScoreColor(stats.avgScore)}`}>{stats.avgScore}<span className="text-base text-muted-foreground font-normal">/100</span></p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>{stats.completedInterviews} completed</span>
                    </div>
                </motion.div>
            )}

            {/* Improvement Insights & Top Topics */}
            {completedSessions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    
                    {/* Main Insight */}
                    {insightMessage && (
                        <div className="md:col-span-1 bg-card/50 glass border border-border rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                {insightTrend === 'up' && <TrendingUp className="w-24 h-24 text-emerald-500" />}
                                {insightTrend === 'down' && <TrendingDown className="w-24 h-24 text-red-500" />}
                                {insightTrend === 'flat' && <Minus className="w-24 h-24 text-amber-500" />}
                            </div>
                            <div className="relative z-10">
                                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                    <Zap className="w-4 h-4 text-amber-400" /> Insight
                               </h3>
                                <p className="text-foreground text-sm leading-relaxed">{insightMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Topic Analytics */}
                    <div className={`${insightMessage ? "md:col-span-2" : "md:col-span-3"} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-3 block">Top Strengths</h3>
                            <div className="flex flex-wrap gap-2">
                                {topStrengths.length > 0 ? topStrengths.map(t => (
                                    <span key={t} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{t}</span>
                                )) : <span className="text-xs text-muted-foreground">Not enough data</span>}
                            </div>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5">
                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-3 block">Weaknesses To Review</h3>
                            <div className="flex flex-wrap gap-2">
                                {topWeaknesses.length > 0 ? topWeaknesses.map(t => (
                                    <span key={t} className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">{t}</span>
                                )) : <span className="text-xs text-muted-foreground">Not enough data</span>}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Score Over Time (Simple Bar Chart) */}
            {sessions.filter(s => s.evaluation).length > 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-card/50 glass border border-border rounded-2xl p-6 mb-10">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Score Progression</h3>
                    <div className="flex items-end gap-2 h-40">
                        {sessions
                            .filter(s => s.evaluation)
                            .slice(0, 12)
                            .reverse()
                            .map((s, i) => {
                                const score = s.evaluation?.overall_score || 0;
                                return (
                                    <div key={s.id} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                                        onClick={() => router.push(`/candidate/analytics/${s.id}`)}>
                                        <span className="text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{score}</span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(score, 5)}%` }}
                                            transition={{ delay: 0.05 * i, duration: 0.4 }}
                                            className={`w-full rounded-t-lg ${getScoreBg(score)} opacity-70 group-hover:opacity-100 transition-opacity min-h-[4px]`}
                                        />
                                        <span className="text-[9px] text-muted-foreground truncate max-w-full">{formatDate(s.created_at).split(",")[0]}</span>
                                    </div>
                                );
                            })}
                    </div>
                </motion.div>
            )}

            {/* Interview List */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Interview History</h3>

                {sessions.length === 0 && (
                    <div className="bg-card/50 glass border border-border rounded-2xl p-8 text-center">
                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">No interviews found. Start your first mock interview!</p>
                        <Link href="/candidate/mock-interviews" className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                            <Sparkles className="w-4 h-4" /> Start Interview
                        </Link>
                    </div>
                )}

                <div className="space-y-3">
                    {sessions.map((session, i) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 * i }}
                        >
                            <Link href={`/candidate/analytics/${session.id}`}
                                className="flex items-center justify-between p-4 bg-card/50 glass border border-border rounded-xl hover:border-primary/30 hover:bg-secondary/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.evaluation ? "bg-primary/10" : "bg-secondary"}`}>
                                        {session.evaluation ? (
                                            <span className={`text-sm font-bold ${getScoreColor(session.evaluation.overall_score)}`}>
                                                {session.evaluation.overall_score}
                                            </span>
                                        ) : (
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {session.interview_type || "Mock Interview"}
                                            {session.current_topic && session.current_topic !== "general" && (
                                                <span className="text-muted-foreground font-normal"> · {session.current_topic}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDate(session.created_at)}</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
