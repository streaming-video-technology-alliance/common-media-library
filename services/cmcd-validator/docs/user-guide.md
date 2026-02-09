# CMCD Validator User Guide

## Overview

The CMCD Validator is a verification proxy that helps you confirm CMCD data is being correctly applied by your media player. It works by sitting between the player and the CDN, recording all CMCD data it observes.

## Architecture

```
Player                          CMCD Validator                     CDN
  │                                │                                │
  │── GET /proxy/path?CMCD=... ──▶│                                │
  │                                │── record CMCD data ──▶ store   │
  │                                │── GET path ──────────────────▶│
  │◀── response ──────────────────│◀── response ──────────────────│
  │                                │                                │
  │── POST /cmcd/event ─────────▶│                                │
  │   (CMCD v2 event batch)       │── decode & store ──▶ store     │
  │◀── 201 Created ──────────────│                                │
  │                                │                                │
  │── GET /reports/:sid ─────────▶│                                │
  │◀── JSON reports ─────────────│◀── query ──────── store         │
```

## Setup

### 1. Start the Validator

```bash
npx @svta/cmcd-validator --upstream https://your-cdn.example.com --port 3000
```

### 2. Configure Your Player

Change the player's base URL from your CDN to the proxy:

**Before:**
```
https://your-cdn.example.com/stream/manifest.mpd
```

**After:**
```
http://localhost:3000/proxy/stream/manifest.mpd
```

For CMCD v2 event reporting, point the event target URL to:
```
http://localhost:3000/cmcd/event
```

### 3. Play Content

Play your content as normal. The proxy transparently forwards all requests while capturing CMCD data.

### 4. Inspect Reports

```bash
# View all captured reports
curl http://localhost:3000/reports | jq

# View reports for a specific session
curl http://localhost:3000/reports/YOUR_SESSION_ID | jq

# View only request reports
curl http://localhost:3000/reports?type=request | jq

# View only event reports
curl http://localhost:3000/reports?type=event | jq

# Clear all reports
curl -X DELETE http://localhost:3000/reports
```

## CMCD Transmission Modes

The validator supports all CMCD transmission modes:

### Query Parameter Mode

CMCD data is appended as a query parameter:

```
GET /proxy/segment.ts?CMCD=br%3D1000%2Csid%3D%22abc%22
```

### Header Mode

CMCD data is sent across four HTTP headers:

```
CMCD-Object: br=1000,d=4000
CMCD-Request: bl=21000,dl=18000
CMCD-Session: sid="abc",sf=d,st=v
CMCD-Status: bs
```

### Event Mode (CMCD v2)

Events are sent as POST requests with `Content-Type: text/cmcd`:

```
POST /cmcd/event
Content-Type: text/cmcd

e=ps,sid="abc",ts=1700000000000,sta=p
e=t,sid="abc",ts=1700000001000,bl=5000
```

## Manifest URL Rewriting

The proxy automatically rewrites absolute URLs in HLS and DASH manifests that match the upstream origin, so that subsequent requests from the player also route through the proxy. Relative URLs work without rewriting.

**Supported manifest types:**
- HLS: `.m3u8`, `.m3u` (detected by extension or `application/vnd.apple.mpegurl` content type)
- DASH: `.mpd` (detected by extension or `application/dash+xml` content type)

**What gets rewritten:**
- Absolute URLs matching the upstream origin (e.g., `https://cdn.example.com/path` → `/proxy/path`)
- Protocol-relative URLs matching the upstream host (e.g., `//cdn.example.com/path` → `/proxy/path`)

**Limitations:**
- Absolute URLs pointing to a different origin are not rewritten. Requests for those URLs will bypass the proxy.

## Report Format

Each report contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique report ID (UUID) |
| `sessionId` | string | CMCD session ID (`sid` key), or `"unknown"` |
| `type` | string | `"request"` or `"event"` |
| `timestamp` | string | ISO 8601 timestamp of when the report was recorded |
| `data` | object | Decoded CMCD data (all keys present in the request/event) |
| `requestUrl` | string | Upstream URL (request reports only) |
| `method` | string | HTTP method (request reports only) |
| `eventType` | string | CMCD event type (event reports only) |

## Storage

Reports are stored in a local SQLite database (via `better-sqlite3`). The default path is `./cmcd-reports.db`, configurable via `--db`. WAL mode is enabled for concurrent read performance.

Use `DELETE /reports` to clear all data.
