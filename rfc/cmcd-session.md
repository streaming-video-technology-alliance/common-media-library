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

Add `createCmcdSession()`, a reporting API next to `CmcdReporter`. A session is one `sid`. It keeps only the state that CTA-5004-B scopes to a session or to a destination. This state is a sequence number for each destination, the event queues, and the timers. It also includes the `msd`, `bs`, `bsd`, and `ec` values that wait for the next report of each destination. The player passes its data on every call and decides itself when its state changes. A `filter` predicate on an event target selects the reports that the target receives. The release that adds the session deprecates `CmcdReporter`, and version 3.0.0 removes it.

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

RFC 455 proposed a larger session API. The design record compares the options: [analysis](../plans/cmcd-reporting-architecture/analysis.md), [option 1](../plans/cmcd-reporting-architecture/option-1.md), and [option 2](../plans/cmcd-reporting-architecture/option-2.md). This RFC is option 2 with later changes. The largest change deprecates `CmcdReporter` instead of a later decision on its future. [Rationale and alternatives](#rationale-and-alternatives) lists the other changes.

## Guide-level explanation

### A session is one `sid`

Create a session when playback starts. The session generates a `sid` when the configuration has none. The second argument sends the event reports, so a player passes its own loader there.

Request mode is one destination. Each target URL is one destination, so targets that share a URL share a destination. Each destination has its own sequence number, which starts at 0. When the player needs a new `sid`, it creates a new session. It calls `flush()` and `stop()` on the old session first. A player that keeps the old session can still record late responses under the old `sid`.

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

Three more keys have a scope that one report cannot cover. The player passes them in the data of any call, and the session sends them to every destination:

- `msd` goes once to each destination. The session keeps the first valid value.
- `bs: true` reports a stall. Each destination sends `bs` with its next report of the same object type.
- `bsd` holds the duration of a stall. Each destination sends the durations with its next report, as one list.

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

The error target receives `e=e` with `ec`, `msd`, and `bs`. The other target receives each of the four keys once, with its `ps` reports. The request report carries `msd`, `bs`, `bsd`, and `ec`.

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

The first target receives only the segment response, and the second target receives only the manifest response. Both targets use one collector URL, so they share one sequence of `sn` values.

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

### Migrate from `CmcdReporter`

The table maps each member of `CmcdReporter` to the session API. The example in [Pass the state on every call](#pass-the-state-on-every-call) shows the state object and the change check.

| `CmcdReporter` | Session API |
|---|---|
| `new CmcdReporter(config, requester)` | `createCmcdSession(config, requester)` |
| `sid`, `cid`, `version`, `transmissionMode`, `enabledKeys`, `customHeaderMap`, `eventTargets` | The same names |
| `update(data)` for values that persist | The player keeps the values and passes them with each call |
| The events that `update()` fires for `sta`, `pr`, `cid`, `bg`, and `br` | The player compares the new value with the old value, then calls `recordEvent()` |
| `update({ sid })` | A new session. The player calls `flush()` and `stop()` on the old session. |
| `update({ msd })` | `msd` in the data of any call. The session sends it once to each destination. |
| The data store in `t` reports | `snapshot` |
| `recordEvent()`, `createRequestReport()`, `recordResponseReceived()` | The same methods. The data includes the values that persist. |
| `start()`, `stop()`, `flush()` | The same methods. `stop(true)` becomes `flush()` and then `stop()`. |
| `isRequestReportingEnabled()` | No equivalent. The player decides whether to call `createRequestReport()`. |
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
| `CmcdSession`, `CmcdSessionConfig`, `CmcdSessionSettings`, `CmcdSessionEventTarget` | types |
| `CmcdReportFilter` | type |
| `CMCD_EVENT_HOSTNAME`, and `HOSTNAME` in `CmcdEventType` | constant |

CTA-5004-B defines the `h` event for a change of the content host, and the package has no constant for it. The player records the event with the new host in the `h` key.

### Types

```ts
type CmcdReportFilter = (report: DeepReadonly<Cmcd>, request?: DeepReadonly<HttpRequest>) => boolean

type CmcdSessionEventTarget = {
	url: string
	events: readonly CmcdEventType[]
	enabledKeys?: readonly CmcdKey[]            // default: every event key
	batchSize?: number                          // default 1
	interval?: number                           // seconds. default CMCD_DEFAULT_TIME_INTERVAL (30). 0 turns t reports off
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
	configure(settings: CmcdSessionSettings): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}

function createCmcdSession(config?: CmcdSessionConfig, requester?: (request: HttpRequest) => Promise<{ status: number }>): CmcdSession
```

The names follow `CmcdReporter`: `createRequestReport`, `recordEvent`, `recordResponseReceived`, `enabledKeys`, `eventTargets`, `customHeaderMap`, and the `requester` argument. The default requester is `fetch`.

### Reports

Every report starts from the data of the call. The session then adds the waiting values of that destination, as [Keys with a destination scope](#keys-with-a-destination-scope) describes. Last, it writes `sid` and `sn`. An event report also receives `e`, and `ts` when the data has none. A `sid`, `sn`, or `e` in the data has no effect. The configured `cid` applies when the data has no `cid`. A `b` report with `bg: false` is the exit from backgrounded mode. The session writes that report without `bg`, as CTA-5004-B defines.

The session encodes each report with the rules of `encodeCmcd`. The encoder rounds values, applies the rules of the version and the mode, and adds `v`. It writes `nor` as a path relative to the request URL. Request mode uses the configured `version`. Event mode always uses version 2. Each report keeps the keys in `enabledKeys`, plus the keys that its event requires.

### Requests

`createRequestReport()` returns a copy of the request. In query mode, the first `CMCD` parameter of the URL takes the new value in place, and the session removes the other `CMCD` parameters. In header mode, the headers have the CMCD shards, and `customHeaderMap` places the custom keys. `customData.cmcd` holds the report data before encoding. Each call advances the sequence number of request mode. Version 1 does not send `sn`.

### Events

`recordEvent()` selects its targets first. A target is selected when three conditions hold. It lists the event type, no 410 response stopped it, and its `filter` returns `true`. A target without a `filter` meets the third condition. The filter receives the report data with `e` and `ts` set, and the request when the caller passes one. A filter must not change the data. The `DeepReadonly` types of `CmcdReportFilter` reject a change at any depth.

The session builds a report only for the selected targets. If a filter throws, no target receives the report, and the error goes to the caller. A destination advances its sequence number only for a report that one of its targets receives. The values of the call with a destination scope wait for the next report of each other destination.

Targets with the same URL form one destination. They share one sequence number, the `msd` gate, and the waiting values. Each target keeps its own events, `enabledKeys`, `filter`, `batchSize`, `interval`, and queue.

`recordResponseReceived()` derives `url` without any `CMCD` parameter, and `rc` from `status`. It derives three keys from `resourceTiming`:

- `ts` is the time origin plus `startTime`.
- `ttfb` is `responseStart` minus `startTime`. The session omits `ttfb` when `responseStart` is 0 or earlier than `startTime`. Resource Timing reports 0 for a cross-origin response without the `Timing-Allow-Origin` header.
- `ttlb` is `duration`, when `duration` is above 0.

The method adds the request-time data from `customData.cmcd`, without the keys that have a destination scope. The request report already gave those keys to every destination. The `data` argument overrides the derived keys. It then records an `rr` event and passes the request to the filters.

`recordError()` sends `e=e` with `ec` at once to each selected target that lists `e`. Every other destination receives the codes with its next report, as CTA-5004-B recommends.

### Keys with a destination scope

CTA-5004-B scopes four keys to a destination or to the `sid`, so one report cannot cover them. The session reads them from the data of every call.

| Key | Source | Rule |
|---|---|---|
| `msd` | The data of any call | The first valid value counts. Each destination sends it once, in its next report that can carry it. |
| `bs` | `bs: true` in the data of any call | Each destination sends `bs` with its next report of the same `ot`. A report or a call without `ot` matches every `ot`. |
| `bsd` | The data of any call | Each destination adds the values to one list and sends the list with its next report. |
| `ec` | `recordError()` | Each destination without the `e` report sends the codes with its next report. |

The next report drops a waiting `bs`, `bsd`, or `ec` value that the version or `enabledKeys` does not allow. This rule limits the memory that waiting values use. The session copies each waiting value, including the value inside an `SfItem`. A later change to the data of the caller does not change a waiting value. A valid `msd` is a finite number from 0 to 999,999,999,999,999 after rounding to an integer. The session ignores any other `msd`, as `CmcdReporter` does today.

### Settings and timers

`configure()` replaces `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap` for request mode. It keeps the `sid` and every sequence number. Event targets cannot change after creation.

`start()` arms one timer for each event target whose events include `t` and whose interval is above 0. Each tick records a `t` report with the data from `snapshot()`, and the filter applies. `start()` sends the first `t` report at once, and `start(false)` waits one interval. `stop()` clears these timers. Without `snapshot`, `start()` arms nothing.

### Delivery

A target sends its queue when the queue reaches `batchSize`, and on `flush()`. An `e` report in the queue also makes the target send. One batch is one POST with the content type `application/cmcd`. The lines are joined with a line feed, with no line feed at the end. A target has at most one POST in flight. Lines that arrive meanwhile wait in its queue. After the response, the target checks the send conditions again.

| Response | Action |
|---|---|
| 2xx | Done. The wait resets. |
| 410 | Every target with that URL stops for the life of the session. The session clears their queues and waiting values. It also drops a batch still in flight to that URL. |
| 429, 5xx, a rejected request, or a requester that throws | The batch returns to the front of the queue, and the target waits before its next send |
| Any other status | The batch is dropped. The wait resets. |

The wait starts at 1 second and doubles after each failure, up to 60 seconds. During the wait, new lines join the queue and go out with the retry, also an `e` report. CTA-5004-B recommends this back-off for 429 and 5xx responses. `flush()` sends at once, also during a wait. If a POST is in flight, `flush()` sends after its response. `stop()` clears the wait timers together with the interval timers. After `stop()`, a failure starts no timer.

### Errors

Each call builds and encodes all of its reports before it changes any state. A call that throws therefore changes no sequence number, no waiting value, and no queue.

- A filter that throws stops the report for every target, and the error goes to the caller.
- A value that the structured-field encoder cannot serialize throws from the call that produced it. The session checks the `bs`, `bsd`, and `ec` values of a call before they wait. A waiting value therefore cannot fail a later report.
- An error in a timer tick goes to the timer callback, as in `CmcdReporter` today. The error can come from `snapshot()` or from encoding.
- A failed send does not throw. The delivery table describes what happens instead.

`createCmcdSession()` checks the rules of the configuration that TypeScript types cannot express. It throws on an invalid value. Without these checks, an empty `url` would send the reports to the page URL. An `interval` of `Infinity` would fire the timer without a pause.

| Parameter | Valid values |
|---|---|
| `sid` | A string of 1 to 64 characters |
| `cid` | A string of at most 128 characters |
| `url` of a target | A non-empty string |
| `interval` of a target | A finite number, 0 or more |
| `batchSize` of a target | A positive integer |

The message names the parameter, the valid values, and the received value: `createCmcdSession: eventTargets[1].batchSize must be a positive integer, received 0`.

### Deprecation of `CmcdReporter`

1. Release 2.8.0 fixes `recordResponseReceived()`: a response without a provenance record reports under the current session, as in 2.4.0. hls.js and dash.js can then upgrade before they migrate.
2. The release that adds `createCmcdSession()` marks the exports in the table `@deprecated`. Each notice links to the migration table.
3. Until its removal, `CmcdReporter` accepts bug fixes only.
4. Version 3.0.0 removes the deprecated exports. The removal does not wait for the players to migrate.

| Deprecated export | Kind |
|---|---|
| `CmcdReporter` | class |
| `CmcdReporterConfig`, `CmcdRequestReportConfig`, `CmcdEventReportConfig`, `CmcdReportConfig` | types |
| `CmcdReporterCustomData`, `CmcdTransformRequest`, `CmcdRequestReportTransform`, `CmcdEventReportTransform` | types |
| `CMCD_REQUEST_PROVENANCE`, `CmcdRequestProvenance` | constant and type |

Three related exports stay. The session uses `CMCD_DEFAULT_TIME_INTERVAL`, and dash.js imports it. `CmcdRequestReport` is the result type of `createRequestReport()`. `CmcdReportRecorder` and its transports record HTTP traffic and do not depend on `CmcdReporter`.

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

The prototype writes the same request output as `CmcdReporter`, byte for byte, for the same data. The [design record](../plans/cmcd-reporting-architecture/analysis.md) has the method.

## Drawbacks

- Each player must migrate. It replaces the store with its own state object and adds its own state change checks.
- Until version 3.0.0, the package keeps two implementations of sequence numbers, the `msd` rule, queues, delivery, and timers. A fix or a spec change lands twice.
- A player that imports both APIs during a migration pays for both, as the bundle table shows.
- During a long outage of a collector, the queues of its targets grow without a limit. `CmcdReporter` has the same behavior.
- A target cannot receive data that differs from the data of the other targets. The `bg=?0` opt-in of `CmcdReporter` has no equivalent.
- The session derives no playback keys. Players keep computing `msd`, `bs`, `su`, and `dl`, as they do today.

## Rationale and alternatives

- **Rebuild `CmcdReporter` on the session in a major version.** It gives one implementation and a reporter of 6319 B. It keeps the class, the store, and the automatic events, and the automatic events cause the dash.js failure. CML APIs use `createX` factory functions, so this RFC deprecates the class instead.
- **RFC 455.** It derives keys from pushed state, keeps one reporter for each media player, rotates the `sid`, and attributes late responses through request origins. It measures 9161 B. The players compute that state themselves. This RFC supersedes RFC 455.
- **`CmcdReporter` alone, with fixes.** The store and the automatic events stay, together with their failure cases. Per-target routing still needs `transform`.
- **`transform` instead of `filter`.** About 34 of the 54 transform tests of `CmcdReporter` guard the rewrite rules that the Motivation describes. A predicate needs none of them.
- **Other names for `filter`.** `accept` suggests the HTTP `Accept` header. `include` is a boolean or an array in CML names. `shouldReport` is longer than the other target options. `CmcdEncodeOptions.filter` already uses `filter` for a predicate that keeps an item on `true`.
- **Other names for the API.** In CMCD, "client" names the player, so `createCmcdClient()` is ambiguous. `createCmcdDispatcher()` does not describe request decoration. `createCmcdReporter()` would sit next to the deprecated class, with other behavior, until version 3.0.0.
- **Removal after the players migrate.** It would tie the removal to the schedules of three projects. Until the removal, each fix and each spec change lands twice. A player depends on a fixed version of the package, so version 3.0.0 reaches no player by surprise.
- **`includeOnce()`, or keys derived from `sta`.** A method for the keys with a destination scope adds a call that the key rules make unnecessary. The session could derive `msd`, `bs`, and `bsd` from the play states. shaka-player reports no starting state, though, and dash.js gives `bs` and `bsd` an object type that `sta` does not show.
- **No keys without `enabledKeys`.** This default of `CmcdReporter` makes each player pass the full key list. hls.js, dash.js, and shaka-player all do so. The data of each call already selects the keys.
- **A queue limit.** A limit bounds the memory that a long outage of a collector uses. It also drops reports, and a `batchSize` above the limit never fills. The session has no limit, like `CmcdReporter`.
- **`keepalive` in the default requester.** It lets a send finish after the page closes. Browsers reject a `keepalive` body over 64 KiB, and a batch after an outage can be larger. A player that needs `keepalive` passes its own requester.
- **The retry rule of `CmcdReporter`.** It sends a failed batch again with the next send. During an outage, each new event then sends the whole queue to the failing collector.
- **Timers in the player.** shaka-player 5.2.0 shows the lifecycle risk of timers in the library. Targets have their own intervals, though, so the session needs to know them. `start()` and `stop()` keep the lifecycle explicit.

## Prior art

`CmcdReporter` 2.3.2 and 2.4.0 are the versions that the players adopted. The integrations in hls.js, dash.js, and shaka-player show which parts of the reporter the players use. The review of the transforms RFC (PR 390) defined the dash.js routing need.

## Unresolved questions

None. The review of the RFC PR can add questions.

## Future possibilities

- A factory function for `CmcdReportRecorder`, to follow the `createX` convention.
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
