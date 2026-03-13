"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";
import {
    ArrowLeft, Calendar, Clock, Loader2, MessageSquare,
    Code2, Activity, HelpCircle, User, Bot, BarChart3, TrendingUp, TrendingDown
} from "lucide-react";
import Link from "next/link";

interface SessionData {
    id: string;
    interview_type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    duration: number | null;
}

interface Transcript { speaker: string; message: string; timestamp: string; }
interface CodeAttempt { question: string; code: string; run_count: number; error_count: number; success: boolean; execution_output: string; timestamp: string; }
interface ActivityLog { activity_type: string; description: string; timestamp: string; }
interface Question { question: string; question_type: string; timestamp: string; }
interface Evaluation {
    technical_score: number; coding_score: number; communication_score: number; confidence_score: number;
    strong_topics: string[]; weak_topics: string[]; feedback_summary: string;
}

export default function SessionDetail({ params }: { params: Promise<{ session_id: string }> }) {
    const resolvedParams = use(params);
    const sessionId = resolvedParams.session_id;

    const [session, setSession] = useState<SessionData | null>(null);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [codeAttempts, setCodeAttempts] = useState<CodeAttempt[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        async function fetchAll() {
            const [sessionRes, transcriptRes, codeRes, activityRes, questionRes, evalRes] = await Promise.all([
                supabase.from("interview_sessions").select("*").eq("id", sessionId).single(),
                supabase.from("interview_transcripts").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true }),
                supabase.from("code_attempts").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true }),
                supabase.from("interview_activity_logs").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true }),
                supabase.from("interview_questions").select("*").eq("session_id", sessionId).order("timestamp", { ascending: true }),
                supabase.from("interview_evaluations").select("*").eq("session_id", sessionId).single(),
            ]);

            if (sessionRes.data) setSession(sessionRes.data as SessionData);
            if (transcriptRes.data) setTranscripts(transcriptRes.data as Transcript[]);
            if (codeRes.data) setCodeAttempts(codeRes.data as CodeAttempt[]);
            if (activityRes.data) setActivityLogs(activityRes.data as ActivityLog[]);
            if (questionRes.data) setQuestions(questionRes.data as Question[]);
            if (evalRes.data) setEvaluation(evalRes.data as Evaluation);
            setIsLoading(false);
        }
        fetchAll();
    }, [sessionId, supabase]);

    const formatDuration = (s: number | null) => { if (!s) return "—"; const m = Math.floor(s / 60); return `${m} min${m !== 1 ? "s" : ""}`; };
    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const formatTime = (d: string) => new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const getTitle = (type: string) => MOCK_INTERVIEWS.find(i => i.id === type)?.title || type;

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center pt-32">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading session details...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="w-full flex flex-col items-center justify-center pt-32 text-center">
                <h2 className="text-xl font-bold text-foreground mb-2">Session not found</h2>
                <Link href="/candidate/history" className="text-primary hover:underline">← Back to History</Link>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col pt-4 pb-12 max-w-5xl mx-auto">
            {/* Back + Title */}
            <Link href="/candidate/history" className="flex items-center text-sm text-primary hover:text-primary/80 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
            </Link>

            {/* Summary Card */}
            <div className="p-6 rounded-2xl border border-border bg-card/50 glass mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-4">{getTitle(session.interview_type)}</h1>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(session.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${session.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                            {session.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        ID: <span className="font-mono text-xs">{session.id.slice(0, 8)}</span>
                    </div>
                </div>
            </div>

            {/* Evaluation Report Section */}
            {evaluation && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">Evaluation Report</h2>
                    </div>
                    <div className="p-6 rounded-2xl border border-border bg-card/50 glass">
                        {/* Score Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <ScoreCard label="Technical" score={evaluation.technical_score} color="indigo" />
                            <ScoreCard label="Coding" score={evaluation.coding_score} color="green" />
                            <ScoreCard label="Communication" score={evaluation.communication_score} color="blue" />
                            <ScoreCard label="Confidence" score={evaluation.confidence_score} color="purple" />
                        </div>

                        {/* Topics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            {evaluation.strong_topics.length > 0 && (
                                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-bold text-green-500">Strong Topics</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {evaluation.strong_topics.map(t => (
                                            <span key={t} className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {evaluation.weak_topics.length > 0 && (
                                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingDown className="w-4 h-4 text-red-400" />
                                        <span className="text-sm font-bold text-red-400">Needs Improvement</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {evaluation.weak_topics.map(t => (
                                            <span key={t} className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Feedback Summary */}
                        {evaluation.feedback_summary && (
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-border">
                                <h4 className="text-sm font-bold text-foreground mb-3">Feedback Summary</h4>
                                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {evaluation.feedback_summary}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Transcript Section */}
            <Section icon={MessageSquare} title="Transcript" count={transcripts.length}>
                {transcripts.length === 0 ? (
                    <EmptyState text="No transcript data recorded for this session." />
                ) : (
                    <div className="space-y-3">
                        {transcripts.map((t, idx) => (
                            <div key={idx} className={`flex gap-3 ${t.speaker === 'ai' ? '' : 'flex-row-reverse'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.speaker === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white/60'}`}>
                                    {t.speaker === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${t.speaker === 'ai' ? 'bg-indigo-500/10 text-foreground' : 'bg-white/5 text-foreground'}`}>
                                    <p>{t.message}</p>
                                    <span className="text-[10px] text-muted-foreground mt-1 block">{formatTime(t.timestamp)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Code Attempts Section */}
            <Section icon={Code2} title="Coding Attempts" count={codeAttempts.length}>
                {codeAttempts.length === 0 ? (
                    <EmptyState text="No coding attempts recorded for this session." />
                ) : (
                    <div className="space-y-4">
                        {codeAttempts.map((a, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-foreground">{a.question}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                                        {a.success ? '✓ Success' : '✗ Failed'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                                    <div>Runs: <span className="text-foreground font-mono">{a.run_count}</span></div>
                                    <div>Errors: <span className="text-foreground font-mono">{a.error_count}</span></div>
                                    <div>{formatTime(a.timestamp)}</div>
                                </div>
                                {a.code && (
                                    <pre className="p-3 bg-[#0d1117] rounded-lg text-xs text-white/70 font-mono overflow-x-auto max-h-40">{a.code}</pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Activity Log Section */}
            <Section icon={Activity} title="Activity Log" count={activityLogs.length}>
                {activityLogs.length === 0 ? (
                    <EmptyState text="No activity logs recorded for this session." />
                ) : (
                    <div className="space-y-2">
                        {activityLogs.map((log, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors text-sm">
                                <span className="text-muted-foreground font-mono text-xs w-16 shrink-0">{formatTime(log.timestamp)}</span>
                                <span className="px-2 py-0.5 rounded bg-white/5 text-xs font-mono text-white/60">{log.activity_type}</span>
                                <span className="text-muted-foreground">{log.description}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Questions Section */}
            <Section icon={HelpCircle} title="Questions Asked" count={questions.length}>
                {questions.length === 0 ? (
                    <EmptyState text="No questions recorded for this session." />
                ) : (
                    <div className="space-y-3">
                        {questions.map((q, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-0.5 shrink-0 ${q.question_type === 'coding' ? 'bg-blue-500/10 text-blue-400' :
                                    q.question_type === 'behavioral' ? 'bg-purple-500/10 text-purple-400' :
                                        'bg-white/5 text-white/50'
                                    }`}>{q.question_type}</span>
                                <p className="text-sm text-foreground">{q.question}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
}

function Section({ icon: Icon, title, count, children }: { icon: React.ComponentType<{ className?: string }>, title: string, count: number, children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card/50 glass">{children}</div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return <p className="text-sm text-muted-foreground italic text-center py-6">{text}</p>;
}

function ScoreCard({ label, score, color }: { label: string, score: number, color: string }) {
    const colorMap: Record<string, string> = {
        indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
        green: "from-green-500/20 to-green-500/5 border-green-500/20 text-green-400",
        blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
        purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400",
    };
    const cls = colorMap[color] || colorMap.indigo;
    return (
        <div className={`p-4 rounded-xl bg-gradient-to-br border text-center ${cls}`}>
            <div className="text-3xl font-black">{score}<span className="text-lg opacity-60">/100</span></div>
            <div className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-70">{label}</div>
        </div>
    );
}
