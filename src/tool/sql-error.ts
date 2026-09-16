// Pure, framework-free helper that turns whatever formatSql() throws (a
// plain Error, the sql-formatter package's ConfigError, or an unexpected
// non-Error value) into a single, human-readable line — never a raw stack
// trace. Tool-specific.

/** Formats a caught format/minify error into a clean, displayable message. */
export function describeSqlFormatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // A couple of sql-formatter's own errors are multi-line (e.g. an
  // ambiguous-grammar diagnostic dump); keep just the first line so the UI
  // always shows a compact, readable message.
  const firstLine = message.split('\n')[0]?.trim();
  return firstLine && firstLine.length > 0 ? firstLine : 'Could not format this SQL.';
}
