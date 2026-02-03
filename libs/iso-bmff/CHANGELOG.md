# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0-beta.2] - 2026-02-03

### Changed

- Update `@svta/cml-utils` to 1.2.0

## [1.0.0-beta.1] - 2026-01-29

### Added

- Added writers: `stsc`, `stsz`, `stco`.
- Added `defaultReaderConfig` and `defaultWriterConfig` functions to create default reader and writer configurations ([#298](https://github.com/streaming-video-technology-alliance/common-media-library/issues/298))

### Changed

- Made `IsoBoxWriteViewConfig` required in `writeIsoBoxes` function ([#298](https://github.com/streaming-video-technology-alliance/common-media-library/issues/298))

## [1.0.0-alpha.9] - 2026-01-16

### Added

- Added `fourCcToUint32` utility function to convert FourCC strings to Uint32

## [1.0.0-alpha.8] - 2026-01-16

### Added

- Added `favicon.ico` to documentation
- Added `isIsoBoxType` type guard function

### Changed

- Allow type guards to be used with `findIsoBox` and `filterIsoBoxes`
- Improved base `SampleEntryBox` type
- Updated box reader functions to allow a type parameter to be passed in

## [1.0.0-alpha.7] - 2026-01-12

### Fix

- Bad publish

## [1.0.0-alpha.6] - 2026-01-09

### Added

- Added `IsoBoxFields` constant for all ISO BMFF field types
- Exports for `IsoBoxReadView` and `IsoBoxWriteView`

### Changed

- Moved all field constants to `IsoBoxFields.ts`

### Fixed

- Broken type inference for `createAudioSampleEntryReader` and `createVisualSampleEntryReader`
- Broken type inference for `writeIsoBoxes`

## [1.0.0-alpha.5] - 2026-01-08

### Fixed

- Broken type inference for `traverseIsoBoxes`, `findIsoBox`, and `filterIsoBoxes`

## [1.0.0-alpha.4] - 2026-01-08

### Added

- Added ability to use generic reader functions with `readIsoBoxes`
- Added `createAudioSampleEntryReader` and `createVisualSampleEntryReader` utility functions for custom audio and visual sample entry box types
- Added `findIsoBox` utility function to find the first box matching a predicate
- Added `filterIsoBoxes` utility function to filter boxes matching a predicate
- Added `TraverseIsoBoxesConfig` type for configuring box traversal options

### Changed

- Improved type inference for reader return types
- Changed `traverseIsoBoxes` to accept a config object instead of positional arguments for `depthFirst` and `maxDepth`
- Expanded `AudioSampleEntryBox` and `VisualSampleEntryBox` type parameters to accept any `IsoBoxType`

## [1.0.0-alpha.3] - 2025-01-07

### Changed

- Improved reading and writing of A/V sample entry boxes

### Fixed

- Incorrect FourCC for Additional Metadata Container Box (`meco`) box

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-beta.2...HEAD
[1.0.0-beta.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-beta.1...iso-bmff-v1.0.0-beta.2
[1.0.0-beta.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.9...iso-bmff-v1.0.0-beta.1
[1.0.0-alpha.9]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.8...iso-bmff-v1.0.0-alpha.9
[1.0.0-alpha.8]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.7...iso-bmff-v1.0.0-alpha.8
[1.0.0-alpha.7]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.6...iso-bmff-v1.0.0-alpha.7
[1.0.0-alpha.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.5...iso-bmff-v1.0.0-alpha.6
[1.0.0-alpha.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.4...iso-bmff-v1.0.0-alpha.5
[1.0.0-alpha.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.3...iso-bmff-v1.0.0-alpha.4
[1.0.0-alpha.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.2...iso-bmff-v1.0.0-alpha.3
[1.0.0-alpha.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-alpha.1...iso-bmff-v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v0.23.2...iso-bmff-v1.0.0-alpha.1
[0.23.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v0.23.1...iso-bmff-v0.23.2
[0.23.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v0.23.0...iso-bmff-v0.23.1
[0.23.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/iso-bmff-v0.23.0
