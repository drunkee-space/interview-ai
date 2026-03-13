"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";
import { Video, History, BarChart2, Trophy, Clock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CandidateDashboard() {
    const [profile, setProfile] = useState<{ name?: string } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("profiles").select("name").eq("id", user.id).single();
                if (data) setProfile(data);
            }
        }
        loadProfile();
    }, [supabase]);

    const stats = [
        { label: "Total Mock Interviews", value: "12", icon: Video, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Average Score", value: "85%", icon: Trophy, color: "text-green-500", bg: "bg-green-500/10" },
        { label: "Practice Time", value: "24h", icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Skill Progress", value: "+15%", icon: BarChart2, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    return (
        <div className="w-full flex flex-col pt-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome back, {profile?.name?.split(' ')[0] || "Candidate"}</h1>
                    <p className="text-muted-foreground mt-1">Here&apos;s a breakdown of your recent interview performance.</p>
                </div>
                <Link
                    href="/candidate/mock-interviews"
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 shrink-0"
                >
                    <span>Start Mock Interview</span>
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl border border-border bg-card/50 glass hover:bg-card/80 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity Placeholder */}
                <div className="lg:col-span-2 p-8 rounded-2xl border border-border bg-card/50 glass">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-foreground">Recent Mock Interviews</h3>
                        <Link href="/candidate/history" className="text-sm font-medium text-primary hover:underline">View all</Link>
                    </div>
                    <div className="space-y-4 text-center py-10">
                        <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">You haven&apos;t completed any mock interviews yet.</p>
                    </div>
                </div>

                {/* Quick Action / Recommend */}
                <div className="p-8 rounded-2xl border border-border bg-primary/5 glass relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <h3 className="text-lg font-bold text-foreground mb-2">Recommended for you</h3>
                    <p className="text-sm text-muted-foreground mb-6">Based on your target role, we suggest practicing system design.</p>
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl border border-border bg-background/50 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-foreground">Python Data Structures</p>
                                <p className="text-xs text-muted-foreground">Medium • 30 mins</p>
                            </div>
                            <Link href="/candidate/mock-interviews/python-ds" className="p-2 bg-secondary text-foreground rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
