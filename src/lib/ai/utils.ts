// ═══════════════════════════════════════════════════════
// Utility helpers for the Gemini modules
// ═══════════════════════════════════════════════════════

/**
 * Simple UUID v4 fallback (no external dependency needed).
 * Uses crypto.randomUUID when available, otherwise manual generation.
 */
export function v4Fallback(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Manual UUID v4 generation
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
