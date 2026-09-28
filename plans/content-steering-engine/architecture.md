# Content steering engine: design record

This document supports [RFC: Content steering engine](../../rfc/content-steering-engine.md). The RFC defines the public API. This document records the spec rules, the prior art, the internal structure, and the history of the design. The spec names (base spec, HLS spec, DASH spec) have the meaning that the RFC gives them.

## History

The first design is from 2026-04-13. A review against draft-05 of the base spec followed on 2026-07-01. That design was on the `feat/content-steering-engine` branch, in `spec.md` and `implementation.md`, and it was not published. It predates the RFC process. The RFC replaces it with these changes:

| Area | First design | RFC |
|---|---|---|
| Public API | 17 new exports in three layers | `createSteeringEngine`, `applyUriReplacement`, and their types |
| Protocol differences | `HLS_CDP` and `DASH_CDP` objects with format callbacks | a `protocol` value |
| I/O | injected `fetch(url, signal)` and `schedule(fn, ms)` | a `request` function with the `HttpRequest` type, and the timers of the platform |
| Validation | a `validate` option | always on |
| Unknown pathway IDs | could be selected | ignored (base spec, section 4) |
| Clone `BASE-ID` | looked up only among earlier clones | also looked up in `pathways` (base spec, section 5) |
| Clone lifetime | kept across Steering Manifests | only the current Steering Manifest (base spec, section 5) |
| Retry-After | parsed with `Number()`, so an HTTP date failed. It replaced the TTL for both protocols | seconds or HTTP date. It replaces the TTL only for DASH (DASH spec, step 18) |
| RELOAD-URI | not resolved, so a relative value failed | resolved against the response URI (base spec, section 4) |
| End of a penalty | no selection until the next Steering Manifest | a new selection (base spec, step 4) |
| HTTP 410 | requests stopped, no fallback | fallback priority list (base spec, step 7A) |
| Relative content URIs | no base URI in `applyUriReplacement` | `baseUri` option (base spec, section 5) |
| `_DASH_throughput` | divided by 1000 | integer bits per second (DASH spec, step 7) |
| `_DASH_pathway` | no quotes | in quotes (DASH spec, step 7) |
| HLS per-variant URIs | `PARAMS` applied after them | they replace the result of `HOST` and `PARAMS` (HLS spec, section 7.3) |
| DASH `proxyServerURL` | supported | removed, because ETSI TS 103 998 V1.1.1 does not define it |
| Penalty duration | one default for both protocols | the TTL for DASH (DASH spec, step 19) |

## Spec rules

The table maps each rule to the behavior of the engine. An empty cell means that the spec adds nothing to the base spec.

| Topic | Base spec | HLS spec | DASH spec | Engine |
|---|---|---|---|---|
| Initial pathway | step 1: apply the initial pathway until the first Steering Manifest | 4.4.6.6: `PATHWAY-ID` MUST be applied until then | steps 5 and 7: with `@queryBeforeStart`, the first request has no parameters | `pathway` of the configuration |
| Query parameters | section 6: send the pathway and the throughput | 7.4: `_HLS_pathway="<id>"` and integer bits per second | step 7: a quoted list of the pathways since the previous request, and integer bits per second for each | the RFC table. The quotes for HLS are unresolved question 1 |
| Request timing | section 4 and step 6: wait TTL seconds after a load | | step 9: set the timer at receipt | a timer at receipt |
| RELOAD-URI | section 4: relative to the current Steering Manifest URI. A `data` base MUST produce an error | 4.4.6.6: `SERVER-URI` can be a `data` URI | step 10: relative to the current server URI | resolved against the response URI. A failure makes the Steering Manifest invalid |
| VERSION | section 4: refuse a VERSION that is missing or unknown | | step 11: abort all steering | HLS: invalid Steering Manifest. DASH: no more requests and the fallback priority list |
| HTTP 410 | step 7A: no more requests for that URI. Without a priority list, build one from the Content Description | | step 17: keep the priority list and cancel the requests. On the first request, abandon steering | no more requests. The priority list stays, or the fallback priority list applies |
| HTTP 429 | step 7B: wait until the time of Retry-After | | step 18: replace the TTL with Retry-After | the next request after Retry-After. DASH also stores it as the TTL |
| Other failures | step 7C: keep the previous values and wait the previous TTL. Without one, wait 5 minutes | | | the same |
| Selection | step 5: the first pathway that is not penalized. If none, keep the current one. Section 4: ignore unknown IDs | 7.5: use only the variant streams of the pathway | steps 12 to 15: the preferred service location | the first known pathway that is not penalized |
| Penalty | steps 3 and 4: the duration is defined by the protocol or by the player | 7.5: two minutes is generally enough | step 19: exclude for the last TTL, even if the next response ranks it first | a timer for each penalty, and a new selection when it ends |
| Cloning | section 5: steps 1 to 4, clone of a clone, unknown `BASE-ID` ignored, `HOST` not empty, `PARAMS` percent-encoded | 7.3: per-variant and per-rendition URIs replace the result of steps 1 to 4 | step 13: replace the host, replace `PARAMS` of the same name, ignore the per-variant keys | clone checks and `applyUriReplacement` |

The DASH spec has two conflicts with itself:

- Step 7 puts `_DASH_pathway` in quotes. The examples in clauses 8.1, 8.2.2, A.1, and A.3 have no quotes, but A.2 has them. The engine follows step 7.
- Clause 5.1 defines `@defaultServiceLocation` as a list separated by spaces. The schema of the 6th edition of ISO/IEC 23009-1 defines it as one token. The player passes the value that it applies, so the engine does not depend on this difference.

## Prior art

The comparison uses these commits, read on 2026-09-28:

| Player | Commit | File |
|---|---|---|
| hls.js | `c721313f028431b107e4a77edf40bb908f8d782c` | `src/controller/content-steering-controller.ts` |
| dash.js | `acddd0cfee4189d4249026937117eb8c80be619a` | `src/dash/controllers/ContentSteeringController.js` |
| Shaka Player | `91ca4dbd95a82ff3b352110a173756d414e5d8cb` | `lib/util/content_steering_manager.js` |
| VHS | `a9f9d7ac0264b373f14da1bb2f2e7fe8f2775c4f` | `src/content-steering-controller.js` |

A cell marked "(inferred)" is based on a reading of several code paths. No test of the player covers it.

| Rule | hls.js | dash.js | Shaka Player | VHS |
|---|---|---|---|---|
| RELOAD-URI base | the current request URI | the URI in the MPD | the manifest base. A relative value fails (inferred) | the previous RELOAD-URI |
| HTTP 410 | stops | stops, and also for 404 | retries, then polls at the TTL | stops |
| HTTP 429 | steering stops (inferred) | Retry-After replaces the TTL. Without it, steering stops (inferred) | a generic retry. Retry-After is not read | Retry-After delays one request. Without it, the retry is immediate (inferred) |
| VERSION other than 1 | steering stops | ignored, and steering stops | ignored, and steering stops | an error, but later manifests apply (inferred) |
| Penalty | 5 minutes. Checked at the next Steering Manifest or error | the TTL. Checked at each segment request | 60 seconds for each host. Checked at each segment request | the TTL. The switch waits for the next Steering Manifest (inferred) |
| Pathway parameter | no quotes | a quoted list | no quotes. Absent from the first request | no quotes |
| Throughput parameter | truncated to 32 bits. Default 500000 | a list with one value for each pathway | rounded. Default 1000000 | not rounded. Omitted when 0 |
| `HOST` | the hostname | host and port. A scheme is allowed | the hostname | the hostname. A missing `HOST` gives the host `undefined` |
| `PARAMS` | sorted and replaced. The values are encoded again | appended. The values are encoded again | ignored | set. The whole query is encoded again |
| Per-variant URIs | replace `HOST` and `PARAMS` | not applicable | ignored | not supported |
| Clone lifetime | kept. The first definition wins | rebuilt for each response. The last definition wins | for each response. The first definition wins | compared when the pathway changes |

No player parses an HTTP date in Retry-After. The engine is the first implementation to do so.

A 2024 prototype by Qualabs is on the `content-steering-refactoring` branch of `qualabs/common-media-library`. It has a request function and a URL builder, in the file layout from before the monorepo. It was not merged.

## Internal structure

The package exports only the API of the RFC. These modules are internal:

| Module | Job |
|---|---|
| `parseSteeringManifest` | Parses the body, checks it with `isValidSteeringManifest`, and resolves RELOAD-URI. |
| `resolveClones` | Returns the valid clones of a Steering Manifest, in array order. |
| `selectPathway` | Returns the first known pathway of the priority list that is not penalized. |
| `buildSteeringUri` | Sets the steering query parameters and keeps the rest of the URI. |
| `parseRetryAfter` | Converts seconds or an HTTP date to a delay in milliseconds. |
| `createSteeringEngine` | Holds the state, the timers, and the callbacks. |

The code rules of the repository require that tests import from the package name. So the tests check the internal modules through `createSteeringEngine` and `applyUriReplacement`.

## Test plan

- The tests use `node:test` and `node:assert`. The mock timers of `node:test` control `setTimeout` and `Date`, as in the `CmcdReporter` tests.
- A stub `request` function records each request and returns fixed responses.
- The fixtures include the examples of the base spec, section 8, and the examples of the DASH spec, clause 8.
- Each row of the response table of the RFC has a test for each protocol.
- Tests compare the exact request URI for HLS and for DASH, including the quotes and the lists.
- Tests for `applyUriReplacement` cover relative URIs, a port, existing query parameters, percent-encoded values, and the per-variant and per-rendition keys.

## Follow-up after acceptance

- Write `plans/content-steering-engine/steps.md` from the accepted RFC.
- Update the `@see` links of the package to draft-05 and to the 2024-01 date of ETSI TS 103 998.
- Update the package README with the examples of the RFC.
- Measure the bundle size in the implementation pull request.
