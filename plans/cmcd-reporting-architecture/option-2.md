# Option 2: a new API next to an unchanged `CmcdReporter`

Date: 2026-10-01. Status: chosen, with one change. `CmcdReporter` is deprecated instead of a later decision. [The RFC](../../rfc/cmcd-session.md) is the current contract, and the numbers below come from an earlier prototype. The evidence is in [analysis.md](analysis.md). [option-1.md](option-1.md) describes the client that this option renames.

## Summary

- `CmcdReporter` keeps its API, its rules, and its code. A new API, `createCmcdSession()`, ships next to it in a minor release.
- The new API is the client of option 1 with the names that `CmcdReporter` already uses. It measures 5616 B. Its request output is byte-identical to the `CmcdReporter` output.
- No player has to change. A player moves to the new API when it wants `filter`, `configure()`, or the smaller bundle.
- The package then keeps two implementations of sequence numbers, the `msd` gate, queues, delivery, and timers. A player that imports both APIs pays 9318 B.
- Option 2 keeps option 1 open. A later major version can rebuild `CmcdReporter` on the new API at the same cost as today.

## The name of the predicate

| Name | For | Against |
| --- | --- | --- |
| `filter` | `true` keeps the report, as in `Array.prototype.filter`. `CmcdEncodeOptions.filter` is already a predicate with that meaning. | `CmcdEncodeOptions.filter` selects keys, not reports. A reader can mix them up. |
| `accept` | It reads as a sentence: the target accepts the report. | It is uncommon for a predicate. In an HTTP library, it suggests the `Accept` header. |
| `include` | It matches player names such as `includeKeys` and `includeInRequests`. | CML uses `include` names for booleans. An `include` option is often an array. |
| `shouldReport` | The name says what `true` means. | It is longer, and the other options of a target are nouns. |

Recommendation: `filter`, with the type name `CmcdReportFilter`. The TSDoc says: "Selects the reports that this target receives. Return `true` to send the report. `enabledKeys` selects the keys." The mix-up has a guard: TypeScript rejects a key filter in that place, because the parameter types differ. The prototype checked this.

## The new API

The prototype is in [prototype/option-2.md](prototype/option-2.md). It passes a strict typecheck.

```ts
type CmcdReportFilter = (report: Readonly<Cmcd>, request?: Readonly<HttpRequest>) => boolean

type CmcdSessionEventTarget = {
	url: string
	events: readonly CmcdEventType[]
	enabledKeys?: readonly CmcdKey[]            // default: every key
	batchSize?: number                          // default 1
	interval?: number                           // seconds. default 30. 0 turns t off
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
	cid?: string                                // default for reports without cid
	eventTargets?: readonly CmcdSessionEventTarget[]
	snapshot?: () => Cmcd                       // the player state for t reports
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

The contract is the contract of the option 1 client, with two changes. A queue keeps at most 500 lines, and the next report of a destination takes all of its waiting keys. [The RFC](../../rfc/cmcd-session.md) is the current contract. The names differ as follows:

| Option 1 client | Option 2 session | Reason |
| --- | --- | --- |
| `request()` | `createRequestReport()` | The `CmcdReporter` name. It returns the same shape, with `customData.cmcd`. |
| `event()` | `recordEvent()` | The `CmcdReporter` name |
| none | `recordResponseReceived()` | The `CmcdReporter` name. It derives `url`, `rc`, `ts`, `ttfb`, and `ttlb`, and it passes the request to `filter`. |
| `error()` | `recordError()` | The verb pattern of the package |
| `once()` | `includeOnce()` | A verb that says what happens: the keys are included once in the next report to each destination |
| `keys`, `targets`, `headerMap` | `enabledKeys`, `eventTargets`, `customHeaderMap` | The `CmcdReporter` names |
| `requester` in the configuration | `requester` as the second argument | The `CmcdReporter` constructor |

Two defaults differ from `CmcdReporter`. Without `enabledKeys`, the session reports every key, in request mode and on each event target. In that case, `CmcdReporter` reports nothing in request mode and only the required keys on a target. A player that calls `createRequestReport()` wants CMCD on that request, so an empty report would be a trap.

The candidates for the API name:

| Name | For | Against |
| --- | --- | --- |
| `createCmcdSession()` | One object is one `sid`, which is a CMCD session in the spec. | RFC 455 used the name for a different design. |
| `createCmcdClient()` | It describes the role in the code. | CMCD means Common Media Client Data, so "client" already names the player. |
| `createCmcdDispatcher()` | It describes event delivery. | It does not describe request decoration. |

Recommendation: `createCmcdSession()`. In this option, the new API also replaces the RFC 455 design. RFC 455 then closes, and the name is free.

## A player on the new API

The player keeps its state in one object and passes it with each call.

```ts
import { CmcdEventType, createCmcdSession } from '@svta/cml-cmcd'

const state = () => ({ sf: 'h', st: streamType(), sta: playerState, pr: media.playbackRate, bl: [bufferLength()], mtp: [bandwidthEstimate() / 1000] })

const session = createCmcdSession({ cid: contentId, version: 2, eventTargets, snapshot: state }, loader)
session.start()

function setPlayerState(next) {
	if (next === playerState) return
	playerState = next
	session.recordEvent(CmcdEventType.PLAY_STATE, state())
}

const report = session.createRequestReport({ url, headers }, { ...state(), ot: 'v', d: 4000, br: [3000], nor: [nextUrl] })
session.recordResponseReceived({ request: report, status, resourceTiming })
session.includeOnce({ msd })
session.includeOnce({ bs: true })
```

The state change check is one comparison. `CmcdReporter` performs it inside `update()` today.

## What stays the same

`CmcdReporter` keeps every feature: the store, the automatic events, `transform`, retention, and provenance. It also keeps both upgrade failures from [analysis.md](analysis.md):

- hls.js loses its `rr` events on 2.6.0 and later.
- dash.js loses the data of its `ps` events on 2.4.0 and later.

The `rr` failure has a fix that breaks nothing. A response without a provenance record reports under the current session, as in 2.4.0. This option still needs that fix in 2.8.0. The `ps` failure comes from the deduplication rule, and dash.js changes one call.

dash.js has two ways to route `rr` reports. It can upgrade `CmcdReporter` to 2.8.0 and use `transform`, the design that Daniel approved. It can also move to the new API and use `filter`.

## Comparison with option 1

| | Option 1 | Option 2 |
| --- | --- | --- |
| Breaking change | yes, a major version | no |
| Implementations of the session state and the delivery | one | two |
| `CmcdReporter`, min+gzip | 6319 B | 8423 B |
| New API, min+gzip | 5417 B | 5616 B |
| Both in one bundle | 6329 B | 9318 B |
| hls.js `rr` events after an upgrade | sent | sent with the 2.8.0 fix |
| dash.js `ps` data after an upgrade | one call changes | one call changes, or dash.js moves to the new API |
| Work for the players | upgrade pull requests | none |

## Costs

- The new API has 158 lines of implementation. Almost all of them repeat work that `CmcdReporter` does internally. Every spec change and every fix lands twice, and the two implementations can drift apart.
- A player that imports both APIs pays 895 B more than with `CmcdReporter` alone. A player migrates over time, so both APIs can be in one bundle for a while.
- `CmcdReporter` keeps 1339 lines and 228 tests.
- The documentation must say which API to choose.
- The package adds 6 exports: the function and 5 types.

## Path to option 1

Option 2 can be the first step of option 1:

1. Release 2.8.0 with the `rr` fix, and accept no new features in `CmcdReporter`.
2. Release the new API in a minor version.
3. When the players have used the new API, decide the future of `CmcdReporter`. A deprecation is one choice. A rebuild on the new API in 3.0, as in option 1, is the other.

The rebuild costs the same later, because the option 1 reporter is a layer over this API. Without a decision date, the duplication and the choice between two APIs stay permanent.

## Decisions needed

- The predicate name. The recommendation is `filter`.
- The API name. The recommendation is `createCmcdSession()`.
- The name of `includeOnce()`.
- The default for a missing `enabledKeys`.
- The 2.8.0 fix for responses without a provenance record.
- A feature freeze for `CmcdReporter`, and a date to decide its future.

## Method

The prototype passed a strict typecheck. Its request output matched `CmcdReporter` on the port branch byte for byte. The check covered both versions and both modes, with the same data. Daniel's example from PR 390 ran through `recordResponseReceived()`. A typecheck probe confirmed that TypeScript rejects a key filter in the place of a report filter. The bundle method is in [analysis.md](analysis.md). The measurement scripts ran outside the repository.
