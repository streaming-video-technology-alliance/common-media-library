# CMCD Validator User Guide

## Overview

The CMCD Validator is a verification proxy that helps you confirm CMCD data is being correctly applied by your media player. It works by sitting between the player and the CDN, recording all CMCD data it observes.

## Architecture

```
Player                          CMCD Validator                     CDN
  │                                │                                │
  │── GET /proxy?url=<cdn-url> ──▶│                                │
  │    + CMCD query/headers        │── record CMCD data ──▶ store   │
  │                                │── GET <cdn-url> ─────────────▶│
  │◀── response (URLs rewritten) ─│◀── response ──────────────────│
  │                                │                                │
  │── POST /cmcd/event/:id ──────▶│                                │
  │   (CMCD v2 event batch)       │── decode & store ──▶ store     │
  │◀── 204 No Content ───────────│                                │
  │                                │                                │
  │── GET /reports/:sid ──────────▶│                                │
  │◀── JSON reports ──────────────│◀── query ──────── store         │
```

## Setup

### 1. Start the Validator

```bash
npx @svta/cmcd-validator --port 3000
```

### 2. Configure Your Player

Pass the stream URL through the proxy using a URL-encoded query parameter:

**Before (direct CDN):**
```
https://your-cdn.example.com/stream/manifest.m3u8
```

**After (through proxy):**
```
http://localhost:3000/proxy?url=https%3A%2F%2Fyour-cdn.example.com%2Fstream%2Fmanifest.m3u8
```

The proxy will automatically rewrite all URLs inside the manifest to route subsequent requests (variant playlists, segments, init segments) back through the proxy.

For CMCD v2 event reporting, point the event target URL to:
```
http://localhost:3000/cmcd/event/:id
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
GET /proxy?url=https%3A%2F%2Fcdn.example.com%2Fsegment.ts&CMCD=br%3D1000%2Csid%3D%22abc%22
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
POST /cmcd/event/:id
Content-Type: text/cmcd

e=ps,sid="abc",ts=1700000000000,sta=p
e=t,sid="abc",ts=1700000001000,bl=5000
```

## Manifest URL Rewriting

The proxy automatically rewrites all URLs in HLS and DASH manifests so that subsequent requests from the player also route through the proxy.

**Supported manifest types:**
- HLS: `.m3u8`, `.m3u` (detected by extension or `application/vnd.apple.mpegurl` content type)
- DASH: `.mpd` (detected by extension or `application/dash+xml` content type)

**How it works:**

For **HLS** manifests, every URI (segment URLs, variant playlist URLs, `URI="..."` attributes) is resolved to an absolute URL and rewritten as:
```
/proxy?url=<url-encoded-absolute-url>
```

For **DASH** manifests:
- `<BaseURL>` elements are rewritten using path-based proxy URLs (`/proxy/<absolute-url>`) so that DASH players can resolve template patterns (`$Number$`, `$Time$`, etc.) relative to the base URL
- Absolute `http(s)://` URLs in attributes are rewritten using query-based proxy URLs

**Key advantages:**
- Works with any origin — no pre-configuration required
- Handles relative URLs correctly by resolving them against the manifest's own URL
- Supports cross-origin URLs (e.g., a manifest on one CDN referencing segments on another)

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

Reports are stored in a local SQLite database (via Node.js built-in `node:sqlite`). The default path is `./cmcd-reports.db`, configurable via `--db`. WAL mode is enabled for concurrent read performance.

Use `DELETE /reports` to clear all data.
