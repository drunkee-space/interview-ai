"use client";

import { motion } from "framer-motion";
import { Frown, Clock, Target, VolumeX } from "lucide-react";

export function Problem() {
    const problems = [
        {
            title: "Nervous under pressure",
            description: "Brain freeze during technical questions even when you know the answer.",
            icon: <Frown className="w-8 h-8 text-orange-500" />,
            color: "bg-orange-500/10 border-orange-500/20",
        },
        {
            title: "Lack of real practice",
            description: "LeetCode alone doesn't prepare you for behavioral and system design conversations.",
            icon: <Clock className="w-8 h-8 text-blue-500" />,
            color: "bg-blue-500/10 border-blue-500/20",
        },
        {
            title: "No feedback loop",
            description: "Companies ghost you or send generic rejection emails with zero actionable advice.",
            icon: <VolumeX className="w-8 h-8 text-red-500" />,
            color: "bg-red-500/10 border-red-500/20",
        },
        {
            title: "Unclear improvement path",
            description: "Don't know what to study next or which areas of your communication need work.",
            icon: <Target className="w-8 h-8 text-purple-500" />,
            color: "bg-purple-500/10 border-purple-500/20",
        },
    ];

    return (
        <section className="w-full py-24 bg-secondary/30 relative">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Why candidates fail interviews
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        Many developers fail interviews not because they lack technical skills, but because they lack realistic interview experience.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={problem.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className={`p-8 rounded-3xl border ${problem.color} glass flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 hover:scale-[1.02] transition-transform`}
                        >
                            <div className="p-4 bg-background/50 rounded-2xl shrink-0">
                                {problem.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">{problem.title}</h3>
                                <p className="text-muted-foreground">{problem.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
