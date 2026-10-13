# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- README: the usage example imports from `@svta/cml-throughput` instead of an unexported subpath, and prints its result instead of calling an undefined `assert`.
- The TSDoc of `EwmaEstimatorOptions` describes each option, the default value, and the shaka-player value.

### Fixed

- The `getEstimate` TSDoc states the unit as bits per second. Before, the comment said bytes per second.
- `EwmaEstimator` now returns a positive estimate. Before, the estimator used the half-life as the smoothing factor and could return a negative estimate. All estimates change after this fix.
- `EwmaEstimator` now returns `defaultEstimate` until the first sample.
- `Ewma.sample` now weights the new value by `1 - alpha ^ weight` and the previous estimate by `alpha ^ weight`. Before, the new value received the weight `alpha ^ weight`. The constructor still takes the smoothing factor `alpha`, and the estimate of a direct `Ewma` instance changes.
- `Ewma.getEstimate` now returns 0 for an empty `Ewma`. Before, the method returned `NaN`. With an `alpha` of 0, the method now returns the last value.
- `Ewma.sample` now ignores a sample that would make the estimate `NaN`. The estimate and the total duration do not change for that sample.
- `EwmaEstimator.sample` now ignores a sample with a duration of 0 or less. Before, a zero duration made every later estimate infinite or `NaN`, and a negative duration gave a negative estimate.


## [1.0.9] - 2026-09-15

### Changed

- Update `@svta/cml-utils` to 1.6.1

## [1.0.8] - 2026-07-28

### Changed

- Update `@svta/cml-utils` to 1.6.0

## [1.0.7] - 2026-07-21

### Changed

- Update `@svta/cml-utils` to 1.5.1

## [1.0.6] - 2026-05-13

### Changed

- Update `@svta/cml-utils` to 1.5.0

## [1.0.5] - 2026-02-11

### Changed

- Update `@svta/cml-utils` to 1.4.0

## [1.0.4] - 2026-02-04

### Changed

- Update `@svta/cml-utils` to 1.3.0

## [1.0.3] - 2026-02-03

### Changed

- Update `@svta/cml-utils` to 1.2.0

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.9...HEAD
[1.0.9]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.8...throughput-v1.0.9
[1.0.8]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.7...throughput-v1.0.8
[1.0.7]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.6...throughput-v1.0.7
[1.0.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.5...throughput-v1.0.6
[1.0.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.4...throughput-v1.0.5
[1.0.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.3...throughput-v1.0.4
[1.0.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.2...throughput-v1.0.3
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.1...throughput-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/throughput-v1.0.0...throughput-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/throughput-v1.0.0
