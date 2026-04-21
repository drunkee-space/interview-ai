"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Target, MessageSquare, Shield, ArrowRight, RefreshCw, Sparkles, Quote, ChevronLeft } from "lucide-react";

const MOTIVATIONAL_QUOTES = [
    { text: "Every expert was once a beginner.", author: "Helen Hayes" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Your limitation — it's only your imagination.", author: "Unknown" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
];

interface SessionData {
    memory: any;
    transcripts: any[];
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
}

export default function InterviewSummaryPage({
    params,
}: {
    params: Promise<{ sessionId: string }>;
}) {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string>("");
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    useEffect(() => {
        params.then(({ sessionId: id }) => {
            setSessionId(id);
            fetchSummary(id);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchSummary(id: string) {
        try {
            const [sessionRes, evalRes] = await Promise.all([
                fetch(`/api/interview/session/${id}`),
                fetch(`/api/analytics`),
            ]);

            if (sessionRes.ok) {
                const data = await sessionRes.json();
                setSessionData(data);
            }

            if (evalRes.ok) {
                const analytics = await evalRes.json();
                const match = analytics.sessions?.find((s: any) => s.id === id);
                if (match?.evaluation) {
                    setEvaluation(match.evaluation);
                }
            }
        } catch (err) {
            console.error("Failed to fetch summary:", err);
            setError("Failed to load interview summary.");
        } finally {
            setIsLoading(false);
        }
    }

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
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f111a]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="mt-4 text-white/60 text-sm">Loading your results...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f111a] text-white">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={() => router.push("/candidate/mock-interviews")} className="px-6 py-2 bg-indigo-500 rounded-full text-sm font-semibold">
                    Back to Interviews
                </button>
            </div>
        );
    }

    const topic = sessionData?.memory?.topicsAsked?.[sessionData.memory.topicsAsked.length - 1]?.topic || sessionData?.memory?.interviewType || "General";
    const questionCount = sessionData?.memory?.questionCount || 0;

    return (
        <div className="min-h-screen bg-[#0f111a] text-white">
            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[60%] rounded-full bg-indigo-900/20 blur-[150px]" />
                <div className="absolute top-[30%] -right-[15%] w-[40%] h-[50%] rounded-full bg-purple-900/15 blur-[150px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Back Button */}
                <button onClick={() => router.push("/candidate/history")} className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back to History
                </button>

                {/* Hero Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> Interview Complete
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Session Summary</h1>
                    <p className="text-white/50 text-sm">
                        Topic: <span className="text-white/80 font-medium">{topic}</span> · {questionCount} questions answered
                    </p>
                </motion.div>

                {/* Score Cards */}
                {evaluation && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        {[
                            { label: "Technical", score: evaluation.technical_score, icon: Target },
                            { label: "Communication", score: evaluation.communication_score, icon: MessageSquare },
                            { label: "Confidence", score: evaluation.confidence_score, icon: Shield },
                            { label: "Overall", score: evaluation.overall_score, icon: Trophy },
                        ].map(({ label, score, icon: Icon }) => (
                            <div key={label} className="relative bg-white/5 border border-white/10 rounded-2xl p-5 text-center backdrop-blur-md overflow-hidden group hover:border-white/20 transition-colors">
                                <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${getScoreGradient(score)}`} />
                                <Icon className="w-5 h-5 text-white/30 mx-auto mb-2" />
                                <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</p>
                                <p className="text-[11px] text-white/40 uppercase tracking-wider mt-1 font-semibold">{label}</p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Feedback Section */}
                {evaluation && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6 mb-10">
                        {/* Summary */}
                        {evaluation.feedback_summary && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 mb-3">AI Feedback</h3>
                                <p className="text-white/80 leading-relaxed text-sm">{evaluation.feedback_summary}</p>
                            </div>
                        )}

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400/80 mb-3">Strengths</h3>
                                <ul className="space-y-2">
                                    {(evaluation.strong_topics || []).map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                            {s}
                                        </li>
                                    ))}
                                    {(!evaluation.strong_topics || evaluation.strong_topics.length === 0) && (
                                        <li className="text-sm text-white/40 italic">No strengths recorded yet</li>
                                    )}
                                </ul>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-5">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-red-400/80 mb-3">Areas to Improve</h3>
                                <ul className="space-y-2">
                                    {(evaluation.weak_topics || []).map((w, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                                            {w}
                                        </li>
                                    ))}
                                    {(!evaluation.weak_topics || evaluation.weak_topics.length === 0) && (
                                        <li className="text-sm text-white/40 italic">No weaknesses recorded yet</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* No Evaluation Fallback */}
                {!evaluation && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-10">
                        <p className="text-white/50 text-sm">Evaluation data is not available for this session yet.</p>
                    </motion.div>
                )}

                {/* Motivational Quote */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/15 rounded-2xl p-6 mb-10 text-center">
                    <Quote className="w-6 h-6 text-indigo-400/50 mx-auto mb-3" />
                    <p className="text-white/80 italic text-sm leading-relaxed mb-2">&ldquo;{quote.text}&rdquo;</p>
                    <p className="text-indigo-400/60 text-xs font-semibold">— {quote.author}</p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href={`/candidate/analytics/${sessionId}`} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all text-sm">
                        <Trophy className="w-4 h-4" /> View Analytics
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/candidate/mock-interviews" className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-full transition-all text-sm">
                        <RefreshCw className="w-4 h-4" /> Retake Interview
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
