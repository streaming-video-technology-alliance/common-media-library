# CMCD reporting architecture: evidence and options

Date: 2026-10-01. Status: analysis for a decision. Scope: `CmcdReporter`, the session API (RFC 455, PR 460), and the encoder normalization.

The question: players control their own state, and TypeScript types describe each key. Is `CmcdReporter` too large for the players that use it? Is the encoder normalization necessary? Is a smaller architecture possible next to `CmcdReporter`?

## Summary

- All three large web players adopted `CmcdReporter` between May and July 2026. They use cmcd 2.3.2 or 2.4.0.
- Since 2.4.0, the reporter code grew 1.7 times and its documented rules and tests grew 3 times. Its bundle cost over the encoder doubled. No player uses the added features yet. dash.js asked for one of them, transforms, to route `rr` reports by request type.
- Two reporter changes break the current player integrations on upgrade. The 2.4.0 deduplication breaks dash.js, and the 2.6.0 provenance rule breaks hls.js and dash.js. The experiments reproduce both failures.
- The players depend on the encoder normalization. They pass raw floats and version 2 shapes, and TypeScript types cannot express the rules. The validation-only checks have no evidence of need.
- CTA-5004-B scopes a small set of state to a session or a destination. A client that owns only that state measures 1445 B over the encoder. The reporter on the port branch measures 4480 B.
- Recommendation: add that client, stop the session API and the reporter refactor (PR 422), and rebuild `CmcdReporter` on the client.

## Adoption

| Adopter | API | cmcd version | Since |
| --- | --- | --- | --- |
| hls.js | `CmcdReporter` | 2.4.0 | 2026-05-27, hls.js PR 7725 |
| dash.js | `CmcdReporter` | 2.3.2 | 2026-05-19, dash.js PR 4816 |
| shaka-player | `CmcdReporter`, Closure port in `third_party/cml-cmcd` | 2.4.0 | 2026-07-01, shaka PR 10060 |
| avia-js | `encodeCmcd`, `appendCmcdQuery`, `decodeCmcd` | 2.7.0 | local clone |

The shaka port replaced its own encoder, state machine, sequence numbers, and event timers. Its manager went from 1705 lines to 1236 lines. Later features brought it to 1663 lines.

GitHub code search found no other direct use of `CmcdReporter`. Most results for `@svta/cml-cmcd` are lockfiles of applications that install hls.js. One hand-written version 2 reporter (Eyevinn player-analytics-demo) posts JSON. It also uses event codes that CTA-5004-B does not define: `st`, `se`, `cc`, and `er`.

## Features the players use

| Reporter feature | hls.js | dash.js | shaka-player |
| --- | --- | --- | --- |
| `createRequestReport` | yes | yes | yes |
| `recordResponseReceived` | yes | yes | yes |
| `recordEvent` | yes | yes | yes |
| `update()` store | yes | yes | yes |
| Automatic state-change events (2.4.0) | `ps`, `pr` | not in 2.3.2 | `ps`, `bc`, `b` |
| Interval timers through `start()` and `stop()` | yes | yes | yes |
| Custom requester | yes | yes | yes |
| Transforms (2.5.0) | no | requested, not adopted | no |
| Session retention and provenance (2.6.0) | no | no | no |
| `customHeaderMap` | no | no | no |

Each player still computes every metric itself and maps its own events to CMCD calls. All three compute `su` themselves. hls.js and dash.js keep their own flag for `bs`, and shaka does not send `bs`.

## Growth since adoption

| Version | Reporter lines | Comment lines | Reporter tests | Reporter over its encoder (B) |
| --- | ---: | ---: | ---: | ---: |
| 2.3.2 (dash.js) | 486 | 127 | 40 | 2074 |
| 2.4.0 (hls.js, shaka) | 636 | 191 | 68 | 2194 |
| 2.7.0 (latest release) | 1321 | 563 | 210 | 4362 |
| Port branch | 1339 | 572 | 217 | 4480 |
| Client prototype | 201 | 12 | 0 | 1445 |

Since 2.4.0, the package maintainer opened every reporter issue and pull request. Adopter input came from dash.js twice. Issue 357 asked for a body transmission mode, a place for the response keys, and the behavior for an invalid URL. In the review of the transforms RFC (PR 390), dash.js asked to route `rr` reports to targets by request type. [option-1.md](option-1.md) covers that need with a predicate per target.

## Upgrade failures

The experiment calls each build the way the player calls it.

| Integration pattern | 2.3.2 | 2.4.0 | 2.7.0 | Port branch |
| --- | --- | --- | --- | --- |
| hls.js records a response with only `{ url }` | `rr` sent | `rr` sent | `rr` dropped | `rr` dropped |
| dash.js calls `update({ sta })`, then `recordEvent(PLAY_STATE, data)` | data kept | data lost | data lost | data lost |

The `rr` failure comes from the provenance rule of 2.6.0. The lost data comes from the deduplication of 2.4.0. RFC 455 lists a third failure. The configuration is fixed at construction, so both players rebuild the reporter and reset `sid` and every `sn`.

shaka 5.2.0 shipped a regression from the reporter lifecycle. CMCD stopped after the first `load()`, because the reporter owns the timers and shaka tore it down on unload. Issue 10414 reported it, and PR 10416 fixed it.

## Encoder normalization

The players depend on the normalization:

- hls.js passes `br`, `bl`, `mtp`, `d`, `tb`, `lb`, `pb`, and `tpb` as raw floats.
- hls.js passes lists in version 1 mode, which is its default. The encoder converts them.
- shaka passes raw floats for `mtp` and `dl`.
- dash.js rounds bitrates and durations itself.

TypeScript does not help here. dash.js is JavaScript, and shaka is JavaScript with Closure annotations. The type `number` cannot express an integer or a step of 100. It also cannot express a list in version 2 and a scalar in version 1.

The missing rounding reaches production today. With hls.js input, the 2.4.0 encoder writes decimals for three integer keys:

| Encoder | `lb`, `pb`, `tpb` on the wire |
| --- | --- |
| 2.4.0, used by hls.js and shaka | `lb=(499.712)`, `pb=(2499.968)`, `tpb=(7999.872)` |
| Base and port branches | `lb=(500)`, `pb=(2500)`, `tpb=(8000)` |

Keep the normalization and the key rules. The token checks are different. They only validate, and no adopter sends an invalid token, because the players use the CML constants. Dropping the token checks saves about 110 B. This result reverses the recommendation on optimization 3 in [optimizations.md](../cmcd-encode-pipeline-port/optimizations.md). The length limits cost about 14 B and check strings from the application, such as `cid`. Keep them.

## Cost per call

| Implementation | Request v1 (ns) | Request v2 (ns) | Event `ps` (ns) | Request v2 (heap B) |
| --- | ---: | ---: | ---: | ---: |
| `CmcdReporter` 2.3.2 | 10493 | 12636 | 2889 | 27536 |
| `CmcdReporter` 2.4.0 | 10666 | 13009 | 3008 | 27514 |
| `CmcdReporter`, port branch | 19820 | 19856 | 4152 | 32618 |
| Client prototype, port encoder | 9335 | 9542 | 3256 | 14643 |
| `encodeCmcd` alone, port encoder | 7964 | 8891 | not applicable | 13724 |

The current reporter costs 1.5 to 1.9 times the 2.4.0 reporter per request. The provenance record accounts for 5.2 to 5.8 µs of that growth, because it encodes each request a second time. The client costs about the same as the encoder alone.

The absolute cost is small. With 6 s segments and separate audio, a player sends one request every 3 s. Low-latency HLS with 1 s parts sends about 4 requests per second. At 20 µs per request, 4 requests per second use 0.008% of one core on the test machine. The bundle reaches every player, so the bundle is the main cost.

The `prepareCmcdData` step is 2 to 3 µs of these totals. URL work is a larger item. A relative `nor` costs about 7 µs more per request than an absolute `nor`. The reason is that `urlToRelativePath` detects a relative URL with a `new URL()` call that throws. A thrown parse costs 4326 ns in Node 24. `URL.canParse()` costs 69 ns.

## Bundle sizes

| API (min+gzip, dependencies included) | Bytes |
| --- | ---: |
| `encodeCmcd` 2.4.0 | 2630 |
| `encodeCmcd`, port branch | 3943 |
| `CmcdReporter` 2.3.2 | 4607 |
| `CmcdReporter` 2.4.0 | 4824 |
| `CmcdReporter` 2.7.0 | 7507 |
| `CmcdReporter`, port branch | 8423 |
| Session API, PR 460 | 9161 |
| Client prototype with the response helper, port encoder | 5388 |

## Ownership of state

| State | CTA-5004-B scope | Owner |
| --- | --- | --- |
| `sid` and `sn` | `sn` per mode and target, reset on a new `sid` (MUST) | client |
| `msd` gate | once per `sid`, for each active mode (MUST) | client |
| `bs` | per destination, since the prior report | client keeps the flag, player reports the stall |
| `bsd` | once per mode and destination (MUST) | client keeps the gate, player gives the value |
| `ec` buffer | per destination, until the next report (should) | client |
| Batches, 410, 429 | per target | client |
| Rounding, version rules, mode rules, key rules | per report | encoder |
| `sta`, the `msd` value, `bsa`, `bsda`, `su`, `dl`, `bg`, `h`, state changes | playback | player |

A player cannot keep state per destination without knowledge of the targets. The players show this. The `bs` flags of hls.js and dash.js clear on the next request, so an event target never receives `bs`. A player already knows its playback state, because its own events produce that state.

The three players compute `msd` in three ways. dash.js uses the interval from starting to playing that the spec recommends (dash.js PR 5110). shaka measures from the `load()` call. hls.js does not send `msd`. Shared derivation would make the values consistent, but no player asked for it. Documentation or a small helper can do that later.

## Client prototype

The prototype is in [prototype/analysis-client.md](prototype/analysis-client.md).

```ts
const client = createCmcdClient({
	cid: 'movie-42',
	version: 1,
	targets: [{ url: 'https://collector.example.com/cmcd', events: ['ps', 'e', 't', 'rr'], interval: 30 }],
	snapshot: () => player.getCmcdState(),
})

const req = client.request({ url: segment.url }, { ...player.getCmcdState(), ot: 'v', d: 4000 })
client.event('ps', { ...player.getCmcdState(), sta: 'r' })
client.once({ bs: true })
client.error('MEDIA_ERR_NETWORK')
client.event('rr', toCmcdResponseData(req.url, 200, timing))
client.configure({ version: 2 })
client.dispose()
```

The client keeps `sid`, one `sn` for each destination, the data that each destination receives once, and the event queues. It has no store, no automatic events, no deduplication, no provenance, no retention, and no transforms. The experiments checked these behaviors:

- The request wire output equals the port reporter output for version 1 and version 2.
- `bs`, `msd`, and a buffered `ec` reach each destination once.
- A target that lists `e` receives `e=e` at once. The other destinations receive `ec` on their next report.
- `t` reports read `snapshot()` at the interval of each target.

Several players can share one client, because the client keeps no state for a player. hls.js shows the need. When the application sets `cmcd.sessionId`, each hls.js interstitial player reuses it. Each of those players then starts a new `sn` sequence at 0 under the same `sid`.

A player gives up four things:

- Automatic state-change events. The player compares the new state with the old state.
- The store for `t` reports. The player supplies `snapshot()`.
- Rewriting per target. A predicate per target still covers routing, as [option-1.md](option-1.md) describes.
- Attribution of a late response to the `sid` that sent the request.

## Options

1. Add the client, and rebuild `CmcdReporter` on it in a major version. The rebuilt reporter keeps the 2.4.0 rules: the store and the automatic events. It drops transforms, retention, and provenance. Players keep their integration code, and the `rr` failure goes away. dash.js removes its `recordEvent(PLAY_STATE)` call after `update({ sta })`. Recommended. [option-1.md](option-1.md) has the details.
2. Add the client, and keep `CmcdReporter` as it is. Nothing breaks, but a player that upgrades still meets both failures. Two implementations stay. [option-2.md](option-2.md) has the details.
3. Continue the session API. It fixes the failures with more mechanisms: derived keys, rotation, request origins, and back-off states. It is the largest variant at 9161 B.

## Effect on the port branch

- Keep the normalization.
- Drop the token checks (optimization 3).
- Reconsider the speed gate. The prepare step is about 1 µs of difference inside a report of 10 to 20 µs. The bundle gate measures the cost that players pay.

## Open questions

- Option 1, 2, or 3.
- The name of the client. The prototype uses `createCmcdClient`.
- The owner of the `t` timer: the client with `snapshot()`, or the player.
- The speed gate of the port branch.

## Method

| Item | Method |
| --- | --- |
| Player sources | hls.js `master`, dash.js `development`, and shaka `main`, read through the GitHub API on 2026-10-01 |
| CML sources | `git archive` of `cmcd-v2.3.2`, `cmcd-v2.4.0`, `cmcd-v2.7.0`, 501281b70, 452a3391d, and 737e71417 |
| Bundle | rolldown 1.0.0-beta.44 from source, minified, gzip level 9. From source, `encodeCmcd` measures 3943 B. From `dist`, it measured 3923 B. |
| Time | Node 24.16 on Apple silicon, one process per row, median of 50 batches of 1000 calls |
| Heap | bytes over 1000 calls, with the semi-space flags that keep the collector out of the window |
| Input | the hls.js shape: raw floats, an absolute `nor`, and `update()` before each request for the reporter |

The measurement scripts ran outside the repository and are not part of this record.

## Links

| Reference | URL |
| --- | --- |
| hls.js PR 7725 | https://github.com/video-dev/hls.js/pull/7725 |
| dash.js PR 4816 | https://github.com/Dash-Industry-Forum/dash.js/pull/4816 |
| dash.js PR 5110 | https://github.com/Dash-Industry-Forum/dash.js/pull/5110 |
| shaka PR 10060 | https://github.com/shaka-project/shaka-player/pull/10060 |
| shaka issue 10414 | https://github.com/shaka-project/shaka-player/issues/10414 |
| shaka PR 10416 | https://github.com/shaka-project/shaka-player/pull/10416 |
| CML issue 357 | https://github.com/streaming-video-technology-alliance/common-media-library/issues/357 |
| CML RFC PR 390 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/390 |
| CML PR 422 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/422 |
| CML RFC 455 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/455 |
| CML PR 460 | https://github.com/streaming-video-technology-alliance/common-media-library/pull/460 |
| Eyevinn player-analytics-demo | https://github.com/Eyevinn/player-analytics-demo |
