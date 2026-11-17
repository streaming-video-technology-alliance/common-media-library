# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-16

### Added

- `IsoBoxReadViewConfig` has a new `int64` option, a function that reads every 64-bit integer field of the built-in readers. `readInt64AsBigInt` returns each field as a `bigint` with the exact value, and `createInt64OverflowReader` keeps `number` fields and reports a value outside the safe integer range. `defaultReaderConfig` takes the option, and the result type of `readIsoBoxes` follows the option ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `IsoBoxReadView` has the new methods `readUint64`, `readWideUint`, and `readWideInt`. `IsoBoxWriteView` has the new methods `writeUint64`, `writeWideUint`, and `writeWideInt`. A custom reader or writer calls them for a 64-bit integer field, and `IsoInt64Reader` and `IsoInt64` are the types of the option function and of the field ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- Each container box type in `CONTAINERS` now has a named reader and a named writer, such as `readMoov` and `writeMoof`. An entry in the `readers` or `writers` map is optional and does not change the result. The `vttc` box has `readVttc` and `writeVttc`, and the `vttC` box has `readVttC` and `writeVttC` ([#297](https://github.com/streaming-video-technology-alliance/common-media-library/issues/297)).
- `readStco`, `readStsc`, and `readStsz` are new readers for the `stco`, `stsc`, and `stsz` boxes, and `defaultReaderConfig()` includes them. A read and then a write with the default configurations now keeps these boxes. Earlier releases throw a `RangeError` for `stco` and `stsc`, and write `stsz` without the sample sizes ([#619](https://github.com/streaming-video-technology-alliance/common-media-library/issues/619)).
- `TrackEncryptionBox` has the new optional fields `defaultIsProtected`, `defaultConstantIvSize`, `defaultConstantIv`, `defaultCryptByteBlock`, and `defaultSkipByteBlock`. `readTenc` sets the fields, and `writeTenc` writes the constant IV and the pattern fields, so a read and then a write returns the source bytes. To change the pattern of a box from `readTenc`, change the pattern fields ([#648](https://github.com/streaming-video-technology-alliance/common-media-library/issues/648)).
- `EventMessageBoxUnrecognizedVersion` is the new type of an `emsg` box of a version other than 0 or 1, and `EventMessageBox` now includes that type. `EventMessageBoxUnrecognizedVersionNumber` is the type of its `version` field. To narrow to `EventMessageBoxV1`, check `version === 1` ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667)).

### Changed

- The box types with 64-bit integer fields, `ParsedIsoBox`, `IsoBoxReadView`, the container types, and `MetaBox` have a new type parameter for the type of those fields, with the default `number`. The readers of those boxes are now generic, and the writers take `number` fields or `bigint` fields. A utility type such as `ReturnType<typeof readTfdt>` now has `number | bigint` fields, so use the box type, such as `TrackFragmentBaseMediaDecodeTimeBox` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611), [#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- With `readInt64AsBigInt`, a custom reader of the type `(view: IsoBoxReadView) => ...` is a compile error. Type the view as `IsoBoxReadView<IsoInt64>`, or make the reader generic and call `readWideUint` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `Required<IsoBoxReadViewConfig>` now has a required `int64` key. Use `Required<Pick<IsoBoxReadViewConfig, 'readers'>>` for a configuration with required readers ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- A subclass override of `IsoBoxReadView.readUint` or `IsoBoxReadView.readInt` no longer runs for a 64-bit integer field of a built-in reader. To run the override, pass an `int64` function that calls `view.readUint` and `view.readInt` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `isIsoBoxType` now accepts `unknown` as the box argument, and returns `false` for `null` and for a value that is not an object. The guard narrows a box with `bigint` fields to the built-in box type with `bigint` fields ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- The children of the `udta`, `grpl`, `strk`, and `meco` boxes now have the type `IsoBox`, and each element of `box.boxes` has a box type after `isContainer(box)`. Earlier releases give each child the type `any`. Test `child.type` before you read a field, and cast for the `view` field or for a child of another type: `(child as ParsedIsoBox).view`, `bytes as unknown as IsoBox` ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- `writeIsoBox` and `writeIsoBoxes` now return `Uint8Array<ArrayBuffer>`, so the result passes to `SourceBuffer.appendBuffer` without a cast. A box given as a view over a `SharedArrayBuffer` is copied. The type declarations now need TypeScript 5.7 or later.
- `writeEmsg`, `writeHdlr`, `writeUrl`, `writeUrn`, and `writeSchm` now need `TextEncoder`, as the other UTF-8 writers do ([#643](https://github.com/streaming-video-technology-alliance/common-media-library/pull/643)).
- The README has a When to use section, the guides have new sections on the `int64` option, on a custom reader that extends a built-in reader, and on incomplete boxes, and every code example now typechecks. The documentation of the fixed-point fields now states the formats and the values. Internal changes to the UTF-8 writers, `readIsoBoxes`, and `readTfra` change no result ([#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565), [#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611), [#632](https://github.com/streaming-video-technology-alliance/common-media-library/issues/632), [#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650)).

### Fixed

- The `hdlr`, `url `, `urn `, `schm`, and `emsg` readers and writers now use UTF-8 for their strings. Earlier releases use one byte for each character, so a character that is not ASCII gives wrong bytes or a wrong string. A string with only ASCII characters reads and writes the same bytes as before ([#631](https://github.com/streaming-video-technology-alliance/common-media-library/issues/631), [#643](https://github.com/streaming-video-technology-alliance/common-media-library/pull/643)).
- `IsoBoxReadView.readUtf8(-1)` and `readString(-1)` now stop after the null byte or at the end of the view, also for a string with multi-byte characters. `readUtf8(size)` now reads `size` bytes, `readUtf8(0)` reads no bytes, and `readUtf8()` moves the view to the end. `readKind`, `readLabl`, and `readPrsl` now return the correct fields after a string with multi-byte characters ([#630](https://github.com/streaming-video-technology-alliance/common-media-library/issues/630), [#635](https://github.com/streaming-video-technology-alliance/common-media-library/issues/635)).
- `IsoBoxReadView.readData(size)` now stops at the end of the view, and `readData(0)` and `readBoxes(0)` read nothing. If your code passes 0 to read to the end of the view, pass -1. `readDref` and `readStsd` now return no entries for an `entry_count` of 0 ([#644](https://github.com/streaming-video-technology-alliance/common-media-library/pull/644), [#666](https://github.com/streaming-video-technology-alliance/common-media-library/issues/666)).
- `readIsoBoxes` now stops before an incomplete box and returns the boxes before that box, and `IsoBoxReadView.readBox` throws an `Error` with the message `Truncated box`. A box is incomplete when the data ends inside its header, or when its size is below the size of its header, which is 24 bytes for a `uuid` box. Earlier releases throw a `RangeError`, return boxes with wrong types, or read a box with a `largesize` of 0 without end ([#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650), [#663](https://github.com/streaming-video-technology-alliance/common-media-library/issues/663)).
- `writeIsoBoxes` omits the bytes that `readIsoBoxes` stops before, so the written box is shorter than the source box. If the `moov` box precedes the `mdat` box, the chunk offsets of the written file then address other bytes ([#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650)).
- `writeIsoBox` and `writeIsoBoxes` now write the source bytes of a parsed box with a `boxes` field and no writer, such as `meta`, `prsl`, and the sample entries. Earlier releases write only the header and the child boxes. For such a box with no `view`, the functions now throw `No writer found for box type`, so add the writer, such as `writeMeta`, to the `writers` map ([#651](https://github.com/streaming-video-technology-alliance/common-media-library/issues/651)).
- The `mvhd`, `tkhd`, and `smhd` readers and writers now use the signed and fixed-point formats of ISO/IEC 14496-12 for `rate`, `volume`, `matrix`, `layer`, `alternateGroup`, and `balance`. `IsoBoxReadView.readTemplate` now reads the fraction of a value, which also corrects `width`, `height`, `horizresolution`, `vertresolution`, and `samplerate`. The `matrix` entry w of the identity matrix is now 1 and the `balance` for full right is 1, so if your code uses 16384 or 256, use 1.
- `IsoBoxReadView.readInt(8)` now returns the correct value for a negative 64-bit integer, such as a `mediaTime` of -1 in an `elst` box. `IsoBoxWriteView.writeUint(value, 8)` now writes all bits set for a `number` of 2^64 or more, and earlier releases write 0 ([#653](https://github.com/streaming-video-technology-alliance/common-media-library/issues/653)).
- The `sidx`, `prft`, `ctts`, `trun`, and `emsg` readers and writers now follow the syntax for a box of version 2 or above. `sidx` and `prft` have 64-bit fields, `ctts` has no entries, `trun` has a signed `sampleCompositionTimeOffset`, and `emsg` keeps its version with all body bytes in `messageData`. Earlier releases read these boxes with the layout of version 0 ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667), [#670](https://github.com/streaming-video-technology-alliance/common-media-library/issues/670), [#678](https://github.com/streaming-video-technology-alliance/common-media-library/issues/678)).
- `writeUrl`, `writeSchm`, and `writePrsl` now write the strings that the flags declare. `writeUrl` writes no `location` when flag `0x000001` is set, and `writeSchm` and `writePrsl` write an empty string for an empty or missing field. `writeIden`, `writePayl`, `writeSttg`, and `writeVlab` now write no null byte after the string ([#623](https://github.com/streaming-video-technology-alliance/common-media-library/issues/623), [#624](https://github.com/streaming-video-technology-alliance/common-media-library/issues/624), [#628](https://github.com/streaming-video-technology-alliance/common-media-library/issues/628), [#636](https://github.com/streaming-video-technology-alliance/common-media-library/issues/636)).
- `readPssh` and `writePssh` now read and write 16 bytes for each key ID of a version 1 `pssh` box, and the `kid` field has 16 numbers for each key ID. Earlier releases use one byte for each key ID, so `readPssh` returns a wrong `dataSize` and `data` or throws a `RangeError` ([#649](https://github.com/streaming-video-technology-alliance/common-media-library/issues/649)).
- `IsoBoxReaderReturn` no longer adds the built-in type of a box whose reader the configuration replaces, and no longer includes `undefined` for an optional reader. The result of `readIsoBoxes` with a custom `tfdt` reader now narrows to the return type of that reader ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.1.0...HEAD
[1.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/iso-bmff-v1.0.7...iso-bmff-v1.1.0
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
