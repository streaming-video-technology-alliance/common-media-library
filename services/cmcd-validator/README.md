# @svta/cmcd-validator

A validation service for [Common Media Client Data (CMCD)](https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5004-final.pdf). This service collects CMCD v2 event reports and provides an API for retrieving all recorded data by session.

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

# Point your player's event target at:
#   http://localhost:8080/cmcd/event/my-target
#
# Then retrieve captured reports:
curl http://localhost:8080/reports
curl http://localhost:8080/reports/<session-id>
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cmcd/event/:id` | Collect CMCD v2 event reports for a target |
| `GET` | `/sessions` | List all session IDs |
| `GET` | `/reports` | List all reports |
| `GET` | `/reports/:sessionId` | List reports for a specific session |
| `DELETE` | `/reports` | Clear all reports |
| `GET` | `/health` | Health check |

### Query Parameters

- `GET /reports?type=event` — Filter by report type
- `GET /reports?eventType=ps` — Filter by CMCD event type (e.g. `ps`, `t`, `bc`)
- `GET /reports?targetId=my-target` — Filter by target ID
- `GET /reports/:sessionId?eventType=t&targetId=my-target` — Combine session, event type, and target ID filters

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
    "totalEvents": 5,
    "keysObserved": ["bl", "e", "sid", "ts"]
  }
}
```

## Storage

Reports are stored in a local SQLite database (via Node.js built-in `node:sqlite`). The default location is `./cmcd-reports.db`, configurable via `--db`. Use `DELETE /reports` to clear all data.

## Development

```bash
# Build
npm run build -w services/cmcd-validator

# Run tests
npm test -w services/cmcd-validator
```
