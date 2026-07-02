# Content Steering Engine Design

**Date:** 2026-04-13
**Updated:** 2026-07-01 (reviewed against draft-05)
**Package:** `@svta/cml-content-steering`
**Specs:** [IETF draft-pantos-content-steering-05](https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05), [ETSI TS 103 998 V1.1.1](https://www.etsi.org/deliver/etsi_ts/103900_103999/103998/01.01.01_60/ts_103998v010101p.pdf)

## Summary

Add a three-layer content steering engine to `@svta/cml-content-steering`. The engine implements the IETF Pathway-based Content Steering spec's 7-step client algorithm in a CDP-agnostic way, with built-in HLS and DASH support via CDP descriptors. The three layers — pure functions, stateful processor, and I/O engine — are independently usable and testable.

## Architecture

Three layers, each building on the previous:

```
┌──────────────────────────────────────────────────┐
│  SteeringEngine (Layer 3)                        │
│  Owns fetch loop, timers, abort, lifecycle       │
│  Injected: fetch, schedule, getters, callbacks   │
├──────────────────────────────────────────────────┤
│  SteeringProcessor (Layer 2)                     │
│  Manages state: priority, penalties, clones, TTL │
│  Composes pure functions into 7-step algorithm   │
├──────────────────────────────────────────────────┤
│  Pure Functions (Layer 1)                        │
│  selectPathway, applyPathwayCloning,             │
│  applyUriReplacement, buildSteeringUrl,          │
│  parseSteeringResponse                           │
├──────────────────────────────────────────────────┤
│  Types, Validators, Constants (existing)         │
│  SteeringManifest, PathwayClone, UriReplacement  │
│  isValidSteeringManifest, isValidPathwayClone    │
│  DEFAULT_TTL, DEFAULT_PATHWAY_PENALTY            │
└──────────────────────────────────────────────────┘
```

Consumers choose their entry point:
- **Maximum control:** Import pure functions only, manage all state and I/O.
- **State management only:** Use `SteeringProcessor`, own the fetch loop and timers.
- **Turnkey:** Use `SteeringEngine`, provide injected dependencies.

All exports are tree-shakeable from a single entry point (`index.ts`), following CML conventions.

## Layer 1: Pure Functions

Stateless, side-effect-free functions implementing atomic spec operations.

### `selectPathway(priority: string[], penalized: Set<string>): string | undefined`

Implements spec Step 5 (Content Steering Evaluation). Returns the first non-penalized pathway from `priority`, or `undefined` if none available.

### `applyPathwayCloning(clones: PathwayClone[], getPathway: (id: string) => object | undefined): PathwayCloneResult[]`

Implements spec Section 5 (Pathway Cloning Algorithm). Resolves BASE-ID references via the `getPathway` lookup. Supports chained clones (a clone referencing an earlier clone as BASE-ID). Skips clones with unresolvable BASE-ID per spec.

### `applyUriReplacement(uri: string, replacement: UriReplacement, stableId?: string): string`

Implements the URI replacement algorithm from spec Section 5 step 4:
1. If a CDP-extension key (e.g., `PER-VARIANT-URIS`) contains a match for `stableId`, use that URI directly.
2. Otherwise, if `HOST` is present, replace the URI hostname.
3. If `PARAMS` is present, append query parameters sorted by UTF-8 key order, replacing existing params of the same name.

### `buildSteeringUrl(baseUrl: string, params: Record<string, string>): string`

Builds the steering server request URL from the base URL and query parameters. Handles the DASH `proxyServerURL` pattern (append with `?` or `&` depending on existing params).

### `parseSteeringResponse(status: number, body: string, headers: { get(name: string): string | null }): SteeringResponseResult`

Parses the HTTP response into a discriminated result:
- `{ type: 'success', manifest: SteeringManifest }` — HTTP 200, valid JSON, VERSION === 1
- `{ type: 'gone' }` — HTTP 410
- `{ type: 'throttled', retryAfter: number | null }` — HTTP 429 with optional Retry-After
- `{ type: 'error', status: number }` — non-2xx status (except 410/429)
- `{ type: 'invalid' }` — HTTP 200 but body is unparseable JSON or VERSION !== 1

This keeps HTTP status code interpretation (spec Step 7) and manifest validation in a pure function.

## Layer 2: SteeringProcessor

Composes pure functions into a stateful machine implementing the spec's 7-step client algorithm. No I/O, no timers.

### Constructor

```typescript
new SteeringProcessor(config?: SteeringProcessorConfig)

interface SteeringProcessorConfig {
  penalty?: number;    // default: DEFAULT_PATHWAY_PENALTY (300000ms)
  validate?: boolean;  // default: true
}
```

### Internal State

- `pathwayPriority: string[]` — current priority list from steering manifest
- `penalized: Map<string, number>` — pathway ID → penalty expiry timestamp
- `clones: Map<string, PathwayCloneResult>` — active pathway clones by ID
- `ttl: number` — current TTL in seconds (initialized to DEFAULT_TTL)
- `reloadUri: string | null` — current RELOAD-URI override
- `enabled: boolean` — whether steering is active (set to false on 410)
- `lastUpdated: number` — timestamp of last successful manifest processing

### Methods

**`processResponse(status: number, body: string, headers: { get(name: string): string | null }, now?: number): ProcessResult`**

Main entry point after a fetch. Calls `parseSteeringResponse`, then:
- **success:** Validates manifest if configured, updates priority/clones/ttl/reloadUri/lastUpdated. Returns `{ type: 'success', pathwayChanged: boolean, preferredPathway: string | undefined }`.
- **gone:** Sets `enabled = false`. Returns `{ type: 'gone' }`.
- **throttled:** Updates TTL from Retry-After if present. Returns `{ type: 'throttled', retryAfter: number }`.
- **invalid:** State unchanged (bad payload, keep previous priorities per spec Step 7C). Returns `{ type: 'error', status: 200 }`.
- **error:** State unchanged. Returns `{ type: 'error', status: number }`.

**`getPreferredPathway(now?: number): string | undefined`**

Prunes expired penalties, then calls `selectPathway` with current priority and penalized set. Spec Step 5.

**`penalize(pathwayId: string, now?: number): string | undefined`**

Adds the pathway to the penalized map with expiry at `now + penalty`. Returns the new preferred pathway. Spec Step 3 → Step 5.

**`shouldReload(now?: number): { reload: boolean, url: string | null, delay: number }`**

Checks if a reload is due based on `lastUpdated + (ttl * 1000)`. Returns false when `enabled` is false.

**`getReloadUrl(): string | null`**

Returns the current RELOAD-URI override, or null.

**`getClone(id: string): PathwayCloneResult | undefined`**

Lookup a pathway clone by ID.

**`reset(): void`**

Clears all state to initial defaults.

All time-dependent methods accept an optional `now` parameter (defaults to `performance.now()`) for deterministic testing.

## Layer 3: SteeringEngine

Wires the processor to real I/O via injected dependencies. Owns the fetch-parse-apply loop, timer scheduling, and lifecycle.

### Constructor

```typescript
new SteeringEngine(config: SteeringEngineConfig)

interface SteeringEngineConfig {
  // I/O
  fetch: (url: string, signal: AbortSignal) => Promise<SteeringResponse>;
  schedule: (fn: () => void, ms: number) => () => void;

  // Player-side state getters
  getThroughput: () => number | null;
  getCurrentPathway: () => string | string[] | null;

  // CDP descriptor
  cdp: CdpDescriptor;

  // Notifications
  onPathwayChange?: (pathway: string) => void;
  onManifestLoaded?: (manifest: SteeringManifest) => void;
  onError?: (error: SteeringError) => void;
  onStopped?: () => void;

  // Configuration (passed through to processor)
  penalty?: number;
  validate?: boolean;
}
```

### SteeringResponse

```typescript
interface SteeringResponse {
  status: number;
  body: string;
  headers: { get(name: string): string | null };
}
```

Minimal contract any HTTP client can produce.

### CdpDescriptor

```typescript
interface CdpDescriptor {
  formatName: string;
  formatThroughput?: (value: number) => string;
  formatPathway?: (value: string | string[]) => string;
  uriReplacementExtensions?: string[];
}
```

### Built-in CDP Descriptors

```typescript
const HLS_CDP: CdpDescriptor = {
  formatName: 'HLS',
  uriReplacementExtensions: ['PER-VARIANT-URIS', 'PER-RENDITION-URIS'],
};

const DASH_CDP: CdpDescriptor = {
  formatName: 'DASH',
  formatPathway: (v) => Array.isArray(v) ? v.join(',') : v,
  formatThroughput: (v) => String(Math.round(v / 1000)),
};
```

### Lifecycle Methods

**`start(url: string, pathways?: string[]): void`** — Begins the steering loop. Triggers initial fetch. Idempotent if called with same URL while running.

**`stop(): void`** — Cancels pending timer and in-flight fetch via AbortController. Processor state preserved.

**`penalize(pathwayId: string): void`** — Delegates to processor. Fires `onPathwayChange` if preferred pathway changes.

**`destroy(): void`** — Calls stop, resets processor, nullifies references. Not reusable after this.

### Fetch-Parse-Apply Loop

```
start(url)
  │
  ▼
[build URL] ── getThroughput(), getCurrentPathway()
  │              cdp.formatName → "_HLS_throughput", "_HLS_pathway"
  │              buildSteeringUrl() (pure function)
  ▼
[fetch(url, signal)] ── abortable via AbortController
  │
  ▼
[processor.processResponse(status, body, headers)]
  │
  ├─ success ──→ fire onManifestLoaded
  │              if pathwayChanged → fire onPathwayChange
  │              schedule(load, ttl * 1000)
  │
  ├─ gone ────→ fire onStopped
  │              no further requests (spec Step 7A)
  │
  ├─ throttled → schedule(load, retryAfter || ttl * 1000)
  │              (spec Step 7B)
  │
  └─ error ───→ fire onError
                 schedule(load, ttl * 1000)
                 (spec Step 7C)
```

### Abort Handling

- Internal AbortController created on construction
- Each fetch receives `controller.signal`
- `stop()` aborts and creates a fresh controller
- `destroy()` aborts without replacement
- Aborted fetches silently swallowed, not forwarded to `onError`

### Loading Guard

A `loading` boolean prevents concurrent fetches. If `start()` is called while a fetch is in-flight, the call is ignored.

## Types

### New Types

```typescript
// Engine I/O
interface SteeringResponse {
  status: number;
  body: string;
  headers: { get(name: string): string | null };
}

interface SteeringError {
  status?: number;
  message: string;
}

// CDP descriptor
interface CdpDescriptor {
  formatName: string;
  formatThroughput?: (value: number) => string;
  formatPathway?: (value: string | string[]) => string;
  uriReplacementExtensions?: string[];
}

// Processor results
type ProcessResult =
  | { type: 'success'; pathwayChanged: boolean; preferredPathway: string | undefined }
  | { type: 'gone' }
  | { type: 'throttled'; retryAfter: number }
  | { type: 'error'; status: number };

// Pure function results
type SteeringResponseResult =
  | { type: 'success'; manifest: SteeringManifest }
  | { type: 'gone' }
  | { type: 'throttled'; retryAfter: number | null }
  | { type: 'error'; status: number }
  | { type: 'invalid' };

// Pathway clone result
interface PathwayCloneResult {
  id: string;
  baseId: string;
  uriReplacement: UriReplacement;
}

// Config interfaces
interface SteeringProcessorConfig {
  penalty?: number;
  validate?: boolean;
}

interface SteeringEngineConfig {
  fetch: (url: string, signal: AbortSignal) => Promise<SteeringResponse>;
  schedule: (fn: () => void, ms: number) => () => void;
  getThroughput: () => number | null;
  getCurrentPathway: () => string | string[] | null;
  cdp: CdpDescriptor;
  onPathwayChange?: (pathway: string) => void;
  onManifestLoaded?: (manifest: SteeringManifest) => void;
  onError?: (error: SteeringError) => void;
  onStopped?: () => void;
  penalty?: number;
  validate?: boolean;
}
```

### Modified Existing Type

`UriReplacement` gains an index signature for CDP extensions:

```typescript
type UriReplacement = {
  HOST?: string;
  PARAMS?: Record<string, string>;
  [cdpExtension: string]: unknown;
};
```

All other existing types, validators, and constants remain unchanged.

## File Organization

```
src/
├── index.ts                        # barrel export (extended)
│
│   # Existing (unchanged)
├── DEFAULT_PATHWAY_PENALTY.ts
├── DEFAULT_TTL.ts
├── SteeringManifest.ts
├── PathwayClone.ts
├── UriReplacement.ts               # extended with index signature
├── isValidSteeringManifest.ts
├── isValidPathwayClone.ts
│
│   # New types
├── SteeringResponse.ts
├── SteeringError.ts
├── SteeringResponseResult.ts
├── ProcessResult.ts
├── PathwayCloneResult.ts
├── CdpDescriptor.ts
├── SteeringProcessorConfig.ts
├── SteeringEngineConfig.ts
│
│   # New pure functions
├── selectPathway.ts
├── applyPathwayCloning.ts
├── applyUriReplacement.ts
├── buildSteeringUrl.ts
├── parseSteeringResponse.ts
│
│   # New classes
├── SteeringProcessor.ts
├── SteeringEngine.ts
│
│   # Built-in CDP descriptors
├── HLS_CDP.ts
├── DASH_CDP.ts
```

## Testing Strategy

Node's built-in `node:test` runner with `node:assert`, following CML conventions. One test file per source file.

### Test Organization

```
test/
│   # Existing (unchanged)
├── MANIFEST.ts
├── PATHWAY_CLONE.ts
├── isValidPathwayClone.test.ts
├── isValidSteeringManifest.test.ts
│
│   # New test data
├── STEERING_RESPONSE.ts
├── MANIFESTS.ts
│
│   # Pure function tests
├── selectPathway.test.ts
├── applyPathwayCloning.test.ts
├── applyUriReplacement.test.ts
├── buildSteeringUrl.test.ts
├── parseSteeringResponse.test.ts
│
│   # Class tests
├── SteeringProcessor.test.ts
├── SteeringEngine.test.ts
```

### Pure Function Coverage

**selectPathway:**
- Returns first pathway when none penalized
- Skips penalized pathways, returns first non-penalized
- Returns undefined when all penalized
- Returns undefined for empty priority array
- Ignores penalized IDs not in priority list

**applyPathwayCloning:**
- Clones with HOST replacement
- Clones with PARAMS (sorted by key)
- PARAMS replaces existing query parameter of same name
- Chained clones (clone B references clone A as BASE-ID)
- Skips unresolvable BASE-ID
- Skips duplicate ID
- Empty array returns empty array
- Validates HOST is non-empty when present

**applyUriReplacement:**
- HOST only
- PARAMS only
- HOST + PARAMS combined
- Spec §8.2 worked example fixture: HOST + PARAMS applied to URIs with differing original hostnames, both rewritten to the clone host with the token param appended
- PER-VARIANT-URIS override takes precedence over HOST
- PER-RENDITION-URIS override takes precedence over HOST
- No matching stableId falls back to HOST
- Relative URI handling
- Preserves path, hash, credentials

**buildSteeringUrl:**
- Appends query params to clean URL
- Appends with & when URL has existing params
- Handles proxyServerURL pattern
- Omits null/undefined param values
- Encodes reserved characters

**parseSteeringResponse:**
- 200 with valid manifest → success
- 200 with invalid JSON → invalid
- 200 with wrong VERSION → invalid
- 410 → gone
- 429 with Retry-After → throttled with value
- 429 without Retry-After → throttled with null
- 404 → error with status
- 500 → error with status

### Processor Coverage

**processResponse:**
- Success: updates priority, ttl, reloadUri
- Success with PATHWAY-CLONES: clones registered
- Success with RELOAD-URI: getReloadUrl() returns updated URI
- Success with validation: rejects invalid manifest
- Gone: enabled = false, shouldReload returns false
- Throttled with Retry-After: updates TTL
- Error: state unchanged

**getPreferredPathway:**
- Returns first priority pathway
- Prunes expired penalties
- Returns undefined when all penalized

**penalize:**
- Adds to penalized set, returns new preferred
- Penalty expires after configured duration
- Unknown ID is no-op

**shouldReload:**
- True after TTL elapsed
- False before TTL elapsed
- False when disabled
- Correct delay calculation

**reset:**
- Clears all state

### Engine Coverage

Engine tests use stub implementations for fetch and schedule:

```typescript
const fetches: string[] = [];
const fetch = async (url, signal) => {
  fetches.push(url);
  return { status: 200, body: JSON.stringify(manifest), headers: new Map() };
};

const timers: { fn: () => void, ms: number }[] = [];
const schedule = (fn, ms) => {
  timers.push({ fn, ms });
  return () => { /* cancel */ };
};
```

**Lifecycle:**
- start triggers initial fetch
- start with same URL is idempotent
- start with different URL cancels previous
- stop cancels in-flight fetch
- stop cancels pending timer
- destroy stops and nullifies

**Fetch-parse-apply loop:**
- Success: fires onManifestLoaded, schedules at TTL
- Success with pathway change: fires onPathwayChange
- Gone: fires onStopped, no timer
- Throttled: schedules at Retry-After
- Error: fires onError, schedules at previous TTL
- Aborted: no callbacks fired

**Query parameters:**
- Calls getThroughput/getCurrentPathway per fetch
- Formats via CDP descriptor
- Omits when getters return null

**Penalization:**
- Fires onPathwayChange when preferred changes
- Silent when preferred unchanged

**CDP descriptors:**
- HLS_CDP formats correctly
- DASH_CDP comma-separates pathways, converts to kbps

**Loading guard:**
- No concurrent fetches
- Second fetch proceeds after first completes

## Spec Compliance Checklist

| Spec Requirement | Layer | Implementation |
|-----------------|-------|----------------|
| VERSION must be 1 | L1 | `parseSteeringResponse` rejects other versions |
| TTL polling | L3 | Engine schedules via `schedule` callback |
| RELOAD-URI | L2 | Processor tracks, engine uses for next fetch |
| PATHWAY-PRIORITY | L1+L2 | `selectPathway` + processor state |
| PATHWAY-CLONES | L1 | `applyPathwayCloning` + `applyUriReplacement` |
| URI-REPLACEMENT HOST | L1 | `applyUriReplacement` hostname substitution |
| URI-REPLACEMENT PARAMS | L1 | `applyUriReplacement` sorted key append |
| Chained clones | L1 | `applyPathwayCloning` resolves earlier clones |
| Step 3: Penalize | L2 | `processor.penalize()` |
| Step 4: Un-penalize | L2 | `getPreferredPathway` prunes expired |
| Step 5: Evaluate | L1+L2 | `selectPathway` via processor |
| Step 7A: HTTP 410 | L1+L3 | `parseSteeringResponse` → engine stops |
| Step 7B: HTTP 429 | L1+L2 | Retry-After → processor TTL update |
| Step 7C: Other errors | L3 | Engine retries at previous TTL |
| CDP query params | L3 | CDP descriptor formats, engine appends |
| HLS: _HLS_pathway/throughput | CDP | `HLS_CDP` descriptor |
| DASH: _DASH_pathway/throughput | CDP | `DASH_CDP` descriptor |
| HLS: PER-VARIANT-URIS | L1 | `applyUriReplacement` with stableId |
| HLS: PER-RENDITION-URIS | L1 | `applyUriReplacement` with stableId |
| DASH: multi-pathway reporting | CDP | `DASH_CDP.formatPathway` comma-separates |
| Ignore unrecognized keys | L1 | `parseSteeringResponse` passes through |

## Draft-05 Review Notes

Reviewed [draft-05](https://www.ietf.org/archive/id/draft-pantos-content-steering-05.txt) against draft-03 (2026-07-01). No normative changes to the client algorithm, manifest schema (VERSION still 1, TTL still integer seconds), HTTP status handling (410/429/other), pathway cloning, or steering query parameters. Section numbering is unchanged, so all spec references in this document remain valid. The design requires no structural changes.

Editorial changes worth recording:

- The protocol is formally renamed **Pathway-based Content Steering**; "Content Steering" remains an accepted interchangeable name. No API impact.
- New advisory: deployments should not combine multiple application-level steering methods or let Content Steering conflict with transport-layer steering. This is a player integration concern, out of scope for this library.
- Clarification: the server-side recommendation that the initial Steering Manifest agree with the Content Description's initial Pathway now explicitly means the first element of PATHWAY-PRIORITY. Server-side guidance only; no client change.
- New worked example for Pathway Cloning (§8.2): HOST + PARAMS replacement applied across pathway URIs whose original hostnames differ. Captured as an `applyUriReplacement` test fixture above.

## Full Export List

```
# Existing (unchanged)
DEFAULT_PATHWAY_PENALTY, DEFAULT_TTL
SteeringManifest, PathwayClone, UriReplacement
isValidSteeringManifest, isValidPathwayClone

# Pure functions
selectPathway, applyPathwayCloning, applyUriReplacement
buildSteeringUrl, parseSteeringResponse

# Classes
SteeringProcessor, SteeringEngine

# CDP descriptors
HLS_CDP, DASH_CDP

# Types
SteeringResponse, SteeringError, SteeringResponseResult
ProcessResult, PathwayCloneResult, CdpDescriptor
SteeringProcessorConfig, SteeringEngineConfig
```
