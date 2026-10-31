---
title: Session Guide
description: How to report CMCD from a player with createCmcdSession
---

# CMCD Session Guide

`createCmcdSession()` reports Common Media Client Data (CMCD) from a media player. In request mode, it adds CMCD data to media requests. In event mode, it sends event reports to collectors. One session reports one session ID (`sid`).

The session keeps only the state that CTA-5004-B scopes to a session or to a destination. The player keeps its own state. It passes its CMCD data with each call and decides itself when its state changes.

## Create a Session

```typescript
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	cid: 'movie-42',
	eventTargets: [{
		url: 'https://collector.example.com/cmcd',
		events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR],
		batchSize: 5,
	}],
}, async (request) => {
	console.log(request.url, request.body)
	return { status: 200 }
})

console.log(session.sid)
```

The session generates a `sid` when the configuration has none. The second argument sends the event reports, so pass the HTTP client of the player there. Without it, the session sends with `fetch`, without the `keepalive` option.

The configuration types are `CmcdSessionRequestReportConfig` for request mode and `CmcdSessionEventReportConfig` for each event target. Both derive from the `CmcdReporter` types without `transform`. A configuration with a `transform` does not compile. Use `filter` on an event target to select the reports of the target. An event target has a collector `url` or a `send` function. The section [Send Reports Without HTTP](#send-reports-without-http) describes `send`.

Request mode is one destination. Each event target is one destination, also when two targets have one URL. Each destination has its own sequence number (`sn`), which starts at 0.

To change the `sid`, create a new session. Call `flush()` and `stop()` on the old session first. If the player keeps the old session, it can record late responses under the old `sid`.

## Pass the State on Every Call

The player builds its CMCD data from its own fields and passes the data with each call. A state change check is one comparison.

```typescript
import type { CmcdSnapshot } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'

let playerState: CmcdPlayerState = CmcdPlayerState.STARTING
const bufferLength = 21300
const bandwidth = 25_000_000

const state = (): CmcdSnapshot => ({ sf: 'h', st: 'v', sta: playerState, bl: [bufferLength], mtp: [bandwidth / 1000] })

const session = createCmcdSession({
	cid: 'movie-42',
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

session.stop()
```

The second `setPlayerState()` call sends nothing, because the state did not change. `start()` sends the first `t` report at once and then one report every 30 seconds. `start(false)` waits one interval before the first report. `stop()` clears the timers.

`snapshot()` supplies the data of the `t` reports only. Every other report uses only the data of its call. Type the state function as `CmcdSnapshot`, so that one function serves both. The type rejects the keys that the session writes: `sid`, `sn`, `e`, `v`, and the `ts` of a `t` report. It also rejects `bs` and `bsd`, because they report one stall. `ec` goes to `recordError()`, and only a `ce` event can have `cen`.

## Decorate Requests

```typescript
import { CmcdObjectType, CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({ sid: 'session-1' })

const report = session.createRequestReport(
	{ url: 'https://cdn.example.com/movie/seg-2.m4s' },
	{ ot: CmcdObjectType.VIDEO, d: 4000, br: [3000], nor: ['https://cdn.example.com/movie/seg-3.m4s'] },
)

console.log(decodeURIComponent(report.url))
// https://cdn.example.com/movie/seg-2.m4s?CMCD=br=(3000),d=4000,nor=("seg-3.m4s"),ot=v,sid="session-1",sn=0,v=2

session.configure({ transmissionMode: CmcdTransmissionMode.HEADERS })

const next = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-3.m4s' }, { ot: CmcdObjectType.VIDEO })

console.log(next.headers['CMCD-Request'])
// sn=1
```

`createRequestReport()` returns a copy of the request:

- In query mode, the first `CMCD` parameter of the URL takes the new value in place. The session removes the other `CMCD` parameters. The other parameters and the fragment stay.
- In header mode, the session replaces the CMCD headers of the request. `customHeaderMap` places the custom keys.
- `customData.cmcd` holds the report data before encoding.
- The session writes `nor` as a path relative to the request URL.
- Each call advances the sequence number of request mode. Version 1 does not send `sn`.
- Without `enabledKeys`, the report has every key of the version.

`configure()` replaces `version`, `transmissionMode`, `enabledKeys`, and `customHeaderMap` for request mode. It keeps the `sid` and every sequence number. Event targets cannot change after creation.

## Record Events and Responses

`recordEvent()` sends a report to each event target that lists the event type. The session adds `e`, and `ts` when the data has none. It writes `sid` and `sn` last. The data types of all methods leave out `sid`, `sn`, `e`, `v`, and `ec`. In JavaScript, a `sid`, `sn`, or `e` in the data has no effect. The configured `cid` applies when the data has no `cid`. A `b` report with `bg: false` is the exit from backgrounded mode, so the session writes it without `bg`.

`recordResponseReceived()` records an `rr` report. The session derives these keys:

| Key | Source |
|---|---|
| `url` | The request URL without the `CMCD` parameter |
| `rc` | `status` |
| `ts` | The time origin plus `resourceTiming.startTime` |
| `ttfb` | `responseStart` minus `startTime`, when `responseStart` is above 0 and not earlier than `startTime` |
| `ttlb` | `duration`, when it is above 0 |

Resource Timing reports 0 for the `responseStart` of a cross-origin response without the `Timing-Allow-Origin` header. The session then omits `ttfb`.

The report also has the request-time data from `customData.cmcd`. The `data` argument overrides the derived keys. Pass the keys that the session cannot derive there, for example `ttfbb`, `cmsdd`, and `cmsds`.

```typescript
import { CmcdEventType, CmcdObjectType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	eventTargets: [{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.RESPONSE_RECEIVED] }],
}, async (request) => {
	console.log(request.body)
	return { status: 200 }
})

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-1.m4s' }, { ot: CmcdObjectType.VIDEO, br: [3000] })

session.recordResponseReceived({
	request: report,
	status: 200,
	resourceTiming: { startTime: 1200, responseStart: 1280, duration: 400, encodedBodySize: 512000 },
}, { ttfbb: 95 })
```

## Errors, Startup Delay, and Stalls

`recordError()` sends an `e` report at once to each event target that lists `e`. Every other destination, request mode included, sends the error codes in `ec` with its next report.

Three more keys have a scope that one report cannot cover. The player passes them in the data of any call. The session sends them to every destination:

| Key | Rule |
|---|---|
| `msd` | The first valid value counts. Each destination sends it once, in its next report that can carry it. |
| `bs` | Each destination sends `bs` with its next report of the same object type. A report or a call without `ot` matches every object type. |
| `bsd` | Each destination adds the values to one list and sends the list with its next report. |

A valid `msd` is a finite number from 0 to 999,999,999,999,999 after rounding to an integer. The session ignores any other `msd`. The next report drops a waiting `bs`, `bsd`, or `ec` value that the version or `enabledKeys` does not allow. The session copies each waiting value, so a later change to the data of the caller does not change it.

Pass `bs` and `bsd` once, in the data of the call that reports the stall. If the state object of the player keeps `bs: true`, each call reports the stall again. `CmcdSnapshot` rejects both keys, and a tick ignores them. `msd` can stay in the state object, because only its first valid value counts.

```typescript
import { CmcdEventType, CmcdObjectType, CmcdPlayerState, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
	eventTargets: [
		{ url: 'https://collector.example.com/errors', events: [CmcdEventType.ERROR] },
		{ url: 'https://collector.example.com/cmcd', events: [CmcdEventType.PLAY_STATE] },
	],
}, async (request) => {
	console.log(request.url, request.body)
	return { status: 200 }
})

session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, msd: 850 })
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.REBUFFERING, bs: true })
session.recordError('MEDIA_ERR_NETWORK')
session.recordEvent(CmcdEventType.PLAY_STATE, { sta: CmcdPlayerState.PLAYING, bsd: [1200] })

const report = session.createRequestReport({ url: 'https://cdn.example.com/movie/seg-4.m4s' }, { ot: CmcdObjectType.VIDEO, d: 4000 })
console.log(decodeURIComponent(report.url))
```

The error target receives `e=e` with `ec`, `msd`, and `bs`. The other target receives each of the four keys once, with its `ps` reports. The request report has `msd`, `bs`, `bsd`, and `ec`.

## Select Reports with `filter`

A `filter` on an event target returns `true` for each report that the target receives. It runs before the session builds the report, so a rejected report uses no sequence number. For `rr` reports, the filter also receives the request of the response. A filter must not change its arguments, and its `DeepReadonly` types reject a change at any depth.

```typescript
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const settings = [
	{ url: 'https://collector.example.com/cmcd', includeInRequests: ['segment'], batchSize: 10 },
	{ url: 'https://collector.example.com/cmcd', includeInRequests: ['mpd'], batchSize: 1 },
]

const session = createCmcdSession({
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

## Send Reports Without HTTP

An event target has a collector `url` or a `send` function. The session calls the function with each batch, oldest report first. Use a function for a transport that is not HTTP, such as a MoQ track or a WebSocket.

```typescript
import type { CmcdEventSender } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdReportingMode, createCmcdSession, encodeCmcd } from '@svta/cml-cmcd'

async function publishRecords(records: { timestamp: number; line: string }[]): Promise<void> {
	console.log(records)
}

const send: CmcdEventSender = async (reports) => {
	await publishRecords(reports.map((report) => ({
		timestamp: report.ts,
		line: encodeCmcd(report, { reportingMode: CmcdReportingMode.EVENT }),
	})))
}

const session = createCmcdSession({
	eventTargets: [{ send, events: [CmcdEventType.PLAY_STATE, CmcdEventType.ERROR] }],
})

session.recordEvent(CmcdEventType.PLAY_STATE, { sta: 'p' })
```

Each report is the data of one event. The session has applied `enabledKeys`, the `filter`, and the waiting values, and has written `e`, `sid`, `sn`, `ts`, and `v`. A token value is an `SfToken`, and an inner list is an array. A function that needs the encoded line calls `encodeCmcd()` on the report with the event reporting mode. Without the mode, `encodeCmcd()` encodes in request mode and drops `e` and `ts`.

The promise takes the place of the HTTP response. A promise that resolves means that the batch is delivered. A result of `{ gone: true }` stops the target, as a 410 response does. A promise that rejects sends the batch again after a wait, as a 5xx response does. The function must not change a report, and the `DeepReadonly` type rejects a change.

## Several Players, One Session

Several media players can share one session, because the session keeps no state for a player. Each player passes its own `cid`. During an interstitial, the primary player and the ad player report under one `sid`, with one sequence for each destination. The `t` reports read one `snapshot()`, so they carry the state of one player.

```typescript
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const session = createCmcdSession({
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

## Delivery

A target sends its queue when the queue reaches `batchSize`, and on `flush()`. An `e` report in the queue also makes the target send. For a `url` target, one batch is one POST with the content type `application/cmcd`. The lines are joined with a line feed, with no line feed at the end. For a `send` target, one batch is one call of the function with the reports, oldest first.

A target has at most one batch in flight. Reports that arrive meanwhile wait in its queue. After the response, or after the promise settles, the target checks the send conditions again.

| Response | Action |
|---|---|
| 2xx | Done. The wait resets. |
| 410 | The target stops for the life of the session. The session clears its queue and waiting values and drops a batch in flight. Another target with the same URL stops when its own POST receives 410. |
| 429, 5xx, status 0, a rejected request, or a requester that throws | The batch returns to the front of the queue, and the target waits before its next send. |
| Any other status | The session drops the batch. The wait resets. |

The promise of a `send` function takes the place of the response. A promise that resolves counts as 2xx. A result with `gone: true` counts as 410. A promise that rejects, or a function that throws, counts as a rejected request. No result drops a batch. A function that cannot deliver a batch resolves.

For a `send` target, the session copies the nested values of each report at queue time. A later change to the data of the caller does not change a queued report. The function must not change a report. The `DeepReadonly` type of `CmcdEventSender` rejects a change at any depth, as the type of `CmcdReportFilter` does.

The wait starts at 1 second and doubles after each failure, up to 60 seconds. During the wait, new reports join the queue and go out with the retry. `flush()` sends at once, also during a wait. If a batch is in flight, `flush()` sends after that batch completes. `stop()` clears the wait timers together with the interval timers. After `stop()`, a failure starts no timer.

During a long outage of a collector, the queues of its targets grow without a limit.

## Errors

Each call builds and encodes all of its reports before it changes any state. A call that throws changes no sequence number, no waiting value, and no queue.

- If a filter throws, no target receives the report, and the error goes to the caller.
- A value that the structured field encoder cannot serialize throws from the call that has it. A `send` target gets the same check. The session encodes the report, discards the line, and queues a copy of the report.
- An error in a timer tick, from `snapshot()` or from encoding, goes to the timer callback.
- A failed send does not throw. The [delivery](#delivery) table describes what happens instead.

`createCmcdSession()` throws for these configuration values:

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
