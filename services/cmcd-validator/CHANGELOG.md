# Changelog

## 0.2.0

- **Breaking:** Replaced path-based proxy (`/proxy/*` with `--upstream`) with query-parameter-based proxy (`/proxy?url=<encoded-url>`)
- **Breaking:** Removed `--upstream` CLI parameter — the proxy now accepts any origin via the `url` query parameter
- Added path-based proxy fallback (`/proxy/<absolute-url>`) for DASH template resolution
- Manifest URL rewriting now resolves all URLs (relative and absolute) against the manifest's own URL
- HLS manifests: all URI lines and `URI="..."` attributes are rewritten as `/proxy?url=<encoded-absolute-url>`
- DASH manifests: `<BaseURL>` elements use path-based proxy URLs for template compatibility; absolute URLs in attributes use query-based proxy URLs

## 0.1.0

- Initial release
- HTTP proxy that captures CMCD data from query parameters and headers
- Event collection endpoint for CMCD v2 event reports (`text/cmcd` and `application/json`)
- Reports endpoint with session ID filtering and type filtering
- HLS and DASH manifest URL rewriting for transparent proxying
- SQLite storage for reports
- CLI with `--port` and `--db` options
