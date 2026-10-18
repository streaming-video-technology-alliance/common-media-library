# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-10-18

### Changed

- The `@svta/cml-utils` peer dependency range is now `^1.6.2` instead of `*`. The published package no longer accepts a later major version of `@svta/cml-utils`.

### Fixed

- `createThroughputSelector` now picks rung 0 for a `throughput` of 0 instead of the current rung. A negative value, `NaN`, or `Infinity` still counts as unknown ([#532](https://github.com/streaming-video-technology-alliance/common-media-library/issues/532))

## [0.1.0] - 2026-10-18

### Added

- Initial implementation of the [bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526)
- `BitrateSelector`, the type that every bitrate selection algorithm implements, with its `BitrateSelectorInput`, `LadderRung`, `BitrateDecision`, and `SegmentSample` types
- `createThroughputSelector`, which creates a rate-based selector with a safety factor, an upgrade factor for the hysteresis, and a two-pass starvation guard
- `DEFAULT_SAFETY_FACTOR` (0.9), `DEFAULT_UPGRADE_FACTOR` (0.7), and `DEFAULT_STARVATION_TOLERANCE` (4)

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/abr-v0.1.1...HEAD
[0.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/abr-v0.1.0...abr-v0.1.1
[0.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/abr-v0.1.0
