"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  // ✅ Check logged user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      } else {
        setEmail(data.session.user.email || "");
      }
    };

    getUser();
  }, []);

  return (
    <div>

      {/* PAGE TITLE */}
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-5xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-6">
          <p className="text-xl text-gray-600">{email}</p>
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid grid-cols-4 gap-8 mb-12">

        <div className="bg-card p-8 rounded-2xl shadow-soft">
          <p className="text-lg text-gray-500">Interviews</p>
          <h3 className="text-4xl font-bold mt-2">12</h3>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-soft">
          <p className="text-lg text-gray-500">Success Rate</p>
          <h3 className="text-4xl font-bold mt-2">84%</h3>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-soft">
          <p className="text-lg text-gray-500">Avg Score</p>
          <h3 className="text-4xl font-bold mt-2">76</h3>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-soft">
          <p className="text-lg text-gray-500">Practice Hours</p>
          <h3 className="text-4xl font-bold mt-2">28h</h3>
        </div>

      </div>

      {/* ================= ACTIVITY PANEL ================= */}
      <div className="bg-card rounded-2xl shadow-soft p-10 h-[420px]">

        <h2 className="text-3xl font-semibold mb-6">
          Interview Activity
        </h2>

        <div className="h-full flex items-center justify-center text-gray-400 text-xl">
          Chart coming soon 📊
        </div>

      </div>

    </div>
  );
}
