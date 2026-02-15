"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const messages = [
  "Take a deep breath...",
  "Breathe in 🌿",
  "Breathe out 🌊",
  "You are ready.",
];

export default function BreathingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 3000);

    const redirect = setTimeout(() => {
      router.push("/interview/preparation/demo");
    }, 12000);

    return () => {
      clearInterval(interval);
      clearTimeout(redirect);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center
      bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">

      <h1 className="text-5xl font-semibold transition-opacity duration-1000">
        {messages[index] || "Preparing..."}
      </h1>

    </div>
  );
}
