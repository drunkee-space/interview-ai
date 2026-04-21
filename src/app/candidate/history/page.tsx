"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, ArrowRight, Loader2, FileText } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";

interface SessionRow {
    id: string;
    interview_type: string;
    status: string;
    start_time: string;
    end_time: string | null;
    duration: number | null;
    created_at: string;
}

export default function History() {
    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchSessions() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("interview_sessions")
                .select("id, user_id, status, interview_type, start_time, end_time, duration, created_at, updated_at, config_snapshot, track_id")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setSessions(data as SessionRow[]);
            }
            setIsLoading(false);
        }
        fetchSessions();
    }, [supabase]);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "—";
        const m = Math.floor(seconds / 60);
        return `${m} min${m !== 1 ? "s" : ""}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        });
    };

    const getInterviewTitle = (type: string) => {
        const config = MOCK_INTERVIEWS.find(i => i.id === type);
        return config?.title || type;
    };

    const getStatusBadge = (status: string) => {
        if (status === "completed") return { bg: "bg-green-500/10 text-green-500 border-green-500/20", label: "Completed" };
        if (status === "active") return { bg: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "In Progress" };
        return { bg: "bg-white/5 text-white/50 border-white/10", label: "Pending" };
    };

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center pt-32">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading interview history...</p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col pt-4 pb-12">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Interview History</h1>
                    <p className="text-muted-foreground mt-2">
                        Review past interviews and detailed session reports.
                    </p>
                </div>
            </header>

            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No interviews yet</h3>
                    <p className="text-muted-foreground text-sm">Complete a mock interview to see your history here.</p>
                    <Link href="/candidate/mock-interviews" className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                        Start Mock Interview
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => {
                        const badge = getStatusBadge(session.status);
                        return (
                            <div
                                key={session.id}
                                className="p-6 rounded-2xl border border-border bg-card/50 glass hover:bg-card transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-xl font-bold text-foreground">{getInterviewTitle(session.interview_type)}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-4">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-1.5" />
                                            {formatDate(session.start_time || session.created_at)}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            {formatDuration(session.duration)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center shrink-0">
                                    <Link
                                        href={`/candidate/history/${session.id}`}
                                        className="text-primary hover:text-primary/80 font-medium text-sm flex items-center transition-colors px-4 py-2 rounded-xl hover:bg-primary/5"
                                    >
                                        View Details <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
