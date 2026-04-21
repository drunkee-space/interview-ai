"use client";

import { motion } from "framer-motion";
import { Code2, RotateCcw, ZoomIn, ZoomOut, WrapText, Settings2 } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import { getLanguageConfig } from "@/lib/languageConfig";

interface EditorPanelProps {
    type?: string;
    onCodeChange?: (code: string) => void;
    onRunCode?: () => void;
    restoredCode?: string;
}

export function EditorPanel({ type = "general", onCodeChange, onRunCode, restoredCode }: EditorPanelProps) {
    const config = getLanguageConfig(type);
    
    // Fallbacks
    const defaultLanguage = config?.editorLanguage || "javascript";
    const fileName = config?.fileName || "solution.js";
    const languageUI = config?.displayName || "JavaScript";
    const languageIcon = config?.icon || "📄";
    const initialCode = config?.boilerplate || `function solution() {\n    // Write your logic here\n}\n`;

    // Use restored code if available, otherwise use boilerplate
    const [code, setCode] = useState(restoredCode || initialCode);
    const [fontSize, setFontSize] = useState(14);
    const [wordWrap, setWordWrap] = useState<"on" | "off">("on");
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [showSettings, setShowSettings] = useState(false);
    const [showSavedToast, setShowSavedToast] = useState(false);
    const editorRef = useRef<any>(null);

    const handleEditorMount = useCallback((editor: any) => {
        editorRef.current = editor;
        
        // Track cursor position
        editor.onDidChangeCursorPosition((e: any) => {
            setCursorPosition({
                line: e.position.lineNumber,
                col: e.position.column,
            });
        });

        // Ctrl+Enter → Run Code
        editor.addAction({
            id: "run-code",
            label: "Run Code",
            keybindings: [
                // eslint-disable-next-line no-bitwise
                2048 | 3, // Ctrl+Enter (Monaco keycodes)
            ],
            run: () => {
                onRunCode?.();
            },
        });

        // Ctrl+S → Show "Auto-saved" toast
        editor.addAction({
            id: "save-code",
            label: "Save",
            keybindings: [
                // eslint-disable-next-line no-bitwise
                2048 | 49, // Ctrl+S
            ],
            run: () => {
                setShowSavedToast(true);
                setTimeout(() => setShowSavedToast(false), 2000);
            },
        });

        // Focus the editor
        editor.focus();
    }, [onRunCode]);

    const handleResetCode = useCallback(() => {
        setCode(initialCode);
        onCodeChange?.(initialCode);
        if (editorRef.current) {
            editorRef.current.setValue(initialCode);
        }
    }, [initialCode, onCodeChange]);

    const adjustFontSize = useCallback((delta: number) => {
        setFontSize(prev => Math.min(24, Math.max(10, prev + delta)));
    }, []);

    const toggleWordWrap = useCallback(() => {
        setWordWrap(prev => prev === "on" ? "off" : "on");
    }, []);

    // Auto-saved toast disappear
    useEffect(() => {
        if (showSavedToast) {
            const timer = setTimeout(() => setShowSavedToast(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [showSavedToast]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
        >
            {/* Editor Tab Bar */}
            <div className="h-10 border-b border-white/[0.06] flex items-center justify-between px-4 bg-[#1e1e2e] shrink-0">
                <div className="flex items-center gap-3">
                    {/* Active file tab */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-[#0f111a] border border-white/[0.08] border-b-0 -mb-[1px] relative">
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-white/80 text-xs font-medium">{fileName}</span>
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#0f111a]" />
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-mono flex items-center gap-1">
                        <span>{languageIcon}</span>
                        {languageUI}
                    </span>
                </div>

                {/* Editor Controls */}
                <div className="flex items-center gap-1">
                    {/* Auto-saved toast */}
                    {showSavedToast && (
                        <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] text-green-400/80 mr-2 font-medium"
                        >
                            ✓ Auto-saved
                        </motion.span>
                    )}

                    <button
                        onClick={() => adjustFontSize(-1)}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                        title="Decrease font size"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-white/30 font-mono min-w-[20px] text-center">{fontSize}</span>
                    <button
                        onClick={() => adjustFontSize(1)}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                        title="Increase font size"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    <button
                        onClick={toggleWordWrap}
                        className={`p-1.5 rounded transition-colors ${wordWrap === "on" ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/10 text-white/40 hover:text-white/70"}`}
                        title={`Word wrap: ${wordWrap}`}
                    >
                        <WrapText className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={handleResetCode}
                        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                        title="Reset to boilerplate"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0 relative">
                <MonacoEditor
                    height="100%"
                    language={defaultLanguage}
                    theme="vs-dark"
                    value={code}
                    onMount={handleEditorMount}
                    onChange={(val) => {
                        setCode(val || "");
                        onCodeChange?.(val || "");
                    }}
                    options={{
                        fontSize,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        fontLigatures: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: "on",
                        renderLineHighlight: "line",
                        cursorBlinking: "smooth",
                        cursorSmoothCaretAnimation: "on",
                        smoothScrolling: true,
                        bracketPairColorization: { enabled: true },
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap,
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: true,
                        },
                        parameterHints: { enabled: true },
                        suggestOnTriggerCharacters: true,
                        formatOnPaste: true,
                        formatOnType: false,
                        folding: true,
                        foldingStrategy: "indentation",
                        matchBrackets: "always",
                        renderWhitespace: "selection",
                        guides: {
                            indentation: true,
                            bracketPairs: true,
                        },
                        linkedEditing: true,
                        mouseWheelZoom: true,
                        stickyScroll: { enabled: false },
                        overviewRulerLanes: 0,
                        hideCursorInOverviewRuler: true,
                        scrollbar: {
                            vertical: "auto",
                            horizontal: "auto",
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                        },
                    }}
                />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-[#1a1b26] border-t border-white/[0.04] flex items-center justify-between px-4 text-[10px] text-white/30 font-mono shrink-0">
                <div className="flex items-center gap-4">
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
                    <span>{languageUI}</span>
                    <span>UTF-8</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white/20">Ctrl+Enter to run</span>
                    <span>Spaces: {4}</span>
                </div>
            </div>
        </motion.div>
    );
}
