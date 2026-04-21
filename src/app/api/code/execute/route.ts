// ═══════════════════════════════════════════════════════════════
// POST /api/code/execute — Production Code Execution (Judge0 CE)
// 
// Security layers:
//   1. Authentication (Supabase session)
//   2. Rate limiting (sliding window per user)
//   3. Code sanitization (dangerous pattern detection)
//   4. Sandboxed execution (Judge0 CE containers)
//   5. Resource limits (CPU, memory, output size)
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { codeExecutionLimiter } from "@/lib/security/rateLimiter";
import { sanitizeCode } from "@/lib/security/codeSanitizer";

// ─── Judge0 CE Configuration ───
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";
const JUDGE0_BASE_URL = `https://${JUDGE0_API_HOST}`;

// Resource limits
const MAX_CPU_TIME = parseFloat(process.env.JUDGE0_MAX_CPU_TIME || "5");        // seconds
const MAX_MEMORY_KB = parseInt(process.env.JUDGE0_MAX_MEMORY_KB || "262144");   // 256MB
const MAX_OUTPUT_KB = parseInt(process.env.JUDGE0_MAX_OUTPUT_KB || "10240");    // 10KB output

// ─── Judge0 Language ID Mapping ───
const LANGUAGE_MAP: Record<string, { id: number; name: string }> = {
    python:     { id: 71, name: "Python 3.8.1" },
    javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
    typescript: { id: 74, name: "TypeScript 3.7.4" },
    java:       { id: 62, name: "Java (OpenJDK 13.0.1)" },
    c:          { id: 50, name: "C (GCC 9.2.0)" },
    "c++":      { id: 54, name: "C++ (GCC 9.2.0)" },
    cpp:        { id: 54, name: "C++ (GCC 9.2.0)" },
    sqlite3:    { id: 82, name: "SQL (SQLite 3.27.2)" },
};

// ─── SQL Mock Data (prepended to SQL queries) ───
const SQL_MOCK_TABLES = `
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
INSERT INTO users VALUES (1, 'Alice', 'admin'), (2, 'Bob', 'user'), (3, 'Charlie', 'user');

CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount DECIMAL);
INSERT INTO orders VALUES (1, 1, 250.00), (2, 2, 15.50), (3, 2, 45.00);

CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price DECIMAL);
INSERT INTO products VALUES (1, 'Laptop', 1200.00), (2, 'Mouse', 25.00), (3, 'Keyboard', 75.00);
`;

// ─── Piston API Fallback (when Judge0 key not configured) ───
const PISTON_API = "https://emkc.org/api/v2/piston/execute";
const PISTON_LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
    python:     { language: "python", version: "3.10.0" },
    javascript: { language: "javascript", version: "18.15.0" },
    typescript: { language: "typescript", version: "5.0.3" },
    java:       { language: "java", version: "15.0.2" },
    c:          { language: "c", version: "10.2.0" },
    cpp:        { language: "c++", version: "10.2.0" },
    "c++":      { language: "c++", version: "10.2.0" },
    sqlite3:    { language: "sqlite3", version: "3.36.0" },
};

// ═══════════════════════════════════════════════════════
// Helper: Base64 encode/decode
// ═══════════════════════════════════════════════════════
function toBase64(str: string): string {
    return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(b64: string): string {
    if (!b64) return "";
    try {
        return Buffer.from(b64, "base64").toString("utf-8");
    } catch {
        return b64;
    }
}

// ═══════════════════════════════════════════════════════
// Helper: Poll Judge0 for submission result
// ═══════════════════════════════════════════════════════
async function pollJudge0Result(token: string, maxAttempts = 15, intervalMs = 1000): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const res = await fetch(
            `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,status,time,memory,compile_output`,
            {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": JUDGE0_API_KEY,
                    "X-RapidAPI-Host": JUDGE0_API_HOST,
                },
            }
        );

        if (!res.ok) {
            throw new Error(`Judge0 poll failed: ${res.status}`);
        }

        const data = await res.json();
        
        // Status IDs: 1 = In Queue, 2 = Processing, 3+ = Done
        if (data.status && data.status.id >= 3) {
            return data;
        }

        // Wait before next poll with slight exponential backoff
        await new Promise(resolve => setTimeout(resolve, intervalMs * Math.min(attempt + 1, 3)));
    }

    throw new Error("Execution timed out — Judge0 did not return a result within the time limit");
}

// ═══════════════════════════════════════════════════════
// Helper: Execute via Judge0 CE
// ═══════════════════════════════════════════════════════
async function executeViaJudge0(languageId: number, code: string, stdin: string = "") {
    const startTime = Date.now();

    // Submit code
    const submitRes = await fetch(`${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=false`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": JUDGE0_API_KEY,
            "X-RapidAPI-Host": JUDGE0_API_HOST,
        },
        body: JSON.stringify({
            language_id: languageId,
            source_code: toBase64(code),
            stdin: stdin ? toBase64(stdin) : "",
            cpu_time_limit: MAX_CPU_TIME,
            memory_limit: MAX_MEMORY_KB,
            max_file_size: MAX_OUTPUT_KB,
        }),
    });

    if (!submitRes.ok) {
        const errText = await submitRes.text();
        console.error("[Code Execute] Judge0 submit error:", errText);
        throw new Error(`Execution service error: ${submitRes.status}`);
    }

    const { token } = await submitRes.json();
    if (!token) {
        throw new Error("No execution token received from Judge0");
    }

    // Poll for result
    const result = await pollJudge0Result(token);
    const durationMs = Date.now() - startTime;

    const stdout = fromBase64(result.stdout || "");
    const stderr = fromBase64(result.stderr || "");
    const compileOutput = fromBase64(result.compile_output || "");

    // Judge0 status codes:
    // 3 = Accepted (success)
    // 4 = Wrong Answer
    // 5 = Time Limit Exceeded
    // 6 = Compilation Error
    // 7-12 = Various runtime errors
    // 13 = Internal Error
    const statusId = result.status?.id || 0;
    const statusDescription = result.status?.description || "Unknown";

    let exitCode = 0;
    let finalStderr = stderr;

    if (statusId === 6) {
        // Compilation error
        finalStderr = compileOutput || stderr || "Compilation failed";
        exitCode = 1;
    } else if (statusId === 5) {
        finalStderr = "Time Limit Exceeded — your code took too long to execute. Check for infinite loops.";
        exitCode = 1;
    } else if (statusId === 7 || statusId === 8 || statusId === 9 || statusId === 10 || statusId === 11 || statusId === 12) {
        // Runtime errors
        finalStderr = `Runtime Error (${statusDescription}): ${stderr || compileOutput || "Unknown error"}`;
        exitCode = 1;
    } else if (statusId !== 3 && statusId !== 4) {
        exitCode = 1;
        finalStderr = `Execution error: ${statusDescription}`;
    }

    return {
        stdout,
        stderr: finalStderr,
        exitCode,
        durationMs,
        memoryKB: result.memory || 0,
        cpuTime: result.time ? parseFloat(result.time) : 0,
        statusDescription,
    };
}

// ═══════════════════════════════════════════════════════
// Helper: Execute via Piston (Fallback)
// ═══════════════════════════════════════════════════════
async function executeViaPiston(language: string, code: string) {
    const pistonLang = PISTON_LANGUAGE_MAP[language] || PISTON_LANGUAGE_MAP["javascript"];
    const startTime = Date.now();

    const pistonRes = await fetch(PISTON_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            language: pistonLang.language,
            version: pistonLang.version,
            files: [{ content: code }],
            stdin: "",
            args: [],
            compile_timeout: 10000,
            run_timeout: 10000,
            compile_memory_limit: -1,
            run_memory_limit: -1,
        }),
    });

    const durationMs = Date.now() - startTime;

    if (!pistonRes.ok) {
        if (pistonRes.status === 401 || pistonRes.status === 403) {
            return {
                stdout: "",
                stderr: "Execution failed: Public execution API limit reached or unauthorized.\n\nACTION REQUIRED: Please configure a valid JUDGE0_API_KEY in your .env.local file to enable secure production-grade sandboxed execution.",
                exitCode: 1,
                durationMs,
                memoryKB: 0,
                cpuTime: 0,
                statusDescription: "Configuration Error",
            };
        }
        throw new Error(`Piston API error: ${pistonRes.status}`);
    }

    const result = await pistonRes.json();
    const runResult = result.run || {};
    const compileResult = result.compile || {};

    if (compileResult.stderr) {
        return {
            stdout: compileResult.stdout || "",
            stderr: compileResult.stderr,
            exitCode: compileResult.code || 1,
            durationMs,
            memoryKB: 0,
            cpuTime: 0,
            statusDescription: "Compilation Error",
        };
    }

    return {
        stdout: runResult.stdout || "",
        stderr: runResult.stderr || "",
        exitCode: runResult.code ?? 0,
        durationMs,
        memoryKB: 0,
        cpuTime: 0,
        statusDescription: runResult.code === 0 ? "Accepted" : "Runtime Error",
    };
}

// ═══════════════════════════════════════════════════════
// POST Handler
// ═══════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
    try {
        // ─── 1. Authentication ───
        let userId = "anonymous";
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                userId = user.id;
            }
            // Allow anonymous for now (development), but log it
            if (!user) {
                console.warn("[Code Execute] Unauthenticated request — using rate limit by IP");
                const forwarded = request.headers.get("x-forwarded-for");
                const ip = forwarded?.split(",")[0]?.trim() || "unknown-ip";
                userId = `anon_${ip}`;
            }
        } catch (authErr) {
            console.warn("[Code Execute] Auth check failed, continuing with IP-based limiting:", authErr);
            const forwarded = request.headers.get("x-forwarded-for");
            const ip = forwarded?.split(",")[0]?.trim() || "unknown-ip";
            userId = `anon_${ip}`;
        }

        // ─── 2. Rate Limiting ───
        const rateResult = codeExecutionLimiter.check(userId);
        if (!rateResult.allowed) {
            return NextResponse.json(
                {
                    stdout: "",
                    stderr: `Rate limit exceeded. You have used all ${rateResult.total} executions in this window. Try again in ${Math.ceil(rateResult.resetInMs / 1000)} seconds.`,
                    exitCode: 1,
                    rateLimitRemaining: 0,
                    rateLimitTotal: rateResult.total,
                },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Limit": String(rateResult.total),
                        "X-RateLimit-Reset": String(Math.ceil(rateResult.resetInMs / 1000)),
                    },
                }
            );
        }

        // ─── 3. Parse Input ───
        const { language, code, stdin } = await request.json();

        if (!code || typeof code !== "string") {
            return NextResponse.json({ 
                stdout: "", 
                stderr: "Code is required", 
                exitCode: 1 
            }, { status: 400 });
        }

        const lang = (language || "javascript").toLowerCase();

        // ─── 4. Code Sanitization ───
        const sanitizeResult = sanitizeCode(code, lang);

        if (!sanitizeResult.safe) {
            const errorLines = [
                "⛔ Code execution blocked for safety reasons:",
                "",
                ...sanitizeResult.violations,
            ];

            if (sanitizeResult.warnings.length > 0) {
                errorLines.push("", ...sanitizeResult.warnings);
            }

            errorLines.push(
                "",
                "This is an interview environment. System-level operations,",
                "network access, and file manipulation are not permitted.",
                "Focus on algorithmic logic and data structures."
            );

            return NextResponse.json({
                stdout: "",
                stderr: errorLines.join("\n"),
                exitCode: 1,
                blocked: true,
                rateLimitRemaining: rateResult.remaining,
                rateLimitTotal: rateResult.total,
            });
        }

        // ─── 5. Prepare Code ───
        let finalCode = code;

        // SQL: Prepend mock tables
        if (lang === "sqlite3" || lang === "sql") {
            finalCode = `.mode json\n${SQL_MOCK_TABLES}\n-- USER CODE:\n${code}`;
        }

        // ─── 6. Execute Code ───
        let result;
        const useJudge0 = JUDGE0_API_KEY && JUDGE0_API_KEY.length > 10;

        if (useJudge0) {
            const judge0Lang = LANGUAGE_MAP[lang];
            if (!judge0Lang) {
                return NextResponse.json({
                    stdout: "",
                    stderr: `Unsupported language: ${lang}`,
                    exitCode: 1,
                }, { status: 400 });
            }
            result = await executeViaJudge0(judge0Lang.id, finalCode, stdin || "");
        } else {
            // Fallback to Piston if Judge0 key not configured
            console.warn("[Code Execute] Judge0 API key not configured. Falling back to Piston API.");
            result = await executeViaPiston(lang, finalCode);
        }

        // ─── 7. Build Response ───
        const responseBody: Record<string, any> = {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
            memoryKB: result.memoryKB,
            cpuTime: result.cpuTime,
            rateLimitRemaining: rateResult.remaining,
            rateLimitTotal: rateResult.total,
        };

        // Append sanitization warnings (non-blocking)
        if (sanitizeResult.warnings.length > 0) {
            responseBody.warnings = sanitizeResult.warnings;
        }

        return NextResponse.json(responseBody, {
            headers: {
                "X-RateLimit-Remaining": String(rateResult.remaining),
                "X-RateLimit-Limit": String(rateResult.total),
            },
        });
    } catch (error: any) {
        console.error("[Code Execute] Failed:", error);
        return NextResponse.json({
            stdout: "",
            stderr: error?.message || "Failed to execute code. Please try again.",
            exitCode: 1,
            durationMs: 0,
        }, { status: 500 });
    }
}
