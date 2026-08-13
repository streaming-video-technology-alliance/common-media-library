# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `CmcdReporterConfig.sessionRetention` — the number of ended sessions the reporter retains state for, in addition to the current one (default `2`; `0` disables retention, `Infinity` never evicts; only `number` values are accepted and floored, anything else falls back to the default). The reporter now keeps per-session state (data snapshot, sequence numbers, `msd` gate, dedup baseline, unsent queues) for recently ended sessions, so a media request that completes after a `sid` change reports under the session that issued it: its own `sid`, its next per-target sequence number, its still-unsent `msd`, and its frozen data snapshot, which is detached at the transition so mutating an array previously passed to `update()` cannot rewrite an ended session's late reports. A `sid` change also drains an ended session's unsent event reports (each keeps its own `sid` and sequence number) before eviction can discard them. Implements the accepted RFC in `rfc/cmcd-session-retention.md` ([#416](https://github.com/streaming-video-technology-alliance/common-media-library/pull/416))
- `CMCD_REQUEST_PROVENANCE` — the symbol key (backed by `Symbol.for('@svta/cml-cmcd/request-provenance')`) under which `createRequestReport()` stamps a frozen session-provenance record (`CmcdRequestProvenance`) on every request it returns, including requests it does not decorate (request reporting disabled, or a transform cancels decoration). The record carries the opaque `token` that names the issuing session, and on decorated requests `cmcd`, the request report exactly as encoded on the wire. The member is typed optional on `CmcdRequestReport` so the type stays constructible by consumers; every request the reporter returns carries it. `recordResponseReceived()` attributes by the record's token first, so attribution survives a cancelled decoration and resolves the exact session when a `sid` string is reused (each `sid` change is a new retained session). A request carrying no provenance, or a value written by another reporter instance, falls back to the `sid` in the record's snapshot, then the `sid` of the request's `cmcd` object, then a per-call `data.sid`, then the current session; a token or `sid` that names no retained session drops the response rather than relabeling it. Request-time report data for the `RESPONSE_RECEIVED` event is rebuilt by decoding the record's snapshot, never by re-ingesting the player-facing (and player-mutable) `customData.cmcd` object, so token-typed values (`ot`, `sf`, `st`, and custom-key `SfToken`s) keep their RFC 8941 wire type across serialization boundaries instead of degrading to quoted strings or un-encodable plain objects. Spread and `Object.assign` carry the record through request clones; `JSON.stringify` and structured clone drop symbol keys, so read the value before such a boundary and restore it afterward — the record itself survives JSON, and both attribution and the snapshot are read by value rather than object identity, so a revived copy behaves exactly like the original. A request whose record was lost (and not restored) still attributes through the `sid` fallback chain but reports its derived keys over the session's data alone ([#416](https://github.com/streaming-video-technology-alliance/common-media-library/pull/416))

- `CmcdDecodeOptions.useSymbol` — controls how RFC 8941 token values are represented by `decodeCmcd` (and `fromCmcdQuery`/`fromCmcdHeaders`/`fromCmcdUrl`). When omitted, tokens reduce to plain strings as before, which cannot be told apart from string values on re-encoding. `true` decodes tokens as registry `Symbol`s, `false` as `SfToken` instances; either preserved representation re-encodes as a bare token, making the codec symmetric: `encodeCmcd(decodeCmcd(s, { useSymbol: false }))` returns the input bytes. `CmcdReporter` decodes provenance snapshots this way, so request-time token values keep their wire type on `RESPONSE_RECEIVED` reports

### Fixed

- `decodeCmcd` no longer discards RFC 8941 parameters carried on a dictionary member or an inner list (`com.example-x=1;p=2`, `tab=(3000);p=2`): a params-bearing member now decodes as an `SfItem` with its value reduced as usual, matching how inner-list members with params were already preserved. The value inside a params-bearing item is also reduced consistently now (previously an inner token leaked as a raw `Symbol` instead of a string). Affects `decodeCmcd`, `fromCmcdQuery`, `fromCmcdHeaders`, and `fromCmcdUrl`
- `CmcdReporter` event reports are encoded when they are queued rather than when a batch is sent. A report whose values cannot be serialized (RFC 8941 rejects them) now throws synchronously from the recording call that produced it, attributable to its caller, instead of rejecting the asynchronous batch send, where the failure was swallowed by the retry path and the un-encodable report re-queued forever, silently blocking every later report on batched targets. Queued reports are also finished wire bytes, immune to later mutation of caller-held values, so the per-target deep copy of report data is now made only where a `transform` is configured
- `CmcdReporter` now stamps the session-owned keys `sid` and `msd` after per-call data and transforms in both reporting modes, so neither `recordEvent()`/`recordResponseReceived()`/`createRequestReport()` data nor a `transform` return value can substitute the session ID or put `msd` on the wire outside the once-per-session gate. Transforms still see the canonical `sid` in their input. This also makes `update({ sid: undefined })` a no-op; previously the explicit `undefined` was merged into the data store and every later report went out with no `sid` at all. On `recordResponseReceived()` a per-call `sid` acts as an attribution key that selects among retained sessions (see Added); it still cannot mislabel a report ([#408](https://github.com/streaming-video-technology-alliance/common-media-library/issues/408))
- `msd` lifecycle fixes ([#409](https://github.com/streaming-video-technology-alliance/common-media-library/issues/409)):
  - `update({ msd })` now accepts `0` (a valid instant-start value), rounds fractional values to integer milliseconds per CTA-5004-B, and rejects `Infinity`, negatives, `NaN`, and values whose rounded form exceeds the RFC 8941 structured-field integer maximum of `999_999_999_999_999`. Previously `0` was rejected while fractions and negatives reached the wire as-is; an accepted `Infinity` consumed the once-per-session gate without ever being encodable, so `msd` was silently never sent; and an over-range value consumed the gate and then threw in the serializer, poisoning event batches on every retry
  - A `sid` change now clears the stored `msd` and re-arms every send gate: `msd` is once per Session ID, so a value supplied for the new session is sent again, and a stored-but-unsent value from the old session no longer leaks forward
  - The send gate is consumed only when the prepared report actually retains `msd`. Previously both modes flipped the flag before the `enabledKeys` filter ran, so a target that filtered `msd` out still consumed its gate
- HTTP 410 disposal of an event target is now scoped per CTA-5004-B: suppression covers every event target configured with the matching URL, lasts for the remainder of the session that received the 410, and no longer outlives it. A `sid` change restores disposed targets (re-arming their intervals when the reporter is started), a 410 response that resolves after a session change silences the session that sent the batch instead of the one that replaced it, and a batch re-queued after a 429/5xx failure retries only within its own session, so a batch invalidated by a disposal in an ended session is never replayed into the new one ([#410](https://github.com/streaming-video-technology-alliance/common-media-library/issues/410))

## [2.5.0] - 2026-07-28

### Added

- `transform` on the request-report config and on each event-target config: a synchronous `(data, request) => Cmcd | null` hook that modifies a single CMCD report before it goes to the wire, or cancels it by returning `null`. Placement scopes the hook the same way `enabledKeys` does — the top-level `transform` applies to `createRequestReport()` reports, and each event target's `transform` applies to that target's event reports, so targets sharing a collector URL can filter independently. For `RESPONSE_RECEIVED` events the transform also receives the request that triggered them, which is how a player filters reports by its own request taxonomy on `customData`. Implements the accepted RFC in `rfc/cmcd-reporter-middleware.md` ([#390](https://github.com/streaming-video-technology-alliance/common-media-library/pull/390))

  The contract is bounded so a transform cannot produce an invalid or cross-contaminated report:

  - `e`, `sn`, and `msd` are stamped after the transform runs, so a cancelled report leaves no sequence-number gap and `msd` rides the next report that is sent.
  - Keys the event requires (`ts` always, the signalled field for state-change events, `cen` for custom events, `ec` for errors, `url` for response-received) are restored if a transform removes them, so a transform cannot emit a report `validateCmcdEvents()` would reject. Keys already absent beforehand are not fabricated.
  - The report data is copied for each target, nested values included, so mutating an array or an `SfItem`'s `params` in place cannot reach the reporter's persistent data or another target's report.
  - Transform exceptions propagate rather than being swallowed, but are isolated per target: the remaining targets still receive the report and the error surfaces after the reporter finishes the event. This covers `start()`'s initial time-interval event as well as `recordEvent()`, so a throwing transform cannot leave later targets without armed intervals. See the user guide.
  - The `request` argument is a read-only view (`CmcdTransformRequest`): it is context for the decision and must not be mutated, since it belongs to the caller. Members are `readonly`, and `customData` values are `unknown` unless the reporter is given the player's `customData` type (see below). A mutable `FormData`/`URLSearchParams` body and JavaScript callers are outside what the type can enforce
- `CmcdReporterConfig.customHeaderMap` — routes custom keys into specific CMCD header shards (`CMCD-Session`, `CMCD-Object`, `CMCD-Status`) when the transmission mode is `HEADERS`. Custom keys not listed in any shard still default to `CMCD-Request`; standard keys keep their spec-defined shards and cannot be re-routed. The option previously existed on `CmcdEncodeOptions` but was not reachable through `CmcdReporter`

### Fixed

- `prepareCmcdData` now force-includes `ec` on error events and `url` on response-received events after the per-target `enabledKeys` filter, completing the set started in 2.4.0 for state-change fields and `cen`. A target whose `enabledKeys` omitted `ec` previously emitted `e=e,sid="…",sn=0,ts=…,v=2`, which `validateCmcdEvents()` rejects for the missing required key; `rr` targets lost `url` the same way. This affects any such target, with or without a report transform configured

### Changed

- `CmcdTransformRequest`, `CmcdRequestReportTransform`, `CmcdEventReportTransform`, `CmcdRequestReportConfig`, `CmcdEventReportConfig`, `CmcdReporterConfig`, and `CmcdReporter` now take a type parameter describing the player's `customData`, so a transform reads player fields with typed dot access instead of bracket access on `unknown`. The parameter is inferred from the configuration: annotating a single transform as `CmcdEventReportTransform<PlayerData>` types the `request` argument in every other transform on the same reporter, and `new CmcdReporter<PlayerData>({ … })` does the same explicitly. Every declaration defaults to `Record<string, unknown>`, so existing code compiles unchanged and un-parameterized spellings such as `CmcdRequestReportTransform` keep their current `unknown`-valued behavior. This closes the asymmetry left by the generic `recordResponseReceived()` below, where the call site preserved the player's `customData` type but the transform reading that same request did not

  `customData` is readonly at every depth rather than only at the top level, so describing a nested shape does not trade the request's no-mutation guarantee for typed reads. `Readonly<C>` would have left `request.customData.nested.field = …` compiling, which the opaque-record default had always rejected

  `createRequestReport()` and `recordResponseReceived()` require the request's `customData` to satisfy the reporter's type, so a request the configured transforms could not read is rejected at the call site instead of reaching them and reading `undefined`. A reporter left on the default constrains nothing and accepts any `customData`, exactly as before; the rule is expressed by the new `CmcdReporterCustomData` type
- `CmcdReporterCustomData<C>` — the `customData` a `CmcdReporter` method accepts for a reporter typed `C`. Exported because it appears in the signatures of `createRequestReport()` and `recordResponseReceived()`
- `CmcdReporter.recordResponseReceived()` is now generic over the request's `customData`, so a player can pass a request carrying only its own keys (e.g. `{ requestType: 'segment' }`) without declaring a `cmcd` key it does not own and without a cast. The parameter was previously pinned to `HttpResponse<HttpRequest<{ cmcd?: Cmcd }>>`; because `{ cmcd?: Cmcd }` is a weak type (every property optional), a `customData` sharing no properties with it was rejected outright. This pairs with the per-target `transform`, which reads the player's taxonomy off the triggering request. Type-only widening: the reporter still reads just `customData.cmcd`, and existing callers passing `HttpRequest<{ cmcd?: Cmcd }>` continue to compile
- `isCmcdCustomKey` and the `CmcdCustomKey` type now only accept custom keys that survive RFC 8941 key serialization: a lowercase first letter, then characters from `a-z 0-9 . -`, with a hyphen that is neither the first nor the last character. Uppercase and digit-leading names were never serializable as CMCD; they are now rejected by the type, the validators, and key filtering instead of being dropped at encode preparation

### Documentation

- The user guide now documents custom reverse-DNS keys end to end: naming rules (including the runtime constraints the `CmcdCustomKey` type cannot express), the explicit `enabledKeys` opt-in required in both request mode and per event target (no wildcard exists), value types and wire-format behavior (`true` as a bare key, `false` dropped), and the fixed `CMCD-Request` header placement in headers mode
- The custom-event (`e=ce`) documentation now shows a complete working configuration: `CmcdEventType.CUSTOM_EVENT` must be listed in the target's `events` for delivery, `cen` is force-included without an `enabledKeys` entry, and any accompanying payload remains subject to the target's `enabledKeys`. Also documents that response-received keys are stripped from non-`rr` events
- The user guide and validation guide custom-key sections now cross-link each other

## [2.4.1] - 2026-07-21

### Fixed

- Module-scope key-table `Set`/`Map` initializers (and the `CmcdReporter` state-field tables) are now marked side-effect free so consumer bundlers can drop them when unused; a bare import of the package previously retained ~4.9 KB of eagerly-built tables (follow-up to the module-scope side-effect audit in [#382](https://github.com/streaming-video-technology-alliance/common-media-library/issues/382))
- `isCmcdCustomKey` no longer backtracks quadratically on hostile inputs (CodeQL polynomial ReDoS): the ambiguous regex was replaced with an unambiguous character-class check plus an interior-hyphen test; accepted inputs are unchanged ([#388](https://github.com/streaming-video-technology-alliance/common-media-library/issues/388))

### Documentation

- Clarify recommended event-firing patterns in `CmcdReporter`: state-change events are fired via `update()`, with snapshot context attached by combining the state field and continuous metrics in a single call. `recordEvent()`'s `data` argument is documented as intended for non-state-change events (custom, error, ad-lifecycle, mute/unmute, expand/collapse, skip). Calling `recordEvent()` for a state-change event after `update()` has auto-fired it silently drops the second call's data; see the user guide for the recommended pattern.

## [2.4.0] - 2026-05-22

### Added

- `CmcdEventType.PLAYBACK_RATE` (token `'pr'`) for playback-rate-change events, per CTA-5004-B.
- `CmcdReportRecorder` — test helper that records CMCD-bearing
  reports across XHR and fetch transports for assertion in e2e tests.
  Includes `waitForReports`, `waitForManifest`, `waitForSegments`,
  and `waitForEvents` wait primitives that accept a
  `CmcdReportRecorderWaitOptions` object (`{ count?, timeout? }`,
  `count` defaults to `1`, reject on timeout) plus a `waitTimeout`
  attach option that sets the per-recorder default timeout, and
  event-target POST stubbing.
- `CmcdRecordedRequestType` const-enum and supporting types
  (`CmcdRecordedReport`, `CmcdRecordedReportMode`, `CmcdTransportAdapter`,
  `CmcdReportRecorderOptions`, `CmcdReportRecorderWaitOptions`).
- `createXhrTransport` and `createFetchTransport` default adapter
  factories.

### Changed

- `CmcdReporter.update()` now auto-fires the corresponding state-change event (`PLAY_STATE`, `PLAYBACK_RATE`, `CONTENT_ID`, `BACKGROUNDED_MODE`, `BITRATE_CHANGE`) when a tracked field's value changes. A subsequent `recordEvent()` call for the same state-change event is deduplicated, which silently drops any enrichment data passed to it.
- `CmcdReporter.recordEvent()` with a state-change event now persists the dedup field from its `data` argument into the persistent data store (write-through), keeping `this.data` consistent with the most recently reported value.
- Consecutive state-change events with the same effective field value are now suppressed, matching CTA-5004-B's definition of these events as state transitions.

### Fixed

- `prepareCmcdData` now force-includes the required field (`sta`, `pr`, `cid`, `bg`, `br`) for state-change events (`ps`, `pr`, `c`, `b`, `bc`) after the per-target `enabledKeys` filter, preventing CTA-5004-B-non-compliant payloads like `e=ps` with no `sta` ([#368](https://github.com/streaming-video-technology-alliance/common-media-library/issues/368)).
- `prepareCmcdData` preserves `pr=1` when encoding an `e=pr` state-change event in event mode. The v1 default-omission for `pr=1` still applies in request mode and in non-`pr` event-mode payloads.
- `prepareCmcdData` now emits an explicit `?0` token for `bg: false` on a backgrounded-mode (`e=b`) state-change event in event mode. Previously the field was stripped by the `isValid` filter, producing a CTA-5004-B-non-compliant payload on backgrounded-mode exit. The carve-out is scoped tightly to this case (`bg` is the only state-change required field typed as boolean); `''`/nullish/`NaN` and `false` on other state-change required fields remain stripped, and request-mode default-omission is unchanged ([#372](https://github.com/streaming-video-technology-alliance/common-media-library/issues/372)).
- `validateCmcdStructure` now reports missing required fields for all five state-change events; previously only `e=ps` was checked for `sta`.

## [2.3.2] - 2026-05-13

### Fixed

- Fix `nor` formatter crash (`TypeError: Invalid URL`) when the value is already a relative path and `baseUrl` is configured ([#364](https://github.com/streaming-video-technology-alliance/common-media-library/issues/364))

### Changed

- `CmcdReporter` now uses the current request URL's directory (via `getBaseUrl`) as the base for `nor` relative-path conversion, producing sibling-relative paths per the CMCD specification (previously the origin was used, yielding root-relative paths)
- Clarify TSDoc for `nor` and `CmcdEncodeOptions.baseUrl` / `CmcdFormatterOptions.baseUrl` to document the absolute-URL convenience conversion

## [2.3.1] - 2026-04-30

### Fixed

- Fix memory leak in `CmcdReporter` from orphaned `setInterval` after HTTP 410 response ([#360](https://github.com/streaming-video-technology-alliance/common-media-library/issues/360))
- Fix `CmcdReporter.start()` not being idempotent — repeated calls leaked the previous time-interval timer

## [2.3.0] - 2026-03-12

### Added

- Add `CMCD_MIME_TYPE` constant for the CMCD event report MIME type
- Add `validateCmcdEventReport(request, options?)` to validate full HTTP requests as event-mode payloads
- Add `@see` links to JSDoc comments referencing CTA-5004-B spec sections

### Changed

- Update event report MIME type from `text/cmcd` to `application/cmcd` per CTA-5004-B spec ([#332](https://github.com/streaming-video-technology-alliance/common-media-library/issues/332))

## [2.2.0] - 2026-02-18

### Added

- Add `validateCmcd(data, options?)` orchestrator that runs key, value, and structure validation
- Add `validateCmcdKeys(data, options?)` to check keys against recognized v1/v2 spec keys
- Add `validateCmcdValues(data, options?)` to validate value types, constraints, and rounding rules
- Add `validateCmcdStructure(data, options?)` to validate structural rules (event mode, version key, response-received keys)
- Add `validateCmcdHeaders(headers)` to validate CMCD HTTP headers including shard placement
- Add `validateCmcdEvents(cmcd)` to validate multi-line event-mode payloads
- Add `validateCmcdRequest(request)` to validate CMCD data from a `Request` or `HttpRequest`
- Add `CmcdValidationResult`, `CmcdDataValidationResult`, `CmcdEventsValidationResult`, `CmcdValidationIssue`, `CmcdValidationOptions`, and `CmcdValidationSeverity` types
- Add `CmcdData`, `CmcdV1Data`, and `CmcdV2Data` discriminated union types using `v` as the discriminator property
- Add `isCmcdV1Data(data)` type guard to narrow `CmcdData` to `CmcdV1Data`
- Add `isCmcdV2Data(data)` type guard to narrow `CmcdData` to `CmcdV2Data`
- Add `CmcdDecodeOptions` type with `convertToLatest` option to up-convert v1 data to v2 format during decoding
- Add optional `options` parameter to `decodeCmcd`, `fromCmcdHeaders`, `fromCmcdQuery`, and `fromCmcdUrl`

### Changed

- Change `decodeCmcd`, `fromCmcdHeaders`, `fromCmcdQuery`, and `fromCmcdUrl` return type from `Cmcd` to `CmcdData`

### Fixed

- Fix `CMCD_EVENT_BITRATE_CHANGE` value from `'br'` to `'bc'`

## [2.1.2] - 2026-02-11

### Changed

- Improve TSDoc for `CmcdReporter` methods
- Update `@svta/cml-utils` to 1.4.0

## [2.1.1] - 2026-02-09

### Fixed

- Fix `CmcdReporter.start()` dispatching time interval events to all targets instead of only the target with the event enabled

## [2.1.0] - 2026-02-06

### Added

- Add `CmcdReporter.recordResponseReceived(response, data?)` method for automated `rr` event reporting
- Add `CmcdReporter.createRequestReport(request, data?)` method with generic type support and per-request CMCD data
- Add `CmcdReporter.isRequestReportingEnabled()` method to check if request reporting is enabled
- Add `CmcdRequestReport` type

### Changed

- `CmcdReporter.recordEvent` data parameter is now scoped to the event instead of being persisted via `update()`
- `CmcdReporter.recordEvent` now respects caller-supplied `ts` values instead of always overriding with `Date.now()`
- `CmcdReporter.stop` now accepts an optional `flush` parameter

### Deprecated

- `CmcdReporter.applyRequestReport` in favor of `CmcdReporter.createRequestReport`

## [2.0.1] - 2026-02-04

### Changed

- Update `@svta/cml-structured-field-values` to 1.1.1
- Update `@svta/cml-utils` to 1.3.0
- Update `CmcdReporter` to use `HttpRequest` from `@svta/cml-utils` (renamed from `Request`)

### Fixed

- Missing `CmcdVersion` and `CMCD_HEADER_MAP` exports

## [2.0.0] - 2026-02-03

### Added

- CMCD Version 2 support ([#143](https://github.com/streaming-video-technology-alliance/common-media-library/issues/143))

## [1.0.2] - 2025-12-26

### Changed

- Update `@svta/cml-utils` to 1.1.0 ([#279](https://github.com/streaming-video-technology-alliance/common-media-library/issues/279))

## [1.0.1] - 2025-12-22

### Changed

- Removed `response mode` from CMCD encoding
- Added `response received` event and filtering

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [1.0.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.5.0...HEAD
[2.5.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.4.1...cmcd-v2.5.0
[2.4.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.4.0...cmcd-v2.4.1
[2.4.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.3.2...cmcd-v2.4.0
[2.3.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.3.1...cmcd-v2.3.2
[2.3.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.3.0...cmcd-v2.3.1
[2.3.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.2.0...cmcd-v2.3.0
[2.2.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.1.2...cmcd-v2.2.0
[2.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.1.1...cmcd-v2.1.2
[2.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.1.0...cmcd-v2.1.1
[2.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.0.1...cmcd-v2.1.0
[2.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.0.0...cmcd-v2.0.1
[2.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v1.0.2...cmcd-v2.0.0
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v1.0.1...cmcd-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v1.0.0...cmcd-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/cmcd-v1.0.0
