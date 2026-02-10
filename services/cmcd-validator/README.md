# @svta/cmcd-validator

A verification proxy for validating [Common Media Client Data (CMCD)](https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf). This service proxies media requests, captures attached CMCD data, collects CMCD v2 event reports, and provides an API for retrieving all recorded data by session.

## Quick Start

```bash
npx @svta/cmcd-validator
```

## Usage

```
cmcd-validator [options]

Options:
  -p, --port <port>       Server port (default: 2623)
      --db <path>         Database file path (default: ./cmcd-reports.db)
  -h, --help              Show help
```

### Example

```bash
# Start the validator
cmcd-validator --port 8080

# Point your player at a proxied stream URL:
#   http://localhost:8080/proxy?url=https%3A%2F%2Fcdn.example.com%2Fstream%2Fmaster.m3u8
#
# Then retrieve captured reports:
curl http://localhost:8080/reports
curl http://localhost:8080/reports/<session-id>
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/proxy?url=<encoded-url>` | Proxy a request, capturing CMCD data |
| `GET` | `/proxy/<absolute-url>` | Path-based proxy (used by DASH template resolution) |
| `POST` | `/cmcd/event/:id` | Collect CMCD v2 event reports for a target |
| `GET` | `/sessions` | List all session IDs |
| `GET` | `/reports` | List all reports |
| `GET` | `/reports/:sessionId` | List reports for a specific session |
| `DELETE` | `/reports` | Clear all reports |
| `GET` | `/health` | Health check |

### Query Parameters

- `GET /reports?type=request` — Filter by report type (`request` or `event`)
- `GET /reports?eventType=ps` — Filter by CMCD event type (e.g. `ps`, `t`, `bc`)
- `GET /reports?targetId=my-target` — Filter by target ID
- `GET /reports/:sessionId?type=event&eventType=t&targetId=my-target` — Combine session, type, event type, and target ID filters

### POST /cmcd/event/:id

Accepts CMCD v2 event reports in two formats:

**`Content-Type: text/cmcd`** (native `CmcdReporter` format):
```
e=ps,sid="session-1",ts=1700000000000,sta=p
e=t,sid="session-1",ts=1700000001000,bl=5000
```

**`Content-Type: application/json`**:
```json
[
  { "sid": "session-1", "e": "ps", "ts": 1700000000000 }
]
```

### GET /reports Response

```json
{
  "sessionId": "abc-123",
  "count": 5,
  "reports": [...],
  "summary": {
    "totalRequests": 3,
    "totalEvents": 2,
    "keysObserved": ["bl", "br", "e", "sid", "ts"]
  }
}
```

## How It Works

### Proxy Mode

1. Pass a stream URL to the proxy via query parameter: `/proxy?url=<encoded-url>`
2. The proxy extracts CMCD data from query parameters (`?CMCD=...`) or HTTP headers (`CMCD-Object`, `CMCD-Request`, `CMCD-Session`, `CMCD-Status`)
3. CMCD data is decoded using `@svta/cml-cmcd` and stored
4. The request is forwarded to the upstream origin (with CMCD stripped)
5. For manifest responses (HLS `.m3u8`, DASH `.mpd`), all URLs are resolved to absolute form and rewritten to route back through the proxy

The proxy supports any origin — no pre-configuration is needed. Simply encode the full upstream URL as a query parameter.

### DASH Template Support

DASH manifests using `<BaseURL>` and `$Variable$` template patterns are handled via a path-based fallback. The `<BaseURL>` is rewritten to `/proxy/<absolute-url>`, allowing DASH players to resolve template URLs relative to the proxied base. The path-based proxy route (`/proxy/<absolute-url>`) is also available for direct use.

### Event Mode

1. Players using CMCD v2 event reporting send POST requests to `/cmcd/event/:id`
2. The payload is decoded using `decodeCmcd()` from `@svta/cml-cmcd`
3. Events are stored with their session ID and event type

### Storage

Reports are stored in a local SQLite database (via Node.js built-in `node:sqlite`). The default location is `./cmcd-reports.db`, configurable via `--db`. Use `DELETE /reports` to clear all data.

## Development

```bash
# Build
npm run build -w services/cmcd-validator

# Run tests
npm test -w services/cmcd-validator
```
