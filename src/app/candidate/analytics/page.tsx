"use client";


import { TrendingUp, BarChart2, Activity, MessageSquare } from "lucide-react";

export default function Analytics() {
    return (
        <div className="w-full flex flex-col pt-4 pb-12">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Performance Analytics</h1>
                    <p className="text-muted-foreground mt-2">
                        Track your progress across multiple dimensions over time.
                    </p>
                </div>
                <div className="hidden sm:block px-4 py-2 bg-secondary rounded-lg border border-border text-sm font-medium">
                    Last 30 Days
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Placeholder Chart 1 */}
                <div className="p-6 rounded-3xl border border-border bg-card/50 glass h-[350px] flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Overall Score Trend</h3>
                    </div>
                    <div className="flex-1 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-center relative overflow-hidden">
                        {/* Fake Line Chart Representation */}
                        <svg className="absolute w-full h-full opacity-50" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M0,80 Q25,70 50,40 T100,20 L100,100 L0,100 Z" fill="currentColor" className="text-primary/10" />
                            <path d="M0,80 Q25,70 50,40 T100,20" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                        </svg>
                        <p className="text-muted-foreground font-medium z-10 bg-background/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-border">Chart Data Visualization</p>
                    </div>
                </div>

                {/* Placeholder Chart 2 */}
                <div className="p-6 rounded-3xl border border-border bg-card/50 glass h-[350px] flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-orange-500" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Skill Progress (Algorithms)</h3>
                    </div>
                    <div className="flex-1 rounded-xl bg-secondary/30 border border-border/50 flex items-end justify-around px-4 pb-0 pt-8 gap-2 relative overflow-hidden">
                        {/* Fake Bar Chart */}
                        {[40, 55, 45, 70, 65, 85, 90].map((h, i) => (
                            <div key={i} className="w-full bg-orange-500/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
                        ))}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-muted-foreground font-medium bg-background/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-border pointer-events-auto">Bar Chart Data</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Placeholder Radar/Polar */}
                <div className="p-6 rounded-3xl border border-border bg-card/50 glass h-[350px] flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <BarChart2 className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Coding Accuracy</h3>
                    </div>
                    <div className="flex-1 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full border-[12px] border-green-500/20 relative flex items-center justify-center">
                            <div className="absolute inset-0 border-[12px] border-green-500 rounded-full border-r-transparent border-b-transparent -rotate-45"></div>
                            <div className="text-3xl font-bold">75%</div>
                        </div>
                    </div>
                </div>

                {/* Placeholder Radar/Polar */}
                <div className="p-6 rounded-3xl border border-border bg-card/50 glass h-[350px] flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Communication Score</h3>
                    </div>
                    <div className="flex-1 rounded-xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center space-y-4">
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-medium">Clarity</span><span>88%</span></div>
                            <div className="h-2 w-full bg-background rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[88%]"></div></div>
                        </div>
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-medium">Pacing</span><span>72%</span></div>
                            <div className="h-2 w-full bg-background rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[72%]"></div></div>
                        </div>
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-medium">Filler Words</span><span>Excellent</span></div>
                            <div className="h-2 w-full bg-background rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[95%]"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
