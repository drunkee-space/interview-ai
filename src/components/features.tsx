"use client";

import { motion } from "framer-motion";
import {
    Bot,
    Terminal,
    Ear,
    BarChart3,
    History,
    Zap
} from "lucide-react";

export function Features() {
    const features = [
        {
            title: "AI Interview Simulation",
            description: "Chat with a highly advanced AI that dynamically generates follow-up questions based on your technical answers.",
            icon: <Bot className="w-6 h-6" />,
            gradient: "from-blue-500/20 to-purple-500/20",
        },
        {
            title: "Real Coding Environment",
            description: "An integrated web IDE supporting Python, JavaScript, Java, and C++ with full syntax highlighting.",
            icon: <Terminal className="w-6 h-6" />,
            gradient: "from-emerald-500/20 to-teal-500/20",
        },
        {
            title: "Speech-to-Text Conversation",
            description: "Practice your vocal delivery. Our engine analyzes clarity, pacing, and use of filler words.",
            icon: <Ear className="w-6 h-6" />,
            gradient: "from-orange-500/20 to-red-500/20",
        },
        {
            title: "Performance Analytics",
            description: "Get scored on problem-solving speed, code quality, communication skills, and algorithmic efficiency.",
            icon: <BarChart3 className="w-6 h-6" />,
            gradient: "from-pink-500/20 to-rose-500/20",
        },
        {
            title: "Interview Timeline Tracking",
            description: "Review past interviews, replay voice snippets, and read the AI recruiter's detailed notes.",
            icon: <History className="w-6 h-6" />,
            gradient: "from-indigo-500/20 to-cyan-500/20",
        },
        {
            title: "Instant Hinting Engine",
            description: "Stuck? Get progressive hints that mimic how a real interviewer nudges you toward the right answer.",
            icon: <Zap className="w-6 h-6" />,
            gradient: "from-yellow-500/20 to-amber-500/20",
        },
    ];

    return (
        <section className="w-full py-24 bg-background relative" id="features-grid">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-2"
                    >
                        <span className="text-xs font-semibold uppercase tracking-wider">Core Features</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Everything you need to succeed
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        A comprehensive suite of tools built specifically for technical interview preparation.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative p-8 rounded-3xl border border-border bg-card hover:bg-secondary/50 transition-colors overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center mb-6 text-foreground group-hover:text-primary transition-colors shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed flex-grow">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
