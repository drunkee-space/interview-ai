"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, History, Settings, User, Video, BarChart2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function CandidateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [profile, setProfile] = useState<{ name?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (data) setProfile(data);
            setIsLoading(false);
        }
        loadProfile();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const navItems = [
        { name: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
        { name: "Mock Interviews", href: "/candidate/mock-interviews", icon: Video },
        { name: "Analytics", href: "/candidate/analytics", icon: BarChart2 },
        { name: "History", href: "/candidate/history", icon: History },
        { name: "Settings", href: "/candidate/settings", icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Transparent Top Bar */}
            <header className="sticky top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="w-4 h-4 bg-primary rounded-sm shadow-[0_0_15px_rgba(var(--primary),0.5)]"></span>
                        </span>
                        <span>Interview AI</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center space-x-1 border border-border/50 bg-secondary/50 p-1 rounded-full">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                            ? "text-primary-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-tab"
                                            className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/20"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <Icon className="w-4 h-4 relative z-10" />
                                    <span className="relative z-10">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-3 pr-4 border-r border-border/50">
                            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm">
                                <User className="w-4 h-4 text-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground leading-tight">{profile?.name?.split(' ')[0] || "Candidate"}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Nav Scrollable Row */}
                <div className="block lg:hidden w-full overflow-x-auto border-t border-border/50 bg-background/40">
                    <nav className="flex items-center px-4 py-2 space-x-2 min-w-max">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={`mobile-${item.href}`}
                                    href={item.href}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                            : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            {/* Main Content Area with Routing Animation */}
            <main className="flex-1 flex flex-col min-w-0 bg-background overflow-x-hidden">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex-1 w-full"
                    >
                        <div className="max-w-6xl mx-auto p-4 md:p-8">
                            {children}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
