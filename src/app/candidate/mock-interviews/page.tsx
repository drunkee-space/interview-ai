"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MOCK_INTERVIEWS } from "@/config/mock-interviews";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MockInterviews() {
    const [difficultyOverride, setDifficultyOverride] = useState<"Easy" | "Medium" | "Hard" | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setDifficultyOverride("Easy");
                return;
            }

            const { data: evals } = await supabase
                .from("interview_evaluations")
                .select("overall_score")
                .eq("candidate_id", user.id);

            if (!evals || evals.length === 0) {
                setDifficultyOverride("Easy");
                return;
            }

            // Calculate average score
            const sum = evals.reduce((acc, curr) => acc + (curr.overall_score || 0), 0);
            const avg = sum / evals.length;

            if (avg > 80) setDifficultyOverride("Hard");
            else if (avg >= 60) setDifficultyOverride("Medium");
            else setDifficultyOverride("Easy");
        };

        fetchHistory();
    }, []);

    return (
        <div className="w-full flex flex-col pt-4 pb-12">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Mock Interviews</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Select an interview type below to read the instructions and begin your practice session with our AI recruiter. 
                    <br />
                    <span className="text-xs text-primary/70 font-semibold mt-1 inline-block">Difficulty is dynamically adjusted based on your past performance ({difficultyOverride || 'Calculating...'}).</span>
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_INTERVIEWS.map((interview, index) => {
                    const Icon = interview.icon as React.ElementType<{ className?: string }>;
                    const currentDiff = difficultyOverride || interview.difficulty;

                    return (
                        <motion.div
                            key={interview.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex flex-col p-6 rounded-3xl border border-border bg-card/50 glass hover:bg-card hover:border-border/80 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-3 rounded-2xl ${interview.bgUrl}`}>
                                    <Icon className={`w-8 h-8 ${interview.color}`} />
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border
                  ${currentDiff === 'Easy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                  ${currentDiff === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : ''}
                  ${currentDiff === 'Hard' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                  ${currentDiff === 'Expert' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : ''}
                  transition-all duration-300
                `}>
                                    {currentDiff}
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{interview.category}</p>
                                <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">{interview.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                    {interview.description}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center mb-6 font-medium">
                                    <ClockIcon className="w-4 h-4 mr-1.5 opacity-70" />
                                    {interview.duration}
                                </p>
                            </div>

                            <Link
                                href={`/candidate/mock-interviews/${interview.id}`}
                                className="w-full py-3 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-sm font-semibold rounded-xl transition-colors flex justify-center items-center group-hover:shadow-md"
                            >
                                <span>View Details</span>
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    );
}
