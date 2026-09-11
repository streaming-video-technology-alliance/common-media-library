---
status: draft
---

# RFC: Session API for CMCD version 2

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-09-09 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No |

## Summary

Add a second reporting API to `@svta/cml-cmcd`, next to `CmcdReporter`. The new API has three objects that match the three scopes of CTA-5004-B.

- A `CmcdSession` reports under one `sid` at a time. It owns the report targets, the requester, the interval timers, and the session totals. `rotate()` starts the next `sid` for every reporter in the session.
- A `CmcdSessionReporter` reports for one media player inside the session. Through it the player pushes its state, records events, decorates its requests, and records their responses.
- A target is one report destination. Targets are internal. Each target owns the state the spec scopes to a destination. That state is the sequence number, the `msd` gate, the `bs` flag, the `ec` buffer, and the delivery queue.

The reporter derives every key the spec defines in terms of state the reporter can observe. A player never computes `msd`, `bs`, `su`, `sn`, the starvation counters, or the response timing keys. State-change events come only from `update()`. A session can hold several reporters, one per media player, and the wire shows one `sid` and one sequence per target.

```ts
import { createCmcdSession, CmcdEventType } from '@svta/cml-cmcd'

const session = createCmcdSession({
	keys: ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'sf', 'st', 'su', 'nor'],
	eventTargets: [{ url: 'https://collector.example.com/cmcd' }],
})

const reporter = session.createReporter({ cid: 'movie-42' })

reporter.update({ sf: 'h', st: 'v' })
reporter.update({ sta: 'p', bl: 3200, mtp: 15000, pt: 12000 }) // emits e=ps with this snapshot

const req = reporter.decorate({ url: 'https://cdn.example.com/seg-1.m4s' }, { ot: 'v', d: 4000, br: 3000 })
const res = await fetch(req.url, { headers: req.headers })
const bytes = await res.arrayBuffer() // read the body first, so ttlb measures the last byte
reporter.recordResponse(req, { status: res.status, headers: res.headers }) // emits e=rr

reporter.recordError('MEDIA_ERR_NETWORK')
reporter.recordEvent(CmcdEventType.AD_BREAK_START)

session.dispose()
```

`CmcdReporter` does not change. It remains until players have migrated, and a later release marks it deprecated.

## Motivation

CMCD version 2 is much larger than version 1. It adds a second reporting mode, several targets with their own filters, 19 event types, and 32 new keys. It also adds rules that scope state to a session or to a destination. `CmcdReporter` encodes and sequences reports, but it leaves much of the spec to the player. The two largest adopters show the result. The table lists spec behavior that hls.js and dash.js implement by hand, read from their development branches on 2026-09-09.

| Spec behavior | hls.js | dash.js |
|---|---|---|
| `msd` from the `sta` starting to playing delta | not sent | `calculateMsd()` in `CmcdModel` |
| `bs` per destination since the last report | `starved` flag, cleared on the next video request | `wasPlaying()` and `onRebufferingStarted()` |
| `su` until the buffer is stable | `buffering` flag | set per request in `CmcdModel` |
| `dl` from buffer length and playback rate | computed per request | computed per request |
| `bsd` from rebuffering spans | not sent | `_rebufferingDuration` in `CmcdModel` |
| `ec` buffered per destination | fatal errors only, one event | `update({ ec })`, so the code stays on every later report |
| `cmsds` and `cmsdd` from response headers | not sent | base64 encoding in `CmcdController` |

The current API also has three traps that the two integrations fall into.

1. `update({ sta })` fires a `ps` event, and a following `recordEvent(PLAY_STATE, data)` is deduplicated. dash.js makes exactly that pair of calls. On `@svta/cml-cmcd` 2.4 or later its play-state events lose the `data` payload.
2. `recordResponseReceived()` attributes a response only through the provenance record on the decorated request. The hls.js loader passes `{ url }` from its loader context. The dash.js interceptor copies only the `cmcd` object from the decorated request. On 2.6 or later both players drop every `rr` event. Both pin older versions today.
3. Configuration is fixed at construction. Both players rebuild the reporter to apply a manifest setting, and the rebuild resets `sid` and every `sn`. dash.js has a comment about that reset.

Multi-player sessions are the case the current design fits worst. The spec expects one `sid` to span a movie and its interstitials, and the `bg` key is defined over "all players in a session". A second `CmcdReporter` with the same `sid` restarts every sequence number and sends `msd` again. The child-reporters proposal ([PR #398](https://github.com/streaming-video-technology-alliance/common-media-library/pull/398)) adds a root and child split to the current class. That proposal calls a session-first API "the right long-term shape" and set it aside for surface area.

Inside the package, `CmcdReporter` is one class with five jobs: session bookkeeping, report assembly, transform policy, delivery, and the public facade. Each feature since version 2.4 added pairwise interactions between those jobs. A refactor ([PR #422](https://github.com/streaming-video-technology-alliance/common-media-library/pull/422)) splits the class along those jobs while keeping every current semantic. This RFC asks a different question: which of those semantics would a design built for the version 2 spec keep at all? The answer keeps `sid` rotation as one call and removes the retention window, eviction, the provenance record, and the `customData` generics. It adds derived keys and a reporter per media player. The design record in [`plans/cmcd-session-api/`](../plans/cmcd-session-api/) has the comparison.

## Guide-level explanation

### One session, one reporter per media player

Create one session per playback session. The session generates a `sid` when the configuration has none. When the same playback needs a new `sid`, for example one supplied by the manifest, call `rotate(sid)`. Every reporter moves to the new `sid` and keeps its state (see [Changing the `sid`](#changing-the-sid)). When a new playback starts, create a new session. Requests that are still in flight keep reporting under the `sid` that issued them (see [Requests and responses](#requests-and-responses)).

```ts
const session = createCmcdSession({
	sid: 'session-abc-123',
	version: 1,             // wire version for request mode. Event mode is always version 2
	transmissionMode: 'headers',
	eventTargets: [
		{
			url: 'https://collector.example.com/cmcd',
			events: ['ps', 'e', 't', 'rr', 'bc'],
			keys: ['sid', 'cid', 'sta', 'br', 'bl', 'url', 'rc', 'ttfb', 'ttlb'],
			interval: 10,
			batchSize: 5,
			headers: { Authorization: 'Bearer token' },
		},
	],
})
```

Create one reporter per media player. The reporter for the primary player and the reporter for an interstitial player are the same type and use the same code.

```ts
const primary = session.createReporter({ cid: 'movie-42' })
const ad = session.createReporter({ cid: 'ad-7' })
```

Every reporter uses the session's `sid` and takes the next sequence number of each target. Dispose a reporter when its media player is destroyed.

The ownership in one picture. Targets belong to the session, and every reporter reports to every target.

```mermaid
flowchart TB
    subgraph session["CmcdSession, one sid at a time"]
        direction TB
        sdata["current sid, version, requester, timers, bg<br>per sid: msd, bsa, bsda, completed spans"]
        subgraph reporters["Reporters, one per media player"]
            direction LR
            primary["CmcdSessionReporter, cid movie-42<br>store, reported values, host, su, open span"]
            ad["CmcdSessionReporter, cid ad-7<br>store, reported values, host, su, open span"]
        end
        subgraph targets["Targets, one per destination"]
            direction LR
            req["request target<br>sn, msd gate, bsd cursor<br>bs and ec per reporter"]
            ev1["event target A<br>sn, msd gate, bsd cursor<br>bs and ec per reporter<br>queue, back-off, gone"]
            ev2["event target B<br>same state as A"]
        end
    end
    primary --> req
    primary --> ev1
    primary --> ev2
    ad --> req
    ad --> ev1
    ad --> ev2
```

### Push state, get events

`update()` stores playback state and derives the five state-change events from it: `sta` gives `ps`, `pr` gives `pr`, `cid` gives `c`, `bg` gives `b`, and `br` gives `bc`. The event fires when the value differs from the last value that reporter reported. Metrics pushed in the same call ride the event.

```ts
primary.update({ sta: 'r', bl: 0 })        // emits e=ps,sta=r,bl=(0)
primary.update({ sta: 'r', bl: 0 })        // emits nothing, no change
primary.update({ br: { v: 3000, a: 128 } }) // emits e=bc with br=(3000;v 128;a)
```

Interval reports and request reports read the same stored state, so push a metric when it changes. There is no second method for state-change events. The `recordEvent()` type accepts only the events that state cannot derive, so the compiler rejects `recordEvent(CmcdEventType.PLAY_STATE)`.

Values are plain. A key that the spec defines as an inner list with object-type parameters accepts a number, or one number per object type. `nor` accepts a string, an object with a `range`, or an array of them. The reporter builds the structured-field syntax.

### Discrete events and errors

`recordEvent()` covers the ad events, `sk`, `m`, `um`, `pe`, `pc`, and `ce`. A custom event requires `cen`. The `data` argument applies to that one report.

```ts
ad.recordEvent(CmcdEventType.AD_START)
ad.recordEvent(CmcdEventType.CUSTOM_EVENT, { cen: 'ad-quartile', 'com.example-quartile': 'q3' })
```

`recordError()` follows the spec's error rule. A target that lists `e` in its events receives an `e=e` report at once, with `ec`. Every other target, the request target included, buffers the code and attaches `ec` to the reporter's next report to that destination.

```ts
primary.recordError('MEDIA_ERR_NETWORK')
primary.recordError(['DRM_NOT_SUPPORTED', 'PLAYBACK_FAILED'])
```

### Requests and responses

`decorate()` returns a copy of the request with the CMCD query parameter or the CMCD headers applied, plus a `cmcd` record. The second argument is the data for this one request. An existing `CMCD` query parameter in the URL is replaced. A `nor` given as an absolute URL becomes a path relative to the request URL.

```ts
const req = primary.decorate(
	{ url: frag.url, headers: {} },
	{ ot: 'v', d: 4000, br: 3000, nor: next.url },
)
// req.url has the CMCD query parameter, or req.headers has the four CMCD headers
// req.cmcd.data is the report as sent, for logging or a player event
```

Hand the returned request back with the response. The reporter derives `url`, `rc`, `ts`, `ttfb`, and `ttlb`, and reads `cmsds` and `cmsdd` from the `CMSD-Static` and `CMSD-Dynamic` response headers.

```ts
primary.recordResponse(req, {
	status: res.status,
	headers: res.headers,
	timing: performance.getEntriesByName(req.url)[0],
})
```

`timing` is optional. Without it, the reporter computes `ts` and `ttlb` from the clock reading it recorded in `decorate()`. Call `recordResponse()` after the body is read, so `ttlb` measures the last byte. A request the player did not keep can still be recorded with `{ url }`. That response reports under the calling reporter's session.

A response can arrive after the session rotated to a new `sid`, or after the player disposed the session. The record on the request points to the `sid` state that issued it. The `rr` report has the old `sid` and that state's next sequence number. An ended `sid` state sends the report at once, because no batch will fill again.

The sequence for a response that arrives after the session rotated to a new `sid`:

```mermaid
sequenceDiagram
    participant Player as media player
    participant S as CmcdSession
    participant A as sid A state
    participant B as sid B state
    participant C as collector
    Player->>S: reporter.decorate(request, data)
    S->>A: sn 41
    S-->>Player: request with cmcd record, sid A
    Player->>Player: send the request to the CDN
    Player->>S: session.rotate(sid B)
    A->>C: POST the queued lines
    S->>B: fresh counters, gates, and queues
    Note over Player,C: the response for the old request arrives
    Player->>S: reporter.recordResponse(request, info)
    S-->>A: the record's origin is the sid A state
    A->>C: POST e=rr with sid A and sn 42, at once
```

### Interstitials

The spec covers multi-player sessions with `cid`, `ps`, and `nr`. The session API needs no other concept. When an interstitial renders on its own player, the primary player sets `nr` while it fetches content that the user does not see.

```ts
const ad = session.createReporter({ cid: hash(asset.uri) })
primary.update({ nr: true })
ad.update({ sta: 'p' })
// ...
ad.dispose()
primary.update({ nr: false })
```

Each interval tick emits one `t` line per live reporter, with the same `ts` and consecutive sequence numbers. Overlay and side-by-side interstitials report both players, and a collector tells them apart by `cid` and `nr`.

The wire during a sequential interstitial. Keys other than the ones shown are omitted.

```text
# The primary pauses and stops rendering while the ad player starts
cid="movie-42",e=ps,nr,sid="s1",sn=7,sta=a,ts=1764752400000,v=2
cid="ad-7",e=as,sid="s1",sn=8,ts=1764752400050,v=2
cid="ad-7",e=ps,sid="s1",sn=9,sta=p,ts=1764752400120,v=2

# One interval tick: one t line per live reporter, same ts, consecutive sn
cid="movie-42",e=t,nr,sid="s1",sn=10,sta=a,ts=1764752430000,v=2
cid="ad-7",e=t,sid="s1",sn=11,sta=p,ts=1764752430000,v=2

# The ad ends and its reporter is disposed, the primary renders again
cid="ad-7",e=ae,sid="s1",sn=12,ts=1764752445000,v=2
cid="movie-42",e=ps,sid="s1",sn=13,sta=p,ts=1764752445200,v=2
```

### Changing the `sid`

`rotate()` starts the next `sid` for the whole session. Every reporter keeps its store and its `cid`. Every target restarts its sequence at zero, the `msd` gate re-arms, and the session totals reset. The dedup baselines reset, so the first state each reporter pushes after the rotation emits under the new `sid`. Rotation itself emits nothing. The queued lines of the old `sid` are sent at once. A response to a request issued before the rotation still reports under the old `sid`.

```ts
session.rotate(manifestSid)   // omit the argument for a new UUID
```

Use `rotate()` for a new `sid` on the same playback. Use a new session for a new playback.

### Lifecycle

Creating a session arms its interval timers. `flush()` sends every queued batch now. `dispose()` flushes, stops the timers, and closes the session. Calls on a disposed reporter or session do nothing.

```ts
window.addEventListener('pagehide', () => session.flush())
// on player destroy
session.dispose()
```

## Reference-level explanation

### New exports

| Export | Kind |
|---|---|
| `createCmcdSession` | function |
| `CmcdSession`, `CmcdSessionConfig` | types |
| `CmcdSessionReporter`, `CmcdSessionReporterConfig`, `CmcdPlaybackData`, `CmcdMetric`, `CmcdNextObject` | types |
| `CmcdEventTargetConfig`, `CmcdRequester` | types |
| `CmcdRequestLike`, `CmcdDecoratedRequest`, `CmcdRequestRecord`, `CmcdResponseInfo`, `CmcdResourceTiming`, `CmcdResponseData` | types |
| `CmcdRequestTransform`, `CmcdEventTransform` | types |
| `CmcdDiscreteEventType` | type |
| `CMCD_EVENT_HOSTNAME`, `CmcdEventType.HOSTNAME` | constant, the missing `h` event |

### Configuration

```ts
type CmcdSessionConfig = {
	sid?: string                                // default: a new UUID
	version?: CmcdVersion                       // request mode only. default CMCD_V2
	transmissionMode?: CmcdTransmissionMode     // default CMCD_QUERY
	keys?: readonly CmcdKey[]                   // request mode allowlist. default: every key of the version
	headerMap?: Partial<CmcdHeaderMap>          // header shard per custom key
	transform?: CmcdRequestTransform
	eventTargets?: readonly CmcdEventTargetConfig[]
	requester?: CmcdRequester                   // default: fetch, POST, keepalive
	derive?: Partial<Record<'bg' | 'dl' | 'su', boolean>>  // observations the reporter may turn into defaults. default: all true
	onError?: (error: unknown) => void
}

type CmcdEventTargetConfig = {
	url: string
	events?: readonly CmcdEventType[]           // default ['ps', 'e', 't', 'rr']
	keys?: readonly CmcdKey[]                   // default: every event key
	interval?: number                           // seconds. default 30. 0 disables t
	batchSize?: number                          // default 1
	maxQueueSize?: number                       // lines. default 500
	headers?: Readonly<Record<string, string>>  // sent with every POST
	transform?: CmcdEventTransform
}

type CmcdSessionReporterConfig = {
	cid?: string
}
```

```ts
type CmcdRequester = (request: HttpRequest) => Promise<{ status: number }>
```

`requester` sends the event-mode POST requests. It receives an `HttpRequest` with `url`, `method`, `headers`, and `body`, and it resolves with the response status. The default is `fetch` with `keepalive`. It is the `requester` argument of `CmcdReporter`, with the same name and signature. The loader adapters that hls.js and dash.js inject today move over unchanged.

`derive` names the three observations the reporter may turn into a default value when the player has not supplied the key: `bg` from document visibility, `dl` from `bl` and `pr`, and `su` from the play state. Each is on by default, and `false` turns it off. The other derived keys are spec definitions and have no switch. A supplied value wins for all of them.

The defaults make `{ url }` a complete event target and `createCmcdSession()` a complete request-mode configuration. The spec's minimum recommended event set is `ps`, `e`, `t`, and `rr`. A configuration error throws at `createCmcdSession()` or `createReporter()`. The message names the parameter, the expected value, and the received value. The checks:

- a `sid` over 64 characters
- a `cid` over 128 characters
- an unknown key or a malformed custom key in a `keys` list
- an unknown event type
- a target without `url`
- an `interval` that is negative or not finite
- a `batchSize` or `maxQueueSize` that is not a finite positive integer, or a `batchSize` over `maxQueueSize`
- an event target with `version`

`configure()` replaces the request-mode settings `version`, `transmissionMode`, `keys`, and `headerMap` for the current and later `sid` states. It runs the same checks as creation, emits nothing, and resets no counter or gate. Event targets are fixed at creation. A manifest that supplies CMCD parameters is handled with `configure()`, then `rotate(sid)`, then `update({ cid })`.

### Objects

```ts
type CmcdSession = {
	readonly sid: string                        // the current sid
	createReporter(config?: CmcdSessionReporterConfig): CmcdSessionReporter
	rotate(sid?: string): void
	configure(settings: Pick<CmcdSessionConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void
	flush(): void
	dispose(): void
}

type CmcdSessionReporter = {
	readonly session: CmcdSession
	update(data: CmcdPlaybackData): void
	recordEvent(type: Exclude<CmcdDiscreteEventType, 'ce'>, data?: CmcdPlaybackData): void
	recordEvent(type: 'ce', data: CmcdPlaybackData & { cen: string }): void
	recordError(code: string | readonly string[], data?: CmcdPlaybackData): void
	decorate<R extends CmcdRequestLike>(request: R, data?: CmcdPlaybackData): CmcdDecoratedRequest<R>
	recordResponse(request: CmcdRequestLike, response: CmcdResponseInfo, data?: CmcdResponseData): void
	dispose(): void
}

type CmcdDiscreteEventType = 'as' | 'ae' | 'abs' | 'abe' | 'sk' | 'm' | 'um' | 'pe' | 'pc' | 'ce'
```

`CmcdDiscreteEventType` is `CmcdEventType` without the derived types `ps`, `pr`, `c`, `b`, `bc`, `t`, `rr`, `e`, and `h`.

### Rotation

`rotate(sid?)` starts a new `sid`, a new UUID when the argument is omitted. A `sid` equal to the current one is a no-op, and a `sid` over 64 characters throws.

- Resets: every target's `sn`, `msd` gate, `bs` flags, `ec` buffers, and `bsd` cursors. The session totals `bsa` and `bsda`, the pending `bsd` samples, and the supplied-value overrides reset too.
- Kept: every reporter with its store, `cid`, host, and `su` state, and the session `bg`. A startup measurement in progress carries over. When `msd` is not yet derived or supplied, the new `sid` keeps the start time, so the manifest-supplied `sid` flow still reports `msd`.
- Baselines: the dedup baselines of every reporter and of `bg` reset. After `rotate()`, the next `update()` emits every tracked field that has a value, even when no value changed. Rotation itself emits nothing.
- Stalls: a stall open at rotation is measured by the new `sid` from the rotation time, and the old `sid` drops its part. The new targets start with `bs` set, because the player is still rebuffering.
- Delivery: the queued lines of the old `sid` are sent at once. A target that a 410 silenced is active again, because the spec scopes the 410 to the current session.
- Late responses: a request issued before the rotation still reports under the old `sid`, with that `sid`'s next sequence number. The ended `sid` state keeps a copy of each reporter's store, so a late response reads the values at rotation and not the live store.

### Data

`CmcdPlaybackData` is the one input type for `update()`, per-event data, per-request data, and per-response data. Every member is optional.

| Members | Type |
|---|---|
| `sta`, `sf`, `st`, `ot` | the existing token unions |
| `cid`, `cs`, `h` | `string` |
| `bg`, `bs`, `nr`, `su` | `boolean` |
| `d`, `dfa`, `dl`, `ltc`, `msd`, `pr`, `pt`, `rtp` | `number` |
| `ab`, `bl`, `br`, `bsa`, `bsd`, `bsda`, `lab`, `lb`, `mtp`, `pb`, `tab`, `tb`, `tbl`, `tpb` | `CmcdMetric` |
| `nor` | `CmcdNextObject \| readonly CmcdNextObject[]` |
| `ts` | `number`, the time of the transition, not stored |
| custom keys | `CmcdCustomValue` |

```ts
type CmcdMetric = number | Readonly<Partial<Record<CmcdObjectType, number>>>
type CmcdNextObject = string | { readonly url: string; readonly range?: string }
```

`ec` is not a member. Errors go through `recordError()`. `sid`, `sn`, `v`, and `e` are reporter-owned and not members. The response keys are members of `CmcdResponseData` alone, the data type of `recordResponse()`. The reporter rounds values per the spec: integer keys to the nearest integer, and `bl`, `dl`, `mtp`, `rtp`, and `tbl` to the nearest 100. Pass raw values. `CmcdPlayerState` remains the token union for `sta`, not the payload type.

`update()` merges `data` into the reporter's store. A member set to `undefined` removes the key. `bg`, `msd`, `bsa`, `bsda`, and `bsd` are session facts. Pushing one of them through any reporter writes it on the session, and automatic tracking of that key stops for the rest of the session. A pushed `bsd` is not stored. It is appended as one pending sample per cause, and each destination receives it once.

### State-change events

After the merge, the reporter compares the five tracked fields with the values it last reported for that reporter. The order is `sta`, `pr`, `cid`, `bg`, `br`. Each changed field emits its event to every target that lists it, with the merged store as the report. Two spec clauses shape the rule.

- `pr` fires only while `sta` is `p`. A rate change while paused fires once on resume, if the rate still differs from the last reported rate.
- `bg` is compared on the session, and `b` follows the one-line-per-reporter rule of interval reports.

The `cid` given to `createReporter()` counts as reported, so creating a reporter emits no `c`. The first `sta` and the first `br` emit, because nothing was reported before. `b` on exit is a bare `e=b` with no `bg` key, as the event definition describes. The exit also removes `bg` from the session, so later reports omit it. The Transforms section shows the opt-in for `bg=?0`.

### Derived keys

A derived key is a key the reporter computes from state it observes. A derived default is a derived key the reporter fills only when the player has not supplied it. A value from `update()` wins for the rest of the session, and a value in per-call data wins for that report. The last column says how a supplied value interacts with each key.

| Key | Derived from | Scope | Supplied value |
|---|---|---|---|
| `sn`, `v`, `e` | the target's counter, the version, and the event type | target and report | ignored |
| `ts` | the clock at emission | report | wins for that report |
| `msd` | the first `sta` s to the next `sta` p, carried across `rotate()` while in progress | session, sent once per target | wins, stops tracking |
| `bs` | `sta` entering or remaining in r since the target's last report | target and reporter, cleared by the first report after the stall | wins for that report |
| `bsa`, `bsda` | completed stalls between `sta` transitions | session totals per cause | wins, stops tracking |
| `bsd` | one completed stall per entry, one entry per cause per report | pending samples per cause, one cursor per cause per target | appended as a sample, stops tracking |
| `su` | in s, k, or r, or no p since one | reporter | wins |
| `dl` | `bl` divided by `pr`, nearest 100 ms, only when `pr` is over 0 | reporter | wins |
| `h`, event `h` | the host of decorated request URLs | reporter | wins, stops tracking |
| `bg`, event `b` | `document.visibilityState`, when `derive.bg` is on | session | wins, stops tracking |
| `url`, `rc`, `ts`, `ttfb`, `ttlb` | request URL, status, timing | response | wins |
| `cmsds`, `cmsdd` | `CMSD-Static` and `CMSD-Dynamic` response headers | response | wins |

`bsa` counts the transitions into `r`. `bsda` and `bsd` count completed stalls only. A stall still open at `dispose()` is dropped. Automatic `bsa`, `bsd`, and `bsda` entries have no cause token. Each completed stall is reported to each destination once, on the next report to that destination, in order. A report carries at most one `bsd` value per cause, per spec item 14. A second stall of the same cause waits for the next report to that destination. The pending samples are capped at 100 per cause, and the oldest is dropped past the cap. When no destination can report `bsd`, no samples are kept.

`url` is the request URL without its `CMCD` parameter. `rc` is `0` when `status` is absent. `ts` for a response is the request start. `ttfb` is omitted when `responseStart` is absent, zero, or earlier than `startTime`. Resource Timing reports zero there for a cross-origin resource without `Timing-Allow-Origin`. `ttlb` is omitted when neither `duration` nor a usable `responseEnd` exists and no start time was recorded. `ttfbb` and `smrt` have no derivation and come only from `CmcdResponseData`.

The `sta` transitions and what each one derives. Transitions with no effect on a derived key are left out.

```mermaid
stateDiagram-v2
    direction LR
    d : d preloading
    s : s starting
    p : p playing
    k : k seeking
    r : r rebuffering
    a : a paused
    [*] --> d
    [*] --> s : records msdStart, su true
    d --> s : records msdStart, su true
    s --> p : msd from msdStart, su false
    p --> k : su true
    k --> p : su false
    p --> r : bsa increments, span opens, bs set on every target, su true
    r --> p : span closes into bsda and bsd, su false
    r --> a : span closes into bsda and bsd
    p --> a
    a --> p
```

### Reports and targets

Every report is assembled in a fixed order, and a later source wins:

1. the reporter's store
2. the session data
3. the per-call data
4. the target's per-reporter state
5. the derived defaults

The target's `transform` runs on a copy when one is configured, and `null` cancels the report for that target. The reporter then filters the keys, applies the spec rules, encodes, and only then commits. At the commit, `sn` advances, and the `msd` gate closes when the output kept `msd`. The `ec` buffer clears, `bs` clears unless the reporter is still rebuffering, and the `bsd` cursors move. A cancelled or failed report commits nothing.

The report path for one target:

```mermaid
flowchart LR
    subgraph assemble["Assemble, a later source wins"]
        direction TB
        s1["reporter store"] --> s2["session data"] --> s3["per-call data"] --> s4["target state for the reporter"] --> s5["derived defaults"]
    end
    assemble --> tq{"transform<br>configured?"}
    tq -- no --> prep["filter keys<br>apply the spec rules"]
    tq -- yes --> tr["copy the normalized report<br>run the transform"]
    tr -- null --> cancel["cancelled<br>nothing committed"]
    tr -- data --> restore["restore required keys<br>re-stamp sid, e, ts"] --> prep
    prep --> enc["encode"]
    enc -- throws --> fail["thrown to the caller<br>nothing committed"]
    enc -- line --> commit["commit<br>sn advances<br>msd gate closes if kept<br>ec clears, bs clears unless still in r<br>bsd cursors move"]
    commit --> out["event target: queue the line<br>request target: URL or headers"]
```

Filtering follows the target's `keys`. A key the current event requires is included whatever the list says:

- `e` and `ts` on every event report, and `v` in version 2
- `sta` on `ps`, `pr` on `pr`, `cid` on `c`, `bg` on `b`, `br` on `bc`, and `h` on `h`
- `ec` on `e`, `cen` on `ce`, and `url` on `rr`

The response keys appear only on `rr`. `cen` appears only on `ce`. `d` and `tpb` follow the object-type rule, and `ab`, `lab`, and `tab` yield to `br`, `lb`, and `tb`, as the encoder does today.

Each interval tick emits one `t` line per live reporter, in creation order, or one session-only line when the session has no reporter. Session-triggered events, `t` and `b`, follow that rule. Reporter-triggered events emit one line for that reporter. The first `t` report of a target comes one interval after creation. Today's `start()` sends one at once. The `ps` event for `sta` s already marks the start of a session.

### Requests

`decorate()` returns a new object. `url` has the `CMCD` query parameter in query mode. `headers` has the four `CMCD-` headers in header mode, and an empty shard is omitted. `cmcd` is the request record. Before it writes, `decorate()` removes an existing `CMCD` parameter and every `CMCD-` header from its copy, compared case-insensitively. A re-decorated request carries only the current report.

```ts
type CmcdRequestLike = {
	readonly url: string
	readonly headers?: Readonly<Record<string, string>>
}

type CmcdDecoratedRequest<R extends CmcdRequestLike> = Omit<R, 'url' | 'headers' | 'cmcd'> & {
	readonly url: string
	readonly headers?: Readonly<Record<string, string>>
	readonly cmcd: CmcdRequestRecord
}

type CmcdRequestRecord = {
	readonly sid: string
	readonly data: Readonly<Cmcd>   // the report as sent, after keys and transform
}
```

The record is a plain object. Spread and `Object.assign` keep it. JSON does not keep the link to the origin. A response for a request that crossed a JSON boundary reports under the calling reporter's session and its current `sid`. A request that the transform cancelled still receives a record, so its response is attributed.

There is no registry of sessions or of past `sid` values. The record is the key in a reporter-internal `WeakMap`. The value is the origin. It holds the `sid` state and the reporter that issued the request. It also holds the `cid` at that time, a copy of the per-request data, and the start time. `decorate()` captures the origin before the transform runs, so a transform that calls `rotate()` does not move the request to the new `sid`. `recordResponse()` on any reporter looks the record up and reports through that origin. The entry lives as long as the request object, and the origin keeps its `sid` state reachable, so nothing else tracks past `sid` values.

### Responses

```ts
type CmcdResponseInfo = {
	status?: number                              // rc. 0 when absent
	headers?: Headers | Readonly<Record<string, string>>
	timing?: CmcdResourceTiming
}

type CmcdResourceTiming = {
	startTime: number                            // DOMHighResTimeStamp
	responseStart?: number
	responseEnd?: number
	duration?: number
}

type CmcdResponseData = CmcdPlaybackData & {
	ttfb?: number                                // milliseconds from the request start
	ttlb?: number
	ttfbb?: number
	smrt?: string                                // base64, the request tracing header
	cmsds?: string                               // base64
	cmsdd?: string
	rc?: number
	url?: string
}
```

A `PerformanceResourceTiming` entry satisfies `CmcdResourceTiming`. The `rr` report is assembled in this order, and a later source wins:

1. the origin reporter's store, or the copy the ended `sid` state keeps
2. the session data of the origin `sid`
3. the `cid` at the time of `decorate()`
4. the copy of the per-request data taken in `decorate()`
5. the derived response keys
6. the `data` argument

It goes to every event target that lists `rr`, with the counters of the origin `sid`.

### Transforms

```ts
type CmcdRequestTransform = (data: Cmcd, request: Readonly<CmcdRequestLike>) => Cmcd | null
type CmcdEventTransform = (data: Cmcd, request: Readonly<CmcdRequestLike> | undefined) => Cmcd | null
```

The contract is the one the transforms RFC defined. The reporter normalizes the report to structured-field values before a configured transform runs. The transform then receives a copy of that normalized report. A token value in the copy is plain text. Every nested value, such as an inner list or a custom item, is copied too, parameters included. A transform cannot change the store or another target's report through this copy. In version 2 the copy matches the `Cmcd` type. In version 1 request mode, a metric with one value arrives as a number. `nor` arrives as one string, with `nrr` beside it. The reporter restores the required keys `sid`, `e`, and `ts` after the transform runs, and assigns `sn` after it. A transform that throws cancels that target's report. The error is thrown to the caller after every other target has been processed. In the request-mode transform, `request` is the request the player passed to `decorate()`, before decoration. In an event transform for `rr`, `request` is the decorated request passed to `recordResponse()`. Read player fields through a cast or bracket access.

A transform may call `rotate()`. The report it runs in and the request origin stay with the `sid` state that was current when the call began. The remaining targets of that emission do too. The rotation applies to every later call.

A transform is also the opt-in for a collector that expects `bg=?0` on the exit `b` report. A target that lists `b` always receives `bg` when it is true. An absent `bg` on `e=b` therefore means exit. The encoder writes an explicit `bg: false` on `e=b` as `?0`.

```ts
const legacyCollector: CmcdEventTargetConfig = {
	url: 'https://legacy-collector.example.com/cmcd',
	transform: (data) => data.e === 'b' && !('bg' in data) ? { ...data, bg: false } : data,
}
```

### Delivery

Each event target queues encoded lines. It sends a batch when the queue reaches `batchSize`, on `flush()`, on `dispose()`, or at once for a late `rr` report after dispose. A batch is one POST with content type `application/cmcd`, the lines joined by a line feed, no trailing line feed, and the target's `headers`. The default requester is `fetch` with `keepalive` set when the body is under 64 KB, so a `flush()` on `pagehide` completes. A drain requested by `flush()`, `rotate()`, `dispose()`, or a late `rr` while a send is in flight is kept. The target continues draining when the send settles, until the queue is empty.

| Response | Action |
|---|---|
| 2xx | done, back-off resets |
| 410 | the target sends nothing else for this session |
| 429, 5xx, or a requester rejection | the batch returns to the front of the queue, and the target retries after a back-off |
| other 4xx | the batch is dropped, back-off resets |

The back-off starts at one second and doubles to a cap of 60 seconds. New lines keep queueing during the back-off and go out with the retry, which is the aggregation the spec recommends for 429. After `dispose()`, a target stops retrying when a retry at the 60 second step fails. When a queue exceeds `maxQueueSize`, the oldest lines are dropped.

The delivery states of one event target:

```mermaid
stateDiagram-v2
    [*] --> queueing
    queueing --> sending : batchSize reached, flush, dispose, or a late rr after dispose
    sending --> queueing : 2xx, back-off resets
    sending --> queueing : other 4xx, batch dropped
    sending --> gone : 410
    sending --> backingOff : 429, 5xx, or a requester rejection, batch back to the front
    backingOff --> sending : timer fires, 1 s doubling to 60 s, or flush
    backingOff --> gone : after dispose, the 60 s retry fails
    gone --> [*]
    note right of queueing : lines past maxQueueSize drop from the front
    note right of backingOff : new lines keep queueing and join the retry
```

### Errors

Runtime data never throws. An unknown or empty value is omitted, as the spec requires. A value the structured-field encoder cannot serialize throws at the call that produced it, and nothing is committed. `createReporter()` on a disposed session throws. Every other call on a disposed reporter or session is a no-op.

`onError` receives the errors that have no caller. Those are a transform or encoding failure on an interval tick, and a requester that still fails after the back-off cap. Without `onError`, those errors are thrown from the timer callback, as today. In both paths the error is an `Error`. Its message names the target URL and the stage, one of transform, encode, or send. Its `cause` is the requester's error when one exists.

### Bundle and performance

The numbers below are measured. The design record minified one entry of the built package at a time, on 2026-09-10. The `CmcdReporter` column is its own entry, and the session column is the `createCmcdSession` entry.

| Measure | `CmcdReporter` today | This API, measured |
|---|---|---|
| Minified | 18.7 KB | 26.4 KB |
| Minified with gzip | 7.1 KB | 8.9 KB |
| Objects per report | 1, plus copies when a transform runs | 1, plus copies when a transform runs |

The session API is the larger of the two. It adds event-mode delivery, rotation, responses, and transforms, which `CmcdReporter` does not have. The retention ledger, the eviction pass, the dirty set, and the provenance encoding go away. The derivation code and the key table arrive. A player that imports only `createCmcdSession` does not bundle `CmcdReporter`. Event-mode delivery is bundled whenever the session API is, because the configuration is data.

### Migration from `CmcdReporter`

| `CmcdReporter` | Session API |
|---|---|
| `new CmcdReporter(config, requester)` | `createCmcdSession({ ...config, requester })` and `session.createReporter({ cid })` |
| `enabledKeys` | `keys` |
| `customHeaderMap` | `headerMap` |
| `sessionRetention`, `CMCD_REQUEST_PROVENANCE`, the `C` type parameter | removed |
| `update(data)` | `reporter.update(data)` with plain values |
| `update({ sid })` | `session.rotate(sid)` |
| the rebuild on manifest parameters | `session.configure(settings)`, then `session.rotate(sid)` and `reporter.update({ cid })` |
| `recordEvent(PLAY_STATE, data)` and the other state events | `reporter.update(data)` |
| `recordEvent(ERROR, { ec })` | `reporter.recordError(codes)` |
| `createRequestReport(request, data)` | `reporter.decorate(request, data)` |
| `recordResponseReceived(response, data)` | `reporter.recordResponse(req, info, data)` |
| `start()` | creation |
| `stop(true)` | `session.dispose()` |
| `flush()` | `session.flush()` |
| `createChildReporter()` (proposed) | `session.createReporter()` |

A sketch of the hls.js change in `CMCDController`:

- create the session and one reporter on `MANIFEST_LOADING`
- delete the `starved` and `buffering` flags and the `dl` arithmetic
- keep the decorated request on the loader wrapper, so `onSuccess` can pass it to `recordResponse()`
- create one reporter per interstitial asset, and set `nr` on the primary at asset start and clear it at primary resume

The dash.js change deletes `calculateMsd()`, the rebuffer tracking, and the `ec` persistence. The rebuild on manifest parameters becomes `configure()`, `rotate()`, and `update({ cid })`. It passes the decorated request through its interceptors.

## Drawbacks

- **Two reporting APIs in one package.** Until `CmcdReporter` is removed, both need documentation and tests. Adopters must choose.
- **Two objects in the simplest integration.** A request-only player still creates a session and a reporter.
- **One `t` line per reporter changes the wire during interstitials.** A collector that expected one interval line per `sid` sees two while an interstitial reporter exists.
- **A DOM side effect.** The session listens to `visibilitychange` when a document exists. `derive: { bg: false }` turns that off.
- **Derived defaults are assumptions.** `dl` from `bl` and `pr`, and `su` from the play state, match what hls.js and dash.js compute today. The spec words `dl` as a possible equivalence only.
- **Exact attribution needs the returned request.** A player that keeps only the URL gets current-session attribution for late responses.
- **In-flight requests keep their `sid` state reachable.** There is no retention knob. Memory is bounded by the requests the player keeps. An ended `sid` state also holds one copy of each reporter's store, taken at rotation.
- **Event-mode code is always bundled** with the session API, because targets are configuration objects. `CmcdReporter` has the same property today. The factory-function alternative in Rationale would improve on both.
- **Wire differences from `CmcdReporter`.** The first `t` report comes after one interval. `ec` no longer persists across reports. `bs` is per destination. The exit `b` report has no `bg` key, and `bg=?0` needs a transform.

## Rationale and alternatives

- **Refactor in place ([PR #422](https://github.com/streaming-video-technology-alliance/common-media-library/pull/422)).** Keeps the public API and every 2.6 semantic. It organizes the retention ledger, eviction, dirty tracking, and provenance into units, and it keeps them. This RFC removes them and keeps rotation as one call on the session. The design record compares the two.
- **A new session object for every `sid`.** The first draft's rule. It made a manifest-supplied `sid` expensive. The player had to dispose the session, create a new one with new reporters, swap every reference, and push the whole store again. `rotate()` keeps every object and moves the `sid`-scoped state to a fresh internal object. The change is one call, and late responses still find their `sid`.
- **One object that is both the session and the primary reporter.** One fewer line in the common case. It recreates the root and child asymmetry of the child-reporters proposal, where a child cannot do what the root does.
- **An explicit `activate()` for interval reports.** The child-reporters proposal's answer. It needs two calls in the interstitials controller and gives wrong data when a teardown skips the return call. One line per live reporter needs no call and loses no reporter.
- **A presenting-reporter rule for one interval line.** The first draft of this design used the most recently updated reporter without `nr`. Overlay and side-by-side interstitials render both players, so the rule flips on every metric push.
- **The provenance record and the retention ledger (2.6.0).** Exact attribution for every request, including undecorated ones, and it survives JSON with a bridge. Its cost is the ledger, the eviction pass, a symbol on `customData`, and a contract that neither adopter meets today.
- **Attribution from the wire.** Parse the `sid` back out of the `CMCD` query parameter or the `CMCD-Session` header. It works with a URL alone and survives every boundary. It costs a decode per response, it fails in header mode without the headers, and it cannot attribute a cancelled or undecorated request. It remains possible as a later fallback.
- **A pull model.** A `getState()` callback read at report time gives fresh interval data. A pull cannot see a `sta` transition when it happens, so transitions still need a push, and the player has two data paths.
- **Targets as factory functions.** `requestTarget()` and `eventTarget()` would let a request-only player tree-shake event mode. It adds a concept and an import for every integration. A hybrid keeps the top-level request settings and wraps only the event targets in `eventTarget()`. It gets the same bundle result for one import. The configuration shape here matches `CmcdReporterConfig`, which both adopters already map.
- **Request targets per destination.** The PR #398 review accepted a configured destination identity for request mode. Requests to different CDNs would then keep separate `sn`, `bs`, and `bsd` state. This RFC keeps one request target per `sid`. The spec defines targets as the configured event endpoints, in items 4, 5, 8, 12 to 14, and 16 of section 5. It names no request-mode target below the mode itself. The `sn` rule, one sequence per combination of mode and target, then gives request mode one sequence. An optional destination name on `decorate()` can be added later without a breaking change.
- **`formatters` on the session API.** Custom formatters remain on `encodeCmcd`. The transform is the per-report hook of this API, and the built-in rounding is a spec `MUST` for `dl`, `mtp`, and `rtp`.
- **`ts` as a second `update()` argument.** It would keep the payload type to stored keys. Kept in the payload for now, because every other reporting call takes `ts` in its payload too.
- **`start()` and `stop()`.** Both adopters call them only as a constructor and destructor pair. Creation and `dispose()` cover that with two calls.

## Prior art

- **hls.js** `CMCDController` and **dash.js** `CmcdController` drive `CmcdReporter` today, and both compute the spec behavior listed in Motivation by hand.
- **Shaka Player** `CmcdManager` is an independent implementation with the same fields per media player and no session sharing.
- **The report transforms RFC** ([`rfc/cmcd-reporter-middleware.md`](./cmcd-reporter-middleware.md)) defined the transform contract this API reuses.
- **The session retention RFC** ([`rfc/cmcd-session-retention.md`](./cmcd-session-retention.md)) defined the late-response goal this API meets by object lifetime.
- **The child-reporters RFC** ([PR #398](https://github.com/streaming-video-technology-alliance/common-media-library/pull/398)) defined the state partition between a session and a player that this API makes the primary model.
- **The starvation counters design** ([`plans/cmcd-session-counters/design.md`](../plans/cmcd-session-counters/design.md)) settled the supplied-value precedence this API uses for every derived key.

## Unresolved questions

1. **Configuration shape.** Top-level request settings plus `eventTargets`, as proposed, or a `targets` list of factory functions that tree-shakes event mode. **Resolution (2026-09-10):** kept as proposed. The gain of the factory shape is unmeasured, and no known adopter has a request-only configuration path. A request-only entry point remains a future possibility.
2. **`bg` from document visibility by default.** On by default with an opt-out, or off by default. **Resolution (2026-09-09):** on by default. `derive: { bg: false }` turns it off.
3. **`dl` as a derived default.** Keep it, or make `dl` player-supplied only. **Resolution (2026-09-09):** kept as a derived default. A supplied `dl` wins, and `derive: { dl: false }` turns the default off.
4. **One `t` line per live reporter.** Collector feedback on two lines per interval during interstitials. **Resolution (2026-09-10):** the design stands. Section 4 of the spec describes a multi-player session as per-player reports, told apart by `cid`, play state, and `nr`. Section 8.1.7 shows two players under one `sid`. No collector objection was raised. Reviewers can reopen the question on the pull request.
5. **`b` on exit.** `bg=?0`, as today, or a bare `e=b` as the token description implies. **Resolution (2026-09-10):** a bare `e=b`. The `bg` key row says the key SHOULD only be sent when TRUE. The `b` event definition describes exit as the event without `bg`. A collector that checks for the presence of `bg` would read `bg=?0` as an enter. The Transforms section shows the per-target opt-in for `bg=?0`.
6. **`ts` in the `update()` payload**, or a second argument. **Resolution (2026-09-10):** kept in the payload. `update()`, `recordEvent()`, `recordError()`, `decorate()`, and `recordResponse()` take one data shape. A second argument would give `recordEvent()` and `recordError()` a third parameter or a second convention.
7. **A URL-only `recordResponse()`** with attribution parsed from the wire, or the current-session fallback alone. **Resolution (2026-09-10):** the fallback alone. Wire parsing needs a map from `sid` strings to past `sid` states, with an eviction rule, which is the retention ledger this design removes. The fallback is wrong only for a response that crosses a `rotate()` from a player that discarded the returned request. Wire parsing stays listed under Rationale as a possible later addition.
8. **`onError` signature.** A single callback, or a context argument that names the target and the stage. **Resolution (2026-09-10):** a single callback. The target URL and the stage are in the error message, and `cause` holds the requester's error. Targets are fixed at `createCmcdSession()`, so a player cannot act on a target at runtime, and a context argument would only feed logging. A `CmcdReportError` class with fields stays a later option if a player needs to branch on the stage.
9. **Names.** `CmcdSessionReporter` and `CmcdPlaybackData` next to the existing `CmcdPlayerState` token union. **Resolution (2026-09-10):** accepted. `CmcdPlayerState` remains the token union for `sta`, and the Data section says so. The send function is `requester` and `CmcdRequester`, not `CmcdTransport`. The package already uses "transport" for the interception adapters of `CmcdReportRecorder`, and `requester` is the existing `CmcdReporter` argument name.

## Future possibilities

- `encodeCmcd` accepts the plain values of `CmcdPlaybackData`, once the shared preparation step normalizes them.
- Automatic response recording through a `PerformanceObserver`, so a browser player never calls `recordResponse()`.
- `Retry-After` from a 429 response, when the requester returns headers.
- A per-target URL filter for the `url` key, per spec item 19. A transform covers it today.
- A request-only entry point that leaves out event-mode delivery, if an adopter without a collector asks for it.
- An optional destination name on `decorate()`, with request-mode state per name, if CTA WAVE defines request-mode targets below the mode.
- `CmcdReporter` marked deprecated after hls.js and dash.js migrate, and removed in the next major version.

## Final Decision

*(Completed after review)*

**Decision:**
**Rationale:**
**Date:**
