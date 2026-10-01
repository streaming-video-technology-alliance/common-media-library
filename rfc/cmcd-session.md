---
status: draft
---

# RFC: CMCD session

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-10-01 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No |
| **Supersedes** | RFC 455 (`rfc/cmcd-session-api.md`), when this RFC is accepted |

## Summary

Add `createCmcdSession()`, a reporting API next to `CmcdReporter`. A session is one `sid`. It keeps only the state that CTA-5004-B scopes to a session or to a destination. This state is a sequence number for each destination, the event queues, and the interval timers. It also includes the keys that each destination receives once. The player passes its data on every call and decides itself when its state changes. A `filter` predicate on an event target selects the reports that the target receives. `CmcdReporter` does not change, and it accepts bug fixes only until a later decision on its future.

```ts
import type { Cmcd } from '@svta/cml-cmcd'
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	cid: 'movie-42',
	version: 2,
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.RESPONSE_RECEIVED],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

const state: Cmcd = { sta: 'p', bl: [12000], mtp: [25000] }

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ...state, ot: 'v', d: 4000, br: [3000] })
console.log(report.url)

session.recordEvent(CmcdEventType.PLAY_STATE, { ...state, sta: 'r' })
session.recordResponseReceived({ request: report, status: 200 })
```

## Motivation

hls.js, dash.js, and shaka-player all report CMCD through `CmcdReporter`. hls.js and shaka-player use version 2.4.0. dash.js uses version 2.3.2. Each player computes every metric itself and maps its own player events to CMCD calls. From the library, the players need three things. They need the encoding rules and the state that CTA-5004-B scopes to a destination. They also need the delivery of event reports.

The state that `CmcdReporter` keeps causes failures in these integrations:

- hls.js records a response with only its URL. From 2.6.0, the reporter drops that response, because the request has no provenance record.
- dash.js calls `update({ sta })` and then `recordEvent(PLAY_STATE, data)`. From 2.4.0, deduplication drops the second call and its data.

dash.js also needs to route `rr` reports by request type. Its setting `eventTargets[].includeInRequests` limits the `rr` reports of each target, and two targets can share one collector URL. `CmcdReporter` offers `transform` for this case. A transform can rewrite a report. The reporter must therefore copy nested values, restore required keys, and isolate errors for each target. dash.js only needs to choose targets.

RFC 455 proposed a larger session API. The design record compares the options: [analysis](../plans/cmcd-reporting-architecture/analysis.md), [option 1](../plans/cmcd-reporting-architecture/option-1.md), and [option 2](../plans/cmcd-reporting-architecture/option-2.md). This RFC is option 2.

## Guide-level explanation

### A session is one `sid`

Create a session when playback starts. The session generates a `sid` when the configuration has none. The second argument sends the event reports, so a player passes its own loader there.

Request mode is one destination. Each event target is one destination. Each destination has its own sequence number, which starts at 0. When the player needs a new `sid`, it creates a new session. It calls `flush()` and `stop()` on the old session first. A player that keeps the old session can still record late responses under the old `sid`.

### Pass the state on every call

The session keeps no player state. The player builds its CMCD data from its own fields and passes it with each call. The player also decides when a state changes. That check is one comparison.

```ts
import type { Cmcd } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'

let playerState: Cmcd['sta'] = CmcdPlayerState.STARTING
const bufferLength = 21300
const bandwidth = 25_000_000

const state = (): Cmcd => ({ sf: 'h', st: 'v', sta: playerState, bl: [bufferLength], mtp: [bandwidth / 1000] })

const session = createCmcdSession({
	cid: 'movie-42',
	version: 2,
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.TIME_INTERVAL],
		interval: 30,
	}],
	snapshot: state,
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

session.start()

function setPlayerState(next: Cmcd['sta']): void {
	if (next === playerState) {
		return
	}

	playerState = next
	session.recordEvent(CmcdEventType.PLAY_STATE, state())
}

setPlayerState(CmcdPlayerState.PLAYING)
setPlayerState(CmcdPlayerState.PLAYING)

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-2.m4s' }, { ...state(), ot: 'v', d: 4000, br: [3000], nor: ['https://cdn.example.com/movie/seg-3.m4s'] })
console.log(report.url)

session.stop()
```

The second `setPlayerState()` call sends nothing, because the state did not change. `start()` sends the first `t` report at once and then one report every 30 seconds. Each `t` report reads `snapshot()`. The request report carries `nor` as a path relative to the request URL.

### Errors, startup delay, and stalls

`recordError()` sends an `e=e` report at once to each target that lists `e`. Every other destination, request mode included, receives the `ec` codes with its next report.

Some keys must reach each destination once. `includeOnce()` adds keys to the next report of each destination. Use it for `msd`, which the spec allows once for each `sid` and mode. Use it for `bs`, which reports a stall since the prior report to the same destination. Use it for `bsd`, which each destination receives once.

```ts
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	version: 2,
	eventTargets: [
		{ url: 'https://collector.example.com/errors', events: [CmcdEventType.ERROR] },
		{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.PLAY_STATE] },
	],
}, async (request) => {
	console.log(request.url, request.body)
	return { status: 200 }
})

session.includeOnce({ msd: 850, bs: true })
session.recordError('MEDIA_ERR_NETWORK')
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-4.m4s' }, { ot: 'v', d: 4000 })
console.log(report.url)
```

The error target receives `e=e` with `ec`, `msd`, and `bs`. The other target receives the same three keys with its `ps` report. The request report carries them too.

### Select reports with `filter`

A `filter` on an event target returns `true` for each report that the target receives. It runs before the session builds the report, so a rejected report uses no sequence number. For `rr` reports, the filter also receives the request of the response.

```ts
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const settings = [
	{ url: 'https://collector.example.com/cmcd', includeInRequests: ['segment'], batchSize: 10 },
	{ url: 'https://collector.example.com/cmcd', includeInRequests: ['mpd'], batchSize: 1 },
]

const session = createCmcdSession({
	version: 2,
	eventTargets: settings.map((target) => ({
		url: target.url,
		events: [CmcdEventType.RESPONSE_RECEIVED],
		batchSize: target.batchSize,
		filter: (report, request) => report.e !== CmcdEventType.RESPONSE_RECEIVED || target.includeInRequests.includes(request?.customData?.requestType),
	})),
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

session.recordResponseReceived({ request: { url: 'https://cdn.example.com/movie/seg-1.m4s', customData: { requestType: 'segment' } }, status: 200 })
session.recordResponseReceived({ request: { url: 'https://cdn.example.com/movie.mpd', customData: { requestType: 'mpd' } }, status: 200 })
session.flush()
```

The first target receives only the segment response, and the second target receives only the manifest response. Both targets use one collector URL, and each target keeps its own sequence numbers.

### Several players, one session

Several media players can share one session, because the session keeps no state for a player. Each player passes its own `cid`. During an interstitial, the primary player and the ad player report under one `sid`, with one sequence for each target.

```ts
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	version: 2,
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.AD_START],
	}],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

session.recordEvent(CmcdEventType.PLAY_STATE, { cid: 'movie-42', sta: 'a', nr: true })
session.recordEvent(CmcdEventType.AD_START, { cid: 'ad-7' })
session.recordEvent(CmcdEventType.PLAY_STATE, { cid: 'ad-7', sta: 'p' })
```

## Reference-level explanation

### New exports

| Export | Kind |
|---|---|
| `createCmcdSession` | function |
| `CmcdSession`, `CmcdSessionConfig`, `CmcdSessionSettings`, `CmcdSessionEventTarget` | types |
| `CmcdReportFilter` | type |

### Types

```ts
type CmcdReportFilter = (report: Readonly<Cmcd>, request?: Readonly<HttpRequest>) => boolean

type CmcdSessionEventTarget = {
	url: string
	events: readonly CmcdEventType[]
	enabledKeys?: readonly CmcdKey[]            // default: every event key
	batchSize?: number                          // default 1
	interval?: number                           // seconds. default 30. 0 turns t reports off
	filter?: CmcdReportFilter
}

type CmcdSessionSettings = {
	version?: CmcdVersion                       // request mode. default CMCD_V2
	transmissionMode?: CmcdTransmissionMode     // default CMCD_QUERY
	enabledKeys?: readonly CmcdKey[]            // request mode. default: every key of the version
	customHeaderMap?: Partial<CmcdHeaderMap>
}

type CmcdSessionConfig = CmcdSessionSettings & {
	sid?: string                                // default: a new UUID
	cid?: string                                // used when a report has no cid
	eventTargets?: readonly CmcdSessionEventTarget[]
	snapshot?: () => Cmcd                       // the data of each t report
}

type CmcdSession = {
	readonly sid: string
	createRequestReport<R extends HttpRequest>(request: R, data?: Cmcd): R & CmcdRequestReport<R['customData']>
	recordEvent(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void
	recordResponseReceived(response: HttpResponse, data?: Cmcd): void
	recordError(codes: string | readonly string[], data?: Cmcd): void
	includeOnce(data: Cmcd): void
	configure(settings: CmcdSessionSettings): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}

function createCmcdSession(config?: CmcdSessionConfig, requester?: (request: HttpRequest) => Promise<{ status: number }>): CmcdSession
```

The names follow `CmcdReporter`: `createRequestReport`, `recordEvent`, `recordResponseReceived`, `enabledKeys`, `eventTargets`, `customHeaderMap`, and the `requester` argument. The default requester is `fetch` with `keepalive`.

### Reports

Every report starts from the data of the call. The session then adds the waiting keys of that destination, from `includeOnce()` and `recordError()`. Last, it writes `sid` and `sn`. An event report also receives `e`, and `ts` when the data has none. A `sid`, `sn`, or `e` in the data has no effect. An `msd` in the data has no effect either, because `msd` goes through `includeOnce()`. The configured `cid` applies when the data has no `cid`.

The session encodes each report with the rules of `encodeCmcd`. The encoder rounds values, applies the rules of the version and the mode, and adds `v`. It writes `nor` as a path relative to the request URL. Request mode uses the configured `version`. Event mode always uses version 2. Each report keeps the keys in `enabledKeys`, plus the keys that its event requires.

### Requests

`createRequestReport()` returns a copy of the request. In query mode, the URL has the `CMCD` parameter, and an existing `CMCD` parameter is replaced. In header mode, the headers have the CMCD shards, and `customHeaderMap` places the custom keys. `customData.cmcd` holds the report data before encoding. Each call advances the sequence number of request mode. Version 1 does not send `sn`.

### Events

`recordEvent()` selects its targets first. A target is selected when three conditions hold. It lists the event type, no 410 response stopped it, and its `filter` returns `true`. A target without a `filter` meets the third condition. The filter receives the report data with `e` set, and the request when the caller passes one. A filter must not change the data.

The session builds a report only for the selected targets. If a filter throws, no target receives the report, and the error goes to the caller. A target that is not selected keeps its sequence number and its waiting keys.

`recordResponseReceived()` derives `url` without the `CMCD` parameter, `rc` from `status`, and `ts`, `ttfb`, and `ttlb` from `resourceTiming`. It adds the request-time data from `customData.cmcd`. The `data` argument overrides the derived keys. It then records an `rr` event and passes the request to the filters.

`recordError()` sends `e=e` with `ec` at once to each selected target that lists `e`. Every other destination receives the codes with its next report, as CTA-5004-B recommends.

### Keys that each destination receives once

`includeOnce(data)` adds the keys to every destination. A list value appends to a waiting list, and any other value replaces a waiting value. The next report of a destination takes all of its waiting keys. A key that the report cannot carry, because of the version or `enabledKeys`, is dropped. This rule limits the memory that waiting keys use.

### Settings and timers

`configure()` replaces `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap` for request mode. It keeps the `sid` and every sequence number. Event targets cannot change after creation.

`start()` arms one timer for each event target whose events include `t` and whose interval is above 0. Each tick records a `t` report with the data from `snapshot()`, and the filter applies. `start()` sends the first `t` report at once, and `start(false)` waits one interval. `stop()` clears the timers. Without `snapshot`, `start()` arms nothing.

### Delivery

A target sends its queue when the queue reaches `batchSize`, and on `flush()`. One batch is one POST with the content type `application/cmcd`. The lines are joined with a line feed, with no line feed at the end.

| Response | Action |
|---|---|
| 2xx | Done |
| 410 | Every target with that URL stops for the life of the session |
| 429, 5xx, or a rejected request | The batch returns to the front of the queue and goes out with the next send |
| Any other status | The batch is dropped |

A queue keeps at most 500 lines. Past that limit, the oldest lines drop.

### Errors

A filter that throws stops the report for every target, and the error goes to the caller. A value that the structured-field encoder cannot serialize throws from the call that produced it. A failed send does not throw. The delivery table describes what happens instead.

### `CmcdReporter`

`CmcdReporter` keeps its API and its behavior. This RFC sets one policy and one fix:

1. `CmcdReporter` accepts bug fixes only, until the decision on its future.
2. Release 2.8.0 fixes `recordResponseReceived()`: a response without a provenance record reports under the current session, as in 2.4.0. hls.js and dash.js can then upgrade without losing `rr` events.

The decision on the future of `CmcdReporter` follows the first release of a player that uses the session API. One choice is to deprecate it. The other choice is a rebuild on the session API in a major version. Option 1 in the design record describes that rebuild.

A player must not report one `sid` through both APIs, because each API keeps its own sequence numbers.

### Bundle and performance

| API | Minified with gzip |
|---|---:|
| `createCmcdSession`, prototype | 5616 B |
| `CmcdReporter`, current | 8423 B |
| Both in one bundle | 9318 B |

| One version 2 request report, Node 24 | Time | Heap |
|---|---:|---:|
| `createCmcdSession`, prototype | 12.1 µs | 20.3 KB |
| `CmcdReporter`, current | 20.7 µs | 32.6 KB |

The prototype writes the same request output as `CmcdReporter`, byte for byte, for the same data. The [design record](../plans/cmcd-reporting-architecture/analysis.md) has the method.

## Drawbacks

- The package has two reporting APIs. The documentation must say which one to choose. The proposal is to recommend the session API for new integrations.
- Until the decision on `CmcdReporter`, the package keeps two implementations of sequence numbers, the `msd` rule, queues, delivery, and timers. A fix or a spec change lands twice.
- A player that imports both APIs pays for both, as the bundle table shows.
- The player keeps its own state object and checks its own state changes.
- A target cannot receive data that differs from the data of the other targets. The `bg=?0` opt-in of `CmcdReporter` has no equivalent.
- The session derives no playback keys. Players keep computing `msd`, `bs`, `su`, and `dl`, as they do today.

## Rationale and alternatives

- **Rebuild `CmcdReporter` on the session in a major version.** It gives one implementation and a reporter of 6319 B. It removes features that no player uses, but the removal is a breaking change. This RFC defers that step to the decision on `CmcdReporter`.
- **RFC 455.** It derives keys from pushed state, keeps one reporter for each media player, rotates the `sid`, and attributes late responses through request origins. It measures 9161 B. The players compute that state themselves. This RFC supersedes RFC 455.
- **`CmcdReporter` alone, with fixes.** The store and the automatic events stay, together with their failure cases. Per-target routing still needs `transform`.
- **`transform` instead of `filter`.** About 34 of the 54 transform tests of `CmcdReporter` guard the rewrite rules that the Motivation describes. A predicate needs none of them.
- **Other names for `filter`.** `accept` suggests the HTTP `Accept` header. `include` is a boolean or an array in CML names. `shouldReport` is longer than the other target options. `CmcdEncodeOptions.filter` already uses `filter` for a predicate that keeps an item on `true`.
- **Timers in the player.** shaka-player 5.2.0 shows the lifecycle risk of timers in the library. Targets have their own intervals, though, so the session needs to know them. `start()` and `stop()` keep the lifecycle explicit.

## Prior art

`CmcdReporter` 2.3.2 and 2.4.0 are the versions that the players adopted. The integrations in hls.js, dash.js, and shaka-player show which parts of the reporter the players use. The review of the transforms RFC (PR 390) defined the dash.js routing need.

## Unresolved questions

- The name of the API. The alternatives are `createCmcdClient()` and `createCmcdDispatcher()`. "Client" already names the player in CMCD, and "dispatcher" does not describe request decoration.
- The name of `includeOnce()`.
- The default for a missing `enabledKeys`. This RFC proposes every key. In the same case, `CmcdReporter` reports nothing in request mode and only the required keys on a target.
- The queue limit of 500 lines, and whether a configuration option should change it.
- The retry rule. This RFC keeps the rule of `CmcdReporter`, which returns a failed batch to the queue. RFC 455 proposed a back-off timer.
- The date of the decision on `CmcdReporter`, if no player releases the session API.

## Future possibilities

- A rebuild of `CmcdReporter` on the session API in a major version.
- Helpers that derive `msd`, `bs`, and `bsd` from play-state transitions, if players ask for them.
- A rewrite step for each target, if an adopter needs one.
- A filter for request mode.

## Final Decision

To be completed after review.

## Links

| Reference | URL |
|---|---|
| RFC 455 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/455 |
| PR 390, transforms RFC | https://github.com/streaming-video-technology-alliance/common-media-library/pull/390 |
| hls.js PR 7725 | https://github.com/video-dev/hls.js/pull/7725 |
| dash.js PR 4816 | https://github.com/Dash-Industry-Forum/dash.js/pull/4816 |
| shaka-player PR 10060 | https://github.com/shaka-project/shaka-player/pull/10060 |
| shaka-player issue 10414 | https://github.com/shaka-project/shaka-player/issues/10414 |
