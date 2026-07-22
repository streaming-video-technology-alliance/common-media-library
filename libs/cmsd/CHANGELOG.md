# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `isCmsdCustomKey`: runtime check for valid custom keys (a lowercase first letter, then characters from `a-z 0-9 . -`, with a hyphen that is neither the first nor the last character), the subset of hyphenated key names that survives RFC 8941 key serialization

### Changed

- The `CmsdCustomKey` type now requires a lowercase hyphenated string, matching `isCmsdCustomKey`. Uppercase and digit-leading custom keys were never serializable as CMSD structured fields (`encodeCmsdStatic` and `encodeCmsdDynamic` throw on them); they are now rejected at compile time

## [1.0.7] - 2026-07-21

### Changed

- Update `@svta/cml-cta` to 1.0.7
- Update `@svta/cml-structured-field-values` to 1.1.4
- Update `@svta/cml-utils` to 1.5.1

## [1.0.6] - 2026-05-13

### Changed

- Update `@svta/cml-cta` to 1.0.6
- Update `@svta/cml-structured-field-values` to 1.1.3
- Update `@svta/cml-utils` to 1.5.0

## [1.0.5] - 2026-02-11

### Changed

- Update `@svta/cml-cta` to 1.0.5
- Update `@svta/cml-structured-field-values` to 1.1.2
- Update `@svta/cml-utils` to 1.4.0

## [1.0.4] - 2026-02-04

### Changed

- Update `@svta/cml-cta` to 1.0.4
- Update `@svta/cml-structured-field-values` to 1.1.1
- Update `@svta/cml-utils` to 1.3.0

## [1.0.3] - 2026-02-03

### Changed

- Update `@svta/cml-utils` to 1.2.0
- Update `@svta/cml-structured-field-values` to 1.1.0
- Update `@svta/cml-cta` to 1.0.3

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.7...HEAD
[1.0.7]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.6...cmsd-v1.0.7
[1.0.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.5...cmsd-v1.0.6
[1.0.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.4...cmsd-v1.0.5
[1.0.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.3...cmsd-v1.0.4
[1.0.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.2...cmsd-v1.0.3
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.1...cmsd-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmsd-v1.0.0...cmsd-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/cmsd-v1.0.0
