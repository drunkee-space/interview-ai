declare module "sql.js" {
    interface SqlJsStatic {
        Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
    }

    interface Database {
        run(sql: string, params?: any[]): Database;
        exec(sql: string, params?: any[]): QueryExecResult[];
        getRowsModified(): number;
        close(): void;
    }

    interface QueryExecResult {
        columns: string[];
        values: any[][];
    }

    interface SqlJsOptions {
        locateFile?: (file: string) => string;
    }

    export default function initSqlJs(options?: SqlJsOptions): Promise<SqlJsStatic>;
    export type { SqlJsStatic, Database, QueryExecResult };
}
