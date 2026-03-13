"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RecruiterDashboard() {
    const [profile, setProfile] = useState<{ name?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
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

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full opacity-50 pointer-events-none -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full p-8 rounded-3xl border border-border bg-card/50 glass shadow-2xl text-center"
            >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                    <Users className="w-8 h-8" />
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-3">Recruiter Portal</h1>
                <p className="text-muted-foreground mb-8">
                    Welcome back, {profile?.name}. The recruiter dashboard is currently in development and will be launching soon.
                </p>

                <div className="flex flex-col space-y-3">
                    <button className="w-full py-3 px-4 bg-secondary text-foreground rounded-xl font-medium cursor-not-allowed opacity-70">
                        View Candidates (Coming Soon)
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex justify-center items-center py-3 px-4 text-red-500 hover:bg-red-500/10 rounded-xl font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
