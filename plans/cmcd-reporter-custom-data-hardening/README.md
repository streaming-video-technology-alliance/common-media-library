# CmcdReporter Custom Data Hardening — Work Plan

**Date**: 2026-07-21
**Package**: `@svta/cml-cmcd`
**Status**: In progress — PR-A (WI-1, WI-2, WI-6) implemented
**Branch**: `task/cmcd-reporter-custom-data-hardening`

## Background

Players need to send custom key/value fields (reverse-DNS hyphenated keys per CTA-5004-B) and
custom events (`e=ce` with `cen`) through `CmcdReporter`. An audit of the current implementation
(source reading plus runtime execution of the actual `libs/*/src` code) confirmed that **both
mechanisms exist and work end-to-end today**, but they are opt-in via config allowlists, untested
at the reporter level, undocumented in the user guide, and carry one correctness bug that can
silently and permanently lose event data.

This document records the verified current behavior, then defines one work item per finding.
Work items are scoped so each can land as an independent PR.

## Verified current behavior

### Custom key/value fields

| Aspect | Behavior | Evidence |
| ------ | -------- | -------- |
| Type surface | `CmcdCustomKey` = `` `${string}-${string}` ``; index signature on `CmcdRequest` with `CmcdCustomValue` values (string/number/boolean/symbol/`SfToken`, bare, `SfItem`-wrapped, or arrays) | `src/CmcdCustomKey.ts:9`, `src/CmcdRequest.ts:26`, `src/CmcdCustomValue.ts` |
| Injection points | `update()` (persistent, rides all subsequent request + event reports incl. `TIME_INTERVAL`); per-call `data` on `recordEvent()` / `createRequestReport()` / `recordResponseReceived()`; `rr` read-back of `request.customData.cmcd` | `src/CmcdReporter.ts:307`, `:366`, `:519`, `:449`, `:482-484` |
| Non-injection point | Constructor config: only `cid`/`sid`/`v` are seeded into the data store; custom keys on the config object are inert | `src/CmcdReporter.ts:209-213` |
| Mode filter | Custom keys pass in both request and event mode via `isCmcdCustomKey` (charset `[a-zA-Z0-9.-]`, interior hyphen required) | `src/isCmcdRequestKey.ts:20-23`, `src/isCmcdEventKey.ts:20-24`, `src/isCmcdCustomKey.ts` |
| `enabledKeys` gate | Exact string membership; a custom key **must** be listed in the top-level `enabledKeys` (request mode) or the per-target `enabledKeys` (event mode) or it is silently dropped. No wildcard exists. | `src/CmcdReporter.ts:42-47`, `src/prepareCmcdData.ts:122-124` |
| Headers mode | Custom keys are hard-wired into the `CMCD-Request` header; `CmcdEncodeOptions.customHeaderMap` and `formatters` exist but are never passed by the reporter | `src/groupCmcdHeaders.ts` (default to `REQUEST`), `src/CmcdReporter.ts:41-50` |
| Boolean values | `false` is stripped by `isValid`; `true` serializes as a bare valueless dictionary member (RFC 8941 convention) | `src/isValid.ts:15`, `src/prepareCmcdData.ts:206` |
| `rr`-only keys | `url`, `rc`, `ttfb`, `ttlb`, `ttfbb`, `smrt`, `cmsdd`, `cmsds` attached to a non-`rr` event are stripped even when enabled (closed 8-key list; custom hyphenated keys unaffected) | `src/prepareCmcdData.ts:118-120`, `src/CMCD_RESPONSE_KEYS.ts` |

### Custom events

| Aspect | Behavior | Evidence |
| ------ | -------- | -------- |
| Event type | `CmcdEventType.CUSTOM_EVENT` = `'ce'`; emitted via `recordEvent(CmcdEventType.CUSTOM_EVENT, { cen, ...payload })` | `src/CmcdEventType.ts:127` |
| Target gate | Event only reaches targets whose `events` array includes `CUSTOM_EVENT` | `src/CmcdReporter.ts:410` |
| `cen` force-include | `cen` is force-included even when absent from the target's `enabledKeys`; accompanying custom payload **is** subject to `enabledKeys` | `src/prepareCmcdData.ts:141-143` |
| Dedup | Custom events are pass-through (not in `CMCD_STATE_EVENT_FIELDS`); every call emits | `src/CMCD_STATE_EVENT_FIELDS.ts` |
| Validation | Validators enforce `cen` present iff `e=ce`, max 64 chars | `src/validateCmcdStructure.ts:74-86`, `src/CMCD_STRING_LENGTH_LIMITS.ts:11` |
| Runtime openness | The `CmcdEventType` union is compile-time only; no runtime check on the token (arbitrary tokens flow through with casts — unsupported) | `src/CmcdReporter.ts:410` (plain `includes` check) |

### The three-gate model

A custom key passes through three gates, each stricter than the type system:

1. **Mode filter** — `isCmcdCustomKey`: charset `[a-zA-Z0-9.-]`, at least one hyphen at index ≥ 1
   that is not the last character. Keys failing this are **silently dropped**.
2. **`enabledKeys` filter** — exact membership. Keys not listed are **silently dropped**.
3. **RFC 8941 key serialization** — `serializeKey` enforces `/^[a-z*][a-z0-9\-_.*]*$/`
   (`libs/structured-field-values/src/serialize/serializeKey.ts:29-34`). Keys that passed gates
   1–2 but fail here (e.g. `Com.Example-foo`, `2com.example-x`, `-a-b`) **throw** — they are not
   dropped. See WI-4 for the consequences.

Only lowercase reverse-DNS keys (e.g. `com.example-foo`) are safe through all three gates.

---

## Work items

### WI-1 — Reporter-level end-to-end tests for custom key transmission

**Priority**: P1 · **Effort**: S–M · **Type**: test-only · **Status**: ✅ Implemented

**Problem.** `libs/cmcd/test/CmcdReporter.test.ts` never passes a `com.example-*` key through any
reporter path. Custom keys are well-covered at the helper layer (`encodeCmcd.test.ts:16`, `:182-187`,
`isCmcdCustomKey.test.ts`, `toCmcdHeaders.test.ts`, validator tests), but nothing asserts the
`enabledKeys` interaction or wire emission through `CmcdReporter` itself — the exact contract
adopters depend on.

**Plan.** Add a `describe('custom keys')` block to `CmcdReporter.test.ts` covering:

1. `update({ 'com.example-foo': 'bar' })` with the key in top-level `enabledKeys` →
   `createRequestReport` emits it in the `CMCD` query param (query mode).
2. Same setup in headers mode → key lands in the `CMCD-Request` header.
3. Key **not** in `enabledKeys` → absent from query, headers, and event bodies (silent drop).
4. Event mode: persistent custom key set via `update()` appears in `TIME_INTERVAL` and
   state-change event bodies when listed in the target's `enabledKeys`.
5. Per-call injection: `recordEvent(type, { 'com.example-foo': 'bar' })` emits for that event only
   and does not persist into subsequent reports.
6. `recordResponseReceived`: (a) read-back — a custom key that survived the request-mode filter
   into `request.customData.cmcd` rides into the `rr` event; (b) direct `data` param injection.
   Both still gated by the event target's `enabledKeys`.
7. Value types: `SfToken`/`SfItem`-wrapped custom values reach the wire in the expected SF form;
   `true` emits as a bare key; `false` is dropped.

**Acceptance criteria.**
- All seven behaviors asserted against actual request bodies/URLs/headers via the existing
  `createMockRequester` pattern.
- Tests import from the package name (`@svta/cml-cmcd`), per repo rules.
- No production code changes; tests document today's behavior verbatim so WI-4 diffs are visible.

**Risks.** None — test-only. Note these tests intentionally lock in silent-drop semantics for
gate 2; WI-4 does not change that gate.

---

### WI-2 — Strengthen custom-event (`cen`) coverage

**Priority**: P1 · **Effort**: S · **Type**: test-only · **Status**: ✅ Implemented

**Problem.** The only reporter custom-event test (`CmcdReporter.test.ts:302-321`) asserts `e=ce`
in the body but never `cen="my-custom-event"` — the event *name*, the point of the feature, is
unasserted end-to-end. The `cen` force-include (`prepareCmcdData.ts:141-143`) is tested only via
standalone `encodeCmcd` (`encodeCmcd.test.ts:65-70`), not through the reporter.

**Plan.**
1. Extend the existing test to assert `cen="my-custom-event"` appears in the delivered body.
2. Add a test where the target's `enabledKeys` omits `cen` → `cen` is still emitted
   (force-include through the full reporter path).
3. Add a test pairing `CUSTOM_EVENT` with a custom key payload
   (`recordEvent(CUSTOM_EVENT, { cen: 'x', 'com.example-detail': 'y' })`): payload emitted when
   the key is in the target's `enabledKeys`, dropped when not — while `cen` survives either way.
4. Add a batching test: multiple custom events accumulate and deliver per `batchSize`.

**Acceptance criteria.** All four assertions green against delivered request bodies; existing
test strengthened rather than duplicated.

---

### WI-3 — User-guide documentation for custom keys and custom events

**Priority**: P2 · **Effort**: M · **Type**: docs-only
**Depends on**: WI-4 (document final hardened behavior, not the current throwing behavior)

**Problem.** `libs/cmcd/docs/user-guide.md` never mentions custom reverse-DNS keys — not in
"Setting CMCD Data", "Filtering CMCD Keys", or the configuration reference. Custom-key docs exist
only for the validators (`validation-guide.md:231-248`). The guide's `CUSTOM_EVENT` example
(`user-guide.md:257`) is not paired with an `eventTargets` config that lists
`CmcdEventType.CUSTOM_EVENT` in `events`, and the guide never states that a target must opt in —
a player copying the guide's configs would have the documented `recordEvent(CUSTOM_EVENT)` call
silently dropped.

**Plan.**
1. Add a **"Custom keys"** section to the user guide covering:
   - Naming rules: CTA-5004-B hyphenated-prefix requirement, reverse-DNS recommendation, and the
     practical constraint that keys must be **lowercase** `[a-z0-9.-]` with an interior hyphen to
     survive all three gates (see three-gate model above).
   - The `enabledKeys` requirement in both request mode and per event target, with a working
     config example. State explicitly: no wildcard; unlisted custom keys are silently dropped.
   - Value types (`CmcdCustomValue`), including `SfItem` for parameterized values, the
     boolean wire semantics (`false` dropped, `true` bare key), and string length limits.
   - Headers mode: custom keys emit in `CMCD-Request`; `customHeaderMap` is not currently
     reachable through the reporter (cross-reference WI-5).
2. Fix the **`CUSTOM_EVENT` example**: show a complete config with
   `events: [CmcdEventType.CUSTOM_EVENT]` and note the `cen` force-include plus the payload/
   `enabledKeys` interaction.
3. Document the **`rr`-key stripping** on non-`rr` events (bounds what per-event data can
   accompany a custom event).
4. Cross-link the validation guide's "Custom Keys" section both ways.
5. Update `CmcdCustomKey` TSDoc to state the runtime constraints (gate 1 and gate 3) that the
   template-literal type cannot express.

**Acceptance criteria.** A developer following only the user guide can configure and verify a
custom key in query, headers, and event modes, and a delivered custom event, without reading
source. Examples compile (guide snippets follow existing `{@includeCode}`/example conventions
where applicable).

---

### WI-4 — Harden encoding failures: eliminate the poison-batch bug and `createRequestReport` throws

**Priority**: P1 (correctness/data-loss) · **Effort**: M · **Type**: bug fix

**Problem.** Gate 3 (RFC 8941 serialization) **throws** rather than dropping. Two consequences,
both runtime-verified:

- **Request mode**: `createRequestReport` throws synchronously out of the player's request path
  when an enabled custom key passes `isCmcdCustomKey` but fails `serializeKey`
  (e.g. `Com.Example-foo`), via `encodePreparedCmcd` (`CmcdReporter.ts:549`) or
  `toPreparedCmcdHeaders` (`:557`).
- **Event mode — poison batch**: `encodeCmcd` throws inside async `sendEventReport`
  (`CmcdReporter.ts:612`); the rejection is caught by the blind re-queue handler
  (`:585-588` — `catch(() => { target.queue.unshift(...events) })`), which was designed for
  transient HTTP failures. The batch is re-queued at the head **forever**: it is never delivered,
  every retry fails identically, `flush()` cannot clear it, and innocent clean events sharing the
  batch are permanently lost. Verified with `batchSize=3`: a batch of [poison `ce` event, two
  clean error events] was never delivered while later clean batches still were.

  The same failure mode applies to value-level throws: custom string values containing control
  characters (`%x00-1f`, `%x7f`) throw in `serializeString`; nothing sanitizes values before
  encoding (`isValid` only screens `null`/`''`/`false`/non-finite numbers).

**Plan.** Two layers, both landing in one PR:

1. **Prevent (choke point)**: in `prepareCmcdData`, validate custom keys against the
   RFC 8941-serializable pattern and drop those that fail — extending the existing
   "invalid data is stripped" policy that `isValid` already applies to values. Implementation:
   a module-level regex constant (per code-quality rules) matching `serializeKey`'s
   `/^[a-z*][a-z0-9\-_.*]*$/`, applied to keys accepted by `isCmcdCustomKey` only (standard keys
   are all serializable by construction). Optionally extend `isValid`/a sibling check to strip
   string values containing control characters.
2. **Contain (defense in depth)**: in `sendEventReport`, encode each item in a per-item
   `try/catch`; items that fail encoding are dropped from the batch (dead-letter) instead of
   poisoning it, and — critically — an encode failure must **not** trigger the transport re-queue
   path. Only transport-level failures (the existing 429/5xx throw at `:619-620`) remain
   retryable.

**Explicitly out of scope / decisions to confirm with maintainers:**
- **Tightening `isCmcdCustomKey` itself** to the RFC 8941 subset. It is a public API used by the
  validators; changing it alters `validateCmcdKeys`/`validateCmcdValues`/`validateCmcdHeaders`
  verdicts. Recommended follow-up: instead teach `validateCmcdKeys` to *warn* on keys that pass
  `isCmcdCustomKey` but would fail serialization, so the dev-time story matches runtime.
- **Error surfacing**: silent drop matches the library's existing posture (no logging anywhere in
  the package). If observability is wanted, a future `onDroppedData` hook on
  `CmcdReporterConfig` is the tree-shakeable option; not part of this WI.

**Acceptance criteria.**
- `createRequestReport` never throws on any custom key/value input; offending keys are absent
  from the emitted report, all other keys unaffected.
- A batch containing an unserializable event delivers its clean events; the poison event is
  dropped; the queue drains; `flush()` leaves the queue empty.
- Transport failures (429/5xx) still re-queue as before.
- Regression tests: uppercase key, digit-leading key, `-a-b` (leading-hyphen multi-hyphen key),
  control-character string value — each in both request and event mode.
- Changelog entry under Fixed.

**Risks.** Behavior change: inputs that previously threw now silently drop. This is strictly less
surprising for players, and no reasonable caller can depend on the poison-batch behavior. Down-side
is debuggability — mitigated by the WI-4 validator warning follow-up and WI-3 docs.

---

### WI-5 — Expose `customHeaderMap` (and optionally `formatters`) through the reporter config

**Priority**: P3 · **Effort**: M · **Type**: API addition (minor release) — needs maintainer sign-off

**Problem.** `CmcdEncodeOptions.customHeaderMap` lets encoders route custom keys into specific
CMCD header shards, and `formatters` allows per-key value formatting — but
`CmcdReporter.createEncodingOptions` (`CmcdReporter.ts:41-50`) builds only
`{ version, reportingMode, filter, baseUrl }`, so neither is reachable through the reporter.
Consequence: in headers mode all custom keys are forced into `CMCD-Request`, which may not match
a CDN's expectations for session-scoped custom data (`CMCD-Session` is the natural shard for
per-session custom keys).

**Plan.**
1. Add `customHeaderMap?: Partial<CmcdHeaderMap>` to `CmcdRequestReportConfig` (headers mode is a
   request-mode concern; event mode POSTs a body and has no header shards).
2. Thread it through `createEncodingOptions` → `toPreparedCmcdHeaders` (the plumbing already
   exists; today the option is simply never populated).
3. Decide on `formatters`: same mechanical change, but it is a `Record<CmcdKey, CmcdFormatter>`
   holding functions — document tree-shaking implications and whether it belongs on the public
   reporter config at all. Default recommendation: defer `formatters` unless a concrete adopter
   need exists; land `customHeaderMap` only.
4. Regenerate the API report (`config/cml-cmcd.api.md`), add user-guide coverage (extends WI-3's
   custom-key section), tests for shard routing through `createRequestReport` in headers mode.

**Acceptance criteria.** A custom key can be routed to `CMCD-Session`/`CMCD-Object`/`CMCD-Status`
via reporter config in headers mode; default behavior (no map → `CMCD-Request`) unchanged; API
report diff reviewed; minor-version changelog entry.

**Risks.** Public API growth — hence sign-off gate. Zero runtime cost when unused (the option is
an optional property; no new code on the hot path).

---

### WI-6 — Direct unit coverage for `prepareCmcdData`

**Priority**: P2 · **Effort**: S–M · **Type**: test-only · **Status**: ✅ Implemented
**Depends on**: pairs naturally with WI-4 (the fix lands at this choke point)

**Problem.** `prepareCmcdData.ts` is the single filtering choke point for every emission path,
significant enough to have warranted three Fixed changelog entries, yet has no dedicated test
file — its behavior is only covered indirectly through `encodeCmcd`.

**Plan.** Add `libs/cmcd/test/prepareCmcdData.test.ts` (with the repo-required
`// #region example` block) covering: mode filters (request vs event vs v1), `options.filter`
interaction and post-filter re-adds (`e`, `ts`, `cen`, state-change required field), `rr`-key
stripping on non-`rr` events, the `pr=1` skip and its `PLAYBACK_RATE`-event exception, the
`bg:false` backgrounded-event exception, custom-key pass-through (and, post-WI-4, the
serializability drop), v1 down-conversion with custom keys present.

**Acceptance criteria.** Each documented branch of `prepareCmcdData` has at least one direct
assertion; the function's TSDoc `@example` includes the new test region.

---

## Sequencing

```
WI-1 ─┐
WI-2 ─┼─► WI-4 (hardening; updates the WI-1/2/6 expectations it changes) ─► WI-3 (docs) ─► WI-5 (API, gated)
WI-6 ─┘
```

1. **Tests first** (WI-1, WI-2, WI-6): lock in current behavior so the WI-4 diff is explicit and
   reviewable — the tests that flip from "throws/loses data" to "drops key/delivers batch" *are*
   the review artifact.
2. **WI-4** next: the only correctness bug; highest user impact.
3. **WI-3** after WI-4: document the hardened behavior once, not twice.
4. **WI-5** last: independent API discussion; not blocking anything above.

Suggested PR slicing: PR-A = WI-1 + WI-2 + WI-6 (test-only, no risk), PR-B = WI-4 (+ test
updates), PR-C = WI-3, PR-D = WI-5 (if approved).

## Adjacent observations (out of scope)

Recorded for completeness; not part of this plan:

- `CmcdEvent.ts:44` documents an `h` (hostname changed) event token and the `h` *data key* is
  registered in `CMCD_EVENT_KEYS`, but no `CMCD_EVENT_HOSTNAME_*` constant exists in
  `CmcdEventType.ts` — the event type is unreachable through the typed API.
- The `CmcdEventType` union has no runtime enforcement; arbitrary tokens can be cast through.
  Whether to validate at `recordEvent()` is a spec-conformance question, not a custom-data one.
- `CmcdCustomKey`'s template-literal type (`` `${string}-${string}` ``) cannot express the runtime
  constraints; WI-3 documents the gap rather than fighting the type system.
