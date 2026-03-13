"use client";

import { motion } from "framer-motion";
import { ClipboardList, Mic, Code2, LineChart, Target } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            title: "Choose a mock interview",
            description: "Select from hundreds of company-specific or skill-based interview templates.",
            icon: <ClipboardList className="w-8 h-8" />,
        },
        {
            title: "Talk with the AI recruiter",
            description: "Answer behavioral and technical questions in a natural voice conversation.",
            icon: <Mic className="w-8 h-8" />,
        },
        {
            title: "Solve coding problems",
            description: "Write, test, and explain your code in our integrated IDE just like a real interview.",
            icon: <Code2 className="w-8 h-8" />,
        },
        {
            title: "Receive AI feedback",
            description: "Get an instant, comprehensive breakdown of what you did well and what needs work.",
            icon: <Target className="w-8 h-8" />,
        },
        {
            title: "Track your progress",
            description: "Watch your confidence and competence grow over time with detailed analytics.",
            icon: <LineChart className="w-8 h-8" />,
        },
    ];

    return (
        <section className="w-full py-24 bg-secondary/20 relative" id="how-it-works">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-20 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        How It Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        A seamless workflow designed to simulate real-world conditions and maximize your learning.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent -translate-x-1/2" />

                    <div className="space-y-12 md:space-y-0">
                        {steps.map((step, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <div key={step.title} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} w-full md:pb-16`}>

                                    {/* Timeline dot */}
                                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-4 border-primary/20 items-center justify-center z-10 shadow-lg group-hover:border-primary transition-colors">
                                        <span className="font-bold text-primary">{index + 1}</span>
                                    </div>

                                    {/* Content Box */}
                                    <motion.div
                                        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className={`w-full md:w-5/12 ${isEven ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'} text-center`}
                                    >
                                        <div className={`p-8 rounded-3xl bg-background border border-border shadow-xl glass hover:border-primary/50 transition-colors inline-block w-full text-left`}>
                                            <div className={`w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 ${isEven ? 'md:ml-auto' : ''}`}>
                                                {step.icon}
                                            </div>
                                            <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                                            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
