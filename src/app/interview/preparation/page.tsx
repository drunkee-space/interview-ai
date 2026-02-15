"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Preparation() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("device");
  const [deviceDone, setDeviceDone] = useState(false);

  /* ================= QUIZ ================= */
  const [selected, setSelected] = useState<number | null>(null);
  const correctAnswer = 1;

  return (
    <div className="min-h-screen bg-bgMain flex">

      {/* ================= LEFT SIDEBAR ================= */}
      <div className="w-80 bg-card shadow-soft p-10 flex flex-col">

        <h2 className="text-3xl font-bold mb-12">
          Preparation
        </h2>

        <div className="space-y-6 text-xl">

          <button
            onClick={() => setActiveTab("device")}
            className={`p-4 rounded-xl text-left ${
              activeTab === "device" ? "bg-panel" : ""
            }`}
          >
            Device Check {deviceDone && "✅"}
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`p-4 rounded-xl text-left ${
              activeTab === "quiz" ? "bg-panel" : ""
            }`}
          >
            Warm-up Quiz
          </button>

          <button
            onClick={() => setActiveTab("revision")}
            className={`p-4 rounded-xl text-left ${
              activeTab === "revision" ? "bg-panel" : ""
            }`}
          >
            Quick Revision
          </button>
        </div>

        {/* ENTER BUTTON */}
        <button
          disabled={!deviceDone}
          onClick={() => router.push("/interview/session")}
          className={`mt-auto py-5 rounded-xl text-xl text-white
            ${
              deviceDone
                ? "bg-primaryDark"
                : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          Enter Interview Room
        </button>
      </div>

      {/* ================= RIGHT CONTENT ================= */}
      <div className="flex-1 p-16 overflow-y-auto">

        {/* DEVICE CHECK */}
        {activeTab === "device" && (
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-10">
              Device Check
            </h1>

            <div className="grid grid-cols-3 gap-8 mb-10">

              <div className="bg-card p-8 rounded-2xl text-center">
                <p className="text-2xl">📷 Camera</p>
                <p className="mt-4 text-green-600 text-xl">
                  Detected
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl text-center">
                <p className="text-2xl">🎤 Microphone</p>
                <p className="mt-4 text-green-600 text-xl">
                  Working
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl text-center">
                <p className="text-2xl">🌐 Network</p>
                <p className="mt-4 text-green-600 text-xl">
                  Stable
                </p>
              </div>
            </div>

            <button
              onClick={() => setDeviceDone(true)}
              className="bg-primaryDark text-white px-12 py-5 rounded-xl text-xl"
            >
              Confirm Device Ready
            </button>
          </div>
        )}

        {/* ================= QUIZ ================= */}
        {activeTab === "quiz" && (
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-10">
              Warm-up Quiz
            </h1>

            <div className="bg-card p-10 rounded-2xl">

              <p className="text-2xl mb-8">
                What is the time complexity of Binary Search?
              </p>

              <div className="space-y-5 text-xl">
                {["O(n)", "O(log n)", "O(n log n)", "O(1)"].map(
                  (opt, i) => (
                    <label
                      key={i}
                      className="block p-4 bg-panel rounded-xl cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="quiz"
                        className="mr-3"
                        onChange={() => setSelected(i)}
                      />
                      {opt}
                    </label>
                  )
                )}
              </div>

              {selected !== null && (
                <div className="mt-8 text-xl">
                  {selected === correctAnswer ? (
                    <p className="text-green-600">
                      ✅ Correct! Binary search halves data each step.
                    </p>
                  ) : (
                    <p className="text-red-500">
                      ❌ Incorrect. Correct answer is O(log n).
                    </p>
                  )}

                  <p className="mt-4 text-gray-600">
                    Explanation: Binary search repeatedly divides
                    the search space into half.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= REVISION ================= */}
        {activeTab === "revision" && (
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-10">
              Quick Revision
            </h1>

            <div className="bg-card p-10 rounded-2xl space-y-6 text-xl">

              <p>
                Arrays allow fast indexed access but insertion
                in the middle costs O(n).
              </p>

              <pre className="bg-panel p-6 rounded-xl text-lg">
{`// Reverse array example
function reverse(arr){
  return arr.reverse();
}`}
              </pre>

              <p className="text-gray-600">
                Always analyse time complexity before optimization.
              </p>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
