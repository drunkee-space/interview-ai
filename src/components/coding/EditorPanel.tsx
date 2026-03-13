"use client";

import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface EditorPanelProps {
    type?: string;
}

export function EditorPanel({ type = "general" }: EditorPanelProps) {
    const typeLower = type.toLowerCase();
    
    let defaultLanguage = "javascript";
    let fileName = "solution.js";
    let languageUI = "JavaScript";
    
    if (typeLower.includes("python")) {
        defaultLanguage = "python";
        fileName = "solution.py";
        languageUI = "Python 3";
    } else if (typeLower.includes("html")) {
        defaultLanguage = "html";
        fileName = "index.html";
        languageUI = "HTML5";
    } else if (typeLower.includes("css")) {
        defaultLanguage = "css";
        fileName = "styles.css";
        languageUI = "CSS3";
    } else if (typeLower.includes("react")) {
        defaultLanguage = "javascript";
        fileName = "App.jsx";
        languageUI = "React (JSX)";
    }

    const boilerplates: Record<string, string> = {
        "python": `def solution():\n    # Write your code here\n    pass\n\n# Test\nprint(solution())\n`,
        "javascript": `function solution() {\n    // Write your code here\n    \n}\n\n// Test\nconsole.log(solution());\n`,
        "html": `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Interview Challenge</title>\n</head>\n<body>\n    <!-- Write your HTML structure here -->\n    \n</body>\n</html>\n`,
        "css": `/* Write your styles here */\n\nbody {\n    font-family: sans-serif;\n    display: flex;\n    justify-content: center;\n    align-items: center;\n}\n`,
        "react": `import React, { useState } from 'react';\n\nexport default function App() {\n    const [count, setCount] = useState(0);\n\n    return (\n        <div className="p-4">\n            {/* Build your component here */}\n            <h1>React Interview</h1>\n        </div>\n    );\n}\n`
    };

    let initialCode = boilerplates["javascript"];
    if (typeLower.includes("python")) initialCode = boilerplates["python"];
    if (typeLower.includes("html")) initialCode = boilerplates["html"];
    if (typeLower.includes("css")) initialCode = boilerplates["css"];
    if (typeLower.includes("react")) initialCode = boilerplates["react"];

    const [code, setCode] = useState(initialCode);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col min-h-0"
        >
            {/* Editor Tab Bar */}
            <div className="h-10 border-b border-white/[0.06] flex items-center px-4 bg-[#1e1e2e] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <Code2 className="w-4 h-4 text-indigo-400" />
                        <span>{fileName}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-mono">
                        {languageUI}
                    </span>
                </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
                <MonacoEditor
                    height="100%"
                    language={defaultLanguage}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || "")}
                    options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 16 },
                        lineNumbers: "on",
                        renderLineHighlight: "line",
                        cursorBlinking: "smooth",
                        smoothScrolling: true,
                        bracketPairColorization: { enabled: true },
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: "on",
                    }}
                />
            </div>
        </motion.div>
    );
}
