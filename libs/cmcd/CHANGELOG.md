# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `CmcdReporterConfig.customHeaderMap` — routes custom keys into specific CMCD header shards (`CMCD-Session`, `CMCD-Object`, `CMCD-Status`) when the transmission mode is `HEADERS`. Custom keys not listed in any shard still default to `CMCD-Request`; standard keys keep their spec-defined shards and cannot be re-routed. The option previously existed on `CmcdEncodeOptions` but was not reachable through `CmcdReporter`

### Changed

- `isCmcdCustomKey` and the `CmcdCustomKey` type now only accept custom keys that survive RFC 8941 key serialization: a lowercase first letter, then characters from `a-z 0-9 . -`, with a hyphen that is neither the first nor the last character. Uppercase and digit-leading names were never serializable as CMCD; they are now rejected by the type, the validators, and key filtering instead of being dropped at encode preparation

### Fixed

- `prepareCmcdData` now strips CMCD data that cannot be serialized per RFC 8941 instead of letting the encoder throw. The check is backed by the structured-field serializers (`isSerializableSfMember` from `@svta/cml-structured-field-values`), so it covers every serialization failure mode: control-character strings (including inside arrays and `SfItem` wrappers), out-of-range integers and decimals, and token values with invalid characters
- `CmcdReporter` event batches no longer lose data permanently when an event cannot be encoded. Previously the encode failure was indistinguishable from a transport failure, so the whole batch — including its clean events — was re-queued at the head of the queue forever: it was retried on every subsequent send, never delivered, and `flush()` could not clear it. Unencodable events are now dropped from the batch, the clean events deliver, and the re-queue path is reserved for retryable transport failures (429/5xx)
- `CmcdReporter.createRequestReport` no longer throws into the player's request path when a value survives preparation but fails serialization; the request is returned without CMCD applied instead

### Documentation

- The user guide now documents custom reverse-DNS keys end to end: naming rules (including the runtime constraints the `CmcdCustomKey` type cannot express), the explicit `enabledKeys` opt-in required in both request mode and per event target (no wildcard exists), value types and wire-format behavior (`true` as a bare key, `false` dropped, control-character strings dropped), and the fixed `CMCD-Request` header placement in headers mode
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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.4.1...HEAD
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
