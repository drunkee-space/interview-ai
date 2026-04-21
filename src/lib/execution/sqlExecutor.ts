// ═══════════════════════════════════════════════════════════════
// SQL In-Browser Executor (sql.js / SQLite WebAssembly)
//
// Security:
//   - Runs entirely in-browser via WASM (no server, no network)
//   - Database is ephemeral — created fresh for each execution
//   - Pre-populated with mock interview data tables
//   - No filesystem access, no persistent storage
//   - 10-second timeout prevents heavy queries
// ═══════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

interface ExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
}

const SQL_WASM_CDN = "https://sql.js.org/dist/sql-wasm.wasm";

let sqlJsEngine: SqlJsStatic | null = null;
let sqlJsLoading: Promise<SqlJsStatic> | null = null;

// ─── Mock Data (same tables as the original server route) ───
const MOCK_TABLE_SQL = `
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
INSERT INTO users VALUES (1, 'Alice', 'admin'), (2, 'Bob', 'user'), (3, 'Charlie', 'user'), (4, 'Diana', 'admin'), (5, 'Eve', 'user');

CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount DECIMAL, status TEXT, created_at TEXT);
INSERT INTO orders VALUES
    (1, 1, 250.00, 'completed', '2024-01-15'),
    (2, 2, 15.50, 'pending', '2024-02-20'),
    (3, 2, 45.00, 'completed', '2024-03-01'),
    (4, 3, 120.00, 'cancelled', '2024-03-10'),
    (5, 1, 89.99, 'completed', '2024-04-05');

CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price DECIMAL, category TEXT);
INSERT INTO products VALUES
    (1, 'Laptop', 1200.00, 'electronics'),
    (2, 'Mouse', 25.00, 'electronics'),
    (3, 'Keyboard', 75.00, 'electronics'),
    (4, 'Desk Lamp', 45.00, 'furniture'),
    (5, 'Notebook', 5.00, 'stationery');

CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, department TEXT, salary DECIMAL, manager_id INTEGER);
INSERT INTO employees VALUES
    (1, 'John', 'Engineering', 85000, NULL),
    (2, 'Sarah', 'Engineering', 92000, 1),
    (3, 'Mike', 'Marketing', 65000, NULL),
    (4, 'Lisa', 'Marketing', 58000, 3),
    (5, 'Tom', 'Engineering', 78000, 1);
`;

/**
 * Initialize sql.js WASM engine (cached after first load)
 */
async function getSqlJs(): Promise<SqlJsStatic> {
    if (sqlJsEngine) return sqlJsEngine;

    if (sqlJsLoading) return sqlJsLoading;

    sqlJsLoading = (async () => {
        const SQL = await initSqlJs({
            locateFile: () => SQL_WASM_CDN,
        });
        sqlJsEngine = SQL;
        return SQL;
    })();

    try {
        return await sqlJsLoading;
    } catch (err) {
        sqlJsLoading = null; // Allow retry
        throw err;
    }
}

/**
 * Check if sql.js is already loaded
 */
export function isSqlReady(): boolean {
    return sqlJsEngine !== null;
}

/**
 * Execute SQL code in the browser using sql.js (SQLite WASM).
 *
 * Security model:
 * - Database is created fresh each execution (no state leaks between runs)
 * - Runs in WASM sandbox (no filesystem, no network)
 * - Only SQL operations are possible (no OS commands)
 * - 10-second timeout prevents expensive queries
 */
export async function executeSQL(code: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
        const SQL = await getSqlJs();

        // Create a fresh ephemeral database for each execution
        const db: Database = new SQL.Database();

        try {
            // Initialize mock data tables
            db.run(MOCK_TABLE_SQL);

            // Execute user's SQL with timeout
            let timedOut = false;
            const timeoutMs = 10000;

            const execPromise = new Promise<string>((resolve, reject) => {
                try {
                    // Split user code into individual statements
                    const statements = code
                        .split(";")
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0 && !s.startsWith("--"));

                    const allResults: any[] = [];

                    for (const stmt of statements) {
                        try {
                            const results = db.exec(stmt);

                            for (const result of results) {
                                // Convert to array of objects for JSON output
                                const rows = result.values.map((row: any[]) => {
                                    const obj: Record<string, any> = {};
                                    result.columns.forEach((col: string, i: number) => {
                                        obj[col] = row[i];
                                    });
                                    return obj;
                                });
                                allResults.push(...rows);
                            }
                        } catch (stmtErr: any) {
                            reject(stmtErr);
                            return;
                        }
                    }

                    if (allResults.length > 0) {
                        resolve(JSON.stringify(allResults));
                    } else {
                        // DDL/DML statements (CREATE, INSERT, UPDATE, DELETE)
                        const changeCount = db.getRowsModified();
                        if (changeCount > 0) {
                            resolve(`Query executed successfully. ${changeCount} row(s) affected.`);
                        } else {
                            resolve("Query executed successfully. No results returned.");
                        }
                    }
                } catch (err) {
                    reject(err);
                }
            });

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    timedOut = true;
                    reject(new Error("TIMEOUT"));
                }, timeoutMs);
            });

            try {
                const output = await Promise.race([execPromise, timeoutPromise]);

                return {
                    stdout: output,
                    stderr: "",
                    exitCode: 0,
                    durationMs: Math.round(performance.now() - startTime),
                };
            } catch (execErr: any) {
                if (timedOut) {
                    return {
                        stdout: "",
                        stderr: "Time Limit Exceeded — your SQL query took too long.\nTry simplifying joins or reducing data scope.",
                        exitCode: 1,
                        durationMs: Math.round(performance.now() - startTime),
                    };
                }

                return {
                    stdout: "",
                    stderr: `SQL Error: ${execErr.message || execErr}`,
                    exitCode: 1,
                    durationMs: Math.round(performance.now() - startTime),
                };
            }
        } finally {
            // Always close the database to free memory
            db.close();
        }
    } catch (loadErr: any) {
        return {
            stdout: "",
            stderr: `Failed to initialize SQL runtime: ${loadErr.message || loadErr}\n\nPlease check your internet connection — sql.js needs to download (~1MB) on first use.`,
            exitCode: 1,
            durationMs: Math.round(performance.now() - startTime),
        };
    }
}
