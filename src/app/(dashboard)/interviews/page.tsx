"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Interviews() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [typedText, setTypedText] = useState("");

  const message =
    "Take a deep breath... You are entering your interview space.";

  /* ================= LOCK SCROLL ================= */
  useEffect(() => {
    if (focusMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [focusMode]);

  /* ================= TYPING EFFECT ================= */
  useEffect(() => {
    if (!focusMode) return;

    let i = 0;

    const typing = setInterval(() => {
      setTypedText(message.slice(0, i));
      i++;

      if (i > message.length) clearInterval(typing);
    }, 55);

    // move to preparation screen
    const timer = setTimeout(() => {
      router.push("/interview/preparation");
    }, 6500);

    return () => {
      clearInterval(typing);
      clearTimeout(timer);
    };
  }, [focusMode]);

  return (
    <>
      {/* ================= DASHBOARD CONTENT ================= */}
      <div
        className={`transition-opacity duration-1000 ${
          focusMode ? "opacity-0" : "opacity-100"
        }`}
      >
        <h1 className="text-5xl font-bold mb-12">
          Upcoming Interviews
        </h1>

        <div className="bg-card p-10 rounded-2xl shadow-soft flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold">
              Frontend Developer
            </h2>
            <p className="text-xl text-gray-600 mt-2">
              March 10 • 6:00 PM
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-primaryDark text-white px-10 py-5 rounded-xl text-xl hover:scale-[1.02] transition"
          >
            Start Interview
          </button>
        </div>
      </div>

      {/* ================= READY MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">

          <div className="bg-card p-12 rounded-2xl w-[520px] text-center">

            <h2 className="text-3xl font-bold mb-6">
              Ready to Begin?
            </h2>

            <p className="text-lg text-gray-600 mb-10">
              Make sure you are in a quiet environment.
              Preparation will begin once you continue.
            </p>

            <div className="flex justify-center gap-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-8 py-4 rounded-xl bg-input"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  setFocusMode(true);
                }}
                className="px-8 py-4 rounded-xl bg-primaryDark text-white"
              >
                I'm Ready
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= FOCUS MODE OVERLAY ================= */}
      {focusMode && (
        <div className="fixed inset-0 bg-[#0b1120] flex items-center justify-center z-50 transition-opacity duration-1000">

          <h1 className="text-5xl text-white font-semibold text-center max-w-2xl px-6 animate-fadeIn">
            {typedText}
          </h1>

        </div>
      )}
    </>
  );
}
