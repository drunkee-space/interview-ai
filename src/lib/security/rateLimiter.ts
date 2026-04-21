// ═══════════════════════════════════════════════════════════
// Production Rate Limiter — Sliding Window per User
// ═══════════════════════════════════════════════════════════

interface RateLimitEntry {
    timestamps: number[];
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
    total: number;
}

const DEFAULT_WINDOW_MS = parseInt(process.env.CODE_EXEC_RATE_LIMIT_WINDOW_MS || "900000"); // 15 minutes
const DEFAULT_MAX_REQUESTS = parseInt(process.env.CODE_EXEC_RATE_LIMIT_MAX || "30");

class SlidingWindowRateLimiter {
    private store: Map<string, RateLimitEntry> = new Map();
    private windowMs: number;
    private maxRequests: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // Auto-cleanup stale entries every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if a request is allowed for a given key (userId).
     * If allowed, records the request timestamp.
     */
    check(key: string): RateLimitResult {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        let entry = this.store.get(key);
        if (!entry) {
            entry = { timestamps: [] };
            this.store.set(key, entry);
        }

        // Remove timestamps outside the sliding window
        entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

        if (entry.timestamps.length >= this.maxRequests) {
            // Rate limited — calculate when the oldest request in window expires
            const oldestInWindow = entry.timestamps[0];
            const resetInMs = oldestInWindow + this.windowMs - now;

            return {
                allowed: false,
                remaining: 0,
                resetInMs: Math.max(0, resetInMs),
                total: this.maxRequests,
            };
        }

        // Record this request
        entry.timestamps.push(now);

        return {
            allowed: true,
            remaining: this.maxRequests - entry.timestamps.length,
            resetInMs: this.windowMs,
            total: this.maxRequests,
        };
    }

    /**
     * Get current usage without recording a new request.
     */
    peek(key: string): RateLimitResult {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        const entry = this.store.get(key);
        if (!entry) {
            return {
                allowed: true,
                remaining: this.maxRequests,
                resetInMs: this.windowMs,
                total: this.maxRequests,
            };
        }

        const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
        const remaining = Math.max(0, this.maxRequests - validTimestamps.length);

        return {
            allowed: remaining > 0,
            remaining,
            resetInMs: this.windowMs,
            total: this.maxRequests,
        };
    }

    /**
     * Remove expired entries to prevent memory leaks.
     */
    private cleanup(): void {
        const now = Date.now();
        const windowStart = now - this.windowMs;

        for (const [key, entry] of this.store.entries()) {
            entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);
            if (entry.timestamps.length === 0) {
                this.store.delete(key);
            }
        }
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.store.clear();
    }
}

// Singleton instance — survives across API calls in the same server process
export const codeExecutionLimiter = new SlidingWindowRateLimiter();
export type { RateLimitResult };
