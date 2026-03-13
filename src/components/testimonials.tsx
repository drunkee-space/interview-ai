"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

export function Testimonials() {
    const testimonials = [
        {
            quote: "This feels exactly like my Google L4 interview. The AI caught my nervous tics and helped me structure my system design answers better.",
            author: "Sarah J.",
            role: "Senior Frontend Engineer",
        },
        {
            quote: "I used to freeze up during live coding. Practicing with Interview AI gave me the confidence to talk through my solutions out loud.",
            author: "Michael T.",
            role: "Full Stack Developer",
        },
        {
            quote: "The personalized feedback after the mock interview is gold. It told me exactly what I needed to brush up on, saving me weeks of directionless studying.",
            author: "Elena R.",
            role: "Software Engineer",
        },
    ];

    return (
        <section className="w-full py-24 bg-secondary/30 relative" id="testimonials">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Loved by developers
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground max-w-2xl mx-auto"
                    >
                        Join thousands of candidates who have landed their dream jobs with Interview AI.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.author}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-3xl border border-border bg-background glass flex flex-col"
                        >
                            <div className="flex space-x-1 mb-6 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-current" />
                                ))}
                            </div>
                            <p className="text-lg text-foreground italic flex-grow mb-6 whitespace-pre-line">
                                &quot;{testimonial.quote}&quot;
                            </p>
                            <div>
                                <div className="font-bold text-base">{testimonial.author}</div>
                                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
