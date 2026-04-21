// ═══════════════════════════════════════════════════════════
// Multi-Language Code Sanitizer — Production Safety Layer
// ═══════════════════════════════════════════════════════════

const MAX_CODE_SIZE_BYTES = 50 * 1024; // 50KB max source code

interface SanitizeResult {
    safe: boolean;
    violations: string[];
    warnings: string[];
}

interface DangerPattern {
    pattern: RegExp;
    message: string;
    severity: "block" | "warn";
}

// ─── Python Dangerous Patterns ───
const PYTHON_PATTERNS: DangerPattern[] = [
    { pattern: /\bos\.system\b/gi, message: "os.system() — shell command execution", severity: "block" },
    { pattern: /\bsubprocess\b/gi, message: "subprocess — process spawning", severity: "block" },
    { pattern: /\b__import__\b/gi, message: "__import__() — dynamic imports", severity: "block" },
    { pattern: /\bexec\s*\(/gi, message: "exec() — arbitrary code execution", severity: "warn" },
    { pattern: /\beval\s*\(/gi, message: "eval() — arbitrary expression evaluation", severity: "warn" },
    { pattern: /\bos\.popen\b/gi, message: "os.popen() — process spawning", severity: "block" },
    { pattern: /\bos\.exec\w*\b/gi, message: "os.exec*() — process replacement", severity: "block" },
    { pattern: /\bos\.spawn\w*\b/gi, message: "os.spawn*() — process spawning", severity: "block" },
    { pattern: /\bos\.fork\b/gi, message: "os.fork() — process forking", severity: "block" },
    { pattern: /\bsocket\b/gi, message: "socket — network access", severity: "block" },
    { pattern: /\bhttp\.client\b/gi, message: "http.client — network requests", severity: "block" },
    { pattern: /\burllib\b/gi, message: "urllib — network requests", severity: "block" },
    { pattern: /\brequests\b/gi, message: "requests — HTTP library", severity: "warn" },
    { pattern: /\bshutil\.rmtree\b/gi, message: "shutil.rmtree() — recursive deletion", severity: "block" },
    { pattern: /\bos\.remove\b/gi, message: "os.remove() — file deletion", severity: "block" },
    { pattern: /\bos\.unlink\b/gi, message: "os.unlink() — file deletion", severity: "block" },
    { pattern: /\bctypes\b/gi, message: "ctypes — C-level system access", severity: "block" },
];

// ─── JavaScript/Node.js Dangerous Patterns ───
const JAVASCRIPT_PATTERNS: DangerPattern[] = [
    { pattern: /\bchild_process\b/gi, message: "child_process — process spawning", severity: "block" },
    { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/gi, message: "require('fs') — file system access", severity: "block" },
    { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/gi, message: "require('net') — network access", severity: "block" },
    { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/gi, message: "require('http') — HTTP server/client", severity: "block" },
    { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/gi, message: "require('https') — HTTPS access", severity: "block" },
    { pattern: /\brequire\s*\(\s*['"]dgram['"]\s*\)/gi, message: "require('dgram') — UDP access", severity: "block" },
    { pattern: /\bprocess\.exit\b/gi, message: "process.exit() — process termination", severity: "warn" },
    { pattern: /\bprocess\.env\b/gi, message: "process.env — environment variable access", severity: "block" },
    { pattern: /\bprocess\.kill\b/gi, message: "process.kill() — signal sending", severity: "block" },
    { pattern: /\bnew\s+Function\s*\(/gi, message: "new Function() — dynamic code execution", severity: "warn" },
    { pattern: /\beval\s*\(/gi, message: "eval() — arbitrary code execution", severity: "warn" },
    { pattern: /\bfetch\s*\(/gi, message: "fetch() — network requests", severity: "block" },
    { pattern: /\bXMLHttpRequest\b/gi, message: "XMLHttpRequest — network requests", severity: "block" },
    { pattern: /\bWebSocket\b/gi, message: "WebSocket — network connections", severity: "block" },
    { pattern: /\bimport\s*\(\s*['"]fs['"]\s*\)/gi, message: "dynamic import('fs') — file system", severity: "block" },
];

// ─── C++ Dangerous Patterns ───
const CPP_PATTERNS: DangerPattern[] = [
    { pattern: /\bsystem\s*\(/gi, message: "system() — shell command execution", severity: "block" },
    { pattern: /\bexec\w*\s*\(/gi, message: "exec*() — process replacement", severity: "block" },
    { pattern: /\bfork\s*\(/gi, message: "fork() — process forking", severity: "block" },
    { pattern: /\bpopen\s*\(/gi, message: "popen() — process spawning", severity: "block" },
    { pattern: /\bsocket\s*\(/gi, message: "socket() — network access", severity: "block" },
    { pattern: /\bconnect\s*\(/gi, message: "connect() — network connection", severity: "warn" },
    { pattern: /\bbind\s*\(/gi, message: "bind() — port binding", severity: "warn" },
    { pattern: /\blisten\s*\(/gi, message: "listen() — port listening", severity: "warn" },
    { pattern: /#include\s*<\s*unistd\.h\s*>/gi, message: "#include <unistd.h> — POSIX API", severity: "warn" },
    { pattern: /#include\s*<\s*sys\/socket\.h\s*>/gi, message: "#include <sys/socket.h> — sockets", severity: "block" },
    { pattern: /#include\s*<\s*netinet/gi, message: "#include <netinet/*> — networking", severity: "block" },
    { pattern: /\bremove\s*\(/gi, message: "remove() — file deletion", severity: "warn" },
    { pattern: /\bunlink\s*\(/gi, message: "unlink() — file deletion", severity: "block" },
    { pattern: /\brmdir\s*\(/gi, message: "rmdir() — directory deletion", severity: "block" },
];

// ─── SQL Dangerous Patterns ───
const SQL_PATTERNS: DangerPattern[] = [
    { pattern: /\bDROP\b/gi, message: "DROP — destructive schema change", severity: "block" },
    { pattern: /\bDELETE\b/gi, message: "DELETE — data deletion", severity: "block" },
    { pattern: /\bALTER\b/gi, message: "ALTER — schema modification", severity: "block" },
    { pattern: /\bTRUNCATE\b/gi, message: "TRUNCATE — table truncation", severity: "block" },
    { pattern: /\bATTACH\b/gi, message: "ATTACH — database attachment", severity: "block" },
    { pattern: /\bDETACH\b/gi, message: "DETACH — database detachment", severity: "block" },
    { pattern: /\bUPDATE\b/gi, message: "UPDATE — data modification", severity: "warn" },
    { pattern: /\.import\b/gi, message: ".import — file import command", severity: "block" },
    { pattern: /\.shell\b/gi, message: ".shell — shell execution", severity: "block" },
    { pattern: /\.system\b/gi, message: ".system — system command", severity: "block" },
    { pattern: /\bLOAD_EXTENSION\b/gi, message: "LOAD_EXTENSION — extension loading", severity: "block" },
];

const PATTERN_MAP: Record<string, DangerPattern[]> = {
    python: PYTHON_PATTERNS,
    javascript: JAVASCRIPT_PATTERNS,
    typescript: JAVASCRIPT_PATTERNS, // Same engine
    "c++": CPP_PATTERNS,
    cpp: CPP_PATTERNS,
    sqlite3: SQL_PATTERNS,
    sql: SQL_PATTERNS,
};

/**
 * Sanitizes user-submitted code for dangerous patterns.
 * Returns whether the code is safe to execute and any violations/warnings.
 */
export function sanitizeCode(code: string, language: string): SanitizeResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    // ─── Size Check ───
    const sizeBytes = new TextEncoder().encode(code).length;
    if (sizeBytes > MAX_CODE_SIZE_BYTES) {
        return {
            safe: false,
            violations: [`Code exceeds maximum size limit (${Math.round(sizeBytes / 1024)}KB / ${MAX_CODE_SIZE_BYTES / 1024}KB max)`],
            warnings: [],
        };
    }

    // ─── Empty Code Check ───
    if (!code.trim()) {
        return {
            safe: false,
            violations: ["No code provided"],
            warnings: [],
        };
    }

    // ─── Language-Specific Pattern Checks ───
    const langKey = language.toLowerCase();
    const patterns = PATTERN_MAP[langKey];

    if (patterns) {
        for (const { pattern, message, severity } of patterns) {
            // Reset regex lastIndex for global patterns
            pattern.lastIndex = 0;
            if (pattern.test(code)) {
                if (severity === "block") {
                    violations.push(`🚫 Blocked: ${message}`);
                } else {
                    warnings.push(`⚠️ Warning: ${message}`);
                }
            }
        }
    }

    // ─── Universal Checks (all languages) ───
    // Infinite loop detection (basic heuristic)
    if (/while\s*\(\s*(?:true|1|True)\s*\)/.test(code) && !/break/.test(code)) {
        warnings.push("⚠️ Warning: Potential infinite loop detected (while(true) without break)");
    }

    // Fork bomb patterns
    if (/:\(\)\{\s*:\|:&\s*\};:/.test(code) || /\bforkbomb\b/i.test(code)) {
        violations.push("🚫 Blocked: Fork bomb pattern detected");
    }

    return {
        safe: violations.length === 0,
        violations,
        warnings,
    };
}

export { MAX_CODE_SIZE_BYTES };
export type { SanitizeResult };
