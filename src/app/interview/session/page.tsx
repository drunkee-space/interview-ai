"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

export default function InterviewSession() {

  /* ================= MODES ================= */

  const [mode, setMode] =
    useState<"discussion" | "coding">("discussion");

  const [cameraView, setCameraView] =
    useState<"mini" | "fullscreen">("mini");

  /* ================= CODE ================= */

  const [code, setCode] = useState("// Start coding here...");
  const [output, setOutput] = useState<string[]>([]);

  const runCode = () => {
    let logs: string[] = [];
    const originalLog = console.log;

    console.log = (...args) => {
      logs.push(args.join(" "));
    };

    try {
      new Function(code)();
    } catch (err: any) {
      logs.push("Error: " + err.message);
    }

    console.log = originalLog;
    setOutput(logs);
  };

  /* ================= CAMERA ================= */

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    const attach = () => {
      if (cameraOn && videoRef.current && cameraStreamRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        videoRef.current.play().catch(() => {});
      }
    };
    const t = setTimeout(attach, 60);
    return () => clearTimeout(t);
  }, [cameraOn, mode, cameraView]);

  const toggleCamera = async () => {
    if (!cameraOn) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      setCameraOn(true);
    } else {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
      setCameraOn(false);
    }
  };

  /* ================= MIC ================= */

  const micStreamRef = useRef<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(false);

  const toggleMic = async () => {
    if (!micOn) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicOn(true);
    } else {
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
      setMicOn(false);
    }
  };

  /* ================= TIMER ================= */

  const [timerInput, setTimerInput] = useState(20);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /* ================= QUESTION ================= */

  const [questionInput, setQuestionInput] = useState("");
  const [currentQuestion, setCurrentQuestion] =
    useState<string | null>(null);

  /* ================= DRAG CAMERA ================= */

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: any) => {
    dragRef.current = true;
    startRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    };
  };

  const handleMouseMove = (e: any) => {
    if (!dragRef.current) return;
    setOffset({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y
    });
  };

  const handleMouseUp = () => dragRef.current = false;

  /* ================= UI ================= */

  return (
    <div
      className="h-screen bg-[#020617] text-white flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >

      {/* HEADER */}
      {mode === "coding" && cameraView === "mini" && (
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">

          <h2 className="truncate max-w-[60%]">
            {currentQuestion || "No Question Yet"}
          </h2>

          <div className="flex items-center gap-4">
            <h1 className={`text-2xl font-semibold
              ${timeLeft <= 120 ? "text-red-400" :
                timeLeft <= 300 ? "text-yellow-400" :
                  "text-white"}`}>
              {formatTime(timeLeft)}
            </h1>

            <button
              onClick={runCode}
              className="px-5 py-2 bg-blue-600 rounded-xl"
            >
              Run
            </button>
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 relative overflow-hidden">

        {/* DISCUSSION MODE */}
        {mode === "discussion" && (
          <div className="absolute inset-0 bg-black">
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                Camera Off
              </div>
            )}
          </div>
        )}

        {/* CODING MODE */}
        {mode === "coding" && (
          <>
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{ fontSize: 18, minimap: { enabled: false } }}
            />

            {/* Console */}
            <div className="absolute bottom-0 left-0 w-full h-40 bg-black border-t border-gray-800 overflow-auto p-3 font-mono text-sm">
              {output.length === 0 ? (
                <p className="text-gray-500">Output will appear here...</p>
              ) : (
                output.map((line, i) => (
                  <p key={i}>{line}</p>
                ))
              )}
            </div>

            {/* MINI FLOAT CAMERA */}
            {cameraView === "mini" && (
              <div
                onMouseDown={handleMouseDown}
                style={{ transform: `translate(${offset.x}px,${offset.y}px)` }}
                className="absolute bottom-24 right-8 z-40 w-72 h-44 rounded-2xl overflow-hidden bg-black border border-gray-700 cursor-move"
              >
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-2 left-2 flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${cameraOn ? "bg-green-600" : "bg-gray-600"}`}>📷</span>
                  <span className={`px-2 py-1 text-xs rounded ${micOn ? "bg-green-600" : "bg-red-600"}`}>🎤</span>
                </div>

                <button
                  onClick={() => setCameraView("fullscreen")}
                  className="absolute top-2 right-2 bg-black/60 px-2 rounded"
                >
                  ⛶
                </button>
              </div>
            )}
          </>
        )}

        {/* FULLSCREEN CAMERA */}
        {mode === "coding" && cameraView === "fullscreen" && (
          <div className="fixed inset-0 bg-black z-[100]">
            <video
              ref={videoRef}
              autoPlay muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            <button
              onClick={() => setCameraView("mini")}
              className="absolute top-6 right-6 bg-black/70 px-4 py-2 rounded-lg"
            >
              Exit Fullscreen
            </button>
          </div>
        )}

      </div>

      {/* CONTROLS */}
      <div className="h-24 border-t border-gray-800 flex justify-center items-center gap-6">

        <button onClick={toggleCamera}
          className={`px-6 py-3 rounded-xl ${cameraOn ? "bg-green-600" : "bg-white/10 border border-white/20"}`}>
          📷 Camera
        </button>

        <button onClick={toggleMic}
          className={`px-6 py-3 rounded-xl ${micOn ? "bg-green-600" : "bg-red-600"}`}>
          🎤 Mic
        </button>

        {mode === "discussion" && (
          <button
            onClick={() => setMode("coding")}
            className="px-6 py-3 rounded-xl bg-blue-600">
            IDE
          </button>
        )}

        {mode === "coding" && (
          <>
            {/* QUESTION HOVER */}
            <div className="relative group">
              <button className="px-6 py-3 rounded-xl bg-indigo-600">
                Question
              </button>

              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-80 p-4 rounded-2xl bg-[#0f172a] border border-gray-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <textarea
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Type question..."
                  className="w-full h-24 bg-black border border-gray-600 rounded-lg p-3 mb-3 text-sm"
                />

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentQuestion(questionInput)}
                    className="px-4 py-2 bg-indigo-600 rounded-lg text-sm">
                    Display
                  </button>

                  <button
                    onClick={() => setCurrentQuestion(null)}
                    className="px-4 py-2 bg-red-600 rounded-lg text-sm">
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* TIMER HOVER */}
            <div className="relative group">
              <button className="px-6 py-3 rounded-xl bg-purple-600">
                Timer
              </button>

              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-72 p-4 rounded-2xl bg-[#0f172a] border border-gray-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="number"
                    value={timerInput}
                    onChange={(e) => setTimerInput(Number(e.target.value))}
                    className="w-16 bg-black border border-gray-700 rounded px-2 py-2 text-center"
                  />
                  <span className="text-sm text-gray-400">min</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setTimeLeft(timerInput * 60); setTimerRunning(true); }}
                    className="px-3 py-2 bg-purple-600 rounded text-sm">
                    Start
                  </button>

                  <button
                    onClick={() => setTimerRunning(p => !p)}
                    className="px-3 py-2 bg-amber-500 rounded text-sm">
                    {timerRunning ? "Pause" : "Resume"}
                  </button>

                  <button
                    onClick={() => setTimeLeft(t => t + 120)}
                    className="px-3 py-2 bg-emerald-500 rounded text-sm">
                    +2m
                  </button>

                  <button
                    onClick={() => { setTimerRunning(false); setTimeLeft(0); }}
                    className="px-3 py-2 bg-red-600 rounded text-sm">
                    Reset
                  </button>
                </div>

              </div>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
