"use client";

import { useEffect, useState } from "react";
import { User, Bell, Shield, Key, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Settings() {
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        preferred_language: "Python",
        target_job_role: "",
        experience_level: "Entry Level",
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
                if (data) {
                    setProfile({
                        name: data.name || "",
                        email: data.email || "",
                        preferred_language: data.preferred_language || "Python",
                        target_job_role: data.target_job_role || "",
                        experience_level: data.experience_level || "Entry Level",
                    });
                }
            }
            setIsLoading(false);
        }
        fetchProfile();
    }, [supabase]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSaveSuccess(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setIsSaving(true);
        setSaveSuccess(false);

        const { error } = await supabase
            .from("profiles")
            .update({
                name: profile.name,
                preferred_language: profile.preferred_language,
                target_job_role: profile.target_job_role,
                experience_level: profile.experience_level,
            })
            .eq("id", userId);

        setIsSaving(false);

        if (!error) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } else {
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col pt-4 pb-12 max-w-5xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your profile details and preferences.
                </p>
            </header>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="w-full md:w-64 shrink-0 space-y-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium transition-colors">
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl font-medium transition-colors">
                        <Bell className="w-5 h-5" />
                        <span>Notifications</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl font-medium transition-colors">
                        <Shield className="w-5 h-5" />
                        <span>Privacy</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-xl font-medium transition-colors">
                        <Key className="w-5 h-5" />
                        <span>Security</span>
                    </button>
                </div>

                {/* Profile Form Content */}
                <div className="flex-1 p-8 rounded-3xl border border-border bg-card/50 glass">
                    <h2 className="text-xl font-bold text-foreground mb-6">Personal Information</h2>

                    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-foreground pt-6 border-t border-border">Interview Preferences</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Preferred Programming Language</label>
                                <select
                                    name="preferred_language"
                                    value={profile.preferred_language}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground appearance-none"
                                >
                                    <option value="Python">Python</option>
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="TypeScript">TypeScript</option>
                                    <option value="Java">Java</option>
                                    <option value="C++">C++</option>
                                    <option value="Go">Go</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Target Job Role</label>
                                <input
                                    type="text"
                                    name="target_job_role"
                                    value={profile.target_job_role}
                                    onChange={handleChange}
                                    placeholder="e.g. Frontend Developer"
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-foreground">Experience Level</label>
                                <select
                                    name="experience_level"
                                    value={profile.experience_level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground appearance-none"
                                >
                                    <option value="Internship">Internship / Student</option>
                                    <option value="Entry Level">Entry Level (0-2 years)</option>
                                    <option value="Mid Level">Mid Level (2-5 years)</option>
                                    <option value="Senior Level">Senior Level (5+ years)</option>
                                    <option value="Lead/Manager">Lead / Engineering Manager</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 flex items-center justify-between">
                            {saveSuccess ? (
                                <div className="flex items-center text-green-500 font-medium text-sm">
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Preferences saved successfully.
                                </div>
                            ) : (
                                <div /> // empty div to maintain flex alignment
                            )}

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
