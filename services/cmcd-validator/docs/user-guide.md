# CMCD Validator User Guide

## Overview

The CMCD Validator is a service that collects and stores CMCD v2 event reports from media players. It provides an API for retrieving and inspecting all recorded CMCD data by session.

## Architecture

```
Player                          CMCD Validator
  │                                │
  │── POST /cmcd/event/:id ──────▶│
  │   (CMCD v2 event batch)       │── decode & store ──▶ store
  │◀── 204 No Content ───────────│
  │                                │
  │── GET /reports/:sid ──────────▶│
  │◀── JSON reports ──────────────│◀── query ──────── store
```

## Setup

### 1. Start the Validator

```bash
npx @svta/cmcd-validator --port 3000
```

### 2. Configure Your Player

Point the CMCD v2 event target URL to:
```
http://localhost:3000/cmcd/event/:id
```

### 3. Play Content

Play your content as normal. The validator collects all CMCD event reports sent by the player.

### 4. Inspect Reports

```bash
# View all captured reports
curl http://localhost:3000/reports | jq

# View reports for a specific session
curl http://localhost:3000/reports/YOUR_SESSION_ID | jq

# View only event reports of a specific type
curl http://localhost:3000/reports?eventType=ps | jq

# Clear all reports
curl -X DELETE http://localhost:3000/reports
```

## Event Mode (CMCD v2)

Events are sent as POST requests with `Content-Type: text/cmcd`:

```
POST /cmcd/event/:id
Content-Type: text/cmcd

e=ps,sid="abc",ts=1700000000000,sta=p
e=t,sid="abc",ts=1700000001000,bl=5000
```

Or as JSON:

```
POST /cmcd/event/:id
Content-Type: application/json

[
  { "sid": "abc", "e": "ps", "ts": 1700000000000, "sta": "p" }
]
```

## Report Format

Each report contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique report ID (UUID) |
| `sessionId` | string | CMCD session ID (`sid` key), or `"unknown"` |
| `type` | string | `"event"` |
| `timestamp` | string | ISO 8601 timestamp of when the report was recorded |
| `data` | object | Decoded CMCD data (all keys present in the event) |
| `targetId` | string | Target ID from the URL path |
| `eventType` | string | CMCD event type (e.g., `ps`, `t`, `bc`) |

## Storage

Reports are stored in a local SQLite database (via Node.js built-in `node:sqlite`). The default path is `./cmcd-reports.db`, configurable via `--db`. WAL mode is enabled for concurrent read performance.

Use `DELETE /reports` to clear all data.
