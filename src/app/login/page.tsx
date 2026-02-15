"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <AuthLayout
      leftContent={
        <>
          <h1 className="text-6xl font-bold mb-8">Interview AI</h1>
          <p className="text-xl text-center max-w-md">
            A calm environment designed to help candidates
            perform confidently during technical interviews.
          </p>
        </>
      }
    >
      <h2 className="text-5xl font-bold mb-12">Welcome Back 👋</h2>

      <div className="flex flex-col gap-8">
        <input
          type="email"
          placeholder="Email Address"
          className="bg-input p-6 text-xl rounded-xl outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="bg-input p-6 text-xl rounded-xl outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-primaryDark text-white py-6 text-xl rounded-xl font-semibold hover:bg-primary transition hover:scale-[1.02]"
        >
          Login
        </button>

        {message && <p className="text-red-500">{message}</p>}
      </div>
    </AuthLayout>
  );
}
