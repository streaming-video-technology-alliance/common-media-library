# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-20

### Added

- Add `includeParentElement` option to `parseXml()` that adds `parentElement` property to each node following DOM spec

### Changed

- Improve `parseXml()` performance by moving constants to module scope, using `Set` for delimiter lookups, and optimizing bounds checks

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.0...HEAD
[1.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.0.2...xml-v1.1.0
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.0.1...xml-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.0.0...xml-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/xml-v1.0.0
