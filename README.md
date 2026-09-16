# SQL Formatter

Format, beautify, and minify SQL — fast, free, and 100% client-side. Your input is never sent over the network; everything runs in your browser.

**Live:** https://techshield-tech.github.io/sql-formatter/

Part of [MMOALL Developer Tools](https://mmoall.com/tools).

## Features

- Format (pretty-print) SQL using the [`sql-formatter`](https://www.npmjs.com/package/sql-formatter)
  library, across 20 dialects: Standard SQL, GCP BigQuery, ClickHouse, IBM
  DB2, IBM DB2i, DuckDB, Apache Hive, MariaDB, MySQL, Couchbase N1QL, Oracle
  PL/SQL, PostgreSQL, Amazon Redshift, SingleStoreDB, Snowflake, Spark,
  SQLite, TiDB, Transact-SQL (SQL Server), and Trino/Presto.
- Configurable keyword case (preserve / upper / lower), indent (2 spaces /
  4 spaces / tab), lines between queries, and logical operator (`AND`/`OR`)
  newline placement (before / after).
- Minify: collapses insignificant whitespace down to single spaces without
  touching the contents of string literals, quoted identifiers, or
  comments — with an option to strip comments entirely.
- Copy output to clipboard, clear input/output, or load a representative
  sample query.
- Clean, readable error messages on invalid SQL or an unsupported dialect
  feature — never a raw stack trace.
- The `sql-formatter` library is loaded lazily via dynamic `import()`, only
  once the user actually formats (or once the browser goes idle), so it
  never blocks first paint.
- Ctrl/Cmd+Enter formats the current input.
- Responsive down to 360px viewport width.

## Embedding

This tool can be embedded in an iframe, e.g. on mmoall.com. In embed mode it
renders only the tool itself (no header/footer) on a transparent background.

```html
<iframe
  id="sql-formatter"
  src="https://techshield-tech.github.io/sql-formatter/?embed=1&theme=dark"
  style="width: 100%; border: 0;"
  title="SQL Formatter"
></iframe>

<script>
  const iframe = document.getElementById('sql-formatter');

  // Resize the iframe to fit its content.
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (data && data.type === 'mmoall-tool:height' && data.slug === 'sql-formatter') {
      iframe.style.height = `${data.height}px`;
    }
    if (data && data.type === 'mmoall-tool:ready' && data.slug === 'sql-formatter') {
      // The tool has mounted and is ready.
    }
  });

  // Push a theme change into the iframe (only accepted from an allowed origin).
  iframe.contentWindow.postMessage({ type: 'mmoall-tool:theme', theme: 'dark' }, '*');
</script>
```

### Contract

- `?embed=1` in the URL renders only the tool (no chrome), transparent
  background.
- `?theme=light` / `?theme=dark` sets the initial theme; otherwise it follows
  `prefers-color-scheme`.
- The page listens for `window.postMessage({type:'mmoall-tool:theme', theme})`
  from the parent frame to change theme at runtime. Only messages whose
  `event.origin` is `https://mmoall.com`, `https://www.mmoall.com`, or
  `http://localhost:3000` are accepted.
- On mount (embed mode only), the page posts
  `{type:'mmoall-tool:ready', slug:'sql-formatter'}` to `window.parent`.
- Whenever its rendered height changes (embed mode only), the page posts
  `{type:'mmoall-tool:height', slug:'sql-formatter', height}` to
  `window.parent`.

## Local development

```bash
bun install
bun dev
```

Build for production:

```bash
bun run build
```

Deployment to GitHub Pages happens automatically via
`.github/workflows/deploy.yml` on every push to `main`.

## License

MIT — see [LICENSE](./LICENSE).
