"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Hero3D } from "./hero-3d";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none -z-10" />

            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col space-y-8"
                    >
                        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-secondary rounded-full w-fit">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs font-medium text-secondary-foreground">Next-Gen AI Interviewer</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                            Master Interviews <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                                with AI
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                            Practice real technical interviews with an AI recruiter, improve your coding skills, and receive personalized feedback to land your dream job.
                        </p>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                            <Link
                                href="#demo"
                                className="group flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                            >
                                Start Practicing
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link
                                href="#how-it-works"
                                className="group flex items-center justify-center px-8 py-4 bg-background border-2 border-border text-foreground font-semibold rounded-full hover:border-primary hover:bg-secondary/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Play className="mr-2 w-5 h-5" />
                                Watch Demo
                            </Link>
                        </div>

                        <div className="flex items-center space-x-6 pt-4 text-sm font-medium text-muted-foreground">
                            <div className="flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                No credit card required
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                Join 10,000+ developers
                            </div>
                        </div>
                    </motion.div>

                    {/* Right 3D Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative lg:h-[600px] w-full max-w-[600px] mx-auto lg:mx-0 flex items-center justify-center"
                    >
                        {/* Glass panel behind 3D render */}
                        <div className="absolute inset-0 glass rounded-[2.5rem] -z-10 blur-[2px] opacity-50 transform rotate-3" />
                        <div className="absolute inset-0 glass rounded-[2.5rem] -z-10 transform -rotate-2" />

                        <Hero3D />
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
