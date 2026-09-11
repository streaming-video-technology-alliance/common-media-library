# CMCD session API: comparison with `CmcdReporter` and PR #422

Companion to [`rfc/cmcd-session-api.md`](../../rfc/cmcd-session-api.md) and [`architecture.md`](./architecture.md). It compares three paths for the CMCD version 2 reporter. All facts are as of 2026-09-09, except the bundle measurements of 2026-09-10.

## The three paths

**`CmcdReporter` on `main`.** One class with the public API of 2.6.1. It gained state-change dedup in 2.4.0, transforms in 2.5.0, and session retention with provenance records in 2.6.0. Each feature added interactions with the earlier ones.

**PR #422, the refactor.** Splits the class into a session ledger, playback state, a pure report pipeline, and per-target outboxes. The public API and every documented semantic remain unchanged. It fixes five defects from the 2.6.0 review. Its design record is [`plans/cmcd-reporter-architecture/`](../cmcd-reporter-architecture/).

**The session API.** A second public API built for the version 2 spec, next to `CmcdReporter`. Three objects match the three scopes of the spec. The reporter derives the keys the spec defines in terms of observable state.

## Size

| Measure | `CmcdReporter` | PR #422 | Session API |
|---|---|---|---|
| Reporter source lines | 1318 | 1152 added, 610 removed, over 11 source files | 1500 to 1700, estimate |
| Preparation source lines | 269 plus about 300 in tables | unchanged | 400 to 550 including the key table, estimate |
| Reporter test lines | 4753 | 5315 | new suite, estimate 3000 to 4000 |
| Minified bundle, reporter entry | 18.7 KB | not measured | 26.4 KB |
| Minified with gzip | 7.1 KB | not measured | 8.9 KB |
| Minified, `encodeCmcd` alone | 6.3 KB | 6.3 KB | 6.3 KB, unchanged |

The PR #422 line counts are from its diff against `main`, source files only. The bundle rows come from the probe of Task 13 in [`steps.md`](./steps.md). That probe minifies one entry at a time from the built `dist` of this worktree. It measured both entries on 2026-09-10.

## Concepts

| Concept | `CmcdReporter` | PR #422 | Session API |
|---|---|---|---|
| `sid` rotation | `update({ sid })` | `update({ sid })` | `session.rotate(sid)`, one internal state per `sid`, no ledger |
| Retention window and eviction | yes, `sessionRetention` | yes, in a ledger | no, object lifetime |
| Provenance record on `customData` | yes, symbol key | yes | no, a plain `cmcd` record |
| `customData` type parameter `C` | yes | yes | no |
| Dirty tracking, deferred eviction | no | yes | no |
| Root and child reporters | proposed, PR #398 | landing zone prepared | no, reporters are peers |
| `activate()` for interval reports | proposed, PR #398 | not yet | no, one line per reporter |
| Per-target state in request mode | `sn` and `msd` only | keyed map | full target state |
| Derived keys | `sn`, `ts`, `v`, `e`, `url`, `rc`, `ttfb`, `ttlb` | same | plus `msd`, `bs`, `bsa`, `bsda`, `bsd`, `su`, `dl`, `h`, `bg`, `cmsds`, `cmsdd` |
| Per-destination `ec` buffer | no | no | yes |
| Configuration errors | silent drop | silent drop | throw |
| Transforms | per placement | per placement | per placement |
| Formatters on the reporter | no | no | no |

## Spec coverage

| CTA-5004-B rule | `CmcdReporter` and PR #422 | Session API |
|---|---|---|
| `msd` once per session and mode, from starting to playing | gate only, value from the player | derived and gated |
| `bs` since the last report per destination | player value | derived per target and reporter |
| `ec` buffered per destination | player value, persists when pushed with `update()` | derived per target and reporter |
| `bsa`, `bsda`, `bsd` since session initiation | player values, planned derivation | derived |
| `su` until stable playback | player value | derived default |
| `dl` | player value | derived default |
| `h` hostname and its event | key only, no event token | derived, event added |
| `bg` over all players in a session | player value | session value, from document visibility |
| `cmsds`, `cmsdd` from response headers | player values | derived |
| `pr` event only while playing | not enforced | enforced |
| One `sid`, one `sn` sequence per target across players | one `CmcdReporter` per media player breaks it | native |
| 429 back-off, 5xx retry, lost connectivity | re-queue, retry on the next event | exponential back-off with aggregation |
| 410 for the rest of the session | yes | yes |
| Per-target `Authorization` header, item 16 | no | `headers` per target |
| Existing `CMCD` parameter in the URL, item 6 | replaced | replaced |
| Version 1 request mode with version 2 event mode | yes | yes |

## Adopter impact

Facts read from the hls.js `master` and dash.js `development` branches on 2026-09-09.

| Finding | hls.js | dash.js |
|---|---|---|
| Pinned `@svta/cml-cmcd` | 2.4.0 | 2.3.2 |
| `recordResponseReceived()` receives | `{ url }` from the loader context | a request whose `customData` has `cmcd` but no provenance record |
| Result on 2.6 or later | every `rr` event dropped | every `rr` event dropped |
| `update({ sta })` followed by `recordEvent(PLAY_STATE, data)` | no | yes, `data` lost on 2.4 or later |
| Spec logic implemented by hand | `starved`, `buffering`, `dl` | `calculateMsd()`, rebuffer tracking with `bsd`, `su`, `dl`, `ec` persistence, CMSD base64 |
| Rebuilds the reporter to change configuration | on every `MANIFEST_LOADING` | when manifest parameters arrive, with a comment about the `sid` and `sn` reset |
| Interstitials under one `sid` | not possible | not applicable, single player |

Both players change under either path once they upgrade past 2.5. PR #422 keeps the 2.6 contract, so the players must pass the decorated request back to keep `rr` events. The session API asks for the same request pass-back, and it removes the `msd`, `bs`, `su`, `dl`, and `ec` code from both players.

## Where the queued work lands

| Work | PR #422 | Session API |
|---|---|---|
| Child reporters, PR #398 | a second facade over the ledger, `pid` on the provenance record, `activate()` | `createReporter()` |
| Starvation counters, `plans/cmcd-session-counters/` | transition detection in `acceptStateChange`, cursors in the commit step | in the transition tracking, same precedence rules |
| Session retention, shipped in 2.6.0 | the ledger | object lifetime |
| Transforms, shipped in 2.5.0 | `applyReportPolicy` | `emitReport`, same contract |

## Risks

| Path | Risk |
|---|---|
| `CmcdReporter` as is | Each new feature multiplies interactions. Children and counters both wait on the refactor |
| PR #422 | The public contract that both adopters break stays. The review is open with 4 unresolved threads, and the branch conflicts with `main` after PR #453 and PR #454 |
| Session API | A new surface to document and test next to the old one. Wire changes during interstitials. Estimates until a prototype exists. Adoption needs hls.js and dash.js changes |

## Reading

PR #422 is the lower-risk step. It keeps every promise the package made in 2.6.0, and it lands in weeks. It also makes the 2.6.0 model permanent, and that model is the one both adopters have already failed to integrate against.

The session API is the larger step. It spends its complexity on the spec instead of on session bookkeeping. It removes the concepts that produced most of the review history since 2.4.0. Its payoff is in the adoption priority. A player integration deletes code instead of adding it, and interstitials share one session with no new concept. The RFC review decides whether that payoff is worth a second API for one or two release cycles.
