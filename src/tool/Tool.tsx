import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CopyButton, ErrorBox, Panel, Select, TextArea, Toolbar } from '../shell/ui';
import { describeSqlFormatError } from './sql-error';
import { minifySql } from './sql-minify';
import { SAMPLE_SQL } from './sample';
import {
  DIALECT_OPTIONS,
  formatSql,
  prefetchSqlFormatter,
  type IndentOption,
  type KeywordCase,
  type LogicalOperatorNewline,
  type SqlDialect,
} from './sql-format';

const INDENT_OPTIONS: { value: IndentOption; label: string }[] = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
];

const KEYWORD_CASE_OPTIONS: { value: KeywordCase; label: string }[] = [
  { value: 'preserve', label: 'Preserve case' },
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
];

const LOGICAL_OPERATOR_NEWLINE_OPTIONS: { value: LogicalOperatorNewline; label: string }[] = [
  { value: 'before', label: 'Newline before AND/OR' },
  { value: 'after', label: 'Newline after AND/OR' },
];

const MIN_LINES_BETWEEN_QUERIES = 0;
const MAX_LINES_BETWEEN_QUERIES = 10;

function clampLinesBetweenQueries(value: number): number {
  if (Number.isNaN(value)) return MIN_LINES_BETWEEN_QUERIES;
  return Math.min(MAX_LINES_BETWEEN_QUERIES, Math.max(MIN_LINES_BETWEEN_QUERIES, Math.trunc(value)));
}

function byteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  const [dialect, setDialect] = useState<SqlDialect>('sql');
  const [keywordCase, setKeywordCase] = useState<KeywordCase>('upper');
  const [indent, setIndent] = useState<IndentOption>('2');
  const [linesBetweenQueries, setLinesBetweenQueries] = useState(1);
  const [logicalOperatorNewline, setLogicalOperatorNewline] =
    useState<LogicalOperatorNewline>('before');
  const [stripComments, setStripComments] = useState(false);

  const inputBytes = useMemo(() => byteSize(input), [input]);
  const outputBytes = useMemo(() => byteSize(output), [output]);

  // Warm the sql-formatter chunk once the browser is idle, so the first
  // real Format click doesn't have to wait on the network/parse cost of
  // fetching it. This never blocks first paint.
  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(() => prefetchSqlFormatter());
      return () => window.cancelIdleCallback(handle);
    }
    const timeout = window.setTimeout(() => prefetchSqlFormatter(), 1000);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleFormat = useCallback(() => {
    if (input.trim() === '') {
      setOutput('');
      setError(null);
      return;
    }
    setIsFormatting(true);
    formatSql(input, { dialect, keywordCase, indent, linesBetweenQueries, logicalOperatorNewline })
      .then((result) => {
        setOutput(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(describeSqlFormatError(err));
      })
      .finally(() => {
        setIsFormatting(false);
      });
  }, [input, dialect, keywordCase, indent, linesBetweenQueries, logicalOperatorNewline]);

  const handleMinify = useCallback(() => {
    if (input.trim() === '') {
      setOutput('');
      setError(null);
      return;
    }
    try {
      setOutput(minifySql(input, { stripComments }));
      setError(null);
    } catch (err) {
      setError(describeSqlFormatError(err));
    }
  }, [input, stripComments]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handleFormat();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE_SQL);
    setOutput('');
    setError(null);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button variant="primary" onClick={handleFormat} disabled={isFormatting}>
          {isFormatting ? 'Formatting…' : 'Format'}
        </Button>
        <Button variant="secondary" onClick={handleMinify}>
          Minify
        </Button>
        <Button variant="ghost" onClick={handleLoadSample}>
          Load sample
        </Button>
        <Button variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      </Toolbar>

      <Toolbar>
        <Select
          aria-label="SQL dialect"
          value={dialect}
          onChange={(event) => setDialect(event.target.value as SqlDialect)}
          options={DIALECT_OPTIONS}
        />
        <Select
          aria-label="Keyword case"
          value={keywordCase}
          onChange={(event) => setKeywordCase(event.target.value as KeywordCase)}
          options={KEYWORD_CASE_OPTIONS}
        />
        <Select
          aria-label="Indent width"
          value={indent}
          onChange={(event) => setIndent(event.target.value as IndentOption)}
          options={INDENT_OPTIONS}
        />
        <Select
          aria-label="Logical operator newline placement"
          value={logicalOperatorNewline}
          onChange={(event) =>
            setLogicalOperatorNewline(event.target.value as LogicalOperatorNewline)
          }
          options={LOGICAL_OPERATOR_NEWLINE_OPTIONS}
        />
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-fg)]">
          Lines between queries
          <input
            type="number"
            inputMode="numeric"
            min={MIN_LINES_BETWEEN_QUERIES}
            max={MAX_LINES_BETWEEN_QUERIES}
            value={linesBetweenQueries}
            onChange={(event) =>
              setLinesBetweenQueries(clampLinesBetweenQueries(Number(event.target.value)))
            }
            className="w-16 rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] px-2 py-1.5 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-fg)]">
          <input
            type="checkbox"
            checked={stripComments}
            onChange={(event) => setStripComments(event.target.checked)}
          />
          Strip comments (Minify)
        </label>
      </Toolbar>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel
          title="Input"
          actions={<span className="text-xs text-[var(--color-muted)]">{inputBytes} bytes</span>}
        >
          <TextArea
            aria-label="SQL input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste SQL here… (Ctrl/Cmd+Enter to format)"
            className="min-h-[240px]"
          />
        </Panel>

        <Panel
          title="Output"
          actions={
            <>
              <span className="text-xs text-[var(--color-muted)]">{outputBytes} bytes</span>
              <CopyButton getText={() => output} />
            </>
          }
        >
          <TextArea
            aria-label="SQL output"
            value={output}
            readOnly
            placeholder="Formatted SQL will appear here…"
            className="min-h-[240px]"
          />
        </Panel>
      </div>
    </div>
  );
}
