# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ThroughputSelectorOptions.ignoreTimeToFirstByte`. When `true`, the selector ignores the time to first byte in every pick and in the starvation guard. Default `false`.

### Changed

- The starvation guard of both selectors adds the time to first byte to the download time of a rung. The value is the mean of `responseStart - startTime` over the last four finished samples. The guard ignores a sample whose `responseStart` is missing or outside the response ([#587](https://github.com/streaming-video-technology-alliance/common-media-library/issues/587))
- When a call has `segmentDuration`, the throughput selector picks the highest rung whose download fits in one segment. The download time is the time to first byte plus the transfer at `throughput * safetyFactor`. Before, the pick was the highest rung at or below `throughput * safetyFactor / playbackRate`.
- The BOLA startup pick and oscillation guard bound the pick by the download time of one segment, as the throughput selector does. Before, both used the highest rung at or below `throughput * safetyFactor`. The buffer score, the placeholder, and the delay do not change.
- The README states that the throughput selector accepts a `select` call during a download and that BOLA does not.
- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.
- The README no longer describes the peer dependencies. The website lists them from `package.json` on the package page.

## [0.2.0] - 2026-10-21

### Added

- `createBolaSelector`, which creates a buffer-based selector that implements BOLA, as the [BOLA selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/rfc/bola-abr-selector/index.md) defines ([#358](https://github.com/streaming-video-technology-alliance/common-media-library/issues/358))
- `BolaSelector`, `BolaDecision`, `BolaSelectorOptions`, `BolaState`, and `BOLA_DEFAULT_BUFFER_TARGET` (18)
- The `starvationSafetyFactor` option of `createBolaSelector`, and `DEFAULT_STARVATION_SAFETY_FACTOR` (0.7). The BOLA selector runs the starvation guard when the input has `segmentDuration`.

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/abr-v0.2.0...HEAD
[0.2.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/abr-v0.1.1...abr-v0.2.0
[0.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/abr-v0.1.0...abr-v0.1.1
[0.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/abr-v0.1.0
