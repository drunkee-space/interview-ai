"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FutureVision() {
    return (
        <section className="w-full py-32 relative overflow-hidden bg-foreground text-background">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/30 blur-[150px] rounded-full opacity-50 pointer-events-none" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 blur-[150px] rounded-full opacity-50 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-8 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
                >
                    <span className="text-sm font-semibold tracking-widest uppercase">The Vision</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl md:text-7xl font-bold tracking-tight max-w-4xl leading-tight mb-8"
                >
                    Interviewing shouldn&apos;t be a game of chance.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl md:text-2xl text-background/80 max-w-2xl mb-12 font-light"
                >
                    We are building the future of career preparation—where AI acts as your personal recruiter, mentor, and advocate, leveling the playing field for everyone.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="group flex items-center px-8 py-4 bg-background text-foreground font-semibold rounded-full hover:scale-105 transition-transform"
                >
                    Join the waitlist for Enterprise
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </section>
    );
}
