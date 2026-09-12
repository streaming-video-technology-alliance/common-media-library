# CMCD session API: architecture

Design record for [`rfc/cmcd-session-api.md`](../../rfc/cmcd-session-api.md). The RFC states the public API and its contract. This document states the internal units, their state, the algorithms, the key table, and the test plan. [`comparison.md`](./comparison.md) compares the design with `CmcdReporter` and with PR #422.

Baseline: `main` at `2653a012`, `@svta/cml-cmcd` 2.6.1 plus the unreleased fixes of PR #453 and PR #454.

## Units

| Unit | Owns | Public |
|---|---|---|
| Session | the normalized configuration, replaced in part by `configure()`, the reporters, the current `sid` state, the timers, the visibility listener, and `bg` | `CmcdSession` |
| `sid` state | everything that resets with a `sid`: the targets with their counters, gates, entries, queues, and 410 flags, the session totals, the pending `bsd` samples, and after `rotate()` a copy of each reporter's store | no |
| Reporter | the pushed store, the reported baselines of `sta`, `pr`, `cid`, and `br`, the host, the `su` derivation, and the open starvation span | `CmcdSessionReporter` |
| Target | one destination: `sn`, the `msd` gate, the `bsd` cursor, the per-reporter `bs` flag and `ec` buffer, and for an event target the queue, the back-off, and the 410 flag | no |
| Request origin | the link from a decorated request to its reporter, its `sid` state, the `cid` at issue time, a copy of its per-request data, and its start time | no |
| Preparation | the key table, value normalization, filtering, and encoding | no, `encodeCmcd` moves onto it later |

The request target and the event targets share one state type and one report path. They differ in the encoder output, a query parameter or headers against a body line, and in delivery. The request target has no queue, because the player sends the request.

## Files

One export per file, per the package rule. Names are a starting point for the implementation plan.

| File | Export | Kind |
|---|---|---|
| `createCmcdSession.ts` | `createCmcdSession` | public |
| `CmcdSession.ts`, `CmcdSessionConfig.ts`, `CmcdEventTargetConfig.ts`, `CmcdRequester.ts` | types | public |
| `CmcdSessionReporter.ts`, `CmcdSessionReporterConfig.ts`, `CmcdPlaybackData.ts`, `CmcdMetric.ts`, `CmcdNextObject.ts` | types | public |
| `CmcdRequestLike.ts`, `CmcdDecoratedRequest.ts`, `CmcdRequestRecord.ts`, `CmcdResponseInfo.ts`, `CmcdResourceTiming.ts`, `CmcdResponseData.ts` | types | public |
| `CmcdRequestTransform.ts`, `CmcdEventTransform.ts`, `CmcdDiscreteEventType.ts` | types | public |
| `CmcdEventType.ts` | adds `CMCD_EVENT_HOSTNAME` and `HOSTNAME` | public, existing file |
| `CmcdKeySpec.ts`, `CMCD_KEY_SPECS.ts` | the key table | internal |
| `normalizeValue.ts`, `formatNor.ts` | value normalization | internal |
| `prepareReport.ts` | the table-driven preparation loop | internal |
| `createCmcdSessionState.ts`, `createCmcdSidState.ts`, `createCmcdReporterState.ts`, `createCmcdTargetState.ts` | state factories | internal |
| `deriveStateEvents.ts` | the state-change diff and the transition tracking | internal |
| `assembleReport.ts` | the merge order and the derived defaults | internal |
| `emitReport.ts` | transform, prepare, encode, commit, for one target | internal |
| `deliverBatch.ts` | POST, response handling, back-off | internal |
| `toResponseKeys.ts`, `readCmsdHeaders.ts` | the `rr` derivations | internal |
| `observeVisibility.ts` | the `bg` listener, when `derive.bg` is on | internal |
| `CMCD_REQUEST_ORIGINS.ts` | the `WeakMap` from record to origin | internal |

No module runs code at import time. The key table is an object literal, so it needs no purity annotation. The `WeakMap` is created inside a function that runs on first use, or has the annotation.

## State

### Session

| Field | Type | Notes |
|---|---|---|
| `config` | normalized `CmcdSessionConfig` | defaults applied, lists copied |
| `reporters` | `Set<ReporterState>` | insertion order is creation order |
| `current` | `SidState` | replaced by `rotate()` |
| `timers` | `ReturnType<typeof setInterval>[]` | one per event target with `t` and an interval over 0 |
| `bg`, `bgSupplied` | `boolean \| undefined`, `boolean` | the session value, and whether a push stopped the visibility listener |
| `stopVisibility` | `(() => void) \| undefined` | removes the listener |
| `disposed` | `boolean` | |

### `sid` state

Everything that resets with a `sid`. `rotate()` creates a new one and marks the old one ended.

| Field | Type | Notes |
|---|---|---|
| `sid` | `string` | immutable for this state |
| `ended` | `boolean` | set by `rotate()` and `dispose()`, late reports send at once |
| `requestTarget` | `TargetState` | always present |
| `eventTargets` | `TargetState[]` | one per configured target |
| `bgReported` | `boolean \| undefined` | the last reported `bg` |
| `msd`, `msdSupplied`, `msdStart` | `number \| undefined`, `boolean`, `number \| undefined` | `msdStart` is the `ts` of the first `sta` s, carried by `rotate()` while `msd` is unset |
| `bsa`, `bsda` | `number`, `number` | totals since the `sid` started |
| `pending` | `Map<string, number[]>` | the pending `bsd` samples per cause, automatic spans under the empty key, at most 100 per list |
| `stores` | `Map<ReporterState, Record<string, unknown>>` | filled by `rotate()`, read by late responses |
| `countersSupplied` | `{ bsa?: true; bsda?: true; bsd?: true }` | per-key sticky override |

### Reporter

| Field | Type | Notes |
|---|---|---|
| `session` | `SessionState` | |
| `store` | `Record<string, unknown>` | values as pushed, `undefined` deletes |
| `reported` | `{ sta?, pr?, cid?, br? }` | last reported values, `br` compared by value |
| `host`, `hSupplied` | `string \| undefined`, `boolean` | |
| `su` | `boolean \| undefined` | derived, `undefined` until the first `sta` |
| `suSupplied`, `dlSupplied` | `boolean` | a persistent push stops the derivation |
| `spanOpenedAt` | `number \| undefined` | the `ts` of the last transition into r |
| `disposed` | `boolean` | |

### Target

| Field | Type | Notes |
|---|---|---|
| `kind` | `'request' \| 'event'` | |
| `config` | normalized target configuration | |
| `sn` | `number` | next sequence number |
| `msdSent` | `boolean` | |
| `bsdCursors` | `Map<string, number>` | pending samples per cause delivered to this target |
| `drainRequested` | `boolean` | event targets only, set by `flush()`, `rotate()`, `dispose()`, and a late `rr` |
| `perReporter` | `Map<ReporterState, { bs: boolean; ec: string[] }>` | entry removed on reporter dispose |
| `queue` | `string[]` | event targets only, encoded lines |
| `attempt`, `retryTimer` | `number`, timer handle or `undefined` | back-off state |
| `gone` | `boolean` | set by a 410 |

A target state belongs to one `sid` state. `rotate()` creates new ones from the same configuration.

### Request origin

| Field | Type |
|---|---|
| `reporter` | `ReporterState` |
| `sidState` | the `sid` state current at `decorate()` |
| `cid` | the reporter's `cid` at `decorate()` |
| `data` | a copy of the raw per-request `CmcdPlaybackData`, nested values included |
| `startedAt` | epoch milliseconds at `decorate()` |

The origin is stored in a `WeakMap` keyed by the `CmcdRequestRecord` object. A spread copy of the request keeps the same record object, so the lookup still resolves. JSON produces a new object, so the lookup fails and the response reports under the calling reporter.

## Algorithms

### update(data)

1. If the reporter or its session is disposed, return.
2. Take `ts` from `data`, default `Date.now()`. Do not store it.
3. For `bg`, `msd`, `bsa`, and `bsda` in `data`: write the value on the current `sid` state and set the supplied flag. `bg` is written on the session instead. For `bsd`: append one sample per cause to `pending` and set `countersSupplied.bsd`. Remove these keys from the merge. A pushed `bg` also calls `stopVisibility`.
4. Merge the rest into `store`. Set `suSupplied` or `dlSupplied` when `su` or `dl` is present.
5. Run the transition tracking for `sta` when `data` has `sta` (below).
6. Run the state-change diff (below).

### Transition tracking

Runs when `sta` changes from the previous stored value. `msdStart`, `msd`, `bsa`, `bsda`, and `spans` live on the current `sid` state.

| Transition | Effect |
|---|---|
| into s, with no `msdStart` | `msdStart = ts` |
| into p, with `msdStart` set and `msd` unset | `msd = ts - msdStart`, when `msdSupplied` is false |
| into r | `spanOpenedAt = ts`, `bsa += 1`, set `bs` on every target's entry for this reporter |
| out of r, with `spanOpenedAt` set | add `ts - spanOpenedAt` to `bsda`, append it to the untagged `pending` list when a destination is eligible for `bsd` and `countersSupplied.bsd` is unset, clear `spanOpenedAt` |
| into s, k, or r | `su = true` |
| into p | `su = false` |

`bsa` and `bsda` updates are skipped for a key in `countersSupplied`. The pending list is still fed, because `bsd` may be automatic while `bsda` is supplied.

### State-change diff

For each field in the order `sta`, `pr`, `cid`, `bg`, `br`:

1. Read the current value. `bg` reads the session, the rest read the store.
2. Skip when the value equals the reported value. `br` compares element by element.
3. Skip `pr` when the store's `sta` is not p.
4. Set the reported value, then emit the event to every event target that lists it.

`bg` emits one line per live reporter, like `t`. When `bg` changes to false, the session clears the value before the emit, so the `b` line and later reports carry no `bg`. The others emit one line for the reporter. A `pr` change while paused is picked up on the next diff that runs while `sta` is p, because step 2 still sees a difference.

### Emit(event, reporter, data, request?)

For each event target of the `sid` state that was current when the call began, when it lists the event and is not gone:

1. Assemble the report (below).
2. Run `emitReport` for the target (below). Collect the first thrown error.
3. After every target, process the target queues.
4. Rethrow the collected error. On a timer tick, pass it to `onError` instead, or throw when `onError` is absent.

### Assemble(reporter, target, event?, data?)

Merge in this order, later wins:

1. the reporter's `store`
2. the session data: `sid`, `v`, `bg`, `msd` when the target's gate is open, `bsa`, and `bsda`
3. `bsd`: for each cause, the oldest `pending` sample past the target's cursor, one entry per cause
4. `data`
5. the target's entry for the reporter: `bs` when flagged, `ec` when the buffer is not empty
6. `su` from the reporter when `derive.su` is on, `suSupplied` is false, and the report has no `su`
7. `dl` from `bl / pr` when `derive.dl` is on, `dlSupplied` is false, the report has `bl` and no `dl`, and `pr` is over 0 or absent
8. `e` and `ts` for an event

### emitReport(target, report, event?, request?)

1. When the target has a transform: copy nested values, run the transform, return on `null`, restore a removed required key, re-stamp `sid`, `e`, and `ts`.
2. `report.sn = target.sn`.
3. Prepare (below) and encode. An encoder error propagates, and step 4 does not run.
4. Commit: `target.sn += 1`. When the output has `msd`, `msdSent = true`. Clear the reporter's `ec` entry, and its `bs` entry unless the store's `sta` is r. When the output has `bsd`, advance the target's cursor for each cause it carried. Then drop from each `pending` list the prefix that every eligible destination has passed. A destination is eligible when it is not gone, its `keys` include `bsd`, and, for the request target, the version is 2.
5. Event target: push the line to the queue. Request target: return the prepared data for the URL or the headers.

### decorate(request, data)

1. If disposed, return a copy of the request with a record `{ sid, data: {} }` and no origin.
2. Capture the origin `{ reporter, sidState: current, cid: store.cid, data: a copy of data, startedAt: Date.now() }`. Every later step uses this origin, whatever a transform does.
3. Read the host of `request.url`. When `hSupplied` is false and the host differs from `reporter.host`, set it and emit `h` after step 6.
4. Assemble with the request target of the origin `sid` state and the data copy. Run `emitReport`. A cancelled report leaves the request as is.
5. Copy the request. Remove the `CMCD` query parameter and every header whose name matches `CMCD-` case-insensitively. Query mode: set the `CMCD` parameter. Header mode: set the non-empty shards. `nor` values use `request.url` as the base for the relative path.
6. Create the record `{ sid, data: prepared }`, store the origin, and return `{ ...request, url, headers, cmcd: record }`.

### recordResponse(request, info, data)

1. Resolve the origin from `request.cmcd`. Without one, the origin is the calling reporter and the current `sid` state, with empty data and no start time.
2. Derive the response keys:
   - `url`: `request.url` without the `CMCD` parameter
   - `rc`: `info.status`, or 0
   - `ts`: `timing.startTime` mapped to epoch milliseconds, else `origin.startedAt`
   - `ttfb`: `responseStart - startTime`, omitted when `responseStart` is absent, zero, or under `startTime`
   - `ttlb`: `duration` when over zero, else `responseEnd - startTime` when `responseEnd` is over `startTime`, else `Date.now() - origin.startedAt` when a start time exists, else omitted
   - `cmsds` and `cmsdd`: the `CMSD-Static` and `CMSD-Dynamic` headers, base64 encoded
3. Assemble for each `rr` target of `origin.sidState`, in this order: the origin reporter's store, or its entry in `origin.sidState.stores` when that state has ended. Then that state's session data, `origin.cid`, `origin.data`, the derived keys, and `data`.
4. Emit `rr` with the decorated request as the transform argument.
5. When `origin.sidState` is ended, dispatch its queues at once.

### Tick(target)

For each live reporter in creation order, assemble with `t` and emit to this one target. With no reporters, emit one line from the session data alone. Then process the queue.

### rotate(sid?)

1. If the session is disposed, return.
2. Resolve the `sid`: the argument, or a new UUID. Throw when it is over 64 characters. Return when it equals the current `sid`.
3. Set `drainRequested` on every event target of the current `sid` state, dispatch its queues, and set its `ended` flag.
4. Copy each reporter's store into the old state's `stores`.
5. Create a new `sid` state with new target states from the configuration. Carry `msdStart` when the old state's `msd` is unset and `msdSupplied` is false.
6. For each reporter, clear `reported`. When the store has `sta` r, set `spanOpenedAt` to the rotation time and set `bs` on the reporter's entries in the new targets. Otherwise clear `spanOpenedAt`.
7. Point `current` at the new state. Nothing is emitted.

### configure(settings)

1. If the session is disposed, return.
2. Run the configuration checks on `settings`. Throw on a violation.
3. Replace `version`, `transmissionMode`, `keys`, and `headerMap` in the normalized configuration. The request target reads them at the next `decorate()`. Nothing is emitted, and no counter, gate, or entry changes.

### dispose()

Session: set `disposed`, clear the timers, call `stopVisibility`, mark every reporter disposed, set `ended` on the current `sid` state, and dispatch every queue in full. Reporter: set `disposed`, remove the reporter from `reporters`, and delete its entries in every target. A late response for a disposed reporter still resolves through its origin, because the origin references the reporter object.

## Delivery

Per event target, `processQueue(drain)`:

1. Set `drainRequested` when `drain` is true. Return when the target is gone, the queue is empty, a send is in flight, or a retry timer is armed.
2. Return when the queue is shorter than `batchSize` and `drainRequested` is false.
3. Splice the batch: the whole queue when `drain`, else `batchSize` lines.
4. POST through the requester. Body: lines joined by `\n`. Headers: `Content-Type: application/cmcd` plus the target's headers.

| Result | Action |
|---|---|
| 2xx or 3xx | `attempt = 0`, process the queue again, and clear `drainRequested` once the queue is empty |
| 410 | `gone = true`, `queue.length = 0` |
| 429, 5xx, or rejection | unshift the batch, `attempt += 1`, arm `retryTimer` for `min(1000 * 2 ** (attempt - 1), 60000)` ms, then process the queue with `drain` |
| other 4xx | drop the batch, `attempt = 0`, process the queue again |

`flush()` clears an armed retry timer and processes with `drain`. Once the owning `sid` state has ended, a failure at the 60 second step stops the retries. When the queue is longer than `maxQueueSize` after an unshift or a push, splice the oldest lines off the front.

The default requester: `fetch(url, { method: 'POST', headers, body, keepalive: body.length < 65536 })`, returning `{ status }`. A network error rejects.

## Key table

One row per reserved key of CTA-5004-B Table 1. Empty cells mean not applicable. `both` means request and event mode. The `v1` column gives the version 1 form: `scalar` collapses an object-type list to the entry matching the report's `ot`, else the first entry, and `absent` drops the key.

| key | type | header | modes | round | ot | supersededBy | onlyOn | requiredOn | omitDefault | max | v1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ab | ot-list | Object | both | 1 | | br | | | | | absent |
| bg | boolean | Status | both | | | | | b | false | | absent |
| bl | ot-list | Request | both | 100 | | | | | | | scalar |
| br | ot-list | Object | both | 1 | | | | bc | | | scalar |
| bs | boolean | Status | both | | | | | | false | | |
| bsa | ot-list | Status | both | 1 | | | | | | | absent |
| bsd | ot-list | Status | both | 1 | | | | | | | absent |
| bsda | ot-list | Status | both | 1 | | | | | | | absent |
| cen | string | | event | | | | ce | ce | | 64 | absent |
| cid | string | Session | both | | | | | c | | 128 | |
| cmsdd | string | | event | | | | rr | | | | absent |
| cmsds | string | | event | | | | rr | | | | absent |
| cs | string | Request | both | | | | | | | | absent |
| d | integer | Object | both | 1 | a v av tt c o | | | | | | |
| dfa | integer | Request | both | 1 | | | | | | | absent |
| dl | integer | Request | both | 100 | | | | | | | |
| e | token | | event | | | | | always | | | absent |
| ec | string-list | Status | both | | | | | e | | | absent |
| h | string | | event | | | | | | | 128 | absent |
| lab | ot-list | Object | both | 1 | | lb | | | | | absent |
| lb | ot-list | Object | both | 1 | | | | | | | absent |
| ltc | integer | Request | both | 1 | | | | | | | absent |
| msd | integer | Session | both | 1 | | | | | | | absent |
| mtp | ot-list | Request | both | 100 | | | | | | | scalar |
| nor | string-list | Request | both | | | | | | | | string |
| nr | boolean | Status | both | | | | | | false | | absent |
| ot | token | Object | both | | | | | | | | |
| pb | ot-list | Request | both | 1 | | | | | | | absent |
| pr | decimal | Status | both | | | | | pr | 1 | | |
| pt | integer | Status | both | 1 | | | | | | | absent |
| rc | integer | | event | | | | rr | | | | absent |
| rtp | integer | Status | both | 100 | | | | | | | |
| sf | token | Session | both | | | | | | | | |
| sid | string | Session | both | | | | | | | 64 | |
| smrt | string | | event | | | | rr | | | | absent |
| sn | integer | Request | both | | | | | | | | absent |
| st | token | Session | both | | | | | | | | |
| sta | token | Request | both | | | | | ps | | | absent |
| su | boolean | Request | both | | | | | | false | | |
| tab | ot-list | Object | both | 1 | | tb | | | | | absent |
| tb | ot-list | Object | both | 1 | | | | | | | scalar |
| tbl | ot-list | Request | both | 100 | | | | | | | absent |
| tpb | ot-list | Object | both | 1 | a v av c | | | | | | absent |
| ts | integer | | event | | | | | always | | | absent |
| ttfb | integer | | event | | | | rr | | | | absent |
| ttfbb | integer | | event | | | | rr | | | | absent |
| ttlb | integer | | event | | | | rr | | | | absent |
| url | string | | event | | | | rr | rr | | | absent |
| v | integer | Session | both | | | | | always | 1 | | |

Token values: `e` takes the 19 event tokens, `ot` takes `m a v av i c tt k o`, `sf` takes `d h e s o`, `st` takes `v l ll`, and `sta` takes `s p k r a w e f q d`. `nor` has a `format` function. It makes the path relative to the base URL and wraps the value in a list in version 2. It adds the `r` parameter from a range and percent-encodes the path in version 1. Version 1 also emits `nrr` from the first range. Custom keys are hyphenated, allowed in both modes, typed string or token, limited to 64 characters, and sharded by `headerMap`, default `CMCD-Request`.

### Preparation loop

```text
for key of report keys, sorted:
  spec = CMCD_KEY_SPECS[key] or custom spec, else skip
  skip when spec.modes excludes the mode
  skip when version is 1 and spec.v1 is absent
  skip when spec.onlyOn is set and excludes the event
  skip when spec.ot is set, the report has a valid ot, and spec.ot excludes it
  skip when spec.supersededBy names a key with a non-empty value in the report
  required = spec.requiredOn is always, or includes the event
  skip when the target keys exclude key and not required
  value = normalize(value, spec, version, baseUrl)
  skip when value is empty
  skip when value equals spec.omitDefault and not required
  out[key] = value
```

`normalize` rounds by `spec.round`, or to an integer for `integer` and `ot-list` values without `round`. It turns a number or a per-object-type record into an inner list with parameters, and wraps tokens as `SfToken`. It applies `spec.format`, or the `formatters` option of `encodeCmcd` when present. `encodeCmcd`, `toCmcdHeaders`, and the validators move onto the table in a later plan with no signature change.

## Performance

| Path | Allocations |
|---|---|
| `update()` with no state change | the merge into the store |
| `update()` with one state change | one report object per event target, plus one copy per target with a transform |
| `decorate()` | the report, the prepared object, the request copy, the record, the origin, the copy of `data` |
| `rotate()` | the new `sid` state and its targets, and one store copy per reporter |
| `recordResponse()` | the report per `rr` target |
| tick | one report per reporter per target |
| idle | none |

There is no per-call session lookup, no eviction pass, and no scan of past sessions. A late response follows one `WeakMap` read. `br` comparison in the diff is a loop over a short array.

## Testing

Tests import from `@svta/cml-cmcd` and run against the built package.

| Area | Method |
|---|---|
| Spec conformance | one fixture per scenario in CTA-5004-B section 8: 8.1.1 to 8.1.8, 8.2.1 to 8.2.9, and 8.3. Drive the API with an injected clock and compare the wire string to the spec text, after removing the whitespace the document formatting adds |
| Derivations | one test per row of the derived keys table in the RFC, including the supplied-value override |
| State-change diff | order, dedup, `pr` while paused, `cid` at creation, `bg` on the session, `br` by value |
| Multi-player | two reporters, one `sid`, `sn` continuity per target, one `t` line per reporter, `nr`, reporter dispose |
| Late responses | after `rotate()`, after session dispose, with a spread copy of the request, after a JSON round trip, and with `{ url }` alone. A late `rr` reads the store copied at rotation and the copied per-request data, and a mutated data object does not change it. An ended `sid` state is collectable once its requests are released, checked with a `WeakRef` under `node --expose-gc` |
| Rotation | `sn` restarts per target, the `msd` gate re-arms, baselines reset so the next push emits, the old queue drains at once, a 410 target is active again, the same `sid` is a no-op, and nothing is emitted by the call. `msdStart` is carried while a startup is in progress, an open stall is measured from the rotation, and the new targets start with `bs` |
| Configure | `configure()` replaces the request settings, keeps `sn` and the gates, and throws on a bad setting |
| Stalls | `bs` on every report during a stall and once after recovery, `bsd` one stall per entry per cause in order, a second stall of the same cause waits, the cap at 100, no samples without an eligible destination, prefix reclamation |
| Transform rotation | a transform that calls `rotate()` inside `decorate()` and inside an emission leaves the request and the remaining targets on the old `sid` |
| Requests | re-decoration strips the old `CMCD` parameter and headers, the decorated type compiles for `{ url }`, `CmcdResponseData` accepts `ttfbb` and `smrt` and rejects `sn` |
| Timing | `ttfb` omitted for a zero `responseStart`, `ttlb` from `responseEnd` for a cross-origin entry, the clock fallback measures the call |
| Delivery | mock requester with fake timers: batch size, flush, dispose, 410, 429 back-off sequence, 5xx, rejection, queue cap, `pagehide` keepalive, a drain kept across an in-flight send, and a `batchSize` over `maxQueueSize` throws |
| Errors | configuration checks and their messages, encoder failure commits nothing, throwing transform isolation, `onError` on a tick |
| Validation | every emitted line passes `validateCmcdEvents` or `validateCmcdRequest` |
| Types | `@ts-expect-error` for a state-change type in `recordEvent`, `ce` without `cen`, `version` on an event target, `ec` in `CmcdPlaybackData` |
| Bundle | the bare-import side-effect probe, and a size probe against the baseline in `comparison.md` |

## Sequencing

A suggested order for `steps.md`.

1. The key table, `normalizeValue`, `formatNor`, and `prepareReport`, with the spec fixtures for the wire strings.
2. Session, `sid`, and reporter state, `update()`, the diff, the transition tracking, and `rotate()`.
3. Targets, `emitReport`, and `decorate()`.
4. `recordResponse()` and the origins.
5. Delivery, timers, and `dispose()`.
6. The visibility listener, `onError`, and the configuration checks.
7. Documentation: the user guide section, the README example, the changelog, and the API report review.
8. A follow-up plan moves `encodeCmcd`, `toCmcdHeaders`, and the validators onto the key table.

## Spec gaps found during the design

These are independent of the RFC and can ship as fixes.

| Gap | Where |
|---|---|
| The `h` event token is missing | `CmcdEventType`, `CMCD_TOKEN_VALUES.e`, `validateCmcdStructure` |
| The `e` token for HESP is missing from `sf` | `CmcdStreamingFormat`, `CMCD_TOKEN_VALUES.sf` |
| `cdn` is not a CTA-5004-B key | `CMCD_REQUEST_KEYS`, `CMCD_KEY_TYPES`, `CMCD_HEADER_MAP`, `CMCD_STRING_LENGTH_LIMITS` |

## Open implementation questions

1. Whether `CmcdSession` and `CmcdSessionReporter` are plain objects from a factory or classes. Plain objects match the `create*` pattern of the package and mangle better. Classes give `instanceof`.
2. Whether the request origin should hold the reporter strongly. A strong reference keeps a disposed reporter alive until its requests complete, which is the intended retention.
3. Whether the `t` tick for a session without reporters should emit a line at all.
4. The exact configuration error type: `TypeError` for a wrong type and `RangeError` for a wrong value, or one `Error` with a code.
