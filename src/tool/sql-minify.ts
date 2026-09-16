// Pure, framework-free SQL minifier. Collapses insignificant whitespace
// down to single spaces (and tightens spacing around `, ; ( )`) while never
// touching the contents of string literals, quoted/bracketed identifiers,
// or (unless `stripComments` is set) comments — so it can never mangle a
// literal or silently merge two tokens together. Does not depend on the
// sql-formatter package; runs synchronously. Tool-specific.

export interface MinifyOptions {
  /** When true, comments are removed entirely instead of kept verbatim. */
  stripComments: boolean;
}

type SegmentKind = 'code' | 'literal' | 'comment';

interface Segment {
  kind: SegmentKind;
  text: string;
}

// Quote/bracket characters that open a literal, mapped to the character
// that closes it. Covers the quoting styles used across the dialects this
// tool supports: '...' string literals, "..." and `...` quoted
// identifiers (ANSI SQL / MySQL), and [...] bracketed identifiers
// (Transact-SQL).
const QUOTE_CLOSERS: Record<string, string> = {
  "'": "'",
  '"': '"',
  '`': '`',
  '[': ']',
};

/** Splits `input` into an ordered list of code / string-literal / comment segments. */
function tokenize(input: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  let codeStart = 0;

  const flushCode = (end: number): void => {
    if (end > codeStart) {
      segments.push({ kind: 'code', text: input.slice(codeStart, end) });
    }
  };

  while (i < input.length) {
    const ch = input[i];
    const next = input[i + 1];

    // Line comment: `-- ...` through end of line.
    if (ch === '-' && next === '-') {
      flushCode(i);
      let end = input.indexOf('\n', i);
      if (end === -1) end = input.length;
      segments.push({ kind: 'comment', text: input.slice(i, end) });
      i = end;
      codeStart = i;
      continue;
    }

    // Block comment: `/* ... */` (not nested).
    if (ch === '/' && next === '*') {
      flushCode(i);
      const closeAt = input.indexOf('*/', i + 2);
      const end = closeAt === -1 ? input.length : closeAt + 2;
      segments.push({ kind: 'comment', text: input.slice(i, end) });
      i = end;
      codeStart = i;
      continue;
    }

    // Quoted string / identifier literal.
    const closer = QUOTE_CLOSERS[ch];
    if (closer) {
      flushCode(i);
      let j = i + 1;
      while (j < input.length) {
        const c = input[j];
        // Backslash-escaped character (MySQL-style string escaping).
        // Brackets don't use backslash escaping, so skip this for them.
        if (closer !== ']' && c === '\\' && j + 1 < input.length) {
          j += 2;
          continue;
        }
        if (c === closer) {
          // A doubled closing character is an escaped literal quote, e.g.
          // '' inside '...' or ]] inside [...] — not the real end.
          if (input[j + 1] === closer) {
            j += 2;
            continue;
          }
          j += 1;
          break;
        }
        j += 1;
      }
      segments.push({ kind: 'literal', text: input.slice(i, j) });
      i = j;
      codeStart = i;
      continue;
    }

    i += 1;
  }

  flushCode(input.length);
  return segments;
}

// Collapses whitespace runs to a single space and removes whitespace
// directly touching `, ; ( )`. Only ever called on a whole "code" segment,
// so it can never reach into a literal or comment.
function collapseCodeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,;)])/g, '$1')
    .replace(/([(])\s+/g, '$1');
}

/**
 * Minifies `input` SQL by collapsing insignificant whitespace. String
 * literals, quoted identifiers, and (unless `options.stripComments` is
 * true) comments are copied through byte-for-byte.
 */
export function minifySql(input: string, options: MinifyOptions): string {
  const segments = tokenize(input);

  const parts: string[] = segments.map((segment) => {
    if (segment.kind === 'code') return collapseCodeWhitespace(segment.text);
    if (segment.kind === 'comment') return options.stripComments ? ' ' : segment.text;
    return segment.text;
  });

  // Drop purely-whitespace parts (collapsed code gaps, or comments that
  // were just stripped to a single placeholder space) from the very start
  // and end. This never touches a literal segment's own text.
  while (parts.length > 0 && segments[0].kind !== 'literal' && parts[0].trim() === '') {
    parts.shift();
    segments.shift();
  }
  while (
    parts.length > 0 &&
    segments[segments.length - 1].kind !== 'literal' &&
    parts[parts.length - 1].trim() === ''
  ) {
    parts.pop();
    segments.pop();
  }

  return parts.join('');
}
