"use client";

import { useState, useRef, useCallback } from "react";

export interface TranscriptionResult {
    text: string;
    language: string;
    languageName: string;
}

interface AudioRecordingHook {
    isRecording: boolean;
    isTranscribing: boolean;
    startRecording: () => void;
    stopRecording: (promptContext?: string) => Promise<TranscriptionResult>;
    audioLevel: number; // 0-1 for waveform visualization
}

/**
 * Custom hook that records audio from the microphone using MediaRecorder,
 * then sends it to our Whisper API for multi-language transcription.
 */
export function useAudioRecording(): AudioRecordingHook {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Continuously monitor the mic audio level for the waveform UI
    const monitorAudioLevel = useCallback(() => {
        if (!analyserRef.current) return;

        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
            analyser.getByteFrequencyData(dataArray);
            // Calculate RMS (root mean square) for a smoother level reading
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += (dataArray[i] / 255) ** 2;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            setAudioLevel(Math.min(1, rms * 2.5)); // Scale up for visibility

            animationFrameRef.current = requestAnimationFrame(tick);
        };

        tick();
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                },
            });

            streamRef.current = stream;
            chunksRef.current = [];

            // Set up audio analyser for waveform visualization
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Start the MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus"
                    : "audio/webm",
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(500); // Collect chunks every 500ms
            setIsRecording(true);

            // Start monitoring audio levels
            monitorAudioLevel();
        } catch (err) {
            console.error("Failed to start audio recording:", err);
        }
    }, [monitorAudioLevel]);

    const stopRecording = useCallback(async (promptContext?: string): Promise<TranscriptionResult> => {
        const emptyResult: TranscriptionResult = { text: "", language: "en", languageName: "English" };
        return new Promise((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
                resolve(emptyResult);
                return;
            }

            // Stop the animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            setAudioLevel(0);

            mediaRecorderRef.current.onstop = async () => {
                setIsRecording(false);
                setIsTranscribing(true);

                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];

                // Stop all tracks from the stream
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }

                // If the blob is too small (no real speech), skip transcription
                if (audioBlob.size < 1000) {
                    setIsTranscribing(false);
                    resolve(emptyResult);
                    return;
                }

                try {
                    // Send audio to our Whisper API endpoint
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "recording.webm");
                    if (promptContext) {
                        formData.append("promptContext", promptContext);
                    }

                    const res = await fetch("/api/interview/transcribe", {
                        method: "POST",
                        body: formData,
                    });

                    if (!res.ok) {
                        throw new Error("Transcription API failed");
                    }

                    const data = await res.json();
                    setIsTranscribing(false);
                    resolve({
                        text: data.text || "",
                        language: data.language || "en",
                        languageName: data.languageName || "English",
                    });
                } catch (err) {
                    console.error("Whisper transcription failed:", err);
                    setIsTranscribing(false);
                    resolve(emptyResult);
                }
            };

            mediaRecorderRef.current.stop();
        });
    }, []);

    return {
        isRecording,
        isTranscribing,
        startRecording,
        stopRecording,
        audioLevel,
    };
}
