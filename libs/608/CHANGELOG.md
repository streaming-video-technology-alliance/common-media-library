# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2026-02-13

### Fixed

- CEA608 parser now supports H.265 (HEVC) and H.266 (VVC) SEI NALU types in addition to H.264 (AVC). This fixes CEA608 parsing in H.265/H.266 streams.

## [1.0.1] - 2025-12-22

### Fixed

- The `extractCta608DataFromSample` function is missing from `@svta/cml-608` ([#276](https://github.com/streaming-video-technology-alliance/common-media-library/issues/276))
- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [1.0.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/608-v1.0.2...HEAD
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/608-v1.0.1...608-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/608-v1.0.0...608-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/608-v1.0.0
