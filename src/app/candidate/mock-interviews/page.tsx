"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Plus, Loader2, Code2, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MockInterviews() {
    const router = useRouter();
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [smartSuggestion, setSmartSuggestion] = useState<string | null>(null);

    const errorVariants = {
        shake: { x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } }
    };

    useEffect(() => {
        const fetchTracks = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("interview_tracks")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (data) {
                setTracks(data);
            }
            setLoading(false);
        };

        fetchTracks();
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isGenerating) return;

        setIsGenerating(true);
        setGenerateError(null);
        setSmartSuggestion(null);
        try {
            const res = await fetch("/api/interview/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userPrompt: prompt }),
            });

            const data = await res.json();
            if (!res.ok) {
                if (data.error === "INVALID_PROMPT") {
                    setSmartSuggestion(data.suggestion || null);
                    setGenerateError("Please enter a valid technical topic like HTML, JavaScript, or Python to generate an interview.");
                    setIsGenerating(false);
                    return;
                }
                setGenerateError(data.error || "Generation failed");
                setIsGenerating(false);
                return;
            }

            router.push(`/candidate/device-check?trackId=${data.trackId}`);
        } catch (error: any) {
            console.error("Generation failed:", error);
            setGenerateError(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const getLevelColor = (level: string, unlocked: boolean) => {
        if (!unlocked) return "bg-white/5 text-white/30 border-white/10";
        if (level === "easy") return "bg-green-500/10 text-green-500 border-green-500/20";
        if (level === "medium") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        if (level === "hard") return "bg-red-500/10 text-red-500 border-red-500/20";
        return "";
    };

    return (
        <div className="w-full flex flex-col pt-4 pb-12">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">Progressive Learning Tracks</h1>
                
                {/* AI Generator Input */}
                <form onSubmit={handleGenerate} className="max-w-2xl relative">
                    <motion.div 
                        variants={errorVariants}
                        animate={generateError ? "shake" : undefined}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className={`relative flex items-center bg-card border rounded-2xl p-2 shadow-lg z-10 transition-all focus-within:ring-2 ${
                            generateError 
                                ? 'border-red-500 focus-within:border-red-500 ring-red-500/20' 
                                : 'border-border focus-within:border-primary/50 ring-primary/20'
                        }`}>
                            <Sparkles className={`w-5 h-5 ml-3 mr-2 ${generateError ? 'text-red-500' : 'text-primary'}`} />
                            <input 
                                type="text"
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    if (generateError) setGenerateError(null);
                                }}
                                placeholder="I want a React Frontend interview..."
                                className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground px-2 py-3"
                                disabled={isGenerating}
                            />
                            <button 
                                type="submit"
                                disabled={!prompt.trim() || isGenerating}
                                className={`px-6 py-3 rounded-xl font-semibold flex items-center transition-all disabled:opacity-50 ${
                                    generateError 
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-primary text-primary-foreground hover:opacity-90'
                                }`}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                {isGenerating ? "Generating..." : "Generate AI Track"}
                            </button>
                        </div>
                    </motion.div>
                </form>
                
                {generateError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 max-w-2xl">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm mb-3 font-medium flex items-center gap-2 px-4 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                            {generateError}
                        </div>
                        
                        {smartSuggestion ? (
                            <div className="flex items-center gap-3 px-2">
                                <span className="text-sm font-semibold text-primary">Did you mean?</span>
                                <button onClick={() => setPrompt(smartSuggestion)} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full text-xs font-semibold transition-colors">
                                    {smartSuggestion}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 mt-3 pl-1">
                                <span className="text-xs font-medium text-muted-foreground mr-1 uppercase tracking-wider">Try:</span>
                                {["HTML basics", "React hooks interview", "Python backend", "SQL databases"].map(t => (
                                    <button 
                                        key={t}
                                        type="button"
                                        onClick={() => setPrompt(t)}
                                        className="px-3 py-1.5 bg-secondary text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-xs rounded-full border border-border"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : tracks.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-3xl border border-border">
                    <p className="text-muted-foreground">You haven&apos;t started any interview learning tracks yet.</p>
                    <p className="text-sm mt-2">Generate one above to begin!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tracks.map((track, index) => {
                        const currentLevel = track.current_level || "easy";
                        const easyProgress = track.easy_progress || 0;
                        const mediumProgress = track.medium_progress || 0;
                        const hardProgress = track.hard_progress || 0;
                        const easyUnlocked = track.easy_unlocked !== false;
                        const mediumUnlocked = track.medium_unlocked === true;
                        const hardUnlocked = track.hard_unlocked === true;

                        // Overall progress across all levels
                        const overallProgress = Math.round((easyProgress + mediumProgress + hardProgress) / 3);

                        return (
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex flex-col p-6 rounded-3xl border border-border bg-card/50 glass hover:bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                <div className="flex items-start justify-between mb-4 relative">
                                    <div className="p-3 rounded-2xl bg-primary/10">
                                        <Code2 className="w-8 h-8 text-primary" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wide ${getLevelColor(currentLevel, true)}`}>
                                        {currentLevel}
                                    </div>
                                </div>

                                <div className="flex-1 relative">
                                    <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{track.primary_topic}</p>
                                    <h3 className="text-xl font-bold text-foreground mb-3 leading-tight">{track.title}</h3>
                                    
                                    {/* Level Progress Pills */}
                                    <div className="flex items-center gap-1.5 mb-4">
                                        {/* Easy */}
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getLevelColor("easy", easyUnlocked)}`}>
                                            {easyProgress >= 100 ? <CheckCircle2 className="w-3 h-3" /> : null}
                                            <span>EASY</span>
                                            {easyProgress > 0 && easyProgress < 100 && (
                                                <span className="opacity-70">{easyProgress}%</span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                                        
                                        {/* Medium */}
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getLevelColor("medium", mediumUnlocked)}`}>
                                            {!mediumUnlocked ? <Lock className="w-3 h-3" /> : mediumProgress >= 100 ? <CheckCircle2 className="w-3 h-3" /> : null}
                                            <span>MED</span>
                                            {mediumUnlocked && mediumProgress > 0 && mediumProgress < 100 && (
                                                <span className="opacity-70">{mediumProgress}%</span>
                                            )}
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                                        
                                        {/* Hard */}
                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getLevelColor("hard", hardUnlocked)}`}>
                                            {!hardUnlocked ? <Lock className="w-3 h-3" /> : hardProgress >= 100 ? <CheckCircle2 className="w-3 h-3" /> : null}
                                            <span>HARD</span>
                                            {hardUnlocked && hardProgress > 0 && hardProgress < 100 && (
                                                <span className="opacity-70">{hardProgress}%</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Overall Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <span className="text-muted-foreground font-medium">Overall Progress</span>
                                            <span className="font-bold text-foreground">{overallProgress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${overallProgress}%` }}
                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                className={`h-full rounded-full ${
                                                    overallProgress >= 80 ? 'bg-green-500' : 
                                                    overallProgress >= 40 ? 'bg-yellow-500' : 
                                                    'bg-primary'
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-2 mb-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Mastered Concepts
                                            </span>
                                            <span className="font-semibold text-green-500">
                                                {track.strong_concepts?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-red-500 ml-1 mr-0.5"></span>
                                                Weak Concepts
                                            </span>
                                            <span className="font-semibold text-red-500">
                                                {track.weak_concepts?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/candidate/device-check?trackId=${track.id}`}
                                    className="w-full py-3 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-sm font-semibold rounded-xl transition-colors flex justify-center items-center group-hover:shadow-md relative"
                                >
                                    <span>Continue Track</span>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
