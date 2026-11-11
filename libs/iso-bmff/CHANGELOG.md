# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `IsoBoxReadView.readUint64` and `IsoBoxWriteView.writeUint64` read and write a 64-bit unsigned integer as a `bigint`. `readUint(8)` and `writeUint(value, 8)` use a `number`, which loses precision above 2^53 - 1. A custom reader for a 64-bit field, such as `baseMediaDecodeTime` in a version 1 `tfdt` box, can now keep the exact value ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `readStco`, `readStsc`, and `readStsz` are new readers for the `stco`, `stsc`, and `stsz` boxes ([#619](https://github.com/streaming-video-technology-alliance/common-media-library/issues/619)).

### Fixed

- `IsoBoxReadView.readUtf8(-1)` now moves the view to the byte after the null byte of a string that has multi-byte characters. `readKind`, `readLabl`, and `readPrsl` now return the correct fields after such a string. Earlier releases return an empty `value` for a `kind` box with the `schemeUri` `urn:é` ([#630](https://github.com/streaming-video-technology-alliance/common-media-library/issues/630)).
- `IsoBoxReadView.readUtf8(-1)` and `IsoBoxReadView.readString(-1)` now stop at the end of the view when the string has no null byte. Earlier releases move the view one byte past the end, and `bytesRemaining` is -1 ([#635](https://github.com/streaming-video-technology-alliance/common-media-library/issues/635)).
- `IsoBoxReadView.readUtf8()` with no size now moves the view to the end of the view. Earlier releases return the string and do not move the view ([#635](https://github.com/streaming-video-technology-alliance/common-media-library/issues/635)).
- `IsoBoxReadView.readUtf8(size)` with a positive `size` now reads `size` bytes. With a `size` that exceeds the bytes that remain, the method reads to the end of the view and stops there. Earlier releases read every byte up to the end of the view ([#635](https://github.com/streaming-video-technology-alliance/common-media-library/issues/635)).
- `IsoBoxReadView.readUtf8(0)` now reads no bytes and returns an empty string. Earlier releases return the string up to the end of the view ([#635](https://github.com/streaming-video-technology-alliance/common-media-library/issues/635)).
- `IsoBoxReadView.readData(size)` now stops at the end of the view when `size` exceeds the bytes that remain. Earlier releases return bytes that follow the view, or throw a `RangeError` at the end of the buffer.
- `IsoBoxReadView.readData(0)` now reads no bytes and returns an empty array. Earlier releases return every byte up to the end of the view. If your code passes 0 to read to the end of the view, pass -1.
- The `hdlr`, `url `, `urn `, and `schm` readers and writers now use UTF-8 for the `name`, `location`, and `schemeUri` strings. Earlier releases return `å,` for a `name` of `日本` after `writeHdlr` and `readHdlr` ([#631](https://github.com/streaming-video-technology-alliance/common-media-library/issues/631)).
- `IsoBoxReaderReturn` no longer adds the built-in type of a box whose reader the configuration replaces. The result of `readIsoBoxes` with a custom `tfdt` reader now narrows to the return type of that reader ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `IsoBoxReaderReturn` now includes the return type of an optional reader and no longer includes `undefined` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `writeSchm` now writes the null terminator of an empty `schemeUri` when flag `0x000001` is set. The writer writes an empty string for a missing `schemeUri` ([#628](https://github.com/streaming-video-technology-alliance/common-media-library/issues/628)).
- `IsoBoxReadView.readInt(8)` now returns the correct value for a signed 64-bit integer such as -1. `readElst` now returns the correct `mediaTime` for a version 1 `elst` box, where -1 marks an empty edit. Earlier releases return -4294967297 for -1.
- `writePrsl` now writes every tag that the flags declare. The writer writes an empty string for an empty or missing `preselectionTag` or `interleavingTag`. Earlier releases omit an empty tag, and a read of the written box returns no child boxes ([#624](https://github.com/streaming-video-technology-alliance/common-media-library/issues/624)).
- `defaultReaderConfig()` now includes readers for the `stco`, `stsc`, and `stsz` boxes. `writeIsoBoxes` with `defaultWriterConfig()` now writes the `stco`, `stsc`, and `stsz` boxes that `readIsoBoxes` reads with `defaultReaderConfig()`. Earlier releases throw a `RangeError` for `stco` and `stsc`, and write `stsz` without the sample sizes ([#619](https://github.com/streaming-video-technology-alliance/common-media-library/issues/619)).
- `writeUrl` no longer writes the `location` string when flag `0x000001` is set, even when `location` is not empty. Earlier releases add a null byte, so the `url ` box and the enclosing `dref` box are one byte too long ([#623](https://github.com/streaming-video-technology-alliance/common-media-library/issues/623)).
- `writeIden`, `writePayl`, `writeSttg`, and `writeVlab` now write the string of the box with no null byte after the string. `readIden`, `readPayl`, `readSttg`, and `readVlab` still read the same string from a box that has the null byte. Earlier releases write a null byte after the string ([#636](https://github.com/streaming-video-technology-alliance/common-media-library/issues/636)).
- `IsoBoxReadView.readTemplate` now reads the fraction of a fixed-point value, so the bytes `00 01 80 00` read as 1.5. Earlier releases return 8193 for these bytes. The built-in readers now return the correct fraction of `rate`, `volume`, `matrix`, `width`, `height`, `horizresolution`, `vertresolution`, and `samplerate`.
- `readMvhd` now reads `rate` as a signed value. A `rate` of -1 now reads as -1. Earlier releases return 65535 for this `rate`.
- `readMvhd` and `readTkhd` now read `volume` and `matrix` as signed values. A `matrix` entry of -1, as in a rotated video, now reads as -1. Earlier releases return 65535 for this entry.
- `readTkhd` now reads `layer` and `alternateGroup` as signed values. A `layer` of -1 now reads as -1. Earlier releases return 65535 for this `layer`.
- `readMvhd` and `readTkhd` now read the `matrix` entries u, v, and w (indexes 2, 5, and 8) as 2.30 values. The entry w of the identity matrix now reads as 1. If your code compares w with 16384, compare w with 1.
- `writeMvhd` and `writeTkhd` now write the `matrix` entries u, v, and w as 2.30 values. If your code passes 16384 for w, pass 1. The value 16384 now writes 0.
- `readSmhd` now reads `balance` as a signed 8.8 value. The `balance` for full right reads as 1, and the `balance` for full left reads as -1. Earlier releases return 256 for full right and 65280 for full left.
- `writeSmhd` now writes `balance` as a signed 8.8 value. If your code passes 256 for full right, pass 1. The value 256 now writes 0.
- `readEmsg` and `writeEmsg` now read and write `schemeIdUri` and `value` as UTF-8, as ISO/IEC 23009-1 defines the fields. Earlier releases use one byte for each character, so a character that is not ASCII gives wrong bytes or a wrong string. A string with only ASCII characters reads and writes the same bytes as before ([#643](https://github.com/streaming-video-technology-alliance/common-media-library/pull/643)).

### Changed

- The documentation of `IsoBoxReadView.readTemplate` now states that the method reads an unsigned fixed-point value.
- The documentation of `IsoBoxWriteView.writeTemplate` and of the `TEMPLATE` field type now describes a fixed-point value. The `writeTemplate` documentation states the sizes 2 and 4 and the storage of a negative value.
- The documentation of the `matrix` field of `MovieHeaderBox` and `TrackHeaderBox` now states the entry order and the identity matrix. The documentation also states the stored formats.
- The documentation of the `balance` field of `SoundMediaHeaderBox` now states the values for full left, center, and full right.
- The reading guide has a section on extending a built-in reader. The example decodes the ID3 frames of an `emsg` box.
- `isIsoBoxType` accepts `unknown` as the box argument instead of `any`. The guard now also returns `false` for `null` and for values that are not objects.
- `writeIsoBox` and `writeIsoBoxes` now return `Uint8Array<ArrayBuffer>`. The result passes to `SourceBuffer.appendBuffer` without a cast under TypeScript 6 and later. A box given as a view over a `SharedArrayBuffer` is copied, so the result is always backed by an `ArrayBuffer`. The type declarations now need TypeScript 5.7 or later.
- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.
- The utilities guide examples now store the results of `isContainer` and `isFullBox` in `container` and `fullBox`. The examples no longer redeclare the imported names.
- Every code example in the guides now typechecks. The writing examples pass each `Uint8Array` to `appendBuffer` directly, and the `traverseIsoBoxes` example reads the boxes first ([#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565)).
- The README and the `homepage` field of `package.json` now link to the package page on the website, [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/).
- `writeElng`, `writeIden`, `writeKind`, `writeLabl`, `writePayl`, `writeSttg`, and `writeVlab` now encode each string one time. The written bytes of `writeElng`, `writeKind`, and `writeLabl` do not change ([#632](https://github.com/streaming-video-technology-alliance/common-media-library/issues/632)).
- `writeEmsg`, `writeHdlr`, `writeUrl`, `writeUrn`, and `writeSchm` now need `TextEncoder`, as the other UTF-8 writers do. Earlier releases write these boxes with no `TextEncoder` ([#643](https://github.com/streaming-video-technology-alliance/common-media-library/pull/643)).

## [1.0.7] - 2026-10-18

### Changed

- Type parameter names in `dist/index.d.ts` now match the source, for example `T` instead of `T$1`.
- README and the Reading Boxes, Writing Boxes, and Utilities guides: the prose is rewritten for readers who do not read English as a first language. The code examples are unchanged.
- Peer dependency ranges are now caret ranges, for example `^1.6.2` instead of `1.6.2`. A later patch or minor release of a peer no longer requires a new release of this package.

## [1.0.6] - 2026-09-15

### Changed

- Update `@svta/cml-utils` to 1.6.1

## [1.0.5] - 2026-08-11

### Fixed

- `writeTerminatedString` now writes the null terminator for empty strings, so `writeEmsg` output with an empty `value` or `schemeIdUri` no longer misaligns the fields that follow (version 1 `messageData` lost its head to the `value` read; version 0 numeric fields were garbled) ([#411](https://github.com/streaming-video-technology-alliance/common-media-library/issues/411))

## [1.0.4] - 2026-07-28

### Changed

- Update `@svta/cml-utils` to 1.6.0

## [1.0.3] - 2026-07-21

### Fixed

- `IsoBoxReadableStream` no longer reads the bare `ReadableStream` global at module scope: importing the package never throws on runtimes without the Web Streams API. Instantiating `IsoBoxReadableStream` on such runtimes throws a descriptive error instead ([#382](https://github.com/streaming-video-technology-alliance/common-media-library/issues/382))

## [1.0.2] - 2026-05-13

### Changed

- Update `@svta/cml-utils` to 1.5.0

## [1.0.1] - 2026-02-11

### Fixed

- Loosen typed array generic parameters across public API types and utilities

### Changed

- Update `@svta/cml-utils` to 1.4.0

## [1.0.0] - 2026-02-09

Official stable release. No changes since 1.0.0-beta.2.

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.7...HEAD
[1.0.7]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.6...iso-bmff-v1.0.7
[1.0.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.5...iso-bmff-v1.0.6
[1.0.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.4...iso-bmff-v1.0.5
[1.0.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.3...iso-bmff-v1.0.4
[1.0.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.2...iso-bmff-v1.0.3
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.1...iso-bmff-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0...iso-bmff-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.0-beta.2...iso-bmff-v1.0.0
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
