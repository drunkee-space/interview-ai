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
    }
};

/**
 * Returns a robust configuration object by matching common keywords 
 * to proper coding environments, ignoring case.
 */
export function getLanguageConfig(topic: string): LanguageConfig | null {
    if (!topic || typeof topic !== "string") return null;
    
    // Normalize user string
    const topicLower = topic.toLowerCase();

    // Mapping arrays
    if (["sql", "database", "mysql", "postgres", "sqlite"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.sql;
    }
    if (["c++", "cpp"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.cpp;
    }
    if (["python"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.python;
    }
    if (["react"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.react;
    }
    if (["typescript", "ts"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.typescript;
    }
    if (["java"].some(kw => topicLower === kw)) {
        return CONFIGURATIONS.java;
    }
    if (["javascript", "js", "node"].some(kw => topicLower.includes(kw))) {
        return CONFIGURATIONS.javascript;
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
