---
status: draft
---

# RFC: CMCD session

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-10-01 |
| **Package** | `@svta/cml-cmcd` |
| **Breaking change** | No. Version 3.0.0 removes `CmcdReporter`. |
| **Supersedes** | RFC 455 (`rfc/cmcd-session-api.md`), when this RFC is accepted |

## Summary

Add `createCmcdSession()`, a reporting API next to `CmcdReporter`. A session is one `sid`. It keeps only the state that CTA-5004-B scopes to a session or to a destination. This state is a sequence number for each destination, the event queues, and the timers. The state also includes the `msd`, `bs`, `bsd`, and `ec` values that wait for the next report of each destination. The player passes its data on every call and checks itself when its state changes. A `filter` predicate on an event target selects the reports that the target receives. An event target has a collector `url` or a `send` function, for a transport that is not HTTP. The release that adds the session deprecates `CmcdReporter`, and version 3.0.0 removes it.

```ts
import type { CmcdSnapshot } from '@svta/cml-cmcd'
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

const state: CmcdSnapshot = { sta: 'p', bl: [12000], mtp: [25000] }

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ...state, ot: 'v', d: 4000, br: [3000] })
console.log(report.url)

session.recordEvent(CmcdEventType.PLAY_STATE, { ...state, sta: 'r' })
session.recordResponseReceived({ request: report, status: 200 })
```

## Motivation

hls.js, dash.js, and shaka-player all report CMCD through `CmcdReporter`. hls.js and shaka-player use version 2.4.0. dash.js uses version 2.3.2. Each player computes every metric itself and maps its own player events to CMCD calls. From the library, the players need three things: the encoding rules, the state that CTA-5004-B scopes to a destination, and the delivery of event reports.

The state that `CmcdReporter` keeps causes failures in these integrations:

- hls.js records a response with only its URL. From 2.6.0, the reporter drops that response, because the request has no provenance record.
- dash.js calls `update({ sta })` and then `recordEvent(PLAY_STATE, data)`. From 2.4.0, deduplication drops the second call and its data.

dash.js also needs to route `rr` reports by request type. Its setting `eventTargets[].includeInRequests` limits the `rr` reports of each target, and two targets can share one collector URL. `CmcdReporter` offers `transform` for this case. A transform can rewrite a report. For that case, the reporter copies nested values, restores required keys, and isolates errors for each target. dash.js needs only to select targets.

The CMCD over MSF draft sends event reports over MoQ tracks. The player publishes each report as a record, and the transport has no HTTP response. A requester receives an encoded body, so a MoQ player would decode every line again and would invent status codes.

RFC 455 proposed a larger session API. The design record compares the options: [analysis](https://github.com/streaming-video-technology-alliance/common-media-library/blob/0de942fa34554e5d2cfbccff98a2809184593c3e/plans/cmcd-reporting-architecture/analysis.md), [option 1](https://github.com/streaming-video-technology-alliance/common-media-library/blob/0de942fa34554e5d2cfbccff98a2809184593c3e/plans/cmcd-reporting-architecture/option-1.md), and [option 2](https://github.com/streaming-video-technology-alliance/common-media-library/blob/0de942fa34554e5d2cfbccff98a2809184593c3e/plans/cmcd-reporting-architecture/option-2.md). This RFC is option 2 with later changes. The largest change deprecates `CmcdReporter` instead of a later decision on its future. [Rationale and alternatives](#rationale-and-alternatives) lists the other changes.

## Guide-level explanation

### A session is one `sid`

When playback starts, create a session. The session generates a `sid` when the configuration has none. The second argument sends the event reports, so a player passes its own requester there.

Request mode is one destination. Each event target is one destination, also when two targets have one URL. Each destination has its own sequence number. The number starts at 0. When the player needs a new `sid`, it creates a new session. It calls `flush()` and `stop()` on the old session first. A player that keeps the old session can still record late responses under the old `sid`.

### Pass the state on every call

The session keeps no player state. The player builds its CMCD data from its own fields and passes it with each call. The player also checks when a state changes. That check is one comparison.

```ts
import type { CmcdSnapshot } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'

let playerState: CmcdPlayerState = CmcdPlayerState.STARTING
const bufferLength = 21300
const bandwidth = 25_000_000

const state = (): CmcdSnapshot => ({ sf: 'h', st: 'v', sta: playerState, bl: [bufferLength], mtp: [bandwidth / 1000] })

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

function setPlayerState(next: CmcdPlayerState): void {
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

The second `setPlayerState()` call sends nothing, because the state did not change. `start()` sends the first `t` report at once and then one report every 30 seconds. Each `t` report reads `snapshot()`, and every other report reads only the data of its call. The state function returns `CmcdSnapshot`, so one function serves both. In the request report, `nor` is a path relative to the request URL.

### Errors, startup delay, and stalls

`recordError()` sends an `e=e` report at once to each target that lists `e`. Every other destination, request mode included, receives the `ec` codes with its next report.

Three more keys have a scope that one report cannot cover. The player passes them in the data of any call, and the session sends them to every destination:

- `msd` goes once to each destination. The session keeps the first valid value.
- `bs: true` reports a stall. Each destination sends `bs` with its next report of the same object type.
- `bsd` is the duration of a stall. Each destination sends the durations with its next report, as one list.

Pass `bs` and `bsd` once, in the call that reports the stall. A `bs` flag in the state object would report the stall again with each call, so `CmcdSnapshot` rejects both keys. `msd` can remain in the state object.

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

session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', msd: 850 })
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'r', bs: true })
session.recordError('MEDIA_ERR_NETWORK')
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p', bsd: [1200] })

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-4.m4s' }, { ot: 'v', d: 4000 })
console.log(report.url)
```

The error target receives `e=e` with `ec`, `msd`, and `bs`. The other target receives each of the four keys once, with its `ps` reports. The request report has `msd`, `bs`, `bsd`, and `ec`.

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

The first target receives only the segment response, and the second target receives only the manifest response. Both targets post to one collector URL. Each target is its own destination, so each target keeps its own sequence of `sn` values.

### Send reports without HTTP

An event target has a collector `url` or a `send` function. The session calls the function with each batch, oldest report first. For a transport that is not HTTP, such as a MoQ track or a WebSocket, use a function.

```ts
import type { CmcdEventSender } from '@svta/cml-cmcd'
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

declare function publishRecords(records: { timestamp: number; data: object }[]): Promise<void>

const send: CmcdEventSender = async (reports) => {
	await publishRecords(reports.map((report) => ({ timestamp: report.ts, data: report })))
}

const session = createCmcdSession({
	eventTargets: [{ send, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] }],
})

session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
```

Each report is the data of one event. The session has applied `enabledKeys`, the `filter`, and the waiting values. The session has written `e`, `sid`, `sn`, `ts`, and `v`. A token value is an `SfToken`, and an inner list is an array. A function that needs the encoded line calls `encodeCmcd(report, { reportingMode: CmcdReportingMode.EVENT })`. Without that option, the encoder uses request mode and drops `e` and `ts`.

The promise takes the place of the HTTP response. A promise that resolves means that the function delivered the batch. A result of `{ gone: true }` stops the target, as a 410 response does. A promise that rejects sends the batch again after a wait, as a 5xx response does. The function must not change a report, and the `DeepReadonly` type rejects a change.

### Several players, one session

Several media players can share one session, because the session keeps no state for a player. Each player passes its own `cid`. During an interstitial, the primary player and the ad player report under one `sid`, with one sequence for each target. The `t` reports read one `snapshot()`, so they contain the state of one player.

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

### Migrate from `CmcdReporter`

The table maps each member of `CmcdReporter` to the session API. The example in [Pass the state on every call](#pass-the-state-on-every-call) shows the state object and the change check.

| `CmcdReporter` | Session API |
|---|---|
| `new CmcdReporter(config, requester)` | `createCmcdSession(config, requester)` |
| `sid`, `cid`, `version`, `transmissionMode`, `enabledKeys`, `customHeaderMap`, `eventTargets` | The same names and types |
| `update(data)` for values that persist | The player keeps the values in a `CmcdSnapshot` object and passes them with each call |
| The events that `update()` records for `sta`, `pr`, `cid`, `bg`, and `br` | The player compares the new value with the old value, then calls `recordEvent()` |
| `update({ sid })` | A new session. The player calls `flush()` and `stop()` on the old session. |
| `update({ msd })` | `msd` in the data of any call. The session sends it once to each destination. |
| The data store in `t` reports | `snapshot`, a function that returns `CmcdSnapshot` |
| `recordEvent()`, `createRequestReport()`, `recordResponseReceived()` | The same methods. The data includes the values that persist. |
| `start()`, `stop()`, `flush()` | The same methods. `stop(true)` becomes `flush()` and then `stop()`. |
| `isRequestReportingEnabled()` | No equivalent. The player calls `createRequestReport()` only for the requests that it reports. |
| `applyRequestReport()`, deprecated | `createRequestReport()` |
| `transform` on an event target, to drop reports | `filter` |
| `transform` on the request configuration, to drop reports | No `createRequestReport()` call for that request |
| `transform`, to change a report | Other data in the call. A change for one target only has no equivalent. |
| `sessionRetention` and the provenance record | The player keeps the old session object and records late responses there |
| A new reporter for new request settings | `configure()` |
| A new reporter for a new `sid` or new event targets | A new session |
| A new reporter for a new `cid` | `cid` in the data of each call |

Without `enabledKeys`, the session reports every key. In the same case, `CmcdReporter` reports nothing in request mode and only the required keys on a target.

## Reference-level explanation

### New exports

| Export | Kind |
|---|---|
| `createCmcdSession` | function |
| `CmcdSession`, `CmcdSessionConfig`, `CmcdSessionRequestReportConfig`, `CmcdSessionEventReportConfig`, `CmcdSnapshot` | types |
| `CmcdReportFilter`, `CmcdEventSender`, `CmcdEventSendResult` | types |
| `CMCD_EVENT_HOSTNAME`, and `HOSTNAME` in `CmcdEventType` | constant |

CTA-5004-B defines the `h` event for a change of the content host, and the package has no constant for it. The player records the event with the new host in the `h` key.

The session has its own configuration types. `CmcdSessionRequestReportConfig` contains the settings for request mode, and `CmcdSessionEventReportConfig` describes an event target. Both derive from the types of `CmcdReporter` and reject `transform` with a `never` member. A value typed `CmcdReporterConfig` does not compile as a `CmcdSessionConfig`. The `CmcdReporter` types do not gain `filter`.

The release that adds the session changes one existing type. `CmcdReportConfig.enabledKeys` accepts a read-only array, and the TSDoc names the default of each API.

### Types

```ts
type CmcdReportFilter = (report: DeepReadonly<Cmcd>, request?: DeepReadonly<HttpRequest>) => boolean

// Existing types of CmcdReporter, with the changes in the comments
type CmcdReportConfig = {
	version?: CmcdVersion                       // default CMCD_V2
	enabledKeys?: readonly CmcdKey[]            // now readonly. session default: every key. CmcdReporter default: none
}

type CmcdRequestReportConfig<C> = CmcdReportConfig & {
	transmissionMode?: CmcdTransmissionMode     // default CMCD_QUERY
	customHeaderMap?: Partial<CmcdHeaderMap>
	transform?: CmcdRequestReportTransform<C>   // deprecated. CmcdReporter only
}

type CmcdEventReportConfig<C> = CmcdReportConfig & {
	version?: typeof CMCD_V2                    // event mode always uses version 2
	url: string
	events?: CmcdEventType[]
	interval?: number                           // seconds. default CMCD_DEFAULT_TIME_INTERVAL (30). 0 turns t reports off
	batchSize?: number                          // default 1
	transform?: CmcdEventReportTransform<C>     // deprecated. CmcdReporter only
}

// The session types. In the package, each never member has a TSDoc note that names filter.
type CmcdSessionRequestReportConfig = Omit<CmcdRequestReportConfig, 'transform'> & {
	transform?: never                           // CmcdReporter only. A session has no transform
}

type CmcdEventSendResult = {
	readonly gone?: boolean                     // true: the destination stops, as after a 410 response
}

// The reports of one batch, oldest first. The session has written e, sid, sn, ts, and v.
type CmcdEventSender = (reports: readonly DeepReadonly<Cmcd & Required<Pick<Cmcd, 'e' | 'sid' | 'sn' | 'ts' | 'v'>>>[]) => Promise<CmcdEventSendResult | void>

type CmcdSessionEventReportConfig = Omit<CmcdEventReportConfig, 'transform' | 'url'> & {
	transform?: never                           // CmcdReporter only. filter selects the reports of the target
	filter?: CmcdReportFilter
} & (
	| { url: string; send?: never }             // an HTTP collector. The requester sends each batch as a POST
	| { url?: never; send: CmcdEventSender }    // any other transport. The function sends each batch
)

type CmcdSessionConfig = CmcdSessionRequestReportConfig & {
	sid?: string                                // default: a new UUID
	cid?: string                                // used when a report has no cid
	eventTargets?: readonly CmcdSessionEventReportConfig[]
	snapshot?: () => CmcdSnapshot               // the data of each t report
}

// The state of a player. The session writes e, sid, sn, ts, and v. The other keys describe one occurrence.
// In the package, each never member has a TSDoc note that says where the key goes.
type CmcdSnapshot = Omit<CmcdEvent, 'bs' | 'bsd' | 'cen' | 'e' | 'ec' | 'sid' | 'sn' | 'ts' | 'v'> & {
	bs?: never; bsd?: never; cen?: never; e?: never; ec?: never; sid?: never; sn?: never; ts?: never; v?: never
}

type CmcdSession = {
	readonly sid: string
	createRequestReport<R extends HttpRequest>(request: R, data?: Omit<CmcdRequest, 'sid' | 'sn' | 'v' | 'ec'>): R & CmcdRequestReport<R['customData']>
	recordEvent(type: CmcdEventType, data?: Omit<Cmcd, 'sid' | 'sn' | 'e' | 'v' | 'ec'>, request?: Readonly<HttpRequest>): void
	recordResponseReceived(response: HttpResponse, data?: Omit<Cmcd, 'sid' | 'sn' | 'e' | 'v' | 'ec'>): void
	recordError(codes: string | readonly string[], data?: Omit<CmcdEvent, 'sid' | 'sn' | 'e' | 'v' | 'ec'>): void
	configure(settings: CmcdSessionRequestReportConfig): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}

function createCmcdSession(config?: CmcdSessionConfig, requester?: (request: HttpRequest) => Promise<{ status: number }>): CmcdSession

// The parameter widens, so a send function can encode a report without a copy
// An event report needs { reportingMode: CmcdReportingMode.EVENT }
function encodeCmcd(cmcd: DeepReadonly<Cmcd>, options?: CmcdEncodeOptions): string
```

The names follow `CmcdReporter`: `createRequestReport`, `recordEvent`, `recordResponseReceived`, `enabledKeys`, `eventTargets`, `customHeaderMap`, and the `requester` argument. A configuration object without `transform` type-checks against both APIs. The default requester is `fetch`.

### Reports

Every report starts from the data of the call. The session then adds the waiting values of that destination, as [Keys with a destination scope](#keys-with-a-destination-scope) describes. Last, the session writes `sid` and `sn`. An event report also receives `e`, and `ts` when the data has none. The data types leave out `sid`, `sn`, `e`, and `v`, because the session writes them. The types also leave out `ec`, because only `recordError()` sets it. In JavaScript, a `sid`, `sn`, or `e` in the data has no effect. The configured `cid` applies when the data has no `cid`. A `b` report with `bg: false` is the exit from backgrounded mode. The session writes that report without `bg`, as CTA-5004-B defines.

The session encodes each report with the rules of `encodeCmcd`. The encoder rounds values, applies the rules of the version and the mode, and adds `v`. It writes `nor` as a path relative to the request URL. Request mode uses the configured `version`. Event mode always uses version 2. Each report keeps the keys in `enabledKeys`, plus the keys that its event requires.

### Requests

`createRequestReport()` returns a copy of the request. In query mode, the first `CMCD` parameter of the URL takes the new value in place, and the session removes the other `CMCD` parameters. In header mode, the headers have the CMCD shards, and `customHeaderMap` places the custom keys. `customData.cmcd` contains the report data before encoding. Each call advances the sequence number of request mode. Version 1 does not send `sn`.

### Events

`recordEvent()` selects its targets first. The method selects a target when three conditions are true. The target lists the event type, no 410 response stopped the target, and its `filter` returns `true`. A target without a `filter` meets the third condition. The filter receives the report data with `e` and `ts` set, and the request when the caller passes one. A filter must not change the data. The `DeepReadonly` types of `CmcdReportFilter` reject a change at any depth.

The session builds a report only for the selected targets. If a filter throws, no target receives the report, and the caller receives the error. A target advances its sequence number only for a report that the target receives. The values of the call with a destination scope wait for the next report of each other destination.

Each target is one destination, with its own sequence number, `msd` gate, and waiting values. Two targets with one URL, or with one `send` function, are two destinations. Each target also keeps its own events, `enabledKeys`, `filter`, `batchSize`, `interval`, and queue.

`recordResponseReceived()` derives `url` without any `CMCD` parameter, and `rc` from `status`. The method derives three keys from `resourceTiming`:

- `ts` is the time origin plus `startTime`.
- `ttfb` is `responseStart` minus `startTime`. The session omits `ttfb` when `responseStart` is missing, earlier than `startTime`, or later than `startTime` plus `duration`. Resource Timing reports 0 for a cross-origin response without the `Timing-Allow-Origin` header. That value is earlier than `startTime`, so the response has no `ttfb`.
- `ttlb` is `duration`, when `duration` is above 0.

The method adds the request-time data from `customData.cmcd`, without the keys that have a destination scope. The request report already gave those keys to every destination. The `data` argument overrides the derived keys. The method then records an `rr` event and passes the request to the filters.

`recordError()` sends `e=e` with `ec` at once to each selected target that lists `e`. Every other destination receives the codes with its next report, as CTA-5004-B recommends.

### Keys with a destination scope

CTA-5004-B scopes four keys to a destination or to the `sid`, so one report cannot cover them. The session reads them from the data of every call.

| Key | Source | Rule |
|---|---|---|
| `msd` | The data of any call | The first valid value counts. Each destination sends it once, in its next report that can include it. |
| `bs` | `bs: true` in the data of any call | Each destination sends `bs` with its next report of the same `ot`. A report or a call without `ot` matches every `ot`. |
| `bsd` | The data of any call | Each destination adds the values to one list and sends the list with its next report. |
| `ec` | `recordError()` | Each destination without the `e` report sends the codes with its next report. |

The next report drops a waiting `bs`, `bsd`, or `ec` value that the version or `enabledKeys` does not allow. This rule limits the memory that waiting values use. The session copies each waiting value, including the value inside an `SfItem`. A later change to the data of the caller does not change a waiting value. A valid `msd` is a finite number from 0 to 999,999,999,999,999 after rounding to an integer. The session ignores any other `msd`, as `CmcdReporter` does today.

### Settings and timers

`configure()` replaces `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap` for request mode. It keeps the `sid` and every sequence number. Event targets cannot change after creation.

`start()` starts one timer for each event target whose events include `t` and whose interval is above 0. Each tick records a `t` report with the data from `snapshot()`, and the filter applies. `start()` sends the first `t` report at once, and `start(false)` waits one interval. `stop()` clears these timers. Without `snapshot`, `start()` starts no timer.

`snapshot()` supplies the data of the `t` reports only. The session never adds that data to another report. A tick drops `bs` and `bsd` from the data. A stall flag in the state object of a JavaScript player cannot repeat with each tick.

### Delivery

A target sends its queue when the queue reaches `batchSize`, and on `flush()`. An `e` report in the queue also makes the target send. For a `url` target, one batch is one POST with the content type `application/cmcd`. The session joins the lines with a line feed and writes no line feed at the end. For a `send` target, one batch is one call of the function with the reports, oldest first. A target sends at most one batch at a time. Reports that arrive during that batch wait in the queue of the target. After the response, or after the promise settles, the target checks the send conditions again.

| Response | Action |
|---|---|
| 2xx | Done. The wait resets. |
| 410 | The target stops until the session ends. The session clears the queue and the waiting values of the target and drops a batch that awaits its response. Another target with the same URL stops when its own POST receives 410. |
| 429, 5xx, status 0, a rejected request, or a requester that throws | The batch returns to the front of the queue, and the target waits before its next send |
| Any other status | The session drops the batch. The wait resets. |

The promise of a `send` function takes the place of the response. A promise that resolves counts as 2xx. A result with `gone: true` counts as 410. The session then ignores the result of a call that has not settled for that target. A promise that rejects, or a function that throws, counts as a rejected request. No result of the function drops a batch. A function that cannot deliver a batch resolves.

For a `send` target, the session copies the nested values of each report at queue time. The copy follows the rule for waiting values. The `DeepReadonly` type of `CmcdEventSender` rejects a change by the function, as the type of `CmcdReportFilter` does.

The wait starts at 1 second and doubles after each failure, up to 60 seconds. During the wait, new reports join the queue, also an `e` report, and the retry sends them. CTA-5004-B recommends this back-off for 429 and 5xx responses. Status 0 means that no response arrived, as from an XMLHttpRequest requester after a network failure. `flush()` sends at once, also during a wait. If a batch awaits its response, `flush()` sends after that batch completes. `stop()` clears the wait timers together with the interval timers. After `stop()`, a failure starts no timer.

### Errors

Each call builds and encodes all of its reports before it changes any state. A call that throws changes no sequence number, no waiting value, and no queue.

- A filter that throws stops the report for every target, and the caller receives the error.
- A value that the structured-field encoder cannot serialize throws from the call that produced it. The session checks the `bs`, `bsd`, and `ec` values of a call before they wait. A waiting value cannot fail a later report. A `send` target gets the same check. The session encodes the report and discards the line.
- An error in a timer tick throws from the timer callback, as in `CmcdReporter` today. The source of the error is `snapshot()` or the encoder.
- A failed send does not throw. The delivery table describes the result.

`createCmcdSession()` checks the rules of the configuration that TypeScript types cannot express. It throws on an invalid value. Without these checks, an empty `url` would send the reports to the page URL. An `interval` of `Infinity` would run the tick without a pause.

| Parameter | Valid values |
|---|---|
| `sid` | A string of 1 to 64 characters |
| `cid` | A string of at most 128 characters |
| `url` or `send` of a target | Exactly one of the two |
| `url` of a target | A non-empty string |
| `send` of a target | A function |
| `interval` of a target | A finite number, 0 or more |
| `batchSize` of a target | A positive integer |

The message names the parameter, the valid values, and the received value: `createCmcdSession: eventTargets[1].batchSize must be a positive integer, received 0`.

### Deprecation of `CmcdReporter`

1. Release 2.8.0 fixes `recordResponseReceived()`. A response without a provenance record reports under the current session, as in 2.4.0. hls.js and dash.js can then upgrade before they migrate.
2. The release that adds `createCmcdSession()` marks the exports and the members in the table `@deprecated`. Each notice links to the migration table.
3. Until its removal, `CmcdReporter` accepts bug fixes only.
4. Version 3.0.0 removes the deprecated exports and members. The removal does not wait for the players to migrate.
5. Version 3.0.0 also reworks the configuration types. It removes the type parameter `C`, every `transform` member, and the `never` members of the session types. It makes `events` required. The TSDoc of `enabledKeys` then names only the default of the session.

| Deprecated export or member | Kind |
|---|---|
| `CmcdReporter` | class |
| `CmcdReporterConfig`, `CmcdReporterCustomData`, `CmcdTransformRequest`, `CmcdRequestReportTransform`, `CmcdEventReportTransform` | types |
| `CMCD_REQUEST_PROVENANCE`, `CmcdRequestProvenance` | constant and type |
| `transform` in `CmcdRequestReportConfig` and in `CmcdEventReportConfig` | members |

Related exports remain. The session uses `CMCD_DEFAULT_TIME_INTERVAL`, and dash.js imports it. `CmcdRequestReport` is the result type of `createRequestReport()`. The session types derive from `CmcdReportConfig`, `CmcdRequestReportConfig`, and `CmcdEventReportConfig`. `CmcdReportRecorder` and its transports record HTTP traffic and do not depend on `CmcdReporter`.

During a migration, a player must not report one `sid` through both APIs. Each API keeps its own sequence numbers.

### Bundle and performance

| API | Minified with gzip |
|---|---:|
| `createCmcdSession`, prototype | 6174 B |
| `CmcdReporter`, current | 8423 B |
| Both in one bundle | 9846 B |

| One version 2 request report, Node 24 | Time | Heap |
|---|---:|---:|
| `createCmcdSession`, prototype | 12.0 µs | 20.5 KB |
| `CmcdReporter`, current | 20.2 µs | 32.6 KB |

The prototype writes the same request output as `CmcdReporter`, byte for byte, for the same data. The measurements predate `send`. The implementation PR measures the addition. The [design record](https://github.com/streaming-video-technology-alliance/common-media-library/blob/0de942fa34554e5d2cfbccff98a2809184593c3e/plans/cmcd-reporting-architecture/analysis.md) has the method.

## Drawbacks

- Each player must migrate. It replaces the store with its own state object, typed as `CmcdSnapshot`, and adds its own checks for state changes.
- Until version 3.0.0, the package keeps two implementations of sequence numbers, the `msd` rule, queues, delivery, and timers. Each fix and each spec change needs two implementations.
- A player that imports both APIs during a migration bundles both, as the bundle table shows.
- Until version 3.0.0, the session types have a `transform` member typed `never`. The member exists only to reject a `CmcdReporter` configuration.
- During a long outage of a collector, the queues of its targets grow without a limit. `CmcdReporter` has the same behavior.
- A target cannot receive data that differs from the data of the other targets. The `bg=?0` option of `CmcdReporter` has no equivalent.
- The session derives no playback keys. Players compute `msd`, `bs`, `su`, and `dl` themselves, as they do today.
- A `send` target encodes each report to check the values and copies the nested values at queue time. A `url` target encodes once and copies nothing. Every player receives the `send` code, also a player with `url` targets only.

## Rationale and alternatives

- **Rebuild `CmcdReporter` on the session in a major version.** This option gives one implementation and a reporter of 6319 B. The option keeps the class, the store, and the automatic events, and the automatic events cause the dash.js failure. CML APIs use `createX` factory functions, so this RFC deprecates the class instead.
- **RFC 455.** RFC 455 derives keys from the state that the player pushes. That RFC also keeps one reporter for each media player, rotates the `sid`, and attributes late responses through request origins. That RFC measures 9161 B. The players compute that state themselves. This RFC supersedes RFC 455.
- **`CmcdReporter` alone, with fixes.** The store and the automatic events remain, with their failure cases. Routing for each target still needs `transform`.
- **`transform` instead of `filter`.** About 34 of the 54 transform tests of `CmcdReporter` cover the rewrite rules that the Motivation describes. A predicate needs none of them.
- **Other names for `filter`.** `accept` suggests the HTTP `Accept` header. `include` is a boolean or an array in CML names. `shouldReport` is longer than the other target options. `CmcdEncodeOptions.filter` already uses `filter` for a predicate that keeps an item on `true`.
- **The `CmcdReporter` types for the session, with `filter` added.** An earlier draft added `filter` to `CmcdEventReportConfig`, and the session ignored `transform`. A reporter configuration then compiled as a session configuration. The session dropped the transform without an error. The `never` members reject such a configuration at compile time. `Omit` removes the member from the type, so a value of a wider type remains assignable. The session types keep the members of the existing types and the terms request report and event report.
- **Other names for the API.** In CMCD, "client" names the player, so `createCmcdClient()` is ambiguous. `createCmcdDispatcher()` does not describe request decoration. Until version 3.0.0, `createCmcdReporter()` would exist next to the deprecated class, with other behavior.
- **Removal after the players migrate.** This option would tie the removal to the schedules of three projects. The two implementations in Drawbacks would remain longer. A player depends on a fixed version of the package, so version 3.0.0 changes nothing until the player upgrades.
- **`includeOnce()`, or keys derived from `sta`.** A method for the keys with a destination scope adds a call that the key rules make unnecessary. The session could derive `msd`, `bs`, and `bsd` from the play states. In shaka-player, no starting state exists. In dash.js, `bs` and `bsd` have an object type that `sta` does not show.
- **No keys without `enabledKeys`.** This default of `CmcdReporter` makes each player pass the full key list. hls.js, dash.js, and shaka-player all pass the full key list. The data of each call already selects the keys.
- **A queue limit.** A limit bounds the memory that a long outage of a collector uses. A limit also drops reports, and a `batchSize` above the limit never fills. The session has no limit, like `CmcdReporter`.
- **`keepalive` in the default requester.** The option lets a send finish after the page closes. Browsers reject a `keepalive` body over 64 KiB, and a batch after an outage can be larger. A player that needs `keepalive` passes its own requester.
- **The retry rule of `CmcdReporter`.** `CmcdReporter` sends a failed batch again with the next send. During an outage, each new event then sends the whole queue to the failing collector.
- **Timers in the player.** shaka-player 5.2.0 shows the lifecycle risk of timers in the library. Each target has its own interval, though, so the session must manage the timers. `start()` and `stop()` keep the lifecycle explicit.
- **A store, as in `update()`, without the automatic events.** One store gives one way to pass data, but the session would keep player state again. The `t` reports would have old `bl` and `mtp` values unless the player updates the store before each tick. Each key would need a rule for whether it persists, and two players in one session would overwrite one store. `CmcdReporter` also merges its store with the data of each call, so its players already use two sources.
- **`snapshot()` for every report, under the data of the call.** This option removes the `...state()` spread from each call. One snapshot describes one player, though. In a shared session, the reports of the ad player would contain the state of the primary player.
- **One destination for targets with one URL.** CTA-5004-B defines `sn` per mode and target, and the player requirements call a target a destination URL. The text does not address two configured targets with one URL. `CmcdReporter` keeps one counter for each target, and the session keeps that behavior. A collector behind two targets receives two `sn` sequences and `msd` twice. A player with two targets for one URL accepts that result. One rule for every target also removes the destination lookup by URL or by function.
- **A custom requester for other transports.** The requester receives only the encoded body. The Motivation describes the decode and the invented status codes of a MoQ player.
- **The report objects on the batch request.** The POST request could include the reports in `customData`, and a requester could route a `moqt:` URL. The URL becomes a routing key. The session encodes a body that no one reads, and one requester serves every target.
- **One `send` function for the session.** One function would replace HTTP for every target. A player with one HTTP collector and one MoQ track needs the choice for each target.
- **`Promise<CmcdEventSendResult> | Promise<void>` as the return type of `send`.** A union of two promise types rejects a `Promise.resolve()` call whose argument is `CmcdEventSendResult` or `undefined`. The RFC keeps `void` inside one promise type, and the source needs one lint exception for `no-invalid-void-type` on that line.
- **Encoded lines for `send`.** Transports that are not HTTP mostly need structured data. A function that needs lines calls `encodeCmcd()` with the event reporting mode.
- **A time limit for a batch.** The CMCD over MSF draft asks for a `batchInterval` option. The option is separable from `send`. The draft calls the option a minimum interval and also a trigger, and the draft does not resolve that difference. A later RFC can add the option without a change to `send`.
- **Other names for `send`.** `sink` is a term from stream libraries, and a sink does not answer. This function answers with a promise, and the promise controls the retry. `transport` names the fetch and XHR adapters of `CmcdReportRecorder`. `destination` and `target` name concepts of this RFC. `publish` names one transport.
- **Types that sort keys into state keys and object keys.** CTA-5004-B has no such classes. Table 1 allows most keys in both modes, and `br` changes meaning between the modes. Section 2 leaves the choice of keys to the application. The types leave out only the keys that the session writes and the keys of one occurrence. `CmcdSnapshot` uses `never` members, because `Omit` alone accepts a value typed `Cmcd`. The data arguments use `Omit`, so the `Cmcd` values of existing players still compile. Required keys for each event type, such as `sta` for `ps`, need conditional parameter lists. They also reject a state object whose `sta` is optional.

## Prior art

The integrations in hls.js, dash.js, and shaka-player show which parts of `CmcdReporter` the players use. The review of the transforms RFC (PR 390) defined the dash.js routing need. Zac Shenker wrote an RFC for an event sink on a fork. That RFC proposed a function for each target, the `gone` result, and a `batchInterval` option. This RFC adopts the function and the result under the name `send`.

## Unresolved questions

None. The review of the RFC PR can add questions.

## Future possibilities

- A factory function for `CmcdReportRecorder`, to follow the `createX` convention.
- Helpers that derive `msd`, `bs`, and `bsd` from play-state transitions, if players request them.
- A rewrite step for each target, if a player needs one.
- A filter for request mode.
- A `batchInterval` option, the maximum time that a report waits in a batch. The CMCD over MSF draft asks for the option.
- Helpers for CMCD over MoQ, such as a record serializer, when that draft is stable.

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
| Event sink RFC, Zac Shenker | https://github.com/zshenker/common-media-library/blob/rfc/cmcd-event-sink/rfc/cmcd-event-sink.md |
| CMCD over MSF Event Timeline draft | https://wilaw.github.io/CMCD-over-MSF-event-timeline/draft-wilaw-moq-cmcd-event-timeline.html |
