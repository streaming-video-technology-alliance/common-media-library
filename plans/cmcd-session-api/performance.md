# CMCD session API: performance benchmark

Design record for [`rfc/cmcd-session-api.md`](../../rfc/cmcd-session-api.md). It compares the runtime cost of the session API in [PR #460](https://github.com/streaming-video-technology-alliance/common-media-library/pull/460) with `CmcdReporter` in three states. [`bundle-size.md`](./bundle-size.md) covers the bundle. The harness is in [`bench/`](./bench/). All numbers were measured on 2026-09-11.

## Summary

The session API is the cheapest of the four implementations on every per-segment path. It is slower on three paths that do not matter for a player: construction, a metrics-only `update()`, and the stall transitions. The one hot path where it loses is the response report against `main`, by 14 percent. The reason is a preparation loop that sorts the keys twice and looks up each key spec twice.

The refactor in [PR #422](https://github.com/streaming-video-technology-alliance/common-media-library/pull/422) is performance neutral against its base. It allocates 1.1 KB more per construction and nothing more per report. Its base predates the parser fix of PR #459, so until it merges `main` its response path costs 2.2 times the one on `main`.

No implementation leaks. Absolute costs are microseconds per segment, so CPU time is not a concern for any of them. Allocation per segment is the number that matters on low-end devices. The session API allocates 15 percent less per segment cycle than `main`. Without an event target it allocates 44 percent less.

## Method

### The four implementations

| Label | Code | Commit |
|---|---|---|
| `session-460` | `createCmcdSession`, the session API | `1f4fbac2`, the head of PR #460 |
| `reporter-460base` | `CmcdReporter` from the same tree, unchanged since `2653a012` | `1f4fbac2` |
| `reporter-main` | `CmcdReporter` on `main`, with PR #457 to #459 | `b28716d5` |
| `reporter-422` | `CmcdReporter` restructured by PR #422 | `ffc766a7`, the head of PR #422 |

Each tree was built with `npm ci` and `npm run build` for `libs/utils`, `libs/structured-field-values`, and `libs/cmcd`. The harness imports the built `dist/index.js`, so each implementation runs with the peer packages of its own tree.

### The workload

Every scenario is one player call, or one sequence of calls, driven through the public API. The same configuration applies to every implementation. It is version 2 with one event target that lists `ps`, `e`, `t`, and `rr`. Both APIs get the same request key list and the same event key list. The target has `interval: 0`, so no timer fires, and a batch size of 50. A mock requester resolves every POST with status 200. The session API receives plain values. `CmcdReporter` receives the structured-field values its documentation shows, for example `br: [new SfItem(3000, { v: true })]`. The wire output matches key for key, except that the session API adds its derived `dl`.

| Scenario | Calls per operation |
|---|---|
| construct | create the reporter with the configuration, then dispose it |
| update metrics | `update({ bl, mtp, pt })` with changing values, no state-change event |
| update sta, play and pause | `update({ sta })` alternating `p` and `a`, one `ps` event each |
| update sta, stall and recover | `update({ sta })` alternating `r` and `p` |
| decorate, query | one request decoration with `ot`, `d`, `br`, `tb`, and `nor` |
| decorate, headers | the same in header mode |
| record response | one response report for a request decorated before the timed region |
| segment cycle, one event target | update metrics, decorate, record response, and one `ps` event every 25 cycles |
| segment cycle, request mode only | the same without an event target |
| rotate sid | `session.rotate(sid)` or `update({ sid })` |

Two workload choices favor `CmcdReporter`. It receives values that are already in wire form, while the session API normalizes plain values on every report. And the session API derives `dl`, `su`, and the request host on every report, which `CmcdReporter` does not do. The comparison is therefore conservative for the session API.

### The measurement

- Time: each scenario runs in batches of 200 to 1,000 synchronous calls followed by one turn of the event loop. The promise settlements of the mock requester are therefore inside the timed region. Eight batches warm the JIT. Thirty batches are measured, and the table shows the median and the 90th percentile per operation.
- Allocation: heap growth over 200 synchronous calls after a forced collection, with any window that contained a collection discarded. The young generation is fixed at 64 MB so that windows stay collection free.
- Retained heap: the heap after 20,000 and after 100,000 segment cycles, once every request object was dropped and two full collections ran.
- Passes: each implementation runs in its own process, three passes interleaved across implementations. The table shows the median of the three per-pass medians. The spread between passes was at most 1.16 on every per-segment path.
- Environment: Node v24.21.0, V8 flags `--expose-gc --min-semi-space-size=64 --max-semi-space-size=64`, a 4-core Linux container.

## Results

Microseconds per operation, median and 90th percentile, then heap bytes allocated per operation.

| Scenario | `session-460` | `reporter-460base` | `reporter-main` | `reporter-422` |
|---|---|---|---|---|
| construct | 11.98 (p90 14.16), 7,259 B | 2.86 (p90 4.02), 2,730 B | 2.92 (p90 3.87), 2,730 B | 3.95 (p90 5.19), 3,818 B |
| update metrics | 0.55 (p90 0.67), 921 B | 0.31 (p90 0.40), 289 B | 0.29 (p90 0.35), 289 B | 0.31 (p90 0.38), 289 B |
| update sta, play and pause | 10.90 (p90 17.55), 11,023 B | 16.97 (p90 21.45), 11,280 B | 17.02 (p90 21.16), 11,308 B | 17.32 (p90 20.94), 11,437 B |
| update sta, stall and recover | 12.47 (p90 16.83), 12,753 B | 11.72 (p90 14.86), 11,283 B | 11.88 (p90 13.40), 11,287 B | 11.74 (p90 15.04), 11,411 B |
| decorate, query | 25.66 (p90 33.38), 21,916 B | 33.47 (p90 38.12), 30,169 B | 33.66 (p90 38.03), 30,150 B | 32.74 (p90 36.90), 30,235 B |
| decorate, headers | 31.09 (p90 36.60), 31,965 B | 36.96 (p90 42.27), 35,518 B | 36.59 (p90 41.13), 35,484 B | 34.03 (p90 37.72), 36,159 B |
| record response | 40.92 (p90 45.57), 27,549 B | 77.97 (p90 83.14), 34,057 B | 35.80 (p90 38.60), 30,581 B | 78.26 (p90 81.18), 34,151 B |
| segment cycle, one event target | 70.92 (p90 84.82), 53,112 B | 132.34 (p90 146.73), 66,019 B | 81.59 (p90 87.42), 62,572 B | 131.76 (p90 139.31), 66,178 B |
| segment cycle, request mode only | 30.88 (p90 36.41), 24,666 B | 99.99 (p90 105.43), 47,279 B | 52.64 (p90 57.68), 43,835 B | 98.98 (p90 106.03), 47,141 B |
| rotate sid | 1.96 (p90 2.26), 2,921 B | 2.52 (p90 3.04), 2,494 B | 2.29 (p90 2.68), 2,495 B | 2.15 (p90 2.46), 2,702 B |

The session API against `reporter-main`, the implementation that ships next:

| Scenario | Time | Allocation |
|---|---|---|
| construct | 4.1 times slower | 2.7 times more |
| update metrics | 1.9 times slower | 3.2 times more |
| update sta, play and pause | 36% faster | 3% less |
| update sta, stall and recover | 5% slower | 13% more |
| decorate, query | 24% faster | 27% less |
| decorate, headers | 15% faster | 10% less |
| record response | 14% slower | 10% less |
| segment cycle, one event target | 13% faster | 15% less |
| segment cycle, request mode only | 41% faster | 44% less |
| rotate sid | 14% faster | 17% more |

### Retained heap

Bytes retained after the player dropped every request, in standalone processes.

| Cycles | `session-460` | `reporter-main` |
|---|---|---|
| 20,000 | 633,448 | 543,184 |
| 100,000 | 649,264 | 570,800 |

The growth from 20,000 to 100,000 cycles is 16 KB for the session API and 28 KB for `main`. That is under half a byte per cycle, so neither implementation leaks. The request origins of the session API live in a `WeakMap` keyed by the request record, and they are collected with the request.

## Where the time goes

CPU profiles of 40,000 operations, self time per function, from `node --cpu-prof`. The response profiles include the decorations that the scenario prepares before each batch.

### Decorate, query

| `session-460` | Share | `reporter-main` | Share |
|---|---|---|---|
| `serializeDict`, structured-field encoder | 9.6% | `prepareCmcdData` | 10.9% |
| `normalizeReport` | 9.2% | `urlToRelativePath` for `nor` | 9.7% |
| `filterReport` | 7.6% | `createRequestReport` | 9.4% |
| `decorate` | 6.3% | `serializeDict`, structured-field encoder | 8.9% |
| `emitReport` | 5.6% | `URL` and `URLSearchParams` internals | about 16% together |
| `urlToRelativePath` for `nor` | 5.3% | `createEncodingOptions`, a new `Set` per report | 3.9% |
| garbage collector | 5.1% | garbage collector | 2.5% |
| `assembleReport` | 4.5% | | |
| `getKeySpec` | 4.4% | | |
| `copyPlaybackData` | 3.5% | | |

### Record response

| `session-460` | Share | `reporter-main` | Share |
|---|---|---|---|
| `normalizeReport` | 12.1% | `prepareCmcdData` | 12.2% |
| `serializeDict` | 8.5% | `serializeDict` | 10.8% |
| `assembleReport` | 8.3% | `URL` internals | about 6% |
| `filterReport` | 7.8% | `createRequestReport`, from the prepared decorations | 4.7% |
| `emitReport` | 7.5% | `parse`, the structured-field decoder | 4.4% |
| `urlToRelativePath` | 5.2% | `urlToRelativePath` | 4.1% |
| garbage collector | 5.2% | garbage collector | 4.0% |
| `getKeySpec` | 4.6% | `createEncodingOptions` | 3.3% |

Three design differences explain why the session API is faster on the segment paths although it does more work per report:

1. It never parses. `CmcdReporter` attributes a response by decoding the provenance snapshot with the structured-field parser. Before PR #459 that parser built an `Error` on every successful parse, which is the whole gap between `reporter-460base` and `reporter-main` on the response path. The session API resolves the origin with one `WeakMap` read.
2. It encodes once per decoration. `CmcdReporter` encodes the per-call data a second time for the provenance snapshot.
3. It edits the URL with one regular expression and string concatenation. `CmcdReporter` parses the URL with `URL` and serializes `URLSearchParams`, about 16 percent of its decoration.

One design choice explains why the session API loses on the response path against `main`. `normalizeReport` and `filterReport` each sort the keys, and each calls `getKeySpec` for every key. `emitReport` calls `getKeySpec` a third time when a transform is configured. Those three functions are about a quarter of the path.

## What the numbers mean for a player

A player decorates one request and records one response every 2 to 6 seconds per media type. At 71 to 132 microseconds per cycle, every implementation uses well under 0.01 percent of one core. CPU time does not separate them.

Allocation separates them. Each cycle allocates 53 KB on the session API and 63 KB on `main`. Over one hour at one segment every 4 seconds that is 48 MB against 56 MB of young-generation garbage. Both are small next to the media buffers, but the difference is the direction the priorities ask for.

The paths where the session API is slower do not add up to anything. Construction happens once per playback, or once per manifest on dash.js, and costs 12 microseconds. A metrics-only `update()` costs 0.26 microseconds and 632 bytes more than `main`. A player that calls `update()` once per second spends 0.3 ms and 2.3 MB more per hour.

## Recommendations

1. **Merge the two preparation passes in the session API.** One sorted pass over the keys with one `getKeySpec` call per key removes about a quarter of the report path. That closes the 14 percent gap on the response path against `main` and widens the lead on the others. `normalizeReport` and `filterReport` already share the `PrepareContext`, so the change is local.
2. **Cache the request host.** `decorate()` parses the URL with `new URL()` on every call to derive `h`. Comparing the URL prefix with the last one, and parsing only when it differs, removes the parse from the steady state.
3. **Rebase PR #422 onto `main`** before comparing it on the response path. Its base predates PR #459. On its own paths the refactor keeps its promise of no new per-report allocation.
4. **Two pre-existing costs in `CmcdReporter`** are worth a fix on `main` whatever happens to the session API. `createEncodingOptions` allocates a `Set` of the enabled keys and a filter closure on every report. The request path parses and re-serializes the URL with `URLSearchParams` for one query parameter.
5. **Add the harness to the review checklist** of the RFC. The bundle probe and this harness together give the two numbers the priorities ask for. Both ran for the first time after the implementation was complete.

## Reproduce

From a tree with `libs/utils`, `libs/structured-field-values`, and `libs/cmcd` built:

```bash
# one implementation, human readable
node --expose-gc --min-semi-space-size=64 --max-semi-space-size=64 plans/cmcd-session-api/bench/bench.mjs --dist libs/cmcd/dist/index.js --api session --label session

# several implementations, three interleaved passes, one markdown table
node plans/cmcd-session-api/bench/run-all.mjs 3 session=session=libs/cmcd/dist/index.js reporter=reporter=libs/cmcd/dist/index.js

# a CPU profile of one scenario, then its summary
node --cpu-prof --cpu-prof-dir=temp --cpu-prof-name=decorate.cpuprofile plans/cmcd-session-api/bench/bench.mjs --dist libs/cmcd/dist/index.js --api session --label session --profile "decorate, query" --ops 40000
node plans/cmcd-session-api/bench/summarize-profile.mjs temp/decorate.cpuprofile

# the wire output of one decoration per API, to check that the workloads match
node plans/cmcd-session-api/bench/bench.mjs --dist libs/cmcd/dist/index.js --api session --label session --check
```

`--api reporter` drives `CmcdReporter`. `--dist` accepts the `dist/index.js` of any checkout, so one run can compare several branches.
