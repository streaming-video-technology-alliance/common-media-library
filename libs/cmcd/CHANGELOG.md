# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Update `CmcdReporter` to use `HttpRequest` from `@svta/cml-utils` (renamed from `Request`)
- Refactored `Cmcd` type to be the intersection `CmcdRequest & CmcdResponse & CmcdEvent`
- Restored `CmcdRequest`, `CmcdResponse`, and `CmcdEvent` as separate, standalone types
- `CmcdRequest` contains the common, object, request, session, and status keys
- `CmcdEvent` extends `CmcdRequest` with event-specific keys (`cen`, `e`, `h`, `ts`)
- `CmcdResponse` extends `CmcdRequest` with response-specific keys (`cmsdd`, `cmsds`, `rc`, `smrt`, `ttfb`, `ttfbb`, `ttlb`, `url`)
- Updated `CmcdRequestKey` to use `keyof CmcdRequest` instead of `keyof Cmcd`

### Removed

- Removed deprecated `CmcdData` type alias (use `Cmcd` instead)
- Removed deprecated `CmcdRequestData` type alias (use `CmcdRequest` instead)

## [2.0.1] - 2026-02-04

### Changed

- Update `@svta/cml-structured-field-values` to 1.1.1
- Update `@svta/cml-utils` to 1.3.0

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.0.1...HEAD
[2.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v2.0.0...cmcd-v2.0.1
[2.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v1.0.2...cmcd-v2.0.0
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v1.0.1...cmcd-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmcd-v1.0.0...cmcd-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/cmcd-v1.0.0
