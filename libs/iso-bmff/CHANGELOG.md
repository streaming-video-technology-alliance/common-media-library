# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The guide [Migrating to version 2](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/migrating-to-v2.md) lists each change of version 2.0.0 and its replacement ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `createIsoBoxReadCursor` creates a read cursor for ISO BMFF data. The cursor is a plain object with a `DataView`, a start, a position, and an end. The function takes the configuration of `readIsoBoxes`, with the readers map and the `int64` option ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The read field functions read one field at the position of a read cursor and move the position past the field. The functions are `readUint8`, `readUint16`, `readUint24`, `readUint32`, `readUint64`, `readInt8`, `readInt16`, `readInt32`, `readTemplate16`, `readTemplate32`, `readFourCc`, `readBytes`, `readUtf8`, and `readTerminatedUtf8` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- A read field function throws a `RangeError` for a field that passes the end of the cursor. `readBytes` and `readUtf8` also throw a `RangeError` for a negative length. A length of 0 reads nothing ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readWideUint` and `readWideInt` read an integer field of 4 or 8 bytes with the `int64` function of the read cursor. With no function, they return a `number`. A custom reader that follows the `int64` option calls the two functions ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readChildBoxes` reads the boxes from the position of a read cursor to its end, with the readers of the cursor. The optional `count` sets the maximum number of boxes. A negative `count` or `NaN` throws a `RangeError`. After an error of a reader, the position of the cursor is the first byte of the box that failed ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `seekIsoBox` finds a box by its path, such as `['moof', 'traf', 'tfdt']`, and returns a read cursor for that box. The function decodes no other box. The result is `null` for a missing box and for a truncated box ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `nextIsoBox` returns the type of the box at the position of a read cursor and moves the position past that box. The function parses no content of the box ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoRawBox` is the type of a box with no reader: `{ type, bytes, headerSize, usertype }`. `bytes` is the complete box, with its header ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `createIsoBoxWriteCursor` creates a write cursor. The cursor is a plain object with a buffer that grows, and a position. The `capacity` option sets the size of the first buffer. The `writers` option sets the writers map of the cursor ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeChildBoxes` writes boxes at the position of a write cursor, with the writers of the cursor. A custom writer of a box with child boxes calls the function ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The write field functions write one field at the position of a write cursor and move the position past the field. The functions are `writeUint8`, `writeUint16`, `writeUint24`, `writeUint32`, `writeUint64`, `writeInt8`, `writeInt16`, `writeInt32`, `writeWideUint`, `writeWideInt`, `writeTemplate16`, `writeTemplate32`, `writeFourCc`, `writeBytes`, `writeUtf8`, and `writeTerminatedUtf8` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeFourCc` throws a `RangeError` for a code that does not have 4 characters. The message has the received value ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeTerminatedUtf8` writes the text up to the first U+0000, then one null byte. A read with `readTerminatedUtf8` then returns the same text ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `beginIsoBox` and `beginIsoFullBox` write a box header with no size. `endIsoBox` writes the size into the header, so a writer does not compute the size. `endIsoBox` throws a `RangeError` for a box above 2^32 - 1 bytes ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readStco`, `readStsc`, and `readStsz` are new readers for the `stco`, `stsc`, and `stsz` boxes ([#619](https://github.com/streaming-video-technology-alliance/common-media-library/issues/619)).
- `readCo64` and `writeCo64` read and write the `co64` box. Each chunk offset has 64 bits and follows the `int64` option. The two default configuration functions include both functions, so a `co64` box is no longer a raw box ([#652](https://github.com/streaming-video-technology-alliance/common-media-library/issues/652)).
- `readStz2` and `writeStz2` read and write the `stz2` box with entries of 4, 8, or 16 bits. For another field size, the reader returns no entries, and the writer writes no entries. The two default configuration functions include both functions ([#652](https://github.com/streaming-video-technology-alliance/common-media-library/issues/652)).
- `IsoBoxReadConfig` has a new `int64` option. The option takes a function that reads every 64-bit integer field of the built-in readers. With no option, the readers return the same values and the same types as before ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `readInt64AsBigInt` is a new function for the `int64` option. The built-in readers then return every 64-bit integer field as a `bigint` with the exact value. The result type of `readIsoBoxes` follows the option ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `createInt64OverflowReader` is a new function for the `int64` option. The built-in readers keep `number` fields. The function calls a callback with a `RangeError` when a 64-bit value is outside the safe integer range ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `createDefaultReaderConfig` takes an optional argument with the `int64` option. The readers of the returned configuration have the types of that option ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `writeWideUint` and `writeWideInt` write a field of 4 or 8 bytes from a `number` or a `bigint`. The functions throw a `RangeError` for a `bigint` that does not fit the size ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `IsoInt64Reader` is the type of a function for the `int64` option. The function reads one field at the position of a read cursor. `IsoInt64` is the type `number | bigint` of a 64-bit integer field ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- Each container box type in `CONTAINERS` now has a named reader, such as `readMoov` and `readMoof`. A container reader in the `readers` map is optional and does not change the result. `readVttc` reads the `vttc` box, and `readVttC` reads the `vttC` box ([#297](https://github.com/streaming-video-technology-alliance/common-media-library/issues/297)).
- Each container box type in `CONTAINERS` now has a named writer, such as `writeMoov` and `writeMoof`. A container writer in the `writers` map is optional and does not change the written bytes. `writeVttc` writes the `vttc` box, and `writeVttC` writes the `vttC` box ([#297](https://github.com/streaming-video-technology-alliance/common-media-library/issues/297)).
- `TrackEncryptionBox` has the new optional fields `defaultConstantIvSize` and `defaultConstantIv`. `readTenc` sets the fields for a `tenc` box with a constant IV ([#648](https://github.com/streaming-video-technology-alliance/common-media-library/issues/648)).
- `TrackEncryptionBox` has the new field `defaultIsProtected`, the protection state of the track. `readTenc` reads the field, and `writeTenc` writes it ([#648](https://github.com/streaming-video-technology-alliance/common-media-library/issues/648)).
- `TrackEncryptionBox` has the new optional fields `defaultCryptByteBlock` and `defaultSkipByteBlock`. `readTenc` sets the fields for a `tenc` box of version 1 or above ([#648](https://github.com/streaming-video-technology-alliance/common-media-library/issues/648)).
- `writeTenc` now writes `defaultCryptByteBlock` and `defaultSkipByteBlock` to a `tenc` box of version 1 or above. With no pattern field, the writer writes 0 ([#648](https://github.com/streaming-video-technology-alliance/common-media-library/issues/648)).
- `EventMessageBoxUnrecognizedVersion` is the new type of an `emsg` box of a version other than 0 or 1. The type has the fields of the versions 0 and 1 ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667)).
- `EventMessageBoxUnrecognizedVersionNumber` is the new type of the `version` field of `EventMessageBoxUnrecognizedVersion`. The values are 2 to 255 ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667)).

### Changed

- The container readers, `readMeta`, and the readers and writers of `mdat`, `free`, `skip`, and `imda` now use the field functions of the cursor. Their results and written bytes do not change. A bundle with only these functions no longer has the code of the internal classes `IsoBoxReadView` and `IsoBoxWriteView` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `trun`, `tfra`, and `ssix` no longer have count fields that repeat the length of a list. The removed fields are `sampleCount`, `numberOfEntry`, `subsegmentCount`, and `rangesCount`. The writers write the length of each list, so replace `box.sampleCount` with `box.samples.length` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `sampleDependencyTable` of `sdtp` is now a `Uint8Array` with one byte for each sample. The array is a view of the input. For a write, wrap a list of numbers in `new Uint8Array(...)` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `writeSidx` now throws a `RangeError` for more than 65535 references, the limit of the 16-bit `reference_count`. Earlier releases write the low 16 bits of the count, so a read returns fewer references ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeEmsg` now ends `schemeIdUri` and `value` at the first U+0000. Earlier releases also write the text after the U+0000, so a read returns wrong values for the later fields ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `stts`, `stsc`, `stco`, `stss`, and `subs` no longer have `entryCount`, and a `subs` entry no longer has `subsampleCount`. The writers write the length of each list. Replace `box.entryCount` with the length of the list, such as `box.entries.length` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `entryCount` of `ctts` is now optional. The reader sets it only for a box of version 2 or above, which has no entries. For version 0 or 1, the count is `box.entries.length` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `sampleCount` of `stsz` is now optional. The reader sets it only for a box with a `sampleSize` above 0. With a `sampleSize` of 0, the count is `box.entrySize.length` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeSubs` now throws a `RangeError` for more than 65535 subsamples in one entry, the limit of the 16-bit `subsample_count`. Earlier releases write the low 16 bits of the count ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `ChunkLargeOffsetBox` now has the type parameter `V` for its 64-bit offsets. `ChunkLargeOffsetBox` no longer has `entryCount`, and `CompactSampleSizeBox` no longer has `sampleCount`. Use the length of `chunkOffset` and `entrySize` ([#652](https://github.com/streaming-video-technology-alliance/common-media-library/issues/652)).
- `elst` no longer has `entryCount`. The writer writes the length of `entries`, so replace `box.entryCount` with `box.entries.length` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `matrix` of `MovieHeaderBox` and `TrackHeaderBox` is now a labeled tuple of 9 numbers, and `opColor` of `VideoMediaHeaderBox` is a tuple of 3 numbers. An array that your code builds at run time needs a type annotation. The writers still write 0 for a missing entry ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `writeFtyp`, `writeStyp`, and `writeHdlr` now throw a `RangeError` for a brand or a `handlerType` that does not have 4 characters. Earlier releases move every later field for a code of 3 characters ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `writeMdhd` now writes the code of `und` for a `language` that is not 3 characters from U+0060 to U+007F. Earlier releases write 0 for a shorter value and keep 5 bits of each character, so `en-US` writes `enm` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `writeHdlr` now ends `name` at the first U+0000. Earlier releases also write the text after the U+0000 ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `pssh` now has `systemId` and `data` as `Uint8Array` views of the input, and `kid` as a `Uint8Array[]` with one 16-byte entry for each key ID. `kidCount` and `dataSize` leave the type, and the writer writes the length of each list. Replace `box.kid.slice(i * 16, i * 16 + 16)` with `box.kid[i]` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `defaultKid` and `defaultConstantIv` of `tenc` are now `Uint8Array` views of the input. `defaultConstantIvSize` leaves the type, and `writeTenc` writes the length of `defaultConstantIv`. A constant IV above 255 bytes throws a `RangeError` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `dataFormat` of `frma` and `schemeType` of `schm` are now four-character strings, such as `'avc1'` and `'cenc'`. Replace `dataFormat: 0x61766331` with `dataFormat: 'avc1'` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `writeSchm` now ends `schemeUri` at the first U+0000. Earlier releases also write the text after the U+0000 ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `stsd` and `dref` no longer have `entryCount`. The writers write the length of `boxes`, so replace `box.entryCount` with `box.boxes.length` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readStsd` and `readDref` now throw a `RangeError` when the body has fewer complete child boxes than `entry_count`. The message has the box type, the count, and the number of complete boxes. Earlier releases return the boxes that they find, with no error ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `compressorName` of a visual sample entry is now a string, read as UTF-8. The writer writes the length byte, at most 31 bytes with no cut character, and 0 to the end of the 32 bytes ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `location` of `url ` and `urn ` is now optional. The readers omit the field when the box has no more bytes. `writeUrn` writes no string for the flag `0x000001`, and no `location` for a box without one ([#629](https://github.com/streaming-video-technology-alliance/common-media-library/issues/629)).
- Every built-in reader now takes a read cursor in place of an `IsoBoxReadView`. `readIsoBoxes` calls a reader with the cursor and the box type. A custom reader has the type `IsoBoxReader` and returns the complete box with its `type` field. Replace `view.readUint(4)` with `readUint32(cursor)`, and `view.readFullBox()` with `readUint8` for the version and `readUint24` for the flags ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- A box with no reader and a type outside `CONTAINERS` is now a raw box: `{ type, bytes, headerSize }`. The body of the box is `box.bytes.subarray(box.headerSize)`, and it shares memory with the input. A raw `uuid` box also has `usertype`, a 16-byte `Uint8Array` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- A parsed box no longer has the fields `view`, `size`, `largesize`, and `usertype`. A box object has only `type` and its fields. To keep the bytes of a box, omit its reader and use the raw box ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The result type of `readIsoBoxes` with a readers map now has the return type of each reader, the container types, and `IsoRawBox`. A built-in box type with no reader in the map is no longer in the result type. The reader types apply only to the top level, and a `boxes` field keeps `ParsedIsoBox`. A test of `box.type` does not exclude a raw box, so use `isIsoBoxType` to narrow a box ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readStsd` no longer has a type parameter. The entries of `SampleDescriptionBox` now include `IsoRawBox` by default, and `writeStsd` accepts the result of `readStsd`. Replace `readStsd<Avc1Box>` with `readStsd`, and narrow an entry with `isIsoBoxType` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `isContainer` now takes any box with a `type` field, such as a raw box or the result of a custom reader. The function returns `false` for a raw box with a type outside `CONTAINERS` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- A `true` result of `isContainer` now narrows a box to the box types with a `boxes` field. These types are the container types, `meta`, `stsd`, `dref`, `prsl`, and the sample entries. The result also keeps a box type with a type in `CONTAINERS` and no `boxes` field. The run-time result does not change ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The `boxes` field of every box type is now `ParsedIsoBox<V>[]`, a box type or a raw box. A test of `child.type` does not exclude a raw box, so narrow a child with `isIsoBoxType`. A child that is a byte array becomes a raw box, such as `{ type: 'esds', bytes }` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The box types with child boxes now all have the type parameter `V` for the 64-bit integer fields of the children. The new parameter is on `DataInformationBox`, `DataReferenceBox`, `MediaInformationBox`, `PreselectionGroupBox`, `ProtectionSchemeInfoBox`, `SampleTableBox`, `SchemeInformationBox`, `TrackReferenceBox`, and `WebVttCueBox`. The default is `number` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `AudioSampleEntry` and `VisualSampleEntry` have `V` as a second type parameter. `SampleEntry` has `V` in place of the child type `C`. Replace `SampleEntry<T, MyChild>` with `SampleEntry<T>` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `SampleDescriptionBox` now has `V` as the first type parameter, and the entry type `E` as the second. Replace `SampleDescriptionBox<MyEntry>` with `SampleDescriptionBox<number, MyEntry>` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The readers of the box types with child boxes, such as `readDinf`, `readStsd`, and `readAvc1`, are now generic functions in `V`. The readers from `createAudioSampleEntryReader` and `createVisualSampleEntryReader` are also generic ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- A reader result can have a `type` field that is not a literal, such as `string`. That result now adds no member to the result type of `readIsoBoxes`. Give the `type` field of a custom reader result a literal type ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `Box` no longer has a default type argument. Replace `Box` with `Box<'abcd'>` for one box type, or with `IsoBox` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoBoxStreamable` now has `IsoRawBox` and `{ type: IsoBoxType }` in place of `ParsedBox`. A box object of a custom type needs a writer in the `writers` map ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `isIsoBoxType` now returns `false` for a raw box. Its first signature takes `IsoBox<V> | { type: string } | null | undefined` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readIsoBoxes` now checks the size of a box before it calls the reader of that box. The function does not catch an error of a reader. An error of a reader now always reaches the caller. The error `Truncated box` no longer exists ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `readIsoBoxes` and `readChildBoxes` now throw a `RangeError` for a box that is deeper than 128 levels. The message has the box type and the limit. Earlier releases end with a stack overflow of the engine for a very deep input ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The cursor of a reader for a `uuid` box now starts at the first byte of `usertype`. The reader reads the 16 bytes of `usertype` with `readBytes` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoInt64Reader`, `readInt64AsBigInt`, and the function from `createInt64OverflowReader` now take a read cursor in place of an `IsoBoxReadView` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoBoxReader` now has the type parameters `B` and `V`, and `B` must have a `type` field. `IsoBoxReaderMap` now lists the known box types, so a reader under the key of another known box type is a compile error. The keys `url` and `urn` find the readers of `'url '` and `'urn '` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- Every built-in writer now takes a write cursor and the box, and returns nothing. A custom writer has the same signature. Replace `new IsoBoxWriteView(type, size)` with `beginIsoBox(cursor, type)`, the write field functions, and `endIsoBox(cursor, start)` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The writers of boxes with child boxes, such as `writeStsd` and `writeMoov`, no longer have a `config` parameter. They write the child boxes with the writers of the cursor ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoBoxWriterMap` now lists the known box types, so a writer under the key of another known box type is a compile error. The keys `url` and `urn` find the writers of `'url '` and `'urn '` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeIsoBoxes` now returns one `Uint8Array` with every box, in place of one array for each box. Remove the code that joins the arrays ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeIsoBoxes` and `writeIsoBox` now always return a new array. Earlier releases return a view of the input buffer for an `ArrayBufferView` input ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeIsoBoxes` now copies the bytes of a box with a `bytes` field, such as a raw box, before it looks for a writer. To change a raw box, build a box object with the fields and no `bytes` field ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `createIsoBoxReadableStream` now writes one box for each read and writes no box before the first read. The stream writes every box into one buffer, which keeps the size of the largest box until the stream ends. An error of the first box now rejects the first read. Earlier releases throw the error from the call ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `writeIsoBoxes` and `writeIsoBox` now throw `No writer found for box type` for a box object with a reader, no writer, and a type outside `CONTAINERS`. Earlier releases write the source bytes of the `view` field. Add the writer of the type, or remove the reader so that the box stays a raw box ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The box types with 64-bit integer fields have a new type parameter for the type of those fields. The container types of those boxes, `ParsedIsoBox`, `IsoBoxReadCursor`, and the related types have the same parameter. The default is `number`, so existing references do not change ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- The built-in readers of boxes with no 64-bit integer field take `IsoBoxReadCursor<IsoInt64>`. That type accepts a cursor with `number` fields or `bigint` fields. The readers from `createAudioSampleEntryReader` and `createVisualSampleEntryReader` take the same cursor ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- The readers of the boxes with 64-bit integer fields, such as `readTfdt`, are now generic functions. `ReturnType<typeof readTfdt>` now has `number | bigint` fields. Use the box type, such as `TrackFragmentBaseMediaDecodeTimeBox`, or `ReturnType<typeof readTfdt<number>>` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `Parameters<typeof readTfdt>[0]` is `IsoBoxReadCursor<IsoInt64>`. Use the type `IsoBoxReadCursor` in place of that utility type ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `isIsoBoxType` now narrows a box with `bigint` fields to the built-in box type with `bigint` fields. A box that can be `null` or `undefined` narrows in the same way ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- The writers of the boxes with 64-bit integer fields now take a box with `number` fields or `bigint` fields. `writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream` take the same boxes. A box that `readIsoBoxes` reads with `readInt64AsBigInt` writes back with the exact values ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `Parameters<typeof writeTfdt>[1]` now has `number | bigint` fields. The other ten writers of boxes with 64-bit integer fields, `writeIsoBox`, and `writeIsoBoxes` have the same change. Use the box type, such as `TrackFragmentBaseMediaDecodeTimeBox`, or `IsoBoxStreamable` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- With `readInt64AsBigInt`, a custom reader of the type `(cursor: IsoBoxReadCursor) => ...` is a compile error. Type the cursor as `IsoBoxReadCursor<IsoInt64>`, or make the reader generic and call `readWideUint` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `Required<IsoBoxReadConfig>` now has a required `int64` key. A value of that type with no `int64` function is a compile error. Use `Required<Pick<IsoBoxReadConfig, 'readers'>>` for a configuration with required readers ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- The reading guide has a section on a function that forwards the `int64` option. The guide also states that `JSON.stringify` throws a `TypeError` for a `bigint` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `UserDataBox`, `GroupsListBox`, `SubTrack`, `AdditionalMetadataContainerBox`, and `MetaBox` now have the type parameter for the type of the 64-bit integer fields. The default is `number`, so existing references do not change ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- `readMeta` is now a generic function, so `ReturnType<typeof readMeta>` is `MetaBox<number | bigint>`. Use the type `MetaBox` in place of that utility type ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- `writeMeta` now takes a `MetaBox` with `number` fields or `bigint` fields ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- A `udta`, `grpl`, `strk`, or `meco` box no longer accepts a child of another type, such as a `Uint8Array`. Give that child as a raw box with `type`, `bytes`, and `headerSize` ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- `writeIsoBox` and `writeIsoBoxes` now throw `No writer found for box type` for a box object with no writer and a type outside `CONTAINERS`, such as a `meta` box. Earlier releases write only the header and the child boxes of such a box, so its other fields are lost. Add the writer for the type, such as `writeMeta`, to the `writers` map ([#651](https://github.com/streaming-video-technology-alliance/common-media-library/issues/651)).
- `EventMessageBox` now includes `EventMessageBoxUnrecognizedVersion`. After a check of `version === 0`, the other branch is no longer `EventMessageBoxV1`. To narrow to `EventMessageBoxV1`, check `version === 1` ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667)).
- The documentation of `writeTemplate16` and `writeTemplate32` now describes a fixed-point value. The documentation states the size of each field and the storage of a negative value.
- The documentation of the `matrix` field of `MovieHeaderBox` and `TrackHeaderBox` now states the entry order and the identity matrix. The documentation also states the stored formats.
- The documentation of the `balance` field of `SoundMediaHeaderBox` now states the values for full left, center, and full right.
- The reading guide has a section on extending a built-in reader. The example decodes the ID3 frames of an `emsg` box.
- `isIsoBoxType` accepts `unknown` as the box argument instead of `any`. The guard now also returns `false` for `null` and for values that are not objects.
- `writeIsoBox` and `writeIsoBoxes` now return `Uint8Array<ArrayBuffer>`. The result passes to `SourceBuffer.appendBuffer` without a cast under TypeScript 6 and later. A box given as a view over a `SharedArrayBuffer` is copied, so the result is always backed by an `ArrayBuffer`. The type declarations now need TypeScript 5.7 or later.
- `createIsoBoxReadableStream` now returns `ReadableStream<Uint8Array<ArrayBuffer>>`, the result type of `writeIsoBox` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.
- The utilities guide example now stores the result of `isContainer` in `container`. The example no longer redeclares the imported name.
- Every code example in the guides now typechecks. The writing examples pass each `Uint8Array` to `appendBuffer` directly, and the `traverseIsoBoxes` example reads the boxes first ([#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565)).
- The reading guide has a section on incomplete boxes, and the writing guide links to that section. The documentation of `readIsoBoxes` and `readChildBoxes` states where the read stops ([#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650)).
- The reading guide now states that a box with a size below the size of the box header is incomplete. The documentation of `readIsoBoxes` and `readChildBoxes` states the same rule ([#663](https://github.com/streaming-video-technology-alliance/common-media-library/issues/663)).
- The README and the `homepage` field of `package.json` now link to the package page on the website, [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/).
- `writeElng`, `writeIden`, `writeKind`, `writeLabl`, `writePayl`, `writeSttg`, and `writeVlab` now encode each string one time. The written bytes of `writeElng`, `writeKind`, and `writeLabl` do not change ([#632](https://github.com/streaming-video-technology-alliance/common-media-library/issues/632)).
- `writePrsl` now encodes each tag one time. The written bytes do not change.
- The reading guide now states that the header of a `uuid` box has 16 more bytes for the `usertype` field.
- `writeEmsg`, `writeHdlr`, `writeUrl`, `writeUrn`, and `writeSchm` now need `TextEncoder`, as the other UTF-8 writers do. Earlier releases write these boxes with no `TextEncoder` ([#643](https://github.com/streaming-video-technology-alliance/common-media-library/pull/643)).
- `readTfra` now computes the size of the 64-bit integer fields one time for each box.
- `writeTkhd` now writes `layer` and `alternateGroup` as signed integers, as `readTkhd` reads them. The written bytes do not change.
- The examples of `readIsoBoxes`, `writeIsoBoxes`, `traverseIsoBoxes`, and `createIsoBoxReadableStream` now use `strictEqual` and `deepStrictEqual`. The `writeIsoBoxes` example compares the written bytes with a `Uint8Array` of the file.
- The README has a quick start with one read example and one write example. A new section lists the runtime APIs that some exports need.
- The reading guide states that `readIsoBoxes` throws a `RangeError` for a complete box with a body shorter than its fields. The guide also states the rules for the input types and shared byte fields.
- The reading and writing guide examples find a `tfdt` box with `findIsoBox`. The earlier examples looked for the box at the top level, where a segment does not have it.
- The `bigint` example of the reading guide keeps the fraction of the seconds. The guide also states that an all-ones `duration` reports an overflow to `createInt64OverflowReader`.
- The writing guide states the exact keys of the `writers` map and the rule for flags and missing fields. The `appendBuffer` examples wait for the `updateend` event.
- The utilities guide describes the configuration of `traverseIsoBoxes` and has a section on `findIsoBox`, `filterIsoBoxes`, and `isIsoBoxType`.
- The documentation of `readIsoBoxes`, `writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream` now has `@throws` tags.
- The summary of each reader and writer names the four-character type of its box. The summary of each box type uses one form and cites ISO/IEC 14496-12:2015 where that edition defines the box.
- The documentation of the `mvhd`, `tkhd`, `mdhd`, `mehd`, `elst`, `mfro`, `tfhd`, and `tfra` fields states the units, the 1904 epoch, and the flags. Byte fields state that they are a view over the input.
- 25 readers and writers and 7 other exports now link a test example. Each linked example declares its input, except the example of `writeIsoBoxes`.
- `traverseIsoBoxes` is faster. The largest gain is in breadth-first order over many sibling containers. The order of the boxes does not change ([#706](https://github.com/streaming-video-technology-alliance/common-media-library/pull/706)).
- `writeCtts` and `writeTrun` now write the signed offset fields as signed integers, as `readCtts` and `readTrun` read them. The written bytes do not change.
- `IsoBoxType` is now declared as `string`. The type accepts the same values as before. The documentation states that TypeScript does not check the length of a box type.
- `readVtte` and `writeVtte` now name their unused parameters with a `_` prefix, and the documentation describes the parameters.
- The documentation of `readInt64AsBigInt` and the reading guide now test for `DataView.prototype.getBigUint64`. A runtime can have `BigInt` and no `getBigUint64` method. The documentation of `readUint64`, `writeUint64`, `writeWideUint`, and `writeWideInt` names the `DataView` method that each one needs.
- The runtime requirements table of the README now lists the `DataView` methods that the `bigint` reads and writes need.
- The description of the package now states that the package reads and writes boxes.
- The UTF-8 string reads now call `decodeUtf8` of `@svta/cml-utils`. A bundle with `readIsoBoxes` is about 200 bytes smaller after gzip. The results do not change. The package now needs `@svta/cml-utils` 1.8.0 or later.
- `writeIsoBoxes` and `createIsoBoxReadableStream` now take an optional configuration, as `writeIsoBox` does. With no configuration, a write takes only containers, byte arrays, and raw boxes ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The `writers` field of `IsoBoxWriteConfig` is now optional. A call with `{ writers: {} }` still compiles. `createDefaultWriterConfig` still returns the map ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `SampleDescriptionBox` and `DataReferenceBox` now keep their child boxes in `boxes`, not in `entries`. Replace `stsd.entries` with `stsd.boxes`, and `dref.entries` with `dref.boxes` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` now reach the sample entries of `stsd` and the data entries of `dref`, if the configuration has `readStsd` or `readDref`. A predicate that matches a type inside those boxes, such as `hvc1`, now finds that box ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `isContainer` now returns `true` for a `stsd` box and a `dref` box, because both boxes now have a `boxes` field. Earlier releases return `false` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The exported names of box types, entry types, and fields now follow the names of the specification. The configuration types and functions also have new names. The rename table after this list shows each old name and its new name. The compiler reports each old name ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `SyncSampleBox` now has the field `sampleNumber: number[]` in place of `entries`. Replace `box.entries.map((entry) => entry.sampleNumber)` with `box.sampleNumber`. In a box that code builds, replace `entries: [{ sampleNumber: 1 }]` with `sampleNumber: [1]` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `PreselectionGroupBox` now has the field `entityId: number[]` in place of `entities`. Replace `box.entities.map((entity) => entity.entityId)` with `box.entityId`. In a box that code builds, replace `entities: [{ entityId: 1 }]` with `entityId: [1]` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The type parameter of `TypeBox` now accepts only `'ftyp'` and `'styp'` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `AudioSampleEntry` now has the optional field `entryVersion`, from the first 16 bits after `dataReferenceIndex`. `writeAudioSampleEntry` writes 0 for a missing value ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The `pre_defined` fields of `hdlr`, `mdhd`, `mvhd`, and the sample entries are now optional. A writer writes 0 for a missing value, and -1 for a missing `preDefined3` of a visual sample entry ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The `reserved` field of `HandlerBox` is now optional. `writeHdlr` writes 0 for a missing value ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The writers now write 0 in each reserved field, except `reserved` of `hdlr`. If a source box has another value in a reserved field, the writer writes 0 there ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).

Renames of version 2.0.0:

| Version 1 | Version 2.0.0 |
|---|---|
| `HandlerReferenceBox` | `HandlerBox` |
| `DecodingTimeToSampleBox` | `TimeToSampleBox` |
| `CompositionTimeToSampleBox` | `CompositionOffsetBox` |
| `ProtectionSchemeInformationBox` | `ProtectionSchemeInfoBox` |
| `TrackKindBox` | `KindBox` |
| `SubsampleInformationBox` | `SubSampleInformationBox` |
| `SubTrackBox` | `SubTrack` |
| `SampleEntryBox`, `AudioSampleEntryBox`, `VisualSampleEntryBox` | `SampleEntry`, `AudioSampleEntry`, `VisualSampleEntry` |
| `readAudioSampleEntryBox`, `writeAudioSampleEntryBox` | `readAudioSampleEntry`, `writeAudioSampleEntry` |
| `readVisualSampleEntryBox`, `writeVisualSampleEntryBox` | `readVisualSampleEntry`, `writeVisualSampleEntry` |
| `DecodingTimeSample` | `TimeToSampleEntry` |
| `CompositionTimeToSampleEntry` | `CompositionOffsetEntry` |
| `SubsampleEntry`, `Subsample` | `SubSampleInformationEntry`, `SubSampleInformationSubsample` |
| `Subsegment`, `SubsegmentRange` | `SubsegmentIndexSubsegment`, `SubsegmentIndexRange` |
| `channelcount`, `samplesize`, `samplerate` | `channelCount`, `sampleSize`, `sampleRate` |
| `horizresolution`, `vertresolution` | `horizResolution`, `vertResolution` |
| `graphicsmode`, `opcolor` | `graphicsMode`, `opColor` |
| `defaultIvSize` | `defaultPerSampleIvSize` |
| `IsoBoxReadViewConfig`, `IsoBoxWriteViewConfig` | `IsoBoxReadConfig`, `IsoBoxWriteConfig` |
| `defaultReaderConfig`, `defaultWriterConfig` | `createDefaultReaderConfig`, `createDefaultWriterConfig` |

A field rename also changes the keys of a box that `readIsoBoxes` returns. Code that reads a field by a string key gets no compile error.

### Removed

- `fourCcToUint32` is removed. No field of version 2.0.0 stores a four-character code as a number. To convert a code, compute `new DataView(new TextEncoder().encode(code).buffer).getUint32(0)` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `IsoBoxReadView` is removed. A custom reader reads the fields with the read field functions on a read cursor. `view.bytesRemaining` becomes `cursor.end - cursor.pos`, `view.jump(size)` becomes `cursor.pos += size`, `view.readBoxes()` becomes `readChildBoxes(cursor)`, and `view.readBox()` becomes `nextIsoBox(cursor)` or `readChildBoxes(cursor, 1)` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoBoxWriteView` is removed. A custom writer writes the fields with the write field functions on a write cursor. `writer.writeUint(value, 4)` becomes `writeUint32(cursor, value)`, and `writer.writeFullBox(version, flags)` becomes `beginIsoFullBox(cursor, type, version, flags)` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- The child types are removed: `AdditionalMetadataContainerBoxChild`, `AudioSampleEntryChild`, `DataInformationBoxChild`, `EditBoxChild`, `GroupsListBoxChild`, `MediaBoxChild`, `MediaInformationBoxChild`, `MetaBoxChild`, `MovieBoxChild`, `MovieExtendsBoxChild`, `MovieFragmentBoxChild`, `MovieFragmentRandomAccessBoxChild`, `PreselectionGroupBoxChild`, `ProtectionSchemeInfoBoxChild`, `SampleTableBoxChild`, `SchemeInformationBoxChild`, `SubTrackChild`, `TrackBoxChild`, `TrackFragmentBoxChild`, `TrackReferenceBoxChild`, `UserDataBoxChild`, `VisualSampleEntryChild`, and `WebVttCueChild`. The version 1 names `ProtectionSchemeInformationBoxChild`, `SubTrackBoxChild`, `AudioSampleEntryBoxChild`, and `VisualSampleEntryBoxChild` are removed too. Use `ParsedIsoBox` ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `TrackReferenceTypeBox` is removed, because no reader returns that type. A child of a `tref` box is a raw box ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `IsoFieldTypeMap` is removed. A reader or a writer reads or writes an array of values with a loop ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `ParsedBox` and `IsoTypedParsedBox` are removed, because a parsed box has no `view` and no `size`. `ParsedIsoBox` is the type of a box that `readIsoBoxes` returns ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)).
- `IsoBoxMap` and the child box types no longer have the 16 box types with no reader and no writer. The removed box types are `hmhd`, `iinf`, `iloc`, `imif`, `infe`, `ipro`, `iref`, `nmhd`, `pitm`, `saio`, `saiz`, `sbgp`, `senc`, `sgpd`, `stdp`, and `stsh`. To read one of these boxes, declare its type and add a custom reader ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The package no longer exports the types of the 16 removed box types, such as `SampleEncryptionBox` and `ItemInfoEntry`. The entry types of those boxes, such as `EncryptedSample` and `ItemLocation`, are also removed ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The type aliases `co64`, `stz2`, `url`, and `urn` are removed. Use `ChunkLargeOffsetBox`, `CompactSampleSizeBox`, `DataEntryUrlBox`, and `DataEntryUrnBox`, or a key of `IsoBoxMap` such as `IsoBoxMap['co64']` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The constants `UINT`, `INT`, `TEMPLATE`, `STRING`, `UTF8`, `DATA`, and `IsoBoxFields` are removed. A custom reader calls a read field function, such as `readUint32` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The class `IsoBoxReadableStream` is removed. Replace `new IsoBoxReadableStream(boxes, config)` with `createIsoBoxReadableStream(boxes, config)` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The entry types `SyncSample` and `Entity` are removed. An element of `sampleNumber` and of `entityId` is a `number` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `isFullBox` is removed. Test the fields of the box, such as `'version' in box && 'flags' in box`, or test the box type with `isIsoBoxType` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- The box types no longer have the `reserved` fields of the specification. Remove `reserved1`, `reserved2`, and `reserved3` from `mvhd`, `tkhd`, and the sample entries. Remove `reserved` from `smhd`, `sidx`, and `tfra` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `TrackEncryptionBox` no longer has `defaultIsEncrypted`. Replace `defaultIsEncrypted: 1` with `defaultIsProtected: 1`, and set the pattern with `defaultCryptByteBlock` and `defaultSkipByteBlock` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `LabelBox` no longer has `isGroupLabel`. Replace `box.isGroupLabel` with `(box.flags & 0x1) !== 0` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).
- `SegmentIndexReference` no longer has the packed fields `reference` and `sap`. Use the decoded fields, such as `referenceType` and `sapType` ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).

### Fixed

- `writeTfra` now writes the low 2 bits of each length size, the bits that the header has for the size. Earlier releases write a length size above 3 into the reserved bits, so the entries do not match the header.
- The published package includes `NOTICE.md`.
- `readKind`, `readLabl`, and `readPrsl` now return the correct fields after a string with multi-byte characters. Earlier releases return an empty `value` for a `kind` box with the `schemeUri` `urn:é` ([#630](https://github.com/streaming-video-technology-alliance/common-media-library/issues/630)).
- `readDref` and `readStsd` now return an empty `boxes` list for an `entry_count` of 0. A write of the box then keeps the count of 0 and writes no entries. Earlier releases return the boxes after the count, so a write changes the count to the number of those boxes ([#666](https://github.com/streaming-video-technology-alliance/common-media-library/issues/666)).
- The `hdlr`, `url `, `urn `, and `schm` readers and writers now use UTF-8 for the `name`, `location`, and `schemeUri` strings. Earlier releases return `å,` for a `name` of `日本` after `writeHdlr` and `readHdlr` ([#631](https://github.com/streaming-video-technology-alliance/common-media-library/issues/631)).
- `IsoBoxReaderReturn` no longer adds the built-in type of a box whose reader the configuration replaces. The result of `readIsoBoxes` with a custom `tfdt` reader now narrows to the return type of that reader ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `IsoBoxReaderReturn` now includes the return type of an optional reader and no longer includes `undefined` ([#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611)).
- `writeSchm` now writes the null terminator of an empty `schemeUri` when flag `0x000001` is set. The writer writes an empty string for a missing `schemeUri` ([#628](https://github.com/streaming-video-technology-alliance/common-media-library/issues/628)).
- `readElst` now returns the correct `mediaTime` for a version 1 `elst` box, where -1 marks an empty edit. Earlier releases return -4294967297 for -1.
- `writePrsl` now writes every tag that the flags declare. The writer writes an empty string for an empty or missing `preselectionTag` or `interleavingTag`. Earlier releases omit an empty tag, and a read of the written box returns no child boxes ([#624](https://github.com/streaming-video-technology-alliance/common-media-library/issues/624)).
- `createDefaultReaderConfig()` now includes readers for the `stco`, `stsc`, and `stsz` boxes. `writeIsoBoxes` with `createDefaultWriterConfig()` now writes the `stco`, `stsc`, and `stsz` boxes that `readIsoBoxes` reads with `createDefaultReaderConfig()`. Earlier releases throw a `RangeError` for `stco` and `stsc`, and write `stsz` without the sample sizes ([#619](https://github.com/streaming-video-technology-alliance/common-media-library/issues/619)).
- `writeUrl` no longer writes the `location` string when flag `0x000001` is set, even when `location` is not empty. Earlier releases add a null byte, so the `url ` box and the enclosing `dref` box are one byte too long ([#623](https://github.com/streaming-video-technology-alliance/common-media-library/issues/623)).
- `writeIden`, `writePayl`, `writeSttg`, and `writeVlab` now write the string of the box with no null byte after the string. `readIden`, `readPayl`, `readSttg`, and `readVlab` still read the same string from a box that has the null byte. Earlier releases write a null byte after the string ([#636](https://github.com/streaming-video-technology-alliance/common-media-library/issues/636)).
- The built-in readers now return the correct fraction of `rate`, `volume`, `matrix`, `width`, `height`, `horizResolution`, `vertResolution`, and `sampleRate`. Earlier releases return 8193 for the bytes `00 01 80 00` of a 16.16 value, and the correct value is 1.5.
- `readMvhd` now reads `rate` as a signed value. A `rate` of -1 now reads as -1. Earlier releases return 65535 for this `rate`.
- `readMvhd` and `readTkhd` now read `volume` and `matrix` as signed values. A `matrix` entry of -1, as in a rotated video, now reads as -1. Earlier releases return 65535 for this entry.
- `readTkhd` now reads `layer` and `alternateGroup` as signed values. A `layer` of -1 now reads as -1. Earlier releases return 65535 for this `layer`.
- `readMvhd` and `readTkhd` now read the `matrix` entries u, v, and w (indexes 2, 5, and 8) as 2.30 values. The entry w of the identity matrix now reads as 1. If your code compares w with 16384, compare w with 1.
- `writeMvhd` and `writeTkhd` now write the `matrix` entries u, v, and w as 2.30 values. If your code passes 16384 for w, pass 1. The value 16384 now writes 0.
- `readSmhd` now reads `balance` as a signed 8.8 value. The `balance` for full right reads as 1, and the `balance` for full left reads as -1. Earlier releases return 256 for full right and 65280 for full left.
- `writeSmhd` now writes `balance` as a signed 8.8 value. If your code passes 256 for full right, pass 1. The value 256 now writes 0.
- `readEmsg` and `writeEmsg` now read and write `schemeIdUri` and `value` as UTF-8, as ISO/IEC 23009-1 defines the fields. Earlier releases use one byte for each character, so a character that is not ASCII gives wrong bytes or a wrong string. A string with only ASCII characters reads and writes the same bytes as before ([#643](https://github.com/streaming-video-technology-alliance/common-media-library/pull/643)).
- `readIsoBoxes` no longer throws a `RangeError` when the data ends inside a box header. The function returns the boxes before that header. The function now reads a sample entry or a `udta` box with 4 zero bytes after the last child box ([#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650)).
- `writeIsoBoxes` omits the bytes that `readIsoBoxes` stops before. The written box is shorter than the source box by those bytes. If the `moov` box precedes the `mdat` box, the chunk offsets of the written file then address other bytes ([#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650)).
- `readIsoBoxes` now stops with no error when the data ends inside a box header. Earlier releases throw a `RangeError` for that data ([#650](https://github.com/streaming-video-technology-alliance/common-media-library/issues/650)).
- `readIsoBoxes` now stops before a box with a size below the size of the box header. The function returns the boxes before that box. Earlier releases return boxes with wrong types, omit the next box, or throw a `RangeError` ([#663](https://github.com/streaming-video-technology-alliance/common-media-library/issues/663)).
- `readIsoBoxes` now returns for a box with a `size` of 1 and a `largesize` of 0. Earlier releases read that box again without end, and the memory use grows ([#663](https://github.com/streaming-video-technology-alliance/common-media-library/issues/663)).
- `readIsoBoxes` now stops before a box with a size below the size of the box header. Earlier releases return that box, and the next read starts inside the header of that box ([#663](https://github.com/streaming-video-technology-alliance/common-media-library/issues/663)).
- `readIsoBoxes` now stops before a `uuid` box with a size below 24, or below 32 with a `largesize` field. The function returns the boxes before that box. Earlier releases throw a `RangeError` when that box is the last box of the data or of a container.
- `readIsoBoxes` now stops before a `uuid` box with a size below 24. Earlier releases throw a `RangeError`, or return a `usertype` with bytes of the next box.
- `readPssh` and `writePssh` now read and write 16 bytes for each key ID of a version 1 `pssh` box. The `kid` field has 16 numbers for each key ID. Earlier releases use one byte for each key ID, so `readPssh` returns a wrong `dataSize` and `data` or throws a `RangeError` ([#649](https://github.com/streaming-video-technology-alliance/common-media-library/issues/649)).
- `writeTenc` now writes the constant IV of a `tenc` box that has `defaultConstantIvSize` or `defaultConstantIv`. A read and then a write of the box returns the source bytes. Earlier releases write 32 bytes and drop the constant IV ([#648](https://github.com/streaming-video-technology-alliance/common-media-library/issues/648)).
- The children of the `udta`, `grpl`, `strk`, and `meco` boxes now have the type `ParsedIsoBox`. Earlier releases give each child the type `any`, so TypeScript checks no field of a child. Narrow a child with `isIsoBoxType` before you read a field of the child ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- After `isContainer(box)`, each element of `box.boxes` now has the type `ParsedIsoBox`, a box type or a raw box. A 64-bit integer field of a child has the type of the `int64` option ([#646](https://github.com/streaming-video-technology-alliance/common-media-library/issues/646)).
- `readEmsg` now returns the source version for an `emsg` box of version 2 or above. `messageData` has all bytes after the full box fields, and the other fields are empty strings or 0. Earlier releases read the fields of version 0 and return `version: 0` ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667)).
- `writeEmsg` now writes only the full box fields and `messageData` for a `version` other than 0 or 1. A read and then a write of such a box return the source bytes. Earlier releases write the fields of version 1 ([#667](https://github.com/streaming-video-technology-alliance/common-media-library/issues/667)).
- `writeWideUint(cursor, value, 8)` and the built-in writers now write all bits set for a `number` of 2^64 or more. Earlier releases write 0. A read and then a write with the default configs now keep a 64-bit field with all bits set, such as `duration` in `mvhd` ([#653](https://github.com/streaming-video-technology-alliance/common-media-library/issues/653)).
- `readSidx` and `writeSidx` now read and write `earliestPresentationTime` and `firstOffset` as 64-bit fields for a `sidx` box of version 2 or above. Earlier releases use 32-bit fields for every version other than 1 ([#670](https://github.com/streaming-video-technology-alliance/common-media-library/issues/670)).
- `readPrft` and `writePrft` now read and write `mediaTime` as a 64-bit field for a `prft` box of version 2 or above. Earlier releases use a 32-bit field for every version other than 1 ([#670](https://github.com/streaming-video-technology-alliance/common-media-library/issues/670)).
- `readCtts` now returns `entryCount` and an empty `entries` list for a `ctts` box of version 2 or above. The syntax defines no entries for those versions. Earlier releases read the entries with the layout of version 0 ([#670](https://github.com/streaming-video-technology-alliance/common-media-library/issues/670)).
- `writeCtts` now writes `entryCount` and no entries for a `ctts` box of version 2 or above. Earlier releases write every element of `entries` for every version ([#670](https://github.com/streaming-video-technology-alliance/common-media-library/issues/670)).
- `readTrun` now reads `sampleCompositionTimeOffset` as a signed integer for a `trun` box of version 2 or above. Earlier releases read a signed integer only for version 1 ([#678](https://github.com/streaming-video-technology-alliance/common-media-library/issues/678)).
- `readIsoBoxes` now reads an `ArrayBuffer` from another realm, such as a `node:vm` context or an iframe. Earlier releases throw a `TypeError` for that `ArrayBuffer`.
- `createIsoBoxReadableStream` now closes the source iterator when the stream is canceled. The `finally` block of a generator source now runs. Earlier releases leave the iterator open.
- `createIsoBoxReadableStream` now reads the global `ReadableStream` when it is called. A `ReadableStream` polyfill that a player installs after the import now works ([#715](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715)).

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

### Fixed

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

## [1.0.0-alpha.3] - 2026-01-07

### Changed

- Improved reading and writing of A/V sample entry boxes

### Fixed

- Incorrect FourCC for Additional Metadata Container Box (`meco`) box

## [1.0.0-alpha.2] - 2026-01-05

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
