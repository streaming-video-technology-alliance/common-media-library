# CMCD session API: performance benchmark

Design record for [`rfc/cmcd-session-api.md`](../../rfc/cmcd-session-api.md). It compares the runtime cost of the session API with `CmcdReporter` in three states. It also records the effect of merging the two preparation passes into one. [`bundle-size.md`](./bundle-size.md) covers the bundle, and the harness is in [`bench/`](./bench/). All numbers were measured on 2026-09-11 against [PR #460](https://github.com/streaming-video-technology-alliance/common-media-library/pull/460) and [PR #422](https://github.com/streaming-video-technology-alliance/common-media-library/pull/422).

## Summary

The session API is the cheapest of the implementations on every per-segment path. The first implementation ran two preparation passes and lost to `main` on the response report by 14 percent. This branch merges the passes into one, and the response report is now 3 percent faster than `main` and allocates 28 percent less.

The one-pass change speeds up every report path by 13 to 20 percent and allocates 8 to 27 percent less. It costs about 335 bytes minified. The wire output is unchanged, checked report by report across four version and mode combinations. The cmcd test suite passes with 698 tests.

A second change caches the request host, so `decorate()` parses a URL only when the authority changes. It removes one URL allocation per decoration, about 100 to 150 bytes. The time effect is within noise, because the host parse was a small part of the decorate path.

A third change relativizes `nor` without re-parsing the base URL on every request. It parses the base once per directory and each `nor` target once, where the first implementation parsed the base twice per request. Every report path that carries `nor` is 5 to 12 percent faster and allocates 350 to 1,300 bytes less. The wire output is unchanged.

The session API is still slower than `main` on three paths that do not matter for a player. Those paths are construction, a metrics-only `update()`, and a stall transition. No implementation leaks.

## Method

### The implementations

| Label | Code | Commit |
|---|---|---|
| `session-merged` | the session API with one preparation pass, this branch | working tree on `1f4fbac2` |
| `session-460` | the session API with two passes, the PR #460 head | `1f4fbac2` |
| `reporter-460base` | `CmcdReporter` from the same tree, unchanged since `2653a012` | `1f4fbac2` |
| `reporter-main` | `CmcdReporter` on `main`, with PR #457 to #459 | `b28716d5` |
| `reporter-422` | `CmcdReporter` restructured by PR #422 | `ffc766a7` |

Each tree was built with `npm ci` and `npm run build` for `libs/utils`, `libs/structured-field-values`, and `libs/cmcd`. The harness imports the built `dist/index.js`, so each implementation runs with the peer packages of its own tree.

### The workload

Every scenario is one player call, or one sequence of calls, driven through the public API. The same configuration applies to every implementation. It is version 2 with one event target that lists `ps`, `e`, `t`, and `rr`. Both APIs get the same request key list and the same event key list. The target has `interval: 0`, so no timer fires, and a batch size of 50. A mock requester resolves every POST with status 200.

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
- Allocation: heap growth over 200 synchronous calls after a forced collection, with any window that contained a collection discarded.
- Retained heap: the heap after 20,000 segment cycles, once every request object was dropped and two full collections ran.
- Passes: each implementation runs in its own process, three passes interleaved across implementations. The table shows the median of the three per-pass medians. The spread between passes was at most 1.28 on every per-segment path.
- Environment: Node v24.21.0, V8 flags `--expose-gc --min-semi-space-size=64 --max-semi-space-size=64`, a 4-core Linux container.

### Wire equivalence

The merge must not change any output. [`bench/diff-wire.mjs`](./bench/diff-wire.mjs) drives a fixed workload of 212 reports through two builds and compares every wire string. The workload covers both versions, both transmission modes, request and per-target transforms, and the legacy `bg=?0` transform. It also covers rotation, `configure()`, errors, custom events, and a second reporter. The two session builds match on all 212 reports once the timestamps that come from the clock are normalized.

## Results

Microseconds per operation, median and 90th percentile, then heap bytes allocated per operation. One interleaved run of all five implementations.

| Scenario | `session-merged` | `session-460` | `reporter-main` | `reporter-422` |
|---|---|---|---|---|
| construct | 11.85 (p90 13.42), 7,259 B | 11.91 (p90 13.36), 7,260 B | 2.84 (p90 3.79), 2,730 B | 3.56 (p90 4.44), 3,834 B |
| update metrics | 0.55 (p90 0.68), 921 B | 0.53 (p90 0.67), 921 B | 0.30 (p90 0.45), 289 B | 0.35 (p90 0.51), 289 B |
| update sta, play and pause | 9.50 (p90 16.77), 8,998 B | 11.35 (p90 17.90), 11,020 B | 18.05 (p90 21.99), 11,295 B | 16.70 (p90 19.27), 11,446 B |
| update sta, stall and recover | 10.56 (p90 11.83), 9,315 B | 13.14 (p90 16.78), 12,731 B | 12.09 (p90 15.94), 11,333 B | 12.18 (p90 16.58), 11,403 B |
| decorate, query | 23.34 (p90 28.53), 19,434 B | 28.96 (p90 38.29), 21,936 B | 33.66 (p90 39.40), 30,164 B | 32.64 (p90 39.64), 30,232 B |
| decorate, headers | 29.97 (p90 39.72), 28,896 B | 34.92 (p90 42.09), 31,364 B | 36.99 (p90 49.81), 35,575 B | 36.35 (p90 39.40), 36,163 B |
| record response | 33.32 (p90 38.08), 22,062 B | 40.70 (p90 46.11), 27,574 B | 34.41 (p90 42.94), 30,572 B | 76.64 (p90 86.48), 34,156 B |
| segment cycle, one event target | 60.73 (p90 68.87), 47,107 B | 70.15 (p90 77.50), 53,132 B | 76.62 (p90 82.28), 62,596 B | 129.22 (p90 139.52), 66,247 B |
| segment cycle, request mode only | 29.47 (p90 37.76), 22,991 B | 31.72 (p90 40.34), 24,684 B | 50.59 (p90 58.20), 43,826 B | 96.53 (p90 101.49), 47,185 B |
| rotate sid | 1.90 (p90 2.34), 2,921 B | 1.86 (p90 2.40), 2,921 B | 2.28 (p90 2.87), 2,574 B | 2.18 (p90 2.72), 2,599 B |
| retained heap after 20k cycles | 37 KB | 51 KB | -38 KB | -25 KB |

`reporter-460base` is left out of the table for width. It matches `reporter-main` except on the response path, where it costs 80.94 microseconds because its tree predates the parser fix in PR #459.

### The effect of merging the two passes

`session-460` against `session-merged`, from the same interleaved run.

| Scenario | Time change | Allocation change |
|---|---|---|
| update sta, play and pause | 16% faster | 18% less |
| update sta, stall and recover | 20% faster | 27% less |
| decorate, query | 19% faster | 11% less |
| decorate, headers | 14% faster | 8% less |
| record response | 18% faster | 20% less |
| segment cycle, one event target | 13% faster | 11% less |
| segment cycle, request mode only | 7% faster | 7% less |

### The effect of caching the request host

`decorate()` derived the host by constructing a URL on every call. It now compares the `scheme://authority` prefix and constructs a URL only when the prefix changes. The measurement is a separate run of the one-pass build against the host-cache build.

| Scenario | One pass | Host cache | Allocation change |
|---|---|---|---|
| decorate, query | 22.74 us, 19,381 B | 22.71 us, 19,265 B | 116 B less |
| decorate, headers | 30.30 us, 29,443 B | 29.12 us, 29,325 B | 118 B less |
| segment cycle, one event target | 59.46 us, 46,276 B | 58.77 us, 46,123 B | 153 B less |
| record response | 33.35 us, 22,061 B | 34.40 us, 22,062 B | none |

The response path does not decorate, and its allocation does not move, which confirms the saving is the URL object that decoration no longer builds. The time change is within the spread between passes. The gain is one fewer allocation per request, which scales with the request rate, at a cost of one regular expression in the source.

### The effect of caching the nor base

`formatNor` derived the base URL with `getBaseUrl`, which parsed the request URL, then called `urlToRelativePath`, which parsed the base again and each `nor` target. That is three URL parses for a single `nor` target. The base is now parsed once, cached per reporter by the request directory, and reused. Each `nor` target still parses once, which the path normalization requires. The measurement is a run of the pre-change build against the change.

| Scenario | Before | After | Change |
|---|---|---|---|
| decorate, query | 22.97 us, 19,318 B | 21.07 us, 18,358 B | 8% faster, 960 B less |
| decorate, headers | 29.21 us, 28,743 B | 27.25 us, 28,394 B | 7% faster, 349 B less |
| record response | 36.69 us, 22,061 B | 32.26 us, 21,202 B | 12% faster, 859 B less |
| segment cycle, one event target | 59.47 us, 46,121 B | 56.70 us, 44,843 B | 5% faster, 1,278 B less |
| segment cycle, request mode only | 28.28 us, 22,961 B | 26.81 us, 21,941 B | 5% faster, 1,020 B less |

The response report carries the request's `nor` in its `rr` line, so it relativizes and benefits too. In the decorate profile the `node:internal/url` self time fell from 4.3 percent to 1.1 percent, and `urlToRelativePath` from `@svta/cml-utils` no longer appears. The remaining URL work is `relativePath`, which parses each `nor` target once.

While inlining the relativization, a pre-existing defect surfaced in the shared `urlToRelativePath`. It mis-relativizes when the base directory has two common path segments, so `https://cdn.example.com/v/1080p/seg-2.m4s` against a same-directory request becomes `../1080p/seg-2.m4s` instead of `seg-2.m4s`. One and three segments are correct. The inlined `relativePath` reproduces the current output exactly, so this change alters no wire bytes. The defect is filed as a separate task, since fixing it changes output and also touches the legacy reporter through the same util.

### The merged session API against `main`

`session-merged` against `reporter-main`, the implementation that ships next.

| Scenario | Time | Allocation |
|---|---|---|
| decorate, query | 31% faster | 36% less |
| decorate, headers | 19% faster | 19% less |
| record response | 3% faster | 28% less |
| segment cycle, one event target | 21% faster | 25% less |
| segment cycle, request mode only | 42% faster | 48% less |

The response path was 14 percent slower than `main` with two passes. It is now 3 percent faster. The gap is closed.

### Retained heap

The heap after the player dropped every request grew by under half a byte per cycle for both APIs, so neither leaks. The request origins of the session API live in a `WeakMap` keyed by the request record, and they are collected with the request. The negative figures for `CmcdReporter` are baseline drift in the standalone process, not a saving.

## Where the time goes

CPU profile of 40,000 operations of the merged build, self time per function, from `node --cpu-prof`.

| Path | Top functions by self time |
|---|---|
| decorate, query | `prepareReport` 11.3%, `decorate` 8.7%, `serializeDict` in the encoder 8.4%, garbage collector 6.4%, `urlToRelativePath` for `nor` 5.2%, `assembleReport` 3.8%, `copyPlaybackData` 3.7% |
| record response | `prepareReport` 12.4%, `assembleReport` 9.6%, `serializeDict` 8.1%, `emitReport` 7.9%, garbage collector 5.8%, `urlToRelativePath` 4.8% |

`prepareReport` is now the single largest function, at 11 to 12 percent. It replaces the `normalizeReport` and `filterReport` pair, plus a third `getKeySpec` sweep, that the two-pass version spent about a quarter of the path on. One sorted pass with one spec lookup per key is what removed that quarter.

Three design differences still explain why the session API beats `CmcdReporter` on the segment paths. It never parses, because it resolves a response through one `WeakMap` read where `CmcdReporter` decodes the provenance snapshot. It encodes once per decoration, where `CmcdReporter` encodes the per-call data a second time for the snapshot. And it edits the URL with one regular expression, where `CmcdReporter` spends about 16 percent of a decoration in `URL` and `URLSearchParams`.

## Bundle cost of the merge

The merged pass is one larger function in place of two smaller ones, so the session entry grew a little.

| Build | Minified | Gzip |
|---|---|---|
| `session-460`, two passes | 27,278 B | 9,124 B |
| `session-merged`, one pass | 27,613 B | 9,307 B |

The cost is 335 bytes minified and 183 bytes gzipped, a 1 to 2 percent rise in the session entry. Performance is the first priority of the package and the bundle is the second, so the trade favors the merge. The rise is small next to the one-table saving in [`bundle-size.md`](./bundle-size.md). That saving is larger for any player that also imports the validators.

## What the numbers mean for a player

A player decorates one request and records one response every 2 to 6 seconds per media type. At 61 microseconds per segment cycle for the merged build, every implementation uses well under 0.01 percent of one core. CPU time does not separate them.

Allocation separates them. Each cycle allocates 47 KB on the merged session API and 63 KB on `main`. Over one hour at one segment every 4 seconds that is 42 MB against 56 MB of young-generation garbage. Both are small next to the media buffers, and the difference is the direction the priorities ask for.

The paths where the session API is slower do not add up to anything. Construction happens once per playback, or once per manifest on dash.js, and costs 12 microseconds. A metrics-only `update()` costs 0.25 microseconds and 632 bytes more than `main`. A player that calls it once per second spends 0.3 ms and 2.3 MB more per hour.

## Recommendations

1. **Merge the two preparation passes. Done on this branch.** `prepareReport` replaces `normalizeReport` and `filterReport` with one sorted pass. It closed the response-path gap and sped up every report path.
2. **Cache the request host. Done on this branch.** `decorate()` compares the `scheme://authority` prefix and parses a URL only when it changes. It removes one URL allocation per request in the steady state.
3. **Cache the nor base. Done on this branch.** `formatNor` parses the base once per directory and reuses it, in place of two base parses per request. Every report path that carries `nor` is 5 to 12 percent faster. A separate task tracks the relativization defect found while doing this.
4. **Rebase PR #422 onto `main`** before comparing it on the response path. Its base predates PR #459. On its own paths the refactor keeps its promise of no new per-report allocation.
5. **Two pre-existing costs in `CmcdReporter`** are worth a fix on `main` whatever happens to the session API. `createEncodingOptions` allocates a `Set` of the enabled keys and a filter closure on every report. The request path parses and re-serializes the URL with `URLSearchParams` for one query parameter.
6. **Add the harness to the review checklist** of the RFC. The bundle probe and this harness together give the two numbers the priorities ask for. Both ran for the first time after the implementation was complete.

## Reproduce

From a tree with `libs/utils`, `libs/structured-field-values`, and `libs/cmcd` built:

```bash
# one implementation, human readable
node --expose-gc --min-semi-space-size=64 --max-semi-space-size=64 plans/cmcd-session-api/bench/bench.mjs --dist libs/cmcd/dist/index.js --api session --label session

# several implementations, three interleaved passes, one markdown table
node plans/cmcd-session-api/bench/run-all.mjs 3 session=session=libs/cmcd/dist/index.js reporter=reporter=libs/cmcd/dist/index.js

# check that two builds produce identical wire output
node plans/cmcd-session-api/bench/diff-wire.mjs /path/to/a/libs/cmcd/dist/index.js libs/cmcd/dist/index.js

# a CPU profile of one scenario, then its summary
node --cpu-prof --cpu-prof-dir=temp --cpu-prof-name=decorate.cpuprofile plans/cmcd-session-api/bench/bench.mjs --dist libs/cmcd/dist/index.js --api session --label session --profile "decorate, query" --ops 40000
node plans/cmcd-session-api/bench/summarize-profile.mjs temp/decorate.cpuprofile
```

`--api reporter` drives `CmcdReporter`. `--dist` accepts the `dist/index.js` of any checkout, so one run can compare several branches.
