# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- README: the usage example prints its result instead of calling an undefined `assert`.
- `parseIntegerOrDecimal` creates its `Error` only when parsing fails. Before this change, every call created an `Error` and captured a stack trace, also when parsing succeeded. Every Integer and Decimal in a parsed field passes through this function. Error messages do not change.
- The encoder allocates less and runs faster. `encodeSfDict`, `encodeSfList`, and `encodeSfItem` no longer wrap bare values in `SfItem` objects, and the dictionary and parameter serializers no longer copy their entries through `Object.entries`, `Array.from`, and `map`. `serializeString` returns a string that needs no escape after one regex test. `serializeKey` checks the character codes in a loop. For a 17-key CMCD request dictionary, one encode takes about 40% less time and allocates 2.1 KB instead of 6.5 KB. The output does not change. The error for `encodeSfItem([1, 2])` now quotes the array as passed, `[1,2]`, instead of the wrapped items.
- `serializeInnerList` also accepts the list and its parameters as two arguments: `serializeInnerList([1, 2], { a: 1 })`. The `SfInnerList` object form still works.
- A benchmark for the encoder: `npm run bench -w libs/structured-field-values`. The header of `bench/bench.ts` describes the options.

### Fixed

- Remove the module-scope template literal that built the `Integer or Decimal` error type name. Rolldown-based bundlers such as tsdown kept that statement and two constants in bundles that never used the parser. `parseIntegerOrDecimal` now builds the name inside the function. Error messages do not change.
- `serializeDecimal` fails on values of `1e21` and above. Before this change, the magnitude check used the length of `Number.prototype.toString`, which switches to exponent notation at `1e21`, so `serializeDecimal(1e21)` returned `1e+21.0`. RFC 8941 allows at most 12 digits before the decimal point.


## [1.1.5] - 2026-07-28

### Fixed

- `encodeSfDict` and `encodeSfList` no longer drop the whitespace RFC 8941 emits after each comma when they are given a partial options object. `whitespace` was applied via a default parameter, so any options object without that property (for example `encodeSfDict(data, {})`) silently produced compact output; it is now treated as `true` unless explicitly set to `false`. Callers that passed an options object without `whitespace` and relied on compact output must now pass `whitespace: false`

## [1.1.4] - 2026-07-21

### Changed

- Update `@svta/cml-utils` to 1.5.1

## [1.1.3] - 2026-05-13

### Changed

- Update `@svta/cml-utils` to 1.5.0

## [1.1.2] - 2026-02-11

### Changed

- Update `@svta/cml-utils` to 1.4.0

## [1.1.1] - 2026-02-04

### Changed

- Update `@svta/cml-utils` to 1.3.0

## [1.1.0] - 2026-02-03

### Added

- Add optional generic type parameters to `SfItem` class for improved type inference

## [1.0.2] - 2025-12-26

### Changed

- Update `@svta/cml-utils` to 1.1.0 ([#279](https://github.com/streaming-video-technology-alliance/common-media-library/issues/279))

## [1.0.1] - 2025-12-22

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [1.0.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.5...HEAD
[1.1.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.4...structured-field-values-v1.1.5
[1.1.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.3...structured-field-values-v1.1.4
[1.1.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.2...structured-field-values-v1.1.3
[1.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.1...structured-field-values-v1.1.2
[1.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.0...structured-field-values-v1.1.1
[1.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.0.2...structured-field-values-v1.1.0
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.0.1...structured-field-values-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.0.0...structured-field-values-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/structured-field-values-v1.0.0
