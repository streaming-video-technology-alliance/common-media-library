# Option 1: a CMCD client, and `CmcdReporter` rebuilt on it

Date: 2026-10-01. Status: not chosen. `CmcdReporter` is deprecated instead of rebuilt. The session of [the RFC](../../rfc/cmcd-session.md) is based on the client of this option. [option-2.md](option-2.md) lists the later changes. It keeps three rules of the rebuilt reporter. The rules cover the `bg` exit, the `msd` checks, and reports that fail to encode. The evidence for this option is in [analysis.md](analysis.md).

## Summary

- `@svta/cml-cmcd` ships two reporting parts. A new client owns only the state that CTA-5004-B scopes to a session or a destination. `CmcdReporter` keeps its 2.4.0 API and rules, and its code becomes a layer over the client.
- The prototype reporter passes all 68 tests of the 2.4.0 reporter suite. Its request output is byte-identical to the current reporter output.
- The prototype reporter measures 6319 B, against 8423 B for the current reporter. It needs about half the time per request.
- A `filter` predicate on each event target replaces the `transform` that dash.js asked for. dash.js needs to route `rr` reports by request type, and it never rewrites a report.
- The major version removes 6 exports, the request-mode `transform`, `sessionRetention`, and 1 deprecated method. No known adopter uses them.
- hls.js needs no change. dash.js changes one call. shaka ports a smaller vendored copy again.

## The client

The prototype is in [prototype/option-1.md](prototype/option-1.md).

```ts
type CmcdClientConfig = {
	sid?: string                                // default: a new UUID
	version?: CmcdVersion                       // request mode. default CMCD_V2
	transmissionMode?: 'query' | 'headers'      // default 'query'
	keys?: readonly CmcdKey[]                   // request mode. default: every key of the version
	headerMap?: Partial<CmcdHeaderMap>
	targets?: readonly CmcdClientTarget[]
	snapshot?: () => Cmcd                       // the player state for t reports
	requester?: (request: HttpRequest) => Promise<{ status: number }>  // default: fetch with keepalive
}

type CmcdClientTarget = {
	url: string
	events: readonly CmcdEventType[]
	keys?: readonly CmcdKey[]
	batchSize?: number                          // default 1
	interval?: number                           // seconds. default 30. 0 turns t off
	filter?: (data: Readonly<Cmcd>, request?: Readonly<HttpRequest>) => boolean
}

type CmcdClient = {
	readonly sid: string
	request(request: { url: string; headers?: Record<string, string> }, data?: Cmcd): { url: string; headers?: Record<string, string>; cmcd: Cmcd }
	event(type: CmcdEventType, data?: Cmcd, request?: Readonly<HttpRequest>): void
	error(codes: string | readonly string[], data?: Cmcd): void
	once(data: Cmcd): void
	configure(settings: Pick<CmcdClientConfig, 'version' | 'transmissionMode' | 'keys' | 'headerMap'>): void
	start(immediate?: boolean): void
	stop(): void
	flush(): void
}
```

The contract:

- The player passes the full data on every call. The client keeps no store.
- The client writes `sid`, `sn`, `e`, and a default `ts`. The encoder adds `v` and applies every rounding, version, and key rule.
- Each destination has its own `sn`, from 0. Request mode is one destination, and each event target is one destination.
- `once(data)` gives each destination these keys on its next report that can carry them. Lists append, and scalars replace. The player uses it for `msd`, `bs`, and `bsd`. The client ignores a per-call `msd`.
- `error(codes)` sends `e=e` at once to each target that lists `e`. Every other destination receives `ec` on its next report.
- A target sends its queue when the queue reaches `batchSize`, and on `flush()`.
- A 410 response silences every target with that URL for the life of the client. A 429, a 5xx, or a rejected request puts the batch back at the front of the queue. Any other status drops the batch.
- `start()` arms one `t` timer per target and sends the first `t` report at once. `start(false)` skips that first report. `stop()` clears the timers.
- A new `sid` is a new client. The spec resets `sn` on a new `sid`. Before the switch, call `flush()` and `stop()` on the old client.
- Several players can share one client. Each player passes its own `cid`.
- `configure()` changes the request settings. It keeps the `sid` and every `sn`.
- A target with `filter` receives only the reports that `filter` returns `true` for. [Routing instead of transforms](#routing-instead-of-transforms) describes it.

## Routing instead of transforms

dash.js asked for `transform` in the review of the transforms RFC (PR 390). Its setting `eventTargets[].includeInRequests` limits the `rr` reports of a target to some request types, such as `segment` or `mpd`. Two targets can share one collector URL with different filters. dash.js cannot apply that setting to `rr` today, because it records each response once for all targets. In the review, Daniel confirmed that one function per target is enough for this logic.

That logic selects targets. It never changes a report. `filter` has the place and the arguments of `transform`, and it returns a boolean:

```js
const reporter = new CmcdReporter({
	version: 2,
	eventTargets: settings.eventTargets.map((target) => ({
		url: target.url,
		events: target.events,
		enabledKeys: target.enabledKeys,
		batchSize: target.batchSize,
		filter: (data, request) => data.e !== 'rr' || target.includeInRequests.includes(request?.customData?.request?.type),
	})),
}, requester)
```

The contract:

- The client calls `filter` for each target that lists the event, before it builds any report.
- A target that rejects a report keeps its `sn`, its once-data, and its queue.
- `request` is the request that the player passes to `event()`. `CmcdReporter` passes the request of the response for `rr` reports. Other reports have no request.
- `filter` must not change `data`.
- If `filter` throws, no target receives the report, and the error goes to the caller. `CmcdReporter` commits its deduplication after the report, so a retry still sends.
- `t` reports from the timers also go through `filter`.

The prototype ran the example from PR 390. It has two targets on one URL: one for `segment` responses and one for `mpd` responses. Each target received only its request type, with its own `sn` sequence. A throwing `filter` sent nothing, and the retry reached both targets.

`filter` removes most of the transform contract. The current suite has 54 transform tests. About 20 of them describe routing: cancellation, the choice of targets, and the triggering request. The other 34 guard rewriting: restoring required keys, copying nested values, typing `customData`, and isolating errors per target. A predicate cannot remove a key or change a report, so those guards have no work.

The design gives up one capability: a target cannot receive data that differs from the data of the other targets. This also removes the documented opt-in that sends `bg=?0` on the exit from backgrounded mode. No adopter uses either today. If an adopter needs a rewrite later, the client can add one. Its copy and restore rules then apply only to the targets that use it.

## `CmcdReporter` 3.0

The prototype is in [prototype/option-1.md](prototype/option-1.md).

| Member | Implementation on the client |
| --- | --- |
| `constructor(config, requester)` | Creates a client. The store starts with `cid` and `v`. |
| `update(data)` | Merges the data into the store. A new `sid` creates a new client. `msd` goes to `once()`. A changed state field fires its event. |
| `recordEvent(type, data)` | The 2.4.0 deduplication for `sta`, `pr`, `cid`, `bg`, and `br`. Then `client.event()` with the store and the data. |
| `createRequestReport(request, data)` | `client.request()` with the store and the data. Returns a copy of the request with `url`, `headers`, and `customData.cmcd`. |
| `recordResponseReceived(response, data)` | Derives `url`, `rc`, `ts`, `ttfb`, and `ttlb`. Sends `rr` through the current client. |
| `start()`, `stop(flush)`, `flush()` | The client methods. A new `sid` while started re-arms the timers without a first report. |
| `configure(settings)` | New. The client method, so a manifest setting no longer needs a new reporter. |
| `filter` on an event target | New. Passed to the client target. Replaces `transform` on event targets. |
| `isRequestReportingEnabled()` | Unchanged. |

The reporter keeps the fixes that came after 2.4.0 and change the wire:

- The exit from backgrounded mode is a `b` event without `bg`. A first `bg: false` fires nothing.
- `msd` accepts 0, rounds to an integer, and rejects values above the RFC 8941 integer maximum.
- `msd` and `sid` belong to the session. A per-call value has no effect.
- A new `sid` clears an unsent `msd`.

The major version removes or replaces these members:

| Removed or replaced | Added in |
| --- | --- |
| `transform` on event targets, replaced by `filter` | 2.5.0 |
| `transform` on `CmcdReporterConfig`, for request mode | 2.5.0 |
| Types `CmcdRequestReportTransform`, `CmcdEventReportTransform`, `CmcdTransformRequest`, and `CmcdReporterCustomData` | 2.5.0 |
| The `C` type parameter of `CmcdReporter` | 2.5.0 |
| `sessionRetention` | 2.6.0 |
| `CMCD_REQUEST_PROVENANCE` and type `CmcdRequestProvenance` | 2.6.0 |
| `applyRequestReport()`, deprecated since 2.1.0 | 2.0.0 |

hls.js, dash.js, the shaka port, and avia-js use none of these members. dash.js asked for `transform` to route `rr` reports, and `filter` covers that need. A player that skips CMCD on some requests does not call `createRequestReport()` for them, as dash.js does today. A response after a `sid` change reports under the current session, as in 2.4.0.

## Prototype results

| Check | Current reporter | Option 1 reporter |
| --- | --- | --- |
| 2.4.0 reporter suite, 68 tests | 63 pass | 68 pass |
| Current reporter suite, 228 tests | 228 pass | 161 pass |
| Request output, both versions and both modes | reference | byte-identical |
| hls.js response pattern | `rr` dropped | `rr` sent |
| dash.js routing example from PR 390 | works with `transform` | works with `filter` |
| Bundle, min+gzip | 8423 B | 6319 B |

Of the 67 failures in the current suite, 65 test the removed members. The other 2 read a private field of the current class. Their own comment says that the behavior has no observable effect.

| Per call, Node 24 | Request v1 (ns) | Request v2 (ns) | Event `ps` (ns) | Request v2 (heap B) |
| --- | ---: | ---: | ---: | ---: |
| `CmcdReporter` 2.4.0 | 10764 | 12931 | 3030 | 27514 |
| `CmcdReporter`, port branch | 20049 | 19938 | 4116 | 32619 |
| Option 1 `CmcdReporter` | 10430 | 11701 | 3105 | 20031 |
| Option 1 client | 10420 | 11041 | 3062 | 18709 |

The client alone measures 5417 B. That is 1474 B over `encodeCmcd`. A player that imports both parts pays 6329 B, because the reporter contains the client. `filter` adds 54 B to the client. The first draft named it `accept`. [option-2.md](option-2.md) compares the names.

The client query path costs 1.6 to 2.6 µs more than the earlier prototype. It removes an existing `CMCD` parameter with a regular expression, and it encodes with `URLSearchParams` to match the current output. A faster encoder with the same output is possible.

## Changes for each player

| Player | Required change | Optional change |
| --- | --- | --- |
| hls.js, from 2.4.0 | none | Report `bs` through `once()`, if the reporter gets that pass-through. Event targets then receive `bs` too. |
| dash.js, from 2.3.2 | Replace `update({ sta })` followed by `recordEvent(PLAY_STATE, data)` with one `recordEvent(PLAY_STATE, { sta, ...data })` | Apply `eventTargets[].includeInRequests` to `rr` through `filter`. Replace the reporter rebuild for manifest settings with `configure()`. |
| shaka, vendored 2.4.0 | Port the two new files to Closure. They have 439 lines. The 2.4.0 reporter source has 636 lines. | none |

The dash.js change has the same cause in 2.4.0 and later releases. The 2.4.0 deduplication drops the data of a state event that `update()` already fired.

## Release plan

1. Merge the port into `refactor/cmcd-encode` without the token checks, and release the branch as 2.8.0. Add one fix to `recordResponseReceived()`: a response without a provenance record reports under the current session, as in 2.4.0. Players can then upgrade before 3.0 without losing `rr` events.
2. Write an RFC for the client and `CmcdReporter` 3.0. AGENTS.md requires an RFC for a public API change. The RFC replaces RFC 455. Close PR 460, PR 422, and the RFC in PR 398 with a link to it.
3. Add the client in a minor release. The change is additive, so players can try the client early.
4. Release `CmcdReporter` 3.0 on the client, with the removals and a migration guide.
5. Open the upgrade pull requests in hls.js, dash.js, and shaka-player. Each one is small.

## Costs and risks

- The major version needs an opt-in from every adopter. All three players pin an exact version, so no player upgrades by accident.
- The work in PR 460, PR 422, and RFC 455 stops. That work is finished, but the evidence shows that the current adopters do not need it.
- The package documents two reporting parts. Both use one implementation.
- dash.js keeps the deduplication behavior of 2.4.0 and must change one call.
- The prototype is not production code. A real implementation needs a queue limit, a limit on buffered `ec` codes, tests, TSDoc, and a user guide section.

## Decisions needed

- The name of the client. Candidates: `createCmcdClient`, or `createCmcdSession`, because one client is one `sid`.
- The owner of the `t` timers: the client, with `snapshot()` and `start()`, as in the prototype, or the player.
- The retry rule: a return to the queue, as today, or a back-off timer, as in RFC 455.
- The 2.8.0 fix for responses without a provenance record.
- Pass-through methods `once()` and `recordError()` on `CmcdReporter`, for players that want `bs` and `ec` per destination without the client.
- A rewrite step per target. The design leaves it out until an adopter needs one.

## Method

The 2.4.0 suite and the current suite ran unchanged. A loader hook resolved `@svta/cml-cmcd` to the current `dist` build, with `CmcdReporter` replaced by the build under test. The other measurements follow the method of [analysis.md](analysis.md). The measurement scripts ran outside the repository.
