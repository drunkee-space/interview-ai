"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function Pricing() {
    const tiers = [
        {
            name: "Free",
            price: "$0",
            description: "Perfect for getting started and trying out the AI interviewer.",
            features: [
                "2 AI Mock Interviews / month",
                "Basic behavioral questions",
                "Standard feedback report",
                "Community support"
            ],
            buttonText: "Get Started Free",
            isPopular: false,
        },
        {
            name: "Pro",
            price: "$29",
            period: "/month",
            description: "Everything you need to master technical interviews and land jobs.",
            features: [
                "Unlimited AI Mock Interviews",
                "Company-specific question banks",
                "Live coding environment",
                "Detailed performance analytics",
                "Speech and tone analysis",
                "Priority support"
            ],
            buttonText: "Start 7-Day Free Trial",
            isPopular: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For bootcamps, universities, and technical recruiting teams.",
            features: [
                "Everything in Pro",
                "Custom interview templates",
                "Candidate tracking dashboard",
                "API access",
                "Dedicated account manager",
                "SSO integration"
            ],
            buttonText: "Contact Sales",
            isPopular: false,
        }
    ];

    return (
        <section className="w-full py-24 bg-background relative" id="pricing">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Simple, transparent pricing
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        Invest in your career. Preparation costs a fraction of the salary bump from your next job offer.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-8">
                    {tiers.map((tier, index) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col p-8 rounded-3xl border ${tier.isPopular ? 'border-primary shadow-2xl scale-100 md:scale-105 z-10' : 'border-border bg-card'}`}
                        >
                            {tier.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                                <p className="text-muted-foreground text-sm h-10">{tier.description}</p>
                                <div className="mt-6 flex items-baseline">
                                    <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                                    {tier.period && <span className="text-muted-foreground ml-1">{tier.period}</span>}
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mr-3" />
                                        <span className="text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`w-full py-4 rounded-full font-bold transition-all ${tier.isPopular
                                        ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20'
                                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                {tier.buttonText}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
