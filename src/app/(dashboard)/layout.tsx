"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import {
    LayoutDashboard,
    Code2,
    BarChart3,
    Settings,
} from "lucide-react";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) router.push("/login");
        };

        checkUser();
    }, []);

    return (
        <div className="flex min-h-screen bg-bgMain scale-[1.15] origin-top-left w-[87%]">

            {/* LEFT SIDEBAR */}
            <div className="w-72 bg-card shadow-soft p-8 flex flex-col">

                {/* LOGO */}
                <h1 className="text-4xl font-bold mb-12">
                    Interview AI
                </h1>

                {/* NAVIGATION */}
                <nav className="flex flex-col gap-4">

                    <button
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-4 p-4 rounded-xl bg-panel font-medium"
                    >
                        <LayoutDashboard size={22} />
                        Dashboard
                    </button>

                    <button
                        onClick={() => router.push("/interviews")}
                        className="flex items-center gap-4 p-5 text-lg rounded-xl hover:bg-panel transition">
                        <Code2 size={22} />
                        Interviews
                    </button>


                    <button className="flex items-center gap-4 p-4 rounded-xl hover:bg-panel transition opacity-70">
                        <BarChart3 size={22} />
                        Analytics
                    </button>

                    <button className="flex items-center gap-4 p-4 rounded-xl hover:bg-panel transition opacity-70">
                        <Settings size={22} />
                        Settings
                    </button>

                </nav>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 flex flex-col">

                {/* TOP HEADER */}
                <div className="h-20 bg-card flex items-center justify-between px-12 shadow-soft">

                    {/* LEFT */}
                    <input
                        placeholder="Search..."
                        className="bg-input px-6 py-3 rounded-xl outline-none w-80"
                    />

                    {/* RIGHT */}
                    <div className="flex items-center gap-6">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            U
                        </div>
                    </div>

                </div>

                {/* PAGE CONTENT */}
                <div className="p-12">
                    {children}
                </div>

            </div>


        </div>
    );
}
