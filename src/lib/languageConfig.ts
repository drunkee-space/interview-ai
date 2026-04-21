export type EnvironmentMode = "QUERY_MODE" | "CODE_MODE" | "CONCEPTUAL_MODE";

export interface LanguageConfig {
    id: string;                 // The internal ID for tracking
    mode: EnvironmentMode;      // Controls UI state (Run Query vs Run Code vs Conceptual)
    fileName: string;           // Displayed in Editor tabs
    editorLanguage: string;     // Passed to Monaco Editor highlighting
    runtimeLanguage: string | null; // Passed to Backend Execution API
    boilerplate: string;        // Starting code content
    canExecute: boolean;        // Enables/Disables Execution Engine
    judge0LanguageId: number | null; // Judge0 CE language ID for sandboxed execution
    displayName: string;        // Human-readable name for UI
    icon: string;               // Emoji icon for UI
}

const CONFIGURATIONS: Record<string, LanguageConfig> = {
    sql: {
        id: "sql",
        mode: "QUERY_MODE",
        fileName: "query.sql",
        editorLanguage: "sql",
        runtimeLanguage: "sqlite3",
        canExecute: true,
        judge0LanguageId: 82,
        displayName: "SQL",
        icon: "🗄️",
        boilerplate: `-- Write your SQL query here\n-- Tip: Table 'users' (id, name, role) comes pre-loaded.\n-- Also available: 'orders' (id, user_id, amount) and 'products' (id, name, price)\n\nSELECT * FROM users;\n`,
    },
    cpp: {
        id: "cpp",
        mode: "CODE_MODE",
        fileName: "solution.cpp",
        editorLanguage: "cpp",
        runtimeLanguage: "c++",
        canExecute: true,
        judge0LanguageId: 54,
        displayName: "C++",
        icon: "⚡",
        boilerplate: `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    cout << "Ready to compile!" << endl;\n    return 0;\n}\n`,
    },
    python: {
        id: "python",
        mode: "CODE_MODE",
        fileName: "solution.py",
        editorLanguage: "python",
        runtimeLanguage: "python",
        canExecute: true,
        judge0LanguageId: 71,
        displayName: "Python 3",
        icon: "🐍",
        boilerplate: `def solution():\n    # Write your code here\n    pass\n\n# Test execution\nprint("Script initialized")\n`,
    },
    javascript: {
        id: "javascript",
        mode: "CODE_MODE",
        fileName: "solution.js",
        editorLanguage: "javascript",
        runtimeLanguage: "javascript",
        canExecute: true,
        judge0LanguageId: 63,
        displayName: "JavaScript",
        icon: "🟨",
        boilerplate: `function solution() {\n    // Write your logic here\n}\n\nconsole.log("Runtime initialized");\n`,
    },
    react: {
        id: "react",
        mode: "CONCEPTUAL_MODE",
        fileName: "App.jsx",
        editorLanguage: "javascript",
        runtimeLanguage: null,
        canExecute: false, // React cannot run in standard generic execution backends
        judge0LanguageId: null,
        displayName: "React (JSX)",
        icon: "⚛️",
        boilerplate: `import React, { useState } from 'react';\n\nexport default function App() {\n    const [state, setState] = useState(0);\n\n    return (\n        <div className="p-4">\n            {/* Explain or build your concepts here */}\n            <h1>React Logical concepts</h1>\n        </div>\n    );\n}\n`,
    },
    java: {
        id: "java",
        mode: "CODE_MODE",
        fileName: "Solution.java",
        editorLanguage: "java",
        runtimeLanguage: "java",
        canExecute: true,
        judge0LanguageId: 62,
        displayName: "Java",
        icon: "☕",
        boilerplate: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println("Ready to compile!");\n    }\n}\n`,
    },
    typescript: {
        id: "typescript",
        mode: "CODE_MODE",
        fileName: "solution.ts",
        editorLanguage: "typescript",
        runtimeLanguage: "typescript",
        canExecute: true,
        judge0LanguageId: 74,
        displayName: "TypeScript",
        icon: "🔷",
        boilerplate: `function solution(): void {\n    // Write your logic here\n}\n\nconsole.log("TypeScript runtime initialized");\n`,
    },
    c: {
        id: "c",
        mode: "CODE_MODE",
        fileName: "solution.c",
        editorLanguage: "c",
        runtimeLanguage: "c",
        canExecute: true,
        judge0LanguageId: 50,
        displayName: "C",
        icon: "🔧",
        boilerplate: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    printf("Ready to compile!\\n");\n    return 0;\n}\n`,
    },
    csharp: {
        id: "csharp",
        mode: "CODE_MODE",
        fileName: "Solution.cs",
        editorLanguage: "csharp",
        runtimeLanguage: "csharp",
        canExecute: true,
        judge0LanguageId: 51,
        displayName: "C#",
        icon: "🟪",
        boilerplate: `using System;\n\npublic class Solution {\n    public static void Main(string[] args) {\n        // Write your solution here\n        Console.WriteLine("Ready to compile!");\n    }\n}\n`,
    },
    go: {
        id: "go",
        mode: "CODE_MODE",
        fileName: "solution.go",
        editorLanguage: "go",
        runtimeLanguage: "go",
        canExecute: true,
        judge0LanguageId: 60,
        displayName: "Go",
        icon: "🐹",
        boilerplate: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println("Ready to compile!")\n}\n`,
    },
    rust: {
        id: "rust",
        mode: "CODE_MODE",
        fileName: "solution.rs",
        editorLanguage: "rust",
        runtimeLanguage: "rust",
        canExecute: true,
        judge0LanguageId: 73,
        displayName: "Rust",
        icon: "🦀",
        boilerplate: `fn main() {\n    // Write your solution here\n    println!("Ready to compile!");\n}\n`,
    },
    kotlin: {
        id: "kotlin",
        mode: "CODE_MODE",
        fileName: "Solution.kt",
        editorLanguage: "kotlin",
        runtimeLanguage: "kotlin",
        canExecute: true,
        judge0LanguageId: 78,
        displayName: "Kotlin",
        icon: "🟧",
        boilerplate: `fun main() {\n    // Write your solution here\n    println("Ready to compile!")\n}\n`,
    },
    swift: {
        id: "swift",
        mode: "CODE_MODE",
        fileName: "solution.swift",
        editorLanguage: "swift",
        runtimeLanguage: "swift",
        canExecute: true,
        judge0LanguageId: 83,
        displayName: "Swift",
        icon: "🦅",
        boilerplate: `import Foundation\n\n// Write your solution here\nprint("Ready to compile!")\n`,
    },
    ruby: {
        id: "ruby",
        mode: "CODE_MODE",
        fileName: "solution.rb",
        editorLanguage: "ruby",
        runtimeLanguage: "ruby",
        canExecute: true,
        judge0LanguageId: 72,
        displayName: "Ruby",
        icon: "💎",
        boilerplate: `# Write your solution here\ndef solution\n  # ...\nend\n\nputs "Ruby runtime initialized"\n`,
    },
    php: {
        id: "php",
        mode: "CODE_MODE",
        fileName: "solution.php",
        editorLanguage: "php",
        runtimeLanguage: "php",
        canExecute: true,
        judge0LanguageId: 68,
        displayName: "PHP",
        icon: "🐘",
        boilerplate: `<?php\n// Write your solution here\nfunction solution() {\n    // ...\n}\n\necho "PHP runtime initialized\\n";\n`,
    },
    html: {
        id: "html",
        mode: "CODE_MODE",
        fileName: "index.html",
        editorLanguage: "html",
        runtimeLanguage: "html",
        canExecute: true,
        judge0LanguageId: null,
        displayName: "HTML",
        icon: "🌐",
        boilerplate: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Demo</title>\n</head>\n<body>\n  <!-- Write your markup here -->\n  <h1>Hello, World</h1>\n</body>\n</html>\n`,
    },
    css: {
        id: "css",
        mode: "CONCEPTUAL_MODE",
        fileName: "styles.css",
        editorLanguage: "css",
        runtimeLanguage: null,
        canExecute: false,
        judge0LanguageId: null,
        displayName: "CSS",
        icon: "🎨",
        boilerplate: `/* Write your styles here */\n.container {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n`,
    },
    conceptual: {
        id: "conceptual",
        mode: "CONCEPTUAL_MODE",
        fileName: "notes.md",
        editorLanguage: "markdown",
        runtimeLanguage: null,
        canExecute: false,
        judge0LanguageId: null,
        displayName: "Notes",
        icon: "📝",
        boilerplate: `# Concept Notes\n\nUse this space to sketch out designs, pseudocode, or explanations.\n`,
    },
};

/**
 * Returns a robust configuration object by matching common keywords 
 * to proper coding environments, ignoring case.
 */
export function getLanguageConfig(topic: string): LanguageConfig | null {
    if (!topic || typeof topic !== "string") return null;
    
    // Normalize user string
    const topicLower = topic.toLowerCase();

    // Order matters: check the more specific keywords FIRST
    if (["sql", "database", "mysql", "postgres", "sqlite", "mongo", "nosql", "dbms"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.sql;
    }
    if (["c++", "cpp"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.cpp;
    }
    if (["c#", "csharp", ".net", "dotnet"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.csharp;
    }
    if (["python", "django", "flask", "fastapi"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.python;
    }
    if (["react", "nextjs", "next.js", "next "].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.react;
    }
    if (["typescript", " ts"].some(kw => topicLower.includes(kw)) || topicLower === "ts") {
        return CONFIGURATIONS.typescript;
    }
    if (["javascript", " js", "node", "express"].some(kw => topicLower.includes(kw)) || topicLower === "js") {
        return CONFIGURATIONS.javascript;
    }
    if (["java", "spring"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.java;
    }
    if (["golang", "go "].some(kw => topicLower.includes(kw)) || topicLower === "go") {
        return CONFIGURATIONS.go;
    }
    if (topicLower.includes("rust")) {
        return CONFIGURATIONS.rust;
    }
    if (topicLower.includes("kotlin")) {
        return CONFIGURATIONS.kotlin;
    }
    if (topicLower.includes("swift")) {
        return CONFIGURATIONS.swift;
    }
    if (["ruby", "rails"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.ruby;
    }
    if (["php", "laravel"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.php;
    }
    if (["html"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.html;
    }
    if (["css", "tailwind", "sass", "scss"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.css;
    }
    if (topicLower === "c") {
        return CONFIGURATIONS.c;
    }
    // Conceptual topics that don't have a single language — provide a notes scratchpad
    if (["dsa", "data structures", "algorithm", "system design", "operating system", "os ", "network", "oop", "machine learning", " ml", " ai", "devops", "docker", "kubernetes", "aws", "cloud"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.conceptual;
    }

    // Explicit Fail-Safe. If not identified precisely, don't allow default fallback
    return null;
}

/**
 * Returns all available language configurations.
 */
export function getAllLanguageConfigs(): LanguageConfig[] {
    return Object.values(CONFIGURATIONS);
}
