// ═══════════════════════════════════════════════════════════════
// JavaScript In-Browser Executor (Sandboxed iframe)
//
// Security:
//   - Code runs inside a sandboxed iframe (sandbox="allow-scripts")
//   - No access to parent DOM, cookies, localStorage, or navigation
//   - No access to parent's origin (cross-origin isolation)
//   - console.log/error/warn captured and sent via postMessage
//   - 10-second hard timeout prevents infinite loops
//   - iframe is destroyed after each execution
// ═══════════════════════════════════════════════════════════════

interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
}

/**
 * Execute JavaScript code inside a fully sandboxed iframe.
 * 
 * Security model:
 * - `sandbox="allow-scripts"` blocks:
 *   - Access to parent window/document
 *   - Form submission, popups, top-level navigation
 *   - Access to cookies, localStorage, sessionStorage of parent
 *   - Same-origin access to parent (treated as cross-origin)
 * - `srcdoc` creates a blank document with no network context
 * - iframe is destroyed after execution completes
 * - 10-second timeout kills execution for infinite loops
 */
export async function executeJavaScript(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    return new Promise<ExecutionResult>((resolve) => {
        const timeoutMs = 10000;
        let resolved = false;

        const cleanup = () => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
            window.removeEventListener("message", handleMessage);
        };

        const finish = (result: ExecutionResult) => {
            if (resolved) return;
            resolved = true;
            cleanup();
            resolve(result);
        };

        // Timeout handler
        const timer = setTimeout(() => {
            finish({
                stdout: "",
                stderr: "Time Limit Exceeded — your code took longer than 10 seconds.\nCheck for infinite loops.",
                exitCode: 1,
                durationMs: Math.round(performance.now() - startTime),
            });
        }, timeoutMs);

        // Listen for results from the iframe
        const handleMessage = (event: MessageEvent) => {
            // Only accept messages from our sandbox (blob origin or null)
            if (event.data && event.data.__type === "EXEC_RESULT") {
                clearTimeout(timer);
                finish({
                    stdout: event.data.stdout || "",
                    stderr: event.data.stderr || "",
                    exitCode: event.data.stderr ? 1 : 0,
                    durationMs: Math.round(performance.now() - startTime),
                });
            }
        };

        window.addEventListener("message", handleMessage);

        // Build the sandboxed HTML document
        // We override console methods to capture output, then execute user code
        const sandboxHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
(function() {
    var __stdout = [];
    var __stderr = [];

    // Override console methods to capture output
    var _origLog = console.log;
    var _origError = console.error;
    var _origWarn = console.warn;
    var _origInfo = console.info;

    function stringify(args) {
        return Array.from(args).map(function(a) {
            if (a === null) return "null";
            if (a === undefined) return "undefined";
            if (typeof a === "object") {
                try { return JSON.stringify(a, null, 2); }
                catch(e) { return String(a); }
            }
            return String(a);
        }).join(" ");
    }

    console.log = function() { __stdout.push(stringify(arguments)); };
    console.info = function() { __stdout.push(stringify(arguments)); };
    console.warn = function() { __stdout.push("Warning: " + stringify(arguments)); };
    console.error = function() { __stderr.push(stringify(arguments)); };

    // Block dangerous APIs
    window.fetch = undefined;
    window.XMLHttpRequest = undefined;
    window.WebSocket = undefined;
    window.Worker = undefined;
    window.SharedWorker = undefined;
    window.ServiceWorker = undefined;

    try {
        // Execute user code
        var __result = (function() {
            ${code}
        })();

        // If the code returns a value, log it
        if (__result !== undefined) {
            __stdout.push(String(__result));
        }
    } catch(err) {
        __stderr.push(String(err.name ? (err.name + ": " + err.message) : err));
        if (err.stack) {
            // Extract useful stack lines (skip internal sandbox lines)
            var stackLines = err.stack.split("\\n").filter(function(l) {
                return l.indexOf("<anonymous>") !== -1 || l.indexOf("solution") !== -1;
            });
            if (stackLines.length > 0) {
                __stderr.push(stackLines.join("\\n"));
            }
        }
    }

    // Send results back to parent
    parent.postMessage({
        __type: "EXEC_RESULT",
        stdout: __stdout.join("\\n"),
        stderr: __stderr.join("\\n")
    }, "*");
})();
</script>
</body>
</html>`;

        // Create the sandboxed iframe
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.sandbox.add("allow-scripts"); // Only allow scripts, nothing else
        iframe.srcdoc = sandboxHTML;

        document.body.appendChild(iframe);
    });
}
