# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-10-26

### Changed

- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.

### Fixed

- `decodeIso8601Duration` gives `NaN` for a malformed duration. Before, `P1H` gave 3600 and `PTH1M` gave 60. A time designator needs the `T`, and every designator needs a number.

## [1.0.2] - 2026-07-21

### Changed

- Promote the package API from `@beta` to `@public`: `decodeIso8601Duration` and `encodeIso8601Duration` are now documented as stable ([#288](https://github.com/streaming-video-technology-alliance/common-media-library/issues/288))

## [1.0.1] - 2025-12-22

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [1.0.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-8601-v1.0.3...HEAD
[1.0.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-8601-v1.0.2...iso-8601-v1.0.3
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-8601-v1.0.1...iso-8601-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-8601-v1.0.0...iso-8601-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/iso-8601-v1.0.0
