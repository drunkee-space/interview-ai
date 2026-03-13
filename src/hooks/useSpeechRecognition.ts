"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionHook {
    transcript: string;
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    detectedLanguage: string;
}

// Extend window for webkit speech recognition
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [detectedLanguage, setDetectedLanguage] = useState("en");
    const recognitionRef = useRef<unknown>(null);
    const finalTranscriptRef = useRef("");

    const isListeningIntentionRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    final += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            if (final) {
                finalTranscriptRef.current += final + " ";
            }

            const currentTranscript = finalTranscriptRef.current + interim;
            setTranscript(currentTranscript);

            // Simple language detection: check for non-Latin characters
            if (currentTranscript.length > 10) {
                const nonLatinRatio = (currentTranscript.match(/[^\x00-\x7F]/g) || []).length / currentTranscript.length;
                setDetectedLanguage(nonLatinRatio > 0.3 ? "non-english" : "en");
            }
        };

        recognition.onerror = (event: { error: string }) => {
            if (event.error !== "no-speech" && event.error !== "aborted") {
                console.error("Speech recognition error:", event.error);
            }
        };

        recognition.onend = () => {
            // Auto-restart if we actually intend to be listening
            if (isListeningIntentionRef.current) {
                try {
                    recognition.start();
                } catch {
                    // Already started
                }
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isListeningIntentionRef.current = false;
            try { recognition.stop(); } catch { /* ignore */ }
        };
    }, []);

    useEffect(() => {
        // Expose a globally available method to simulate speech for E2E testing
        if (typeof window !== "undefined") {
            (window as any).simulateSpeech = (text: string) => {
                setTranscript(text);
            };
        }
    }, [setTranscript]);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            isListeningIntentionRef.current = true;
            setIsListening(true);
            try {
                (recognitionRef.current as { start: () => void }).start();
            } catch {
                // Already started
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        isListeningIntentionRef.current = false;
        setIsListening(false);
        if (recognitionRef.current) {
            try {
                (recognitionRef.current as { stop: () => void }).stop();
            } catch { /* ignore */ }
        }
    }, []);

    const resetTranscript = useCallback(() => {
        finalTranscriptRef.current = "";
        setTranscript("");
    }, []);

    return { transcript, isListening, startListening, stopListening, resetTranscript, detectedLanguage };
}
