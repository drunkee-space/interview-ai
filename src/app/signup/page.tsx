"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/auth/AuthLayout";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created successfully!");
    }
  };

  return (
    <AuthLayout
      leftContent={
        <>
          <h1 className="text-6xl font-bold mb-8">Join Interview AI</h1>
          <p className="text-xl text-center max-w-md">
            Practice interviews in a stress-free environment
            and improve your coding confidence.
          </p>
        </>
      }
    >
      <h2 className="text-5xl font-bold mb-12">Create Account 🚀</h2>

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
          onClick={handleSignup}
          className="bg-primaryDark text-white py-6 text-xl rounded-xl font-semibold hover:bg-primary transition hover:scale-[1.02]"
        >
          Sign Up
        </button>

        {message && <p className="text-green-600">{message}</p>}
      </div>
    </AuthLayout>
  );
}
