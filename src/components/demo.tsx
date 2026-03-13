"use client";

import { motion } from "framer-motion";
import { Demo3D } from "./demo-3d";
import { Code, Video, Timer, MessageSquare } from "lucide-react";

export function Demo() {
    const overlayFeatures = [
        { icon: <Video className="w-4 h-4" />, label: "AI Interviewer" },
        { icon: <Code className="w-4 h-4" />, label: "Live Code Editor" },
        { icon: <Timer className="w-4 h-4" />, label: "Real-time Processing" },
        { icon: <MessageSquare className="w-4 h-4" />, label: "Instant Feedback" },
    ];

    return (
        <section className="w-full py-24 bg-background relative" id="demo">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary rounded-full mb-2"
                    >
                        <span className="text-xs font-semibold uppercase tracking-wider">Product Demo</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Experience the Future of Interviews
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        Our interactive 3D environment puts you right into the hot seat, giving you the most realistic interview experience possible before the real thing.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative w-full rounded-[2.5rem] bg-secondary/30 border border-border p-4 md:p-8 overflow-hidden shadow-2xl glass"
                >
                    {/* Glow effect behind canvas */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/20 blur-[100px] rounded-full -z-10" />

                    <Demo3D />

                    <div className="absolute bottom-4 left-0 w-full px-8 md:px-16 flex flex-wrap justify-center gap-4 hidden md:flex">
                        {overlayFeatures.map((feat, i) => (
                            <motion.div
                                key={feat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg"
                            >
                                <div className="text-primary">{feat.icon}</div>
                                <span className="text-sm font-medium">{feat.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
