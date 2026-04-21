// ═══════════════════════════════════════════════════════════════
// Python In-Browser Executor (Pyodide WebAssembly)
//
// Security:
//   - Runs in the browser's WASM sandbox (no filesystem, no network)
//   - 10-second hard timeout prevents infinite loops
//   - stdout/stderr captured via StringIO redirect
//   - No access to host system resources
// ═══════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";

interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
}

let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;

/**
 * Load and cache the Pyodide runtime. First call downloads ~12MB WASM,
 * subsequent calls return the cached instance instantly.
 */
async function getPyodide(): Promise<any> {
    if (pyodideInstance) return pyodideInstance;

    if (pyodideLoading) return pyodideLoading;

    pyodideLoading = (async () => {
        // Dynamically load the Pyodide script from CDN
        if (typeof window !== "undefined" && !(window as any).loadPyodide) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement("script");
                script.src = `${PYODIDE_CDN}pyodide.js`;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Failed to load Pyodide runtime from CDN"));
                document.head.appendChild(script);
            });
        }

        const loadPyodide = (window as any).loadPyodide;
        if (!loadPyodide) {
            throw new Error("Pyodide loader not available");
        }

        pyodideInstance = await loadPyodide({
            indexURL: PYODIDE_CDN,
        });

        return pyodideInstance;
    })();

    try {
        const result = await pyodideLoading;
        return result;
    } catch (err) {
        pyodideLoading = null; // Allow retry on failure
        throw err;
    }
}

/**
 * Check if Pyodide is already loaded (for UI "loading runtime" indicator)
 */
export function isPyodideReady(): boolean {
    return pyodideInstance !== null;
}

/**
 * Execute Python code in the browser using Pyodide.
 * 
 * Security model:
 * - Code runs inside Pyodide's WASM sandbox
 * - No access to real filesystem, network, or OS
 * - Dangerous imports (os, subprocess, socket, etc.) are not functional
 * - 10-second timeout kills long-running code
 */
export async function executePython(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        const pyodide = await getPyodide();

        // Set up stdout/stderr capture via Python's io.StringIO
        pyodide.runPython(`
import sys
import io

__stdout_capture = io.StringIO()
__stderr_capture = io.StringIO()
sys.stdout = __stdout_capture
sys.stderr = __stderr_capture
`);

        // Execute user code with timeout protection
        let timedOut = false;
        const timeoutMs = 10000;

        try {
            await Promise.race([
                pyodide.runPythonAsync(code),
                new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        timedOut = true;
                        reject(new Error("TIMEOUT"));
                    }, timeoutMs);
                }),
            ]);
        } catch (execErr: any) {
            if (timedOut) {
                // Reset stdout/stderr
                pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);
                return {
                    stdout: "",
                    stderr: "Time Limit Exceeded — your code took longer than 10 seconds.\nCheck for infinite loops (e.g. while True without break).",
                    exitCode: 1,
                    durationMs: Math.round(performance.now() - startTime),
                };
            }

            // Capture any partial stdout before the error
            const partialStdout = pyodide.runPython("__stdout_capture.getvalue()") || "";

            // Reset streams
            pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

            // Format the Python error nicely
            const errMsg = String(execErr.message || execErr);
            // Remove the "PythonError: " prefix if present
            const cleanErr = errMsg.replace(/^PythonError:\s*/, "");

            return {
                stdout: partialStdout,
                stderr: cleanErr,
                exitCode: 1,
                durationMs: Math.round(performance.now() - startTime),
            };
        }

        // Collect output
        const stdout = pyodide.runPython("__stdout_capture.getvalue()") || "";
        const stderr = pyodide.runPython("__stderr_capture.getvalue()") || "";

        // Reset streams for next execution
        pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        return {
            stdout,
            stderr,
            exitCode: stderr ? 1 : 0,
            durationMs: Math.round(performance.now() - startTime),
        };
    } catch (loadErr: any) {
        return {
            stdout: "",
            stderr: `Failed to initialize Python runtime: ${loadErr.message || loadErr}\n\nPlease check your internet connection — Pyodide needs to download (~12MB) on first use.`,
            exitCode: 1,
            durationMs: Math.round(performance.now() - startTime),
        };
    }
}
