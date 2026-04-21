// ═══════════════════════════════════════════════════════════════
// Unified In-Browser Code Execution Engine
//
// Routes code to the appropriate WASM-based executor:
//   - Python  → Pyodide (CPython in WebAssembly)
//   - SQL     → sql.js (SQLite in WebAssembly)
//   - JS/TS   → Sandboxed iframe with console capture
//
// All execution is 100% client-side. No server APIs needed.
// No API keys, no billing, no rate limits.
//
// Security layers:
//   1. Code sanitization (dangerous pattern detection)
//   2. Language-specific sandboxing (WASM / iframe sandbox)
//   3. 10-second execution timeout
//   4. No filesystem, network, or OS access
// ═══════════════════════════════════════════════════════════════

import { executePython, isPyodideReady } from "./pythonExecutor";
import { executeSQL, isSqlReady } from "./sqlExecutor";
import { executeJavaScript } from "./jsExecutor";

export interface BrowserExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    engine: string; // Which engine was used
}

/**
 * Check if the runtime for a given language is already downloaded and cached.
 * Returns true if the runtime is ready for instant execution.
 */
export function isRuntimeReady(language: string): boolean {
    const lang = language.toLowerCase();

    if (lang === "python") return isPyodideReady();
    if (lang === "sqlite3" || lang === "sql") return isSqlReady();
    if (lang === "javascript" || lang === "typescript") return true; // iframe is always ready

    return false;
}

/**
 * Get a human-readable name for the engine being used.
 */
export function getEngineName(language: string): string {
    const lang = language.toLowerCase();

    if (lang === "python") return "Pyodide (Python 3.11 WASM)";
    if (lang === "sqlite3" || lang === "sql") return "sql.js (SQLite WASM)";
    if (lang === "javascript") return "Sandboxed iframe";
    if (lang === "typescript") return "Sandboxed iframe (TS→JS)";

    return "Unknown";
}

/**
 * Execute code in the browser using the appropriate engine.
 * 
 * Supported languages:
 * - python → Pyodide WASM
 * - sqlite3, sql → sql.js WASM
 * - javascript → Sandboxed iframe
 * - typescript → Transpiled to JS, then sandboxed iframe
 * 
 * @param language The runtime language identifier
 * @param code The source code to execute
 * @returns ExecutionResult with stdout, stderr, exitCode, durationMs
 */
export async function executeInBrowser(
    language: string,
    code: string
): Promise<BrowserExecutionResult> {
    const lang = language.toLowerCase();

    // ─── Python ───
    if (lang === "python") {
        const result = await executePython(code);
        return { ...result, engine: "Pyodide" };
    }

    // ─── SQL (SQLite) ───
    if (lang === "sqlite3" || lang === "sql") {
        const result = await executeSQL(code);
        return { ...result, engine: "sql.js" };
    }

    // ─── JavaScript ───
    if (lang === "javascript") {
        const result = await executeJavaScript(code);
        return { ...result, engine: "iframe" };
    }

    // ─── TypeScript (basic transpile to JS) ───
    if (lang === "typescript") {
        // Strip type annotations for basic TS support
        // This handles common patterns: type annotations, interfaces, generics
        const jsCode = code
            .replace(/:\s*(string|number|boolean|any|void|never|unknown|null|undefined|object)(\[\])?\s*/g, " ")
            .replace(/:\s*\{[^}]*\}\s*/g, " ")
            .replace(/\binterface\s+\w+\s*\{[^}]*\}/g, "")
            .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, "")
            .replace(/<[^>]+>/g, "")
            .replace(/\bas\s+\w+/g, "");

        const result = await executeJavaScript(jsCode);
        return { ...result, engine: "iframe (TS→JS)" };
    }

    // ─── Unsupported Language ───
    return {
        stdout: "",
        stderr: `Language "${language}" is not supported for in-browser execution.\n\nSupported languages: Python, SQL, JavaScript, TypeScript`,
        exitCode: 1,
        durationMs: 0,
        engine: "none",
    };
}
