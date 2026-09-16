// Formatting logic backed by the `sql-formatter` npm package
// (https://www.npmjs.com/package/sql-formatter). The package is fairly
// heavy, so it is loaded lazily via dynamic import() — it is only pulled
// into a separate chunk when the user actually formats (or once the
// browser goes idle), never blocking first paint. Tool-specific.

import type { KeywordCase, LogicalOperatorNewline } from 'sql-formatter';

export type { KeywordCase, LogicalOperatorNewline };

// All dialects the installed `sql-formatter` package supports, excluding
// the `tsql` alias (identical to `transactsql`, kept out of the UI so each
// dialect appears once). Verified against
// node_modules/sql-formatter/dist/esm/sqlFormatter.js's `dialectNameMap`.
export type SqlDialect =
  | 'bigquery'
  | 'clickhouse'
  | 'db2'
  | 'db2i'
  | 'duckdb'
  | 'hive'
  | 'mariadb'
  | 'mysql'
  | 'n1ql'
  | 'plsql'
  | 'postgresql'
  | 'redshift'
  | 'singlestoredb'
  | 'snowflake'
  | 'spark'
  | 'sql'
  | 'sqlite'
  | 'tidb'
  | 'transactsql'
  | 'trino';

export interface DialectOption {
  value: SqlDialect;
  label: string;
}

export const DIALECT_OPTIONS: DialectOption[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'bigquery', label: 'GCP BigQuery' },
  { value: 'clickhouse', label: 'ClickHouse' },
  { value: 'db2', label: 'IBM DB2' },
  { value: 'db2i', label: 'IBM DB2i' },
  { value: 'duckdb', label: 'DuckDB' },
  { value: 'hive', label: 'Apache Hive' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'n1ql', label: 'Couchbase N1QL' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'redshift', label: 'Amazon Redshift' },
  { value: 'singlestoredb', label: 'SingleStoreDB' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'spark', label: 'Spark' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'tidb', label: 'TiDB' },
  { value: 'transactsql', label: 'Transact-SQL (SQL Server)' },
  { value: 'trino', label: 'Trino / Presto' },
];

export type IndentOption = '2' | '4' | 'tab';

export interface SqlFormatOptions {
  dialect: SqlDialect;
  keywordCase: KeywordCase;
  indent: IndentOption;
  linesBetweenQueries: number;
  logicalOperatorNewline: LogicalOperatorNewline;
}

type SqlFormatterModule = typeof import('sql-formatter');

let modulePromise: Promise<SqlFormatterModule> | null = null;

/** Loads the sql-formatter package on first use and caches the promise so
 * later calls (or a later explicit Format click) reuse the same chunk. */
function loadSqlFormatter(): Promise<SqlFormatterModule> {
  if (!modulePromise) {
    modulePromise = import('sql-formatter');
  }
  return modulePromise;
}

/** Warms the module cache during browser idle time. Safe to call multiple
 * times and safe to call from environments without requestIdleCallback. */
export function prefetchSqlFormatter(): void {
  void loadSqlFormatter();
}

function tabWidthFor(indent: IndentOption): number {
  return indent === '4' ? 4 : 2;
}

/**
 * Formats `input` using the sql-formatter package for the given dialect and
 * options. Throws (a plain Error or the package's ConfigError) on invalid
 * SQL or an invalid config — callers should catch and present a friendly
 * message rather than a raw stack trace.
 */
export async function formatSql(input: string, options: SqlFormatOptions): Promise<string> {
  const { format } = await loadSqlFormatter();
  return format(input, {
    language: options.dialect,
    tabWidth: tabWidthFor(options.indent),
    useTabs: options.indent === 'tab',
    keywordCase: options.keywordCase,
    linesBetweenQueries: options.linesBetweenQueries,
    logicalOperatorNewline: options.logicalOperatorNewline,
  });
}
