# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `isSerializableSfMember` — checks whether a value can be serialized as a structured field dictionary or list member without failing, covering all RFC 8941 serialization failure modes (control characters in strings, out-of-range integers and decimals, invalid token content, unsupported types)

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.4...HEAD
[1.1.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.3...structured-field-values-v1.1.4
[1.1.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.2...structured-field-values-v1.1.3
[1.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.1...structured-field-values-v1.1.2
[1.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.1.0...structured-field-values-v1.1.1
[1.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.0.2...structured-field-values-v1.1.0
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.0.1...structured-field-values-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/structured-field-values-v1.0.0...structured-field-values-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/structured-field-values-v1.0.0
