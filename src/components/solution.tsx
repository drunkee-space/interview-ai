"use client";

import { motion } from "framer-motion";
import { Mic, Code, TrendingUp, Sparkles } from "lucide-react";

export function Solution() {
    const features = [
        {
            title: "AI Mock Interviews",
            description: "Engage in realistic voice conversations with an AI recruiter that adapts to your responses.",
            icon: <Mic className="w-6 h-6 text-primary" />,
        },
        {
            title: "Live Coding Challenges",
            description: "Solve algorithms and data structures in a realistic collaborative coding environment.",
            icon: <Code className="w-6 h-6 text-primary" />,
        },
        {
            title: "Speech & Tone Analysis",
            description: "Get feedback on your communication skills, filler words, and professional tone.",
            icon: <Sparkles className="w-6 h-6 text-primary" />,
        },
        {
            title: "Performance Tracking",
            description: "Monitor your progress over time with detailed analytics on every interview aspect.",
            icon: <TrendingUp className="w-6 h-6 text-primary" />,
        },
    ];

    return (
        <section className="w-full py-24 relative overflow-hidden" id="features">
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent -z-10" />

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary rounded-full">
                            <span className="text-xs font-semibold uppercase tracking-wider">The Solution</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                            We fix how you prepare for interviews.
                        </h2>

                        <p className="text-lg text-muted-foreground">
                            Interview AI simulates real technical interviews and helps candidates prepare with deeply personalized, instant feedback across both technical and behavioral aspects.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                    className="space-y-3"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        {feature.icon}
                                    </div>
                                    <h4 className="font-bold">{feature.title}</h4>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative h-[600px] rounded-[2rem] border border-border bg-background p-2 shadow-2xl overflow-hidden glass"
                    >
                        {/* Abstract visual representation of the solution inner workings */}
                        <div className="absolute inset-0 bg-gradient-to-br from-background to-secondary/50 rounded-[1.8rem] overflow-hidden flex flex-col">
                            <div className="h-12 border-b border-border/50 flex items-center px-4 space-x-2 bg-secondary/20">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="flex-1 p-6 relative">
                                {/* Simulated UI elements representing analysis */}
                                <div className="w-full h-32 rounded-xl bg-primary/5 border border-primary/10 mb-4 animate-pulse" />
                                <div className="flex space-x-4 mb-4">
                                    <div className="w-1/3 h-24 rounded-xl bg-blue-500/10 border border-blue-500/20" />
                                    <div className="w-1/3 h-24 rounded-xl bg-purple-500/10 border border-purple-500/20" />
                                    <div className="w-1/3 h-24 rounded-xl bg-green-500/10 border border-green-500/20" />
                                </div>
                                <div className="space-y-3">
                                    <div className="w-full h-4 rounded-full bg-secondary" />
                                    <div className="w-5/6 h-4 rounded-full bg-secondary" />
                                    <div className="w-4/6 h-4 rounded-full bg-secondary" />
                                </div>

                                {/* Floating "AI Analyzing" badge */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-xl flex items-center space-x-3">
                                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                    <span className="font-semibold text-sm">AI Generating Feedback...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
