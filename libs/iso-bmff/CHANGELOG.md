# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-alpha.3] - 2025-01-07

### Changed

- Improved reading and writing of A/V sample entry boxes

## [1.0.0-alpha.2] - 2025-01-05

### Added

- Add `stsd` and `dref` box writers
- Add `CONTAINERS` export for the list of box types that are containers

### Changed

- Updated `README`
- `IsoBoxWriter` signature now includes a required `config` parameter: `(box: B, config: Required<IsoBoxWriteViewConfig>) => ArrayBufferView`
- `writeArray` method now requires a `length` parameter to specify the number of values to write
- Renamed `IsoBoxReadableStreamConfig` to `IsoBoxWriteViewConfig`
- Removed `writeVisualSampleEntryBox` export (use specific visual sample entry writers like `writeAvc1`, `writeAvc3`, etc. instead)

## [1.0.0-alpha.1] - 2025-12-27

### Added

- Implement ISO Box writing ([#269](https://github.com/streaming-video-technology-alliance/common-media-library/issues/269))

## [0.23.2] - 2025-12-26

### Changed

- Update `@svta/cml-utils` to 1.1.0 ([#279](https://github.com/streaming-video-technology-alliance/common-media-library/issues/279))

## [0.23.1] - 2025-12-22

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [0.23.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-/iso-bmff-/iso-bmff-v1.0.0-alpha.1...HEAD
[1.0.0-alpha.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v0.23.2...iso-bmff-v1.0.0-alpha.1
[0.23.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v0.23.1...iso-bmff-v0.23.2
[0.23.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v0.23.0...iso-bmff-v0.23.1
[0.23.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/iso-bmff-v0.23.0
