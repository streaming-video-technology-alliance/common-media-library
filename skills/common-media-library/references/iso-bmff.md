<!-- libs/iso-bmff/README.md -->
# @svta/cml-iso-bmff

Read and write ISO Base Media File Format (ISO BMFF) boxes.

Documentation: [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/)

## When to use

- Read the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, the sample entry type (such as `avc1`), or the default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTrex`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read a 64-bit field, such as a tfdt time at a 10 MHz timescale, exactly or with an overflow report: `readInt64AsBigInt`, `createInt64OverflowReader`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Write or patch boxes, such as inserting emsg or rewriting tfdt, to a byte array or a ReadableStream: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`, `createIsoBoxReadableStream`
- Read or write a container box, such as moov or moof, with an optional named function: `readMoov`, `writeMoov`
- Read or write a box type that the package does not name: `createIsoBoxReadCursor`, `readUint32`, `readChildBoxes`, `beginIsoBox`, `writeUint32`, `writeChildBoxes`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.

## Installation

```bash
npm i @svta/cml-iso-bmff
```

## Quick start

Read the boxes of a media segment, and find the `tfdt` box inside `moof` and `traf`:

```typescript
import { findIsoBox, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/segment.m4s").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });
const tfdt = findIsoBox(boxes, (box) => box.type === "tfdt");

console.log(tfdt?.baseMediaDecodeTime);
```

Write boxes to a byte array:

```typescript
import { writeFtyp, writeIsoBoxes } from "@svta/cml-iso-bmff";

const bytes = writeIsoBoxes(
	[{ type: "ftyp", majorBrand: "isom", minorVersion: 1, compatibleBrands: ["isom"] }],
	{ writers: { ftyp: writeFtyp } },
);
```

## Runtime requirements

Some exports need a runtime API:

| API | Exports | Fallback |
| --- | --- | --- |
| `TextEncoder` | Every writer of a UTF-8 string field, such as `writeHdlr` and `writeEmsg` | None |
| `BigInt` | `readInt64AsBigInt`, `readUint64`, `writeUint64`, and the boxes with `bigint` fields | None, and no check |
| `DataView` methods `getBigUint64`, `setBigUint64`, and `setBigInt64` | `readInt64AsBigInt`, `readUint64`, `writeUint64`, `writeWideUint`, and `writeWideInt` with a `bigint` of 8 bytes | None, and no check |
| `ReadableStream` | `createIsoBoxReadableStream` | None. The function throws an `Error` with the message "ReadableStream is not available in this environment" |

## Usage

- [Reading boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md) - Read ISO BMFF boxes from a buffer
- [Writing boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md) - Write boxes to a byte array or a stream
- [Utilities](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/utilities.md) - Traverse boxes and type guards
- [Migrating to version 2](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/migrating-to-v2.md) - Update code from version 1 to version 2.0.0

<!-- libs/iso-bmff/docs/migrating-to-v2.md -->
---
title: Migrating to Version 2
description: Update code from version 1 to version 2.0.0
---

# Migrating to Version 2

Version 2.0.0 replaces the classes `IsoBoxReadView` and `IsoBoxWriteView` with two plain objects: the read cursor and the write cursor. A field function reads or writes one field at the position of a cursor. Every built-in reader and writer takes a cursor.

The guide uses two terms:

- A **box object** is an object with a `type` field and the fields of the box, such as the result of `readTfdt`.
- A **raw box** is the result of `readIsoBoxes` for a box with no reader and a type outside `CONTAINERS`: `{ boxType, bytes, headerSize }`.

The compiler reports most changes. The tables in this guide list each change and its replacement.

## Reading boxes

`readIsoBoxes` keeps its arguments. Its result changes:

- A box with no reader and a type outside `CONTAINERS` is a raw box. `bytes` is the complete box, with its header. The body is `box.bytes.subarray(box.headerSize)`. The bytes share memory with the input.
- A box object has only `type` and its fields. The fields `view`, `size`, `largesize`, and `usertype` do not exist.
- A raw box has no `type` field. Its four-character code is `box.boxType`. A test such as `box.type === "mdat"` matches a box object only, so it never matches a box with no reader.
- The result type does not follow the readers map. Every box has the type `ParsedIsoBox`, also a child in a `boxes` field. A test of `box.type` narrows a box to its box type.

```typescript
import { findIsoBox, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });

const tfdt = findIsoBox(boxes, (box) => box.type === "tfdt");

console.log(tfdt?.baseMediaDecodeTime);
```

| Version 1 | Version 2.0.0 |
|---|---|
| `box.view` | Omit the reader of the box, and use `box.bytes` of the raw box |
| `box.size` | `box.bytes.length` of a raw box |
| `box.largesize` | `box.bytes.length` of a raw box |
| `box.view` or `box.size` of a box with a type in `CONTAINERS`, such as `moof` | A custom reader for the box. The bytes of the box are from `cursor.start` to `cursor.end`. `seekIsoBox` returns a cursor with the same range. |
| `box.usertype` of a parsed `uuid` box | `box.userType` of a raw `uuid` box, or `readBytes(cursor, 16)` in a reader |
| `box.type` of a box with no reader | `box.boxType`. The four-character code of any box is `box.type ?? box.boxType`. |
| `readStsd<Avc1Box>` | `readStsd`, then a test of `entry.type` for each entry |
| `stsd.entries`, `dref.entries` | `stsd.boxes`, `dref.boxes` |
| A malformed `stsd` or `dref` box returns fewer entries | The read throws a `RangeError` |
| `readVlab`, `readPayl`, `readIden`, and `readSttg` stop at a null byte | The readers read to the end of the box. A box from release 1.0.7 or earlier gives a trailing U+0000. |
| A `co64` or `stz2` box with the default readers has no fields | The box has `chunkOffset`, or `fieldSize` and `entrySize` |
| An error `Truncated box` from a custom reader | The error reaches the caller of `readIsoBoxes`. A truncated box stops the read with no error. |

`seekIsoBox` reads one box without a read of the other boxes. Use it in place of a full read when your code needs one box, such as `tfdt`. See [Reading one box](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#reading-one-box).

## Custom readers

A reader takes a read cursor and the box type, and returns the complete box object with its `type` field. The cursor of a reader starts at the first byte after the box header. For a `uuid` box, the cursor starts at the first byte of `usertype`.

```typescript
import {
	readIsoBoxes,
	readUint24,
	readUint32,
	readUint8,
	type IsoBoxReadCursor,
	type IsoInt64,
} from "@svta/cml-iso-bmff";

const readMfhd = (cursor: IsoBoxReadCursor<IsoInt64>) => ({
	type: "mfhd" as const,
	version: readUint8(cursor),
	flags: readUint24(cursor),
	sequenceNumber: readUint32(cursor),
});

const boxes = readIsoBoxes(buffer, { readers: { mfhd: readMfhd } });
```

The `readers` map takes a reader under a key of `IsoBoxMap`, and the reader returns the box type of that key. For a box type that the package does not name, add the type to `IsoCustomBoxMap`. See [Writing a custom reader](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#writing-a-custom-reader).

The table shows the replacement for each member of `IsoBoxReadView`. A method with a `size` parameter becomes one function for each size.

| `IsoBoxReadView` member | Version 2.0.0 |
|---|---|
| `new IsoBoxReadView(raw, config)` | `createIsoBoxReadCursor(raw, config)` |
| `view.readUint(1)`, `view.readUint(2)`, `view.readUint(3)`, `view.readUint(4)` | `readUint8(cursor)`, `readUint16(cursor)`, `readUint24(cursor)`, `readUint32(cursor)` |
| `view.readUint(8)` | `readWideUint(cursor, 8)` |
| `view.readInt(1)`, `view.readInt(2)`, `view.readInt(4)` | `readInt8(cursor)`, `readInt16(cursor)`, `readInt32(cursor)` |
| `view.readInt(8)` | `readWideInt(cursor, 8)` |
| `view.readUint64()` | `readUint64(cursor)` |
| `view.readWideUint(size)`, `view.readWideInt(size)` | `readWideUint(cursor, size)`, `readWideInt(cursor, size)` |
| `view.readTemplate(2)`, `view.readTemplate(4)` | `readTemplate16(cursor)`, `readTemplate32(cursor)` |
| `view.readString(4)` for a four-character code | `readFourCc(cursor)` |
| `view.readUtf8(size)` | `readUtf8(cursor, size)` |
| `view.readString(size)` for other sizes | `readUtf8(cursor, size)`. `readString` gave one character for each byte, so a byte above 0x7F now decodes as UTF-8. |
| `view.readUtf8(-1)`, `view.readString(-1)` | `readTerminatedUtf8(cursor)`. For `readString`, a byte above 0x7F now decodes as UTF-8. |
| `view.readUtf8()` | `readUtf8(cursor, cursor.end - cursor.pos)` |
| `view.readData(size)` | `readBytes(cursor, size)` |
| `view.readData(-1)` | `readBytes(cursor, cursor.end - cursor.pos)` |
| `view.readFullBox()` | `readUint8(cursor)` for the version, then `readUint24(cursor)` for the flags |
| `view.readArray(...)`, `view.readEntries(...)` | A loop in the reader |
| `view.readBoxes()` | `readChildBoxes(cursor)` |
| `view.readBoxes(count)` | `readChildBoxes(cursor, count)` |
| `view.readBoxes(-1)` | `readChildBoxes(cursor)`. A negative count now throws a `RangeError`. |
| `view.readBox()` | `readChildBoxes(cursor, 1)[0]`. To skip the box, `nextIsoBox(cursor)` returns its type and moves past it. |
| `for (const box of view)` | `for (const box of readChildBoxes(cursor))` |
| `view.jump(size)` | `cursor.pos += size` |
| `view.bytesRemaining` | `cursor.end - cursor.pos` |
| `view.done` | `cursor.pos >= cursor.end`. Before a truncated box, `nextIsoBox(cursor)` returns `null`. |
| `view.cursor` | `cursor.pos - cursor.start` |
| `view.slice(offset, size)` | `readBytes`, then `createIsoBoxReadCursor` |
| `view.buffer`, `view.byteOffset`, `view.byteLength` | `cursor.view.buffer`, `cursor.view.byteOffset + cursor.start`, `cursor.end - cursor.start`. `cursor.view` covers the complete input, not one box. |

A read past `cursor.end` throws a `RangeError`, so a reader cannot read the bytes of the next box. A length below 0 and a length that is not an integer throw a `RangeError` too. No length value has a special meaning.

The `int64` option of the configuration is new in version 2.0.0. The function of the option takes a read cursor. The package exports `readInt64AsBigInt` and `createInt64OverflowReader` for the option. See [Reading 64-bit fields](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#reading-64-bit-fields).

## Writing boxes

`writeIsoBoxes` keeps its arguments and returns one `Uint8Array` with every box. Remove the code that joins the arrays of version 1:

```typescript
import { createDefaultWriterConfig, readIsoBoxes, writeIsoBoxes } from "@svta/cml-iso-bmff";

const bytes = writeIsoBoxes(readIsoBoxes(buffer), createDefaultWriterConfig());
```

| Version 1 | Version 2.0.0 |
|---|---|
| `writeIsoBoxes` returns one `Uint8Array` for each box | `writeIsoBoxes` returns one `Uint8Array` |
| A writer in the map comes before the bytes of a parsed box | The bytes of a raw box come before a writer. To change a raw box, build a box object with no `bytes` field. |
| A box object with a reader and no writer writes the bytes of `view` | Add the writer of the type, or remove the reader so that the box stays a raw box |
| `writeIsoBox` returns a view of the input for an `ArrayBufferView` | `writeIsoBox` returns a new array |
| `createIsoBoxReadableStream` throws an error of the first box | The error rejects the first read |
| `new IsoBoxReadableStream(boxes, config)` | `createIsoBoxReadableStream(boxes, config)` |
| `writeSidx` writes the low 16 bits of a reference count above 65535 | `writeSidx` throws a `RangeError` |
| `writeEmsg` writes the text after a U+0000 in `schemeIdUri` or `value` | `writeEmsg` throws a `RangeError` for a string with U+0000 |
| `writeSubs` writes the low 16 bits of a subsample count above 65535 | `writeSubs` throws a `RangeError` |
| `writeFtyp`, `writeStyp`, and `writeHdlr` write a code that does not have 4 characters | The writers throw a `RangeError`. A character above U+00FF throws too. |
| `writeMdhd` writes 0 or a wrong code for a `language` that is not 3 characters from U+0060 to U+007F | `writeMdhd` throws a `RangeError` |
| `writeHdlr` writes the text after a U+0000 in `name` | `writeHdlr` throws a `RangeError` |
| `writeSchm` writes the text after a U+0000 in `schemeUri` | `writeSchm` throws a `RangeError` |
| `writePrsl`, `writeLabl`, `writeKind`, and `writeElng` write the text after a U+0000 | Each writer throws a `RangeError` |
| A writer writes the low bits of a number that does not fit its field, and 0 for `NaN` | The writer throws a `RangeError`. `version` and `flags` follow the same rule. |
| A writer writes 0 for a field that a flag selects when the box has no value for it, such as `sampleDuration` of `trun` | The writer throws a `RangeError` |
| `writePssh` and `writeTenc` write 16 bytes for a `systemId` or a `defaultKid` of another length | The writers throw a `RangeError` |
| A byte field takes any value | A byte field takes a `Uint8Array` or an array of integers from 0 to 255. An `ArrayBuffer` throws a `RangeError`. |

The stream writes one box for each read and writes no box before the first read.

## Custom writers

A writer takes a write cursor and the box object, and returns nothing. The writer writes the header with `beginIsoBox` or `beginIsoFullBox`, then the fields, then the size with `endIsoBox`. A writer of a box with child boxes writes them with `writeChildBoxes`. The writers of the cursor then apply to the child boxes.

```typescript
import {
	beginIsoFullBox,
	endIsoBox,
	writeIsoBox,
	writeUint32,
	type IsoBoxWriteCursor,
	type MovieFragmentHeaderBox,
} from "@svta/cml-iso-bmff";

const writeMfhd = (cursor: IsoBoxWriteCursor, box: MovieFragmentHeaderBox) => {
	const start = beginIsoFullBox(cursor, "mfhd", box.version, box.flags);
	writeUint32(cursor, box.sequenceNumber);
	endIsoBox(cursor, start);
};

const bytes = writeIsoBox(
	{ type: "mfhd", version: 0, flags: 0, sequenceNumber: 1 },
	{ writers: { mfhd: writeMfhd } },
);
```

The table shows the replacement for each member of `IsoBoxWriteView`:

| `IsoBoxWriteView` member | Version 2.0.0 |
|---|---|
| `new IsoBoxWriteView(type, size)` | `const start = beginIsoBox(cursor, type)` at the start, and `endIsoBox(cursor, start)` at the end |
| `writer.writeFullBox(version, flags)` | `beginIsoFullBox(cursor, type, version, flags)` in place of `beginIsoBox` |
| `writer.writeBoxHeader(type, size)` | `beginIsoBox(cursor, type)` and `endIsoBox(cursor, start)` |
| `writer.writeUint(value, 1)`, `2`, `3`, `4` | `writeUint8`, `writeUint16`, `writeUint24`, `writeUint32` |
| `writer.writeUint(value, 8)` | `writeWideUint(cursor, value, 8)` |
| `writer.writeInt(value, 1)`, `2`, `4` | `writeInt8`, `writeInt16`, `writeInt32` |
| `writer.writeInt(value, 8)` | `writeWideInt(cursor, value, 8)` |
| `writer.writeUint64(value)` | `writeUint64(cursor, value)` |
| `writer.writeWideUint(value, size)`, `writer.writeWideInt(value, size)` | `writeWideUint(cursor, value, size)`, `writeWideInt(cursor, value, size)` |
| `writer.writeTemplate(value, 2)`, `writer.writeTemplate(value, 4)` | `writeTemplate16(cursor, value)`, `writeTemplate32(cursor, value)` |
| `writer.writeString(code)` for a four-character code | `writeFourCc(cursor, code)` |
| `writer.writeString(text)` for ASCII text | `writeUtf8(cursor, text)` |
| `writer.writeTerminatedString(text)`, `writer.writeUtf8TerminatedString(text)` | `writeTerminatedUtf8(cursor, text)` |
| `writer.writeBytes(data)` | `writeBytes(cursor, data)` |
| `writer.writeBytes([a, b])` | `writeBytes(cursor, a)`, then `writeBytes(cursor, b)` |
| `writer.writeArray(...)` | A loop in the writer |
| `writer.buffer`, `writer.byteOffset`, `writer.byteLength` | `cursor.bytes.subarray(0, cursor.pos)` |

A writer does not compute the size of its box. `endIsoBox` writes the size, and throws a `RangeError` for a box above 2^32 - 1 bytes. `writeFourCc`, `beginIsoBox`, and `beginIsoFullBox` throw a `RangeError` for a code that does not have 4 characters of 1 byte each.

The writers of the boxes with child boxes, such as `writeStsd` and `writeMoov`, have no `config` parameter. They write the child boxes with the writers of the cursor. To call a writer directly, create the cursor with `createIsoBoxWriteCursor({ writers })`.

## Types

### Renamed exports and fields

The names of the box types, entry types, and fields follow the names of the specification.

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
| `writeAudioSampleEntryBox` | `writeAudioSampleEntry` |
| `writeVisualSampleEntryBox` | `writeVisualSampleEntry` |
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

A field rename changes the keys of a reader result. The compiler does not report code that reads a field with a string key.

### Removed exports

| Version 1 | Version 2.0.0 |
|---|---|
| `IsoBoxReadView`, `IsoBoxWriteView` | The read cursor and the write cursor. See [Custom readers](#custom-readers) and [Custom writers](#custom-writers). |
| `ParsedBox`, `IsoTypedParsedBox` | `ParsedIsoBox` |
| `IsoBoxReaderReturn` | `ParsedIsoBox`. The result type of `readIsoBoxes` does not follow the readers map. |
| `IsoFieldTypeMap`, `UINT`, `INT`, `TEMPLATE`, `STRING`, `UTF8`, `DATA`, `IsoBoxFields` | The field functions, such as `readUint32` |
| `IsoBoxReadableStream` | `createIsoBoxReadableStream` |
| `fourCcToUint32` | A field with a four-character code is a string. To convert a code, compute `new DataView(Uint8Array.from(code, char => char.charCodeAt(0)).buffer).getUint32(0)`. |
| `readAudioSampleEntryBox(type, view)`, `readVisualSampleEntryBox(type, view)` | `createAudioSampleEntryReader(type)` and `createVisualSampleEntryReader(type)`. Put the result in the `readers` map, or call it with the cursor. |
| `EventMessageBoxBase`, `EventMessageBoxV0`, `EventMessageBoxV1` | `EventMessageBox`. Read the field of the version, such as `box.presentationTimeDelta ?? box.presentationTime`. |
| `isFullBox` | `isIsoBoxType`, or a test such as `'version' in box && 'flags' in box` |
| The child types, such as `MovieBoxChild` and `VisualSampleEntryBoxChild` | `ParsedIsoBox` |
| `TrackReferenceTypeBox` | A raw box. A child of a `tref` box is a raw box. |
| The aliases `co64`, `stz2`, `url`, and `urn` | `ChunkLargeOffsetBox`, `CompactSampleSizeBox`, `DataEntryUrlBox`, `DataEntryUrnBox`, or a key of `IsoBoxMap` such as `IsoBoxMap['co64']` |
| `SyncSample`, `Entity` | A `number` in `sampleNumber` and `entityId` |
| The types of 16 boxes with no reader and no writer: `hmhd`, `iinf`, `iloc`, `imif`, `infe`, `ipro`, `iref`, `nmhd`, `pitm`, `saio`, `saiz`, `sbgp`, `senc`, `sgpd`, `stdp`, and `stsh` | A type that your code declares and adds to `IsoCustomBoxMap`, with a custom reader |

### Changed fields

| Version 1 | Version 2.0.0 |
|---|---|
| `stss.entries: { sampleNumber }[]` | `stss.sampleNumber: number[]` |
| `prsl.entities: { entityId }[]` | `prsl.entityId: number[]` |
| `reserved1`, `reserved2`, `reserved3` of `mvhd`, `tkhd`, and the sample entries | Removed. The writers write 0. |
| `reserved` of `smhd`, `sidx`, and `tfra` | Removed. The writers write 0. |
| `defaultIsEncrypted` of `tenc` | `defaultIsProtected`, with the pattern in `defaultCryptByteBlock` and `defaultSkipByteBlock` |
| `isGroupLabel` of `labl` | `(box.flags & 0x1) !== 0` |
| `reference` and `sap` of a `sidx` reference | The decoded fields, such as `referenceType` and `sapType` |
| `sampleCount` of `trun` | `samples.length`. The writer writes the length of `samples`. |
| `numberOfEntry` of `tfra` | `entries.length` |
| `subsegmentCount` of `ssix`, `rangesCount` of a subsegment | `subsegments.length`, `ranges.length` |
| `sampleDependencyTable: number[]` of `sdtp` | A `Uint8Array`, a view of the input. Wrap a list in `new Uint8Array(...)`. |
| `entryCount` of `stts`, `stsc`, `stco`, `stss`, and `subs` | The length of the list: `entries`, `chunkOffset`, or `sampleNumber` |
| `subsampleCount` of a `subs` entry | `subsamples.length` |
| `entryCount` of a `ctts` box of version 0 or 1 | `entries.length`. A box of version 2 or above keeps `entryCount`. |
| `sampleCount` of a `stsz` box with a `sampleSize` of 0 | `entrySize.length`. A box with a `sampleSize` above 0 keeps `sampleCount`. |
| `entryCount` of `co64`, `sampleCount` of `stz2` | `chunkOffset.length`, `entrySize.length` |
| `entryCount` of `elst` | `entries.length` |
| `entryCount` of `stsd` and `dref` | `boxes.length` |
| `numEntitiesInGroup` of `prsl` | `entityId.length` |
| `compressorName: number[]` of a visual sample entry | `compressorName: string`. The writer writes the length byte and the padding. A name above 31 bytes in UTF-8 throws a `RangeError`. |
| `location: string` of `url ` and `urn ` | `location?: string`. A box with no bytes after the flags or after `name` has no `location`. |
| `kidCount` and `kid: number[]` of `pssh` | `kid: Uint8Array[]`, one entry for each key ID. The count is `kid.length`. |
| `dataSize` and `data: number[]` of `pssh` | `data: Uint8Array`. The size is `data.length`. |
| `systemId: number[]` of `pssh`, `defaultKid: number[]` of `tenc` | A `Uint8Array` of 16 bytes |
| `dataFormat: number` of `frma`, `schemeType: number` of `schm` | A string, such as `'avc1'` or `'cenc'` |
| `matrix: number[]` of `mvhd` and `tkhd`, `opColor: number[]` of `vmhd` | Labeled tuples of 9 and 3 numbers. Annotate an array that your code builds, such as `matrix as MovieHeaderBox['matrix']`. |

### Changed values

The compiler does not report these changes.

| Version 1 | Version 2.0.0 |
|---|---|
| The `matrix` entries u, v, and w (indexes 2, 5, and 8) of `mvhd` and `tkhd` are 16.16 values. The entry w of the identity matrix is 16384. | The entries are 2.30 values, and w of the identity matrix is 1. Pass 1 for w. The value 16384 throws a `RangeError`. |
| `balance` of `smhd` is 256 for full right and 65280 for full left | 1 for full right and -1 for full left. The value 256 throws a `RangeError`. |
| A `rate`, `volume`, `layer`, `alternateGroup`, or `matrix` entry of -1 reads as 65535 | The value reads as -1 |
| A fixed-point field with a fraction reads a wrong value, such as 8193 for 1.5 | The field reads 1.5 |
| A reader omits the key of a field that the box does not have, such as `sampleDuration` of a `trun` sample or `presentationTime` of `emsg` | Every key is present, with `undefined` for an absent field. `"presentationTime" in box` is always `true`, so test the value for `undefined`. A spread of the box over default values sets each absent field to `undefined`. |

### Changed types

| Version 1 | Version 2.0.0 |
|---|---|
| The `boxes` field of a container has a list of child types | The `boxes` field of every box type is `ParsedIsoBox<V>[]`. Narrow a child with a test of `child.type`. |
| A child of a sample entry can be a `Uint8Array` | A child is a box object or a raw box, such as `{ boxType: "esds", bytes }` |
| `SampleEntry<T, C>` | `SampleEntry<T, V>` |
| `SampleDescriptionBox<E>` | `SampleDescriptionBox<V, E>` |
| `Box` with no type argument | `Box<"abcd">` for one box type, or `IsoBox` |
| The result type of `readIsoBoxes` has the return type of each reader | The result type is `ParsedIsoBox<V>[]`. A test of `box.type` narrows a box. Add the box type of a custom reader to `IsoCustomBoxMap`. |
| `IsoBoxStreamable` has `ParsedBox` and accepts a box object with missing fields | `IsoBoxStreamable` is the union of the box types of `IsoBoxMap`, `IsoRawBox`, and `ArrayBufferView`. The write functions check a box object against its box type. |
| `IsoBoxReader<B, T, V>`, with the box type `T` as the second parameter | `IsoBoxReader<B, V>`, with the type `V` of the 64-bit fields as the second parameter. Replace `IsoBoxReader<MyBox, 'abcd', bigint>` with `IsoBoxReader<MyBox, bigint>`. `B` has a `type` field. |
| `IsoBoxWriter<B>` returns an `ArrayBufferView` | `IsoBoxWriter<B>` takes the cursor and the box, and returns nothing |
| `IsoBoxReaderMap` and `IsoBoxWriterMap` accept a function under any key | The maps take a key of `IsoBoxMap` only. A reader returns the box type of that key, and a writer takes that box type. Add another box type to `IsoCustomBoxMap`. |

<!-- libs/iso-bmff/docs/reading-boxes.md -->
---
title: Reading Boxes
description: Read ISO BMFF boxes from a buffer
---

# Reading Boxes

The `readIsoBoxes` function reads boxes from a buffer and returns an array of boxes. To read the fields of a box, provide a reader function for that box type. The result has two kinds of boxes:

- A **box object** has a `type` field and the fields of the box. A reader returns a box object.
- A **raw box** is a box with no reader: `{ boxType, bytes, headerSize }`. `boxType` is the four-character code of the box. `bytes` is the complete box, with its header. The body of the box is `box.bytes.subarray(box.headerSize)`. A raw `uuid` box also has `userType`, the 16 bytes of the `usertype` field. No other raw box has that field.

The bytes of a raw box share memory with the input.

A raw box has no `type` field. A test such as `box.type === "tfdt"` narrows a box to that box type, and never matches a raw box. A box with no reader is a raw box, so add the reader of a box type before you test for that type. The four-character code of any box is `box.type ?? box.boxType`.

> [!NOTE]
> The function reads container boxes automatically, so they do not need a reader function. The `CONTAINERS` constant lists the container box types that the function reads automatically. Each container type also has a named reader, such as `readMoov` and `readMoof`. A container reader in the `readers` map is optional and does not change the result.

## Using default config

If tree shaking is not a concern, use `createDefaultReaderConfig()`. It returns a configuration with every available reader except the container readers:

```typescript
import { createDefaultReaderConfig, readIsoBoxes } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, createDefaultReaderConfig());
```

Each call of `createDefaultReaderConfig()` returns a new configuration object. A player can create the configuration once and pass it to every read.

`readIsoBoxes` accepts an `ArrayBuffer` and any view, such as a `Uint8Array`, a `DataView`, or a Node.js `Buffer`. The function does not copy the data. Pass the view itself. Do not pass the `buffer` property of a view, because that buffer can contain other data.

## Using specific readers

For optimal bundle size with tree shaking, import only the readers you need:

```typescript
import { readFtyp, readIsoBoxes } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, {
	readers: {
		ftyp: readFtyp,
	},
});
```

## Optional fields

A box object from a built-in reader has every key of its type. A field that the flags, the version, or the size of the box excludes is `undefined`. To check for a field, test its value for `undefined`, or test the flags or the version. Do not test the key with `in` or `Object.keys`. The key is always present.

## Reading one box

`seekIsoBox` finds a box by its path and returns a read cursor for that box. The function reads no other box. Pass the cursor to the reader of the box:

```typescript
import { readTfdt, seekIsoBox } from "@svta/cml-iso-bmff";

const cursor = seekIsoBox(buffer, ["moof", "traf", "tfdt"]);
const time = cursor ? readTfdt(cursor).baseMediaDecodeTime : null;
```

The function returns `null` for a missing box and for a truncated box. If your code reads partial data, a `null` result means that the box can be in the next bytes. The third argument takes the `int64` option, as `readIsoBoxes` does.

`seekIsoBox` treats the body of each box in the path as a list of boxes. Some boxes have fields before their child boxes, such as `meta`, `stsd`, and the sample entries. For such a box, move the position of the cursor past the fields, then call `seekIsoBox` again with the cursor. The second call does not move the first cursor:

```typescript
import { seekIsoBox } from "@svta/cml-iso-bmff";

const stsd = seekIsoBox(buffer, ["moov", "trak", "mdia", "minf", "stbl", "stsd"]);

if (stsd) {
	stsd.pos += 8; // version, flags, and entry_count
	const avc1 = seekIsoBox(stsd, ["avc1"]);
	console.log(avc1 && avc1.end - avc1.start);
}
```

## Stepping over boxes

`nextIsoBox` returns the type of the box at the position of a cursor and moves the position past that box. The function reads no field of the box. The bytes from the old position to the new position are the complete box:

```typescript
import { createIsoBoxReadCursor, nextIsoBox } from "@svta/cml-iso-bmff";

const cursor = createIsoBoxReadCursor(buffer);
let start = cursor.pos;
let type = nextIsoBox(cursor);

while (type) {
	console.log(type, cursor.pos - start); // the type and the size of each box
	start = cursor.pos;
	type = nextIsoBox(cursor);
}
```

The function returns `null` at the end of the cursor and before a truncated box. The position then stays at the first byte of that box.

## Extending a built-in reader

A custom reader can call a built-in reader and add fields to the result. In the result of `readIsoBoxes`, the box has the built-in type. The loop tests `box.type`, then casts the box to the result type of the reader.

HLS and DASH streams contain ID3 timed metadata in `emsg` boxes with the scheme `https://aomedia.org/emsg/ID3`. The built-in reader returns `messageData` as bytes. This reader decodes the frames once, when the box is read:

```typescript
import { ID3_SCHEME_ID_URI, getId3Frames, type Id3Frame } from "@svta/cml-id3";
import {
	readEmsg,
	readIsoBoxes,
	type IsoBoxReadCursor,
} from "@svta/cml-iso-bmff";

const readEmsgWithId3 = (cursor: IsoBoxReadCursor) => {
	const emsg = readEmsg(cursor);
	const frames: Id3Frame[] =
		emsg.schemeIdUri === ID3_SCHEME_ID_URI
			? getId3Frames(emsg.messageData)
			: [];
	return { ...emsg, frames };
};

const segment = await fetch("https://example.com/segment.m4s").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(segment, {
	readers: {
		emsg: readEmsgWithId3,
	},
});

type EmsgWithId3 = ReturnType<typeof readEmsgWithId3>;

for (const box of boxes) {
	if (box.type === "emsg") {
		console.log((box as EmsgWithId3).frames);
	}
}
```

A byte field such as `messageData` is a view over the input data. The field shares memory with that data and is not a copy. To keep the bytes after your code releases or changes the input, call `slice()` on the field.

## Writing a custom reader

The package parses no codec configuration box, such as `avcC`, `hvcC`, or `esds`. The `boxes` field of a sample entry, such as `avc1`, holds such a box as a raw box with its bytes. To read the fields of the box, write a custom reader for its box type.

The `readers` map takes a reader under a key of `IsoBoxMap`. For a box type that the package does not name, add the type to `IsoCustomBoxMap` first. `readIsoBoxes` and the write functions then have that box type.

A reader takes a read cursor and the box type, and returns the box object with its `type` field. A field function reads one field at `cursor.pos` and moves the position past the field, such as `readUint32` or `readFourCc`:

```typescript
import {
	findIsoBox,
	readFourCc,
	readIsoBoxes,
	readUint16,
	readUint32,
	type IsoBoxReadCursor,
	type IsoInt64,
} from "@svta/cml-iso-bmff";

// A box type that the package does not name.
type AbcdBox = { type: "abcd"; brand: string; count: number; flags: number };

// Add the box type to the map of custom box types.
declare module "@svta/cml-iso-bmff" {
	interface IsoCustomBoxMap {
		abcd: AbcdBox;
	}
}

const readAbcd = (cursor: IsoBoxReadCursor<IsoInt64>): AbcdBox => ({
	type: "abcd",
	brand: readFourCc(cursor),
	count: readUint32(cursor),
	flags: readUint16(cursor),
});

const boxes = readIsoBoxes(buffer, { readers: { abcd: readAbcd } });

// The test narrows the box to `AbcdBox`.
console.log(findIsoBox(boxes, (box) => box.type === "abcd")?.brand);
```

The cursor follows these rules:

- `cursor.start` is the first byte of the box header, and `cursor.end` is the first byte after the box. The cursor of a reader starts at the first byte after the header. For a `uuid` box, the cursor starts at the first byte of `usertype`. Read it with `readBytes(cursor, 16)`.
- A read past `cursor.end` throws a `RangeError`, so a reader cannot read the bytes of the next box. A reader can stop before the end of its box.
- A length is an integer of 0 or more. Another length throws a `RangeError`.
- The bytes that remain are `cursor.end - cursor.pos`. To skip bytes, add to `cursor.pos`.
- A reader of a box with child boxes reads them with `readChildBoxes(cursor)`. The readers of the configuration then apply to the child boxes.
- `readIsoBoxes` uses one cursor for every box. A reader must not keep the cursor after it returns. A reader that needs bytes later keeps the result of `readBytes`.
- The declaration of `IsoCustomBoxMap` applies to every file of the program. Two declarations of one box type need the same type.
- A reader under a key returns the box type of that key. The reader can add fields. A reader with another result type is a compile error.

`readIsoBoxes` does not catch an error of a reader. The error reaches the caller.

`readIsoBoxes` finds a reader by the exact type and by the trimmed type. A reader under the key `url` reads the `"url "` box. The box type has a trailing space.

`IsoBoxMap` names the sample entry types of these codecs: `ac-3`, `ac-4`, `av01`, `dav1`, `dva1`, `dvav`, `dvh1`, `dvhe`, `ec-3`, `fLaC`, `Opus`, and `vp09`. The default configuration has no reader for these types. Create a reader with `createAudioSampleEntryReader` or `createVisualSampleEntryReader`, such as `{ "ec-3": createAudioSampleEntryReader("ec-3") }`.

## Incomplete boxes

A box is incomplete when the data ends inside the header or inside the body of the box. A box is also incomplete when its size is below the size of its header. `readIsoBoxes` stops before the first incomplete box and returns the boxes before that box. The function does not throw for an incomplete box.

`readIsoBoxes` returns no position. To continue a read with more data, read with a cursor. After `readChildBoxes` or `nextIsoBox` stops before an incomplete box, the position of the cursor is the first byte of that box. Keep the bytes from that position, add the new bytes, and read again:

```typescript
import { createIsoBoxReadCursor, readChildBoxes } from "@svta/cml-iso-bmff";

const cursor = createIsoBoxReadCursor(buffer);
const boxes = readChildBoxes(cursor);

// The first incomplete box starts at the first byte of `rest`.
const rest = buffer.slice(cursor.pos);
```

The position has two limits:

- The position applies to the boxes of one level. If a child box of a complete box is incomplete, the reader of the parent box stops before the child box. The read then continues after the parent box, and the position does not show the child box.
- The position does not separate an incomplete box from a box with a bad size. A wrong `size` value above the remaining data stops the read at the same position. More data then does not complete the box.

A box with a reader in the configuration and a body shorter than its fields is not an incomplete box. `readIsoBoxes` then throws a `RangeError` and returns no boxes. A box that is deeper than 128 levels also throws a `RangeError`. If the data comes from the network, call `readIsoBoxes` inside a `try` block.

The size of a box includes its header. The header has 8 bytes, or 16 bytes when `size` is 1 and a `largesize` field follows (ISO/IEC 14496-12, clause 4.2). The header of a `uuid` box has 16 more bytes for the `usertype` field. A `size` of 0 is valid and means that the box extends to the end of the data.

The same rule applies to the child boxes of a container and of a sample entry. Some QuickTime files have 4 zero bytes after the last child box of a `udta` box. Other QuickTime files have those bytes at the end of an `avc1` or `hvc1` sample entry. A box header has at least 8 bytes, so the reader stops before those bytes. The box object has the child boxes and no field for those bytes.

A writer builds a container or a sample entry from the child boxes of the box object. A write therefore omits those bytes. The written box is shorter than the source box by those bytes. If the `moov` box precedes the `mdat` box, the chunk offsets of the written file then address other bytes. The `mfraSize` field of an `mfro` box has the same limit. See [Writing a changed `mfra` box](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md#writing-a-changed-mfra-box).

## Reading 64-bit fields

The built-in readers return every integer field as a `number`. A `number` holds integers up to 2^53 - 1 exactly. A 64-bit field can exceed that limit, and the reader then returns a rounded value. One example is `baseMediaDecodeTime` in a version 1 `tfdt` box with a 10 MHz timescale and a wall-clock origin.

The `int64` option of the configuration takes a function that reads every 64-bit field of the built-in readers. The package exports two functions for the option. `readInt64AsBigInt` returns the exact value as a `bigint`. `createInt64OverflowReader` keeps the `number` and reports a rounded value.

The option applies to these fields:

| Box                    | Fields                                          |
| ---------------------- | ----------------------------------------------- |
| `tfdt`                 | `baseMediaDecodeTime`                           |
| `sidx`                 | `earliestPresentationTime`, `firstOffset`       |
| `tfra`                 | `time` and `moofOffset` of each entry           |
| `prft`                 | `mediaTime`                                     |
| `emsg`                 | `presentationTime`                              |
| `mehd`                 | `fragmentDuration`                              |
| `mvhd`, `mdhd`, `tkhd` | `creationTime`, `modificationTime`, `duration`  |
| `elst`                 | `segmentDuration` and `mediaTime` of each entry |
| `tfhd`                 | `baseDataOffset`                                |
| `co64`                 | each entry of `chunkOffset`                     |

### Exact values as `bigint`

Pass `readInt64AsBigInt` as the `int64` option. The built-in readers then return each field of the table as a `bigint`. The result type of `readIsoBoxes` follows the option:

```typescript
import {
	createDefaultReaderConfig,
	isIsoBoxType,
	readInt64AsBigInt,
	readIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(
	buffer,
	createDefaultReaderConfig({ int64: readInt64AsBigInt }),
);

for (const box of boxes) {
	if (isIsoBoxType("sidx", box)) {
		// earliestPresentationTime is a bigint. The division of two bigints
		// drops the fraction, so add the remainder as a number.
		const scale = BigInt(box.timescale);
		const seconds =
			Number(box.earliestPresentationTime / scale) +
			Number(box.earliestPresentationTime % scale) / box.timescale;
		console.log(seconds);
	}
}
```

Pass the option as the argument of `createDefaultReaderConfig`. The readers of the returned configuration have the types of that option. If you add `readInt64AsBigInt` to the result of `createDefaultReaderConfig()` afterward, the code does not compile.

The option works the same way with specific readers:

```typescript
import {
	findIsoBox,
	isIsoBoxType,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: {
		tfdt: readTfdt,
	},
});

// A tfdt box is inside a traf box, inside a moof box.
const tfdt = findIsoBox(boxes, (box) => isIsoBoxType("tfdt", box));

// baseMediaDecodeTime is a bigint.
console.log(tfdt?.baseMediaDecodeTime);
```

Each field has one type for every version of its box. A version 0 `tfdt` box stores `baseMediaDecodeTime` in 32 bits. The reader returns that field as a `bigint` too, so your code does not test `version`. The option also applies to the child boxes of a container.

`readInt64AsBigInt` needs `BigInt` and the `getBigUint64` method of `DataView`, and does not test for them. On a runtime without them, a read fails with the error of the runtime. If your code supports such a runtime, test `typeof DataView.prototype.getBigUint64 === "function"` before you pass the function. The test is `false` on a runtime without `BigInt` too.

`JSON.stringify` throws a `TypeError` for a `bigint`. To serialize a box with `bigint` fields, pass a replacer function that converts each `bigint` to a string.

### Reporting a rounded value

If your code keeps `number` fields, use `createInt64OverflowReader`. The function takes a callback and returns a function for the `int64` option. When a 64-bit value is outside the safe integer range, the callback receives a `RangeError`. If the callback returns, the read continues with the rounded value. If the callback throws, the read stops with that error.

A version 1 `mvhd`, `tkhd`, or `mdhd` box can have a `duration` with all bits set. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. The callback receives a `RangeError` for that value too, and the field reads as `2 ** 64`. That report does not mean that the file is damaged. If your code reads such boxes, do not throw from the callback.

```typescript
import {
	createInt64OverflowReader,
	readIsoBoxes,
	readTfdt,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, {
	int64: createInt64OverflowReader((error) => console.warn(error.message)),
	readers: {
		tfdt: readTfdt,
	},
});
```

The types of the result do not change, and the function does not need `BigInt`. The function checks the fields of the table above. The function does not check a field that a custom reader reads with `readUint32` and no `readWideUint`. A configuration takes one function for the option. The configuration selects `bigint` fields or the report, not both.

### Custom readers and the option

A custom reader of the type `(cursor: IsoBoxReadCursor) => ...` works with no option and with `createInt64OverflowReader`. With `readInt64AsBigInt`, that reader is a compile error, because the cursor then has `bigint` fields. Use one of two forms:

- A reader that reads no 64-bit field takes `IsoBoxReadCursor<IsoInt64>`. That type accepts the cursor of every configuration.
- A reader that follows the option is generic. That reader reads each 64-bit field with `readWideUint` or `readWideInt`.

`readWideUint` and `readWideInt` take the size of the field in bytes, 4 or 8. With no option, they return a `number`. With the option, they return the result of the `int64` function:

```typescript
import {
	readInt64AsBigInt,
	readIsoBoxes,
	readUint24,
	readUint8,
	readWideUint,
	type IsoBoxReadCursor,
	type IsoInt64,
} from "@svta/cml-iso-bmff";

const readTfdtWide = <V extends IsoInt64>(cursor: IsoBoxReadCursor<V>) => {
	const version = readUint8(cursor);
	const flags = readUint24(cursor);
	const baseMediaDecodeTime = readWideUint(cursor, version === 1 ? 8 : 4);
	return {
		type: "tfdt" as const,
		version,
		flags,
		baseMediaDecodeTime,
		source: "custom",
	};
};

// baseMediaDecodeTime is a bigint in this result.
const boxes = readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: {
		tfdt: readTfdtWide,
	},
});

// A readers map in a variable works the same way.
const readers = { tfdt: readTfdtWide };
const stored = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers });
```

The result type follows the `int64` option, not the readers map. With `isIsoBoxType("tfdt", box)`, the box has the built-in type with `bigint` fields. To read the `source` field, cast the box to `ReturnType<typeof readTfdtWide<bigint>>`.

TypeScript reads the type of the `int64` function to select the type of the fields. Pass a named function, such as `readInt64AsBigInt`. For a function that you write inside the configuration object, give the `cursor` parameter the type `IsoBoxReadCursor<IsoInt64>`. Without that type, a function after a `readers` map with a generic reader can fail to compile.

The type of the fields also follows a type that your code writes, such as `readIsoBoxes<bigint>(buffer)` or a variable of the type `ParsedIsoBox<bigint>[]`. TypeScript does not check such a type against the `int64` option. Let TypeScript infer the type from the option.

### A function that forwards the option

Your code can have a function that takes a configuration and passes that configuration to `readIsoBoxes`. Give the function a type parameter for the type of the 64-bit fields. The result type then follows the configuration of each call:

```typescript
import {
	createDefaultReaderConfig,
	readInt64AsBigInt,
	readIsoBoxes,
	type IsoBoxData,
	type IsoBoxReadConfig,
	type IsoInt64,
	type ParsedIsoBox,
} from "@svta/cml-iso-bmff";

function readSegment<V extends IsoInt64 = number>(
	data: IsoBoxData,
	config: IsoBoxReadConfig<V>,
): ParsedIsoBox<V>[] {
	return readIsoBoxes(data, config);
}

// The 64-bit fields are numbers in this result.
const plain = readSegment(buffer, createDefaultReaderConfig());

// The 64-bit fields are bigints in this result.
const exact = readSegment(
	buffer,
	createDefaultReaderConfig({ int64: readInt64AsBigInt }),
);
```

Do not type the parameter as `IsoBoxReadConfig<IsoInt64>`. That type does not accept the result of `createDefaultReaderConfig({ int64: readInt64AsBigInt })`.

### A custom reader for one field

If your code needs the exact value of one field only, a custom reader can call `readUint64`. The function returns a `bigint` and needs no option. A reader under the key `tfdt` returns the `tfdt` box type, so the reader adds the exact value as a new field:

```typescript
import {
	readIsoBoxes,
	readUint24,
	readUint32,
	readUint64,
	readUint8,
	type IsoBoxReadCursor,
} from "@svta/cml-iso-bmff";

const readTfdtExact = (cursor: IsoBoxReadCursor) => {
	const version = readUint8(cursor);
	const flags = readUint24(cursor);
	const exactTime =
		version === 1 ? readUint64(cursor) : BigInt(readUint32(cursor));
	return {
		type: "tfdt" as const,
		version,
		flags,
		baseMediaDecodeTime: Number(exactTime),
		exactTime,
	};
};

const boxes = readIsoBoxes(buffer, {
	readers: {
		tfdt: readTfdtExact,
	},
});

type TfdtExact = ReturnType<typeof readTfdtExact>;

for (const box of boxes) {
	if (box.type === "tfdt") {
		console.log((box as TfdtExact).exactTime);
	}
}
```

The built-in writers write a `bigint` field with the exact value. See [Writing 64-bit fields](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md#writing-64-bit-fields).

<!-- libs/iso-bmff/docs/utilities.md -->
---
title: Utilities
description: Traversing boxes and type guards
---

# Utilities

In the examples, `buffer` holds the bytes of a segment.

## Traversing boxes

The `traverseIsoBoxes` function traverses box iterators and returns a generator of boxes. It takes an iterable of boxes and one optional configuration with two options. `depthFirst` selects a depth-first or a breadth-first traversal, and the default is `true`. `maxDepth` is the maximum depth, and the default is `Infinity`. A maximum depth of 0 traverses only the root boxes.

The read in these examples has no reader, so each box outside `CONTAINERS` is a raw box. A raw box has its four-character code in `boxType`.

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes)) {
	console.log(box.type ?? box.boxType);
}
```

This example traverses breadth-first, and stops at the children of the root boxes:

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes, { depthFirst: false, maxDepth: 1 })) {
	console.log(box.type ?? box.boxType);
}
```

## Finding boxes

`findIsoBox` returns the first box that matches a callback, or `null`. `filterIsoBoxes` returns every box that matches. Both functions traverse the boxes as `traverseIsoBoxes` does and take the same configuration. A callback that tests `box.type` narrows the result to that box type. That callback does not match a raw box. To match a raw box, test `box.boxType`.

```typescript
import {
	createDefaultReaderConfig,
	filterIsoBoxes,
	findIsoBox,
	readIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, createDefaultReaderConfig());

const tfdt = findIsoBox(boxes, (box) => box.type === "tfdt");
const trafs = filterIsoBoxes(boxes, (box) => box.type === "traf");

console.log(tfdt?.baseMediaDecodeTime, trafs.length);
```

The traversal follows the `boxes` field. If the `readers` map has `readStsd`, the search also reaches the sample entries. If the map has `readDref`, the search also reaches the data entries.

`isIsoBoxType` checks the type of one box and narrows the box to that type. The function also takes `null`, `undefined`, and a value of an unknown type. For a box from `readIsoBoxes`, a test of `box.type` gives the same result:

```typescript
import {
	isIsoBoxType,
	readIsoBoxes,
	readTfdt,
	traverseIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });

for (const box of traverseIsoBoxes(boxes)) {
	if (isIsoBoxType("tfdt", box)) {
		console.log(box.baseMediaDecodeTime);
	}
}
```

## Type guards

The package provides type guards that check the type of a box. These guards narrow the type of a box in TypeScript.

`isContainer` checks whether a box has child boxes. The function returns `true` for a box with a `boxes` field and for a box with a type in `CONTAINERS`. In TypeScript, a `true` result narrows the box to the box types with a `boxes` field. These types are the container types, `meta`, `stsd`, `dref`, `prsl`, and the sample entries.

```typescript
import { isContainer, type IsoBox } from "@svta/cml-iso-bmff";

const box: IsoBox = { type: "moov", boxes: [] };
const container = isContainer(box);
```

After `isContainer` returns `true`, each element of `box.boxes` is a box or a raw box. Test the `type` of a child before you read a field of that child.

```typescript
import { createDefaultReaderConfig, isContainer, readIsoBoxes } from "@svta/cml-iso-bmff";

for (const box of readIsoBoxes(buffer, createDefaultReaderConfig())) {
	if (isContainer(box)) {
		for (const child of box.boxes) {
			if (child.type === "mfhd") {
				console.log(child.sequenceNumber);
			}
		}
	}
}
```

<!-- libs/iso-bmff/docs/writing-boxes.md -->
---
title: Writing Boxes
description: Write boxes to a byte array or a stream
---

# Writing Boxes

The `writeIsoBoxes` function writes boxes. It takes an iterable of streamable items and returns one `Uint8Array` with every box. Streamable items include:

- Box objects, such as `{ type: 'ftyp', majorBrand: 'isom', minorVersion: 1, compatibleBrands: ['isom'] }`
- `ArrayBufferView`s such as `Uint8Array` and `DataView`.
- Boxes that `readIsoBoxes` returns. A box with no reader and a type outside `CONTAINERS` is a raw box with a `bytes` field. The function copies those bytes, even if the `writers` map has a writer for the type. To change a raw box, build a box object with the fields and no `bytes` field. A box that a reader returns needs a writer in the `writers` map.

The write functions check a box object against its box type. A box object has the `type` of a box type of `IsoBoxMap` and every required field of that type. To write a box type that the package does not name, add the type to `IsoCustomBoxMap`. See [Writing a custom box](#writing-a-custom-box). The `boxes` field of a box type takes box objects and raw boxes. To put the bytes of a box in a `boxes` field, use a raw box, such as `{ boxType: "esds", bytes }`.

If you provide box objects, also provide a configuration object that names the writers for those box types. The key of the `writers` map is the exact four-character type. The keys `'url '` and `'urn '` have a trailing space. The keys `url` and `urn` also find the writers of those boxes.

A writer follows the `flags` and the `version` of the box. The writer writes a field only when the flags or the version select that field. A field that the flags or the version select must have a value.

A writer throws a `RangeError` for a value that its field cannot hold. A writer never writes other bytes in place of the value. The message has the function or the box field, the values that the field takes, and the received value. The rules:

- A number field takes an integer of its range. A fraction, `NaN`, a string, and `undefined` throw. `version` and `flags` follow the same rule.
- A fixed-point field, such as `width` of `tkhd`, rounds the value to the nearest value of the field. The rounded value must fit the field.
- A 64-bit field takes a `number` or a `bigint` of its range. [Writing 64-bit fields](#writing-64-bit-fields) states one exception.
- A four-character code has 4 characters, each at most U+00FF.
- A string field takes a string. A terminated string has no U+0000. `language` of `mdhd` has 3 characters from U+0060 to U+007F. `compressorName` has at most 31 bytes in UTF-8.
- A byte field takes a `Uint8Array` or an array of integers from 0 to 255. `systemId` and each `kid` of `pssh`, and `defaultKid` of `tenc`, have 16 bytes.
- Each part of a packed field fits its bits, such as `referencedSize` of a `sidx` reference with 31 bits.
- `fieldSize` of `stz2` is 4, 8, or 16.
- A list fits its count field. The limits are 65535 references in `sidx`, 65535 subsamples in one `subs` entry, and 255 bytes in `defaultConstantIv` of `tenc`.

A field with a default in the specification, such as `pre_defined`, is optional and writes that default. Two cases throw a `TypeError` of the JavaScript engine: a missing list field, such as `samples` of a `trun` box, and a `bigint` in a fixed-point field.

> [!NOTE]
> The function writes container boxes automatically, so they do not need a writer function. The `CONTAINERS` constant lists the container box types that the function writes automatically. Each container type also has a named writer, such as `writeMoov` and `writeMoof`. A container writer in the `writers` map is optional and does not change the written bytes.
>
> The function does not write a box of another type as a container, even if the box has a `boxes` field. Examples are `meta` and the sample entries. A raw box of such a type keeps its bytes. For any other box of such a type with no writer, the function throws `No writer found for box type`.

A write omits the bytes of a source box that the reader stops before. See [Incomplete boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#incomplete-boxes).

## Using default config

If tree shaking is not a concern, use `createDefaultWriterConfig()`. It returns a configuration with every available writer except the container writers:

```typescript
import { createDefaultWriterConfig, writeIsoBoxes, type IsoBoxStreamable } from "@svta/cml-iso-bmff";

const boxes: IsoBoxStreamable[] = [
	{
		type: "ftyp",
		majorBrand: "isom",
		minorVersion: 1,
		compatibleBrands: ["isom"],
	},
	{
		type: "mdat",
		data: new Uint8Array([
			102, 105, 114, 115, 116, 115, 101, 99, 111, 110, 100, 116, 104, 105, 114,
			100,
		]),
	},
];

const bytes = writeIsoBoxes(boxes, createDefaultWriterConfig());

sourceBuffer.appendBuffer(bytes);
```

Each call of `createDefaultWriterConfig()` returns a new configuration object. A player can create the configuration once and pass it to every write.

## Using specific writers

For optimal bundle size with tree shaking, import only the writers you need:

```typescript
import { writeFtyp, writeIsoBoxes, writeMdat, type IsoBoxStreamable } from "@svta/cml-iso-bmff";

const boxes: IsoBoxStreamable[] = [
	{
		type: "ftyp",
		majorBrand: "isom",
		minorVersion: 1,
		compatibleBrands: ["isom"],
	},
	new Uint8Array([
		0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
		0x00, 0x00, 0x00, 0x01, 0x69, 0x73, 0x6f, 0x6d,
	]),
	{
		type: "mdat",
		data: new Uint8Array([
			102, 105, 114, 115, 116, 115, 101, 99, 111, 110, 100, 116, 104, 105, 114,
			100,
		]),
	},
];

const bytes = writeIsoBoxes(boxes, {
	writers: {
		ftyp: writeFtyp,
		mdat: writeMdat,
	},
});

sourceBuffer.appendBuffer(bytes);
```

## Streaming boxes

The `createIsoBoxReadableStream` function writes boxes to a readable stream. It supports both the default config and specific writers. The stream writes one box for each read and writes no box before the first read. An error of a box rejects the read. The function needs `ReadableStream`. On a runtime without `ReadableStream`, the function throws an error.

```typescript
import {
	createIsoBoxReadableStream,
	createDefaultWriterConfig,
	type IsoBoxStreamable,
} from "@svta/cml-iso-bmff";

const boxes: IsoBoxStreamable[] = [
	{
		type: "ftyp",
		majorBrand: "isom",
		minorVersion: 1,
		compatibleBrands: ["isom"],
	},
	{
		type: "mdat",
		data: new Uint8Array([
			102, 105, 114, 115, 116, 115, 101, 99, 111, 110, 100, 116, 104, 105, 114,
			100,
		]),
	},
];

const readableStream = createIsoBoxReadableStream(boxes, createDefaultWriterConfig());

const stream = await transport.createBidirectionalStream();
readableStream.pipeTo(stream.writable);
```

## Writing a custom box

The `writers` map takes a writer under a key of `IsoBoxMap`. For a box type that the package does not name, add the type to `IsoCustomBoxMap` first. The write functions then check a box of that type, and `readIsoBoxes` has that box type too.

A writer takes a write cursor and a box object, and returns nothing. The writer writes the header with `beginIsoBox` or `beginIsoFullBox`, then the fields with the write field functions, then the size with `endIsoBox`. A writer does not compute the size of its box:

```typescript
import {
	beginIsoBox,
	endIsoBox,
	writeFourCc,
	writeIsoBox,
	writeUint16,
	writeUint32,
	type IsoBoxWriteCursor,
} from "@svta/cml-iso-bmff";

// A box type that the package does not name.
type AbcdBox = { type: "abcd"; brand: string; count: number; flags: number };

// Add the box type to the map of custom box types.
declare module "@svta/cml-iso-bmff" {
	interface IsoCustomBoxMap {
		abcd: AbcdBox;
	}
}

const writeAbcd = (cursor: IsoBoxWriteCursor, box: AbcdBox) => {
	const start = beginIsoBox(cursor, box.type);
	writeFourCc(cursor, box.brand);
	writeUint32(cursor, box.count);
	writeUint16(cursor, box.flags);
	endIsoBox(cursor, start);
};

const box: AbcdBox = { type: "abcd", brand: "isom", count: 1, flags: 0 };
const bytes = writeIsoBox(box, { writers: { abcd: writeAbcd } });
```

A writer of a box with child boxes writes them with `writeChildBoxes(cursor, box.boxes)`. The writers of the cursor then apply to the child boxes. A writer of a `uuid` box calls `beginIsoBox(cursor, "uuid")`, then writes the 16 bytes of `usertype` with `writeBytes`.

`writeFourCc`, `beginIsoBox`, and `beginIsoFullBox` throw a `RangeError` for a code that does not have 4 characters of 1 byte each. `endIsoBox` throws a `RangeError` for a box above 2^32 - 1 bytes.

## Writing with a cursor

`writeIsoBoxes` creates a write cursor, writes every box, and returns a copy of the written bytes with the exact size. Your code can also write on a cursor directly. The written bytes are `cursor.bytes.subarray(0, cursor.pos)`, with no copy:

```typescript
import {
	createIsoBoxWriteCursor,
	writeChildBoxes,
	writeMdat,
	writeMfhd,
} from "@svta/cml-iso-bmff";

const payload = new Uint8Array(1_000_000);

const cursor = createIsoBoxWriteCursor({
	capacity: payload.length + 1024,
	writers: { mfhd: writeMfhd, mdat: writeMdat },
});

writeChildBoxes(cursor, [
	{ type: "moof", boxes: [{ type: "mfhd", version: 0, flags: 0, sequenceNumber: 1 }] },
	{ type: "mdat", data: payload },
]);

const segment = cursor.bytes.subarray(0, cursor.pos);
```

The cursor doubles its buffer when a field does not fit. Each growth copies the written bytes. A `capacity` above the final size avoids the growth. The default capacity is 1024 bytes.

The growth replaces `cursor.view` and `cursor.bytes`. Write through the field functions, and read `cursor.bytes` after the last write.

## Writing 64-bit fields

The built-in writers take each 64-bit field as a `number` or as a `bigint`. A `number` holds integers up to 2^53 - 1 exactly, and a `bigint` holds the exact value. The guide [Reading 64-bit fields](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#reading-64-bit-fields) lists the fields.

A box that `readIsoBoxes` reads with `readInt64AsBigInt` has `bigint` fields. The writers write that box with no conversion, and the writer configuration needs no option:

```typescript
import {
	findIsoBox,
	isIsoBoxType,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
	writeIsoBoxes,
	writeTfdt,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: {
		tfdt: readTfdt,
	},
});

// A tfdt box is inside a traf box, inside a moof box.
const tfdt = findIsoBox(boxes, (box) => isIsoBoxType("tfdt", box));

if (tfdt) {
	tfdt.baseMediaDecodeTime += BigInt(90000);

	// Write the whole segment. A player cannot append a lone tfdt box.
	const bytes = writeIsoBoxes(boxes, { writers: { tfdt: writeTfdt } });
}
```

A box object can hold a `bigint` too:

```typescript
import { writeIsoBox, writeTfdt } from "@svta/cml-iso-bmff";

const bytes = writeIsoBox(
	{
		type: "tfdt",
		version: 1,
		flags: 0,
		baseMediaDecodeTime: BigInt("17900000000000000"),
	},
	{ writers: { tfdt: writeTfdt } },
);
```

A writer throws a `RangeError` for a `bigint` that does not fit the field. One example is a value above 2^32 - 1 in a version 0 box.

A writer also throws a `RangeError` for a `number` that is not an integer of the field range. One value is an exception: in an unsigned 64-bit field, the `number` 2^64 writes all bits set. The default reader returns 2^64 for a field with all bits set, so a read and then a write keep that field. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. See [Reporting a rounded value](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#reporting-a-rounded-value) for the read of that value.

A custom writer takes a write cursor and a box. The writer calls the field functions `writeWideUint` or `writeWideInt`. Both functions take the cursor, a `number` or a `bigint`, and the size of the field in bytes, 4 or 8:

```typescript
import {
	beginIsoFullBox,
	endIsoBox,
	writeIsoBox,
	writeWideUint,
	type IsoBoxWriteCursor,
	type IsoInt64,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from "@svta/cml-iso-bmff";

const writeTfdtWide = (
	cursor: IsoBoxWriteCursor,
	box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>,
) => {
	const start = beginIsoFullBox(cursor, "tfdt", box.version, box.flags);
	writeWideUint(cursor, box.baseMediaDecodeTime, box.version === 1 ? 8 : 4);
	endIsoBox(cursor, start);
};

const bytes = writeIsoBox(
	{ type: "tfdt", version: 1, flags: 0, baseMediaDecodeTime: BigInt("17900000000000000") },
	{ writers: { tfdt: writeTfdtWide } },
);
```

`writeUint64` writes a 64-bit field from a `bigint` only:

```typescript
import { beginIsoFullBox, createIsoBoxWriteCursor, endIsoBox, writeUint64 } from "@svta/cml-iso-bmff";

const cursor = createIsoBoxWriteCursor();
const start = beginIsoFullBox(cursor, "tfdt", 1, 0);

writeUint64(cursor, BigInt("17900000000000000"));
endIsoBox(cursor, start);

const tfdt = cursor.bytes.slice(0, cursor.pos);
```

## Writing a changed `mfra` box

The `mfraSize` field of an `mfro` box is the size in bytes of the enclosing `mfra` box. `writeMfro` writes the stored value, and `writeMfra` does not change it. After a change to the children of an `mfra` box, set `mfraSize` to the new size of the `mfra` box.

## Type safety

In TypeScript, give a box object a box type. Annotate the object with a box type from the package:

```typescript
import type { FileTypeBox } from "@svta/cml-iso-bmff";

const box: FileTypeBox = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```

Or get the same type from `IsoBoxMap` with the four-character type of the box:

```typescript
import type { IsoBoxMap } from "@svta/cml-iso-bmff";

const box: IsoBoxMap["ftyp"] = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```

The `satisfies` operator checks the object against the box type and keeps the literal types of the object:

```typescript
import type { FileTypeBox } from "@svta/cml-iso-bmff";

const box = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
} satisfies FileTypeBox;
```

<!-- libs/iso-bmff/config/cml-iso-bmff.api.md -->
## API Report File for "@svta/cml-iso-bmff"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public
export type AdditionalMetadataContainerBox<V extends IsoInt64 = number> = {
    type: "meco";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type AudioRenderingIndicationBox = FullBox & {
    type: "ardi";
    audioRenderingIndication: number;
};

// @public
export type AudioSampleEntry<T extends IsoBoxType = AudioSampleEntryType, V extends IsoInt64 = number> = SampleEntry<T, V> & {
    type: T;
    entryVersion?: number;
    channelCount: number;
    sampleSize: number;
    preDefined?: number;
    sampleRate: number;
};

// @public
export type AudioSampleEntryType = "mp4a" | "enca" | "ac-3" | "ac-4" | "ec-3" | "fLaC" | "Opus";

// @public
export function beginIsoBox(cursor: IsoBoxWriteCursor, type: string): number;

// @public
export function beginIsoFullBox(cursor: IsoBoxWriteCursor, type: string, version: number, flags: number): number;

// @public
export type Box<T extends IsoBoxType> = {
    type: T;
};

// @public
export type ChunkLargeOffsetBox<V extends IsoInt64 = number> = FullBox & {
    type: "co64";
    chunkOffset: V[];
};

// @public
export type ChunkOffsetBox = FullBox & {
    type: "stco";
    chunkOffset: number[];
};

// @public
export type CompactSampleSizeBox = FullBox & {
    type: "stz2";
    fieldSize: number;
    entrySize: number[];
};

// @public
export type CompositionOffsetBox = FullBox & {
    type: "ctts";
    entryCount?: number;
    entries: CompositionOffsetEntry[];
};

// @public
export type CompositionOffsetEntry = {
    sampleCount: number;
    sampleOffset: number;
};

// @public
export const CONTAINERS: readonly string[];

// @public
export function createAudioSampleEntryReader<T extends IsoBoxType>(type: T): <V extends IsoInt64>(cursor: IsoBoxReadCursor<V>) => AudioSampleEntry<T, V>;

// @public
export function createDefaultReaderConfig<V extends IsoInt64 = number>(options?: {
    int64?: IsoInt64Reader<V>;
}): IsoBoxReadConfig<V>;

// @public
export function createDefaultWriterConfig(): Required<IsoBoxWriteConfig>;

// @public
export function createInt64OverflowReader(onOverflow: (error: RangeError) => void): IsoInt64Reader;

// @public
export function createIsoBoxReadableStream(boxes: Iterable<IsoBoxStreamable>, config?: IsoBoxWriteConfig): ReadableStream<Uint8Array<ArrayBuffer>>;

// @public
export function createIsoBoxReadCursor<V extends IsoInt64 = number>(data: IsoBoxData, config?: IsoBoxReadConfig<V>): IsoBoxReadCursor<V>;

// @public
export function createIsoBoxWriteCursor(config?: {
    capacity?: number;
    writers?: IsoBoxWriterMap;
}): IsoBoxWriteCursor;

// @public
export function createVisualSampleEntryReader<T extends IsoBoxType>(type: T): <V extends IsoInt64>(cursor: IsoBoxReadCursor<V>) => VisualSampleEntry<T, V>;

// @public
export type DataEntryUrlBox = FullBox & {
    type: "url ";
    location?: string;
};

// @public
export type DataEntryUrnBox = FullBox & {
    type: "urn ";
    name: string;
    location?: string;
};

// @public
export type DataInformationBox<V extends IsoInt64 = number> = {
    type: "dinf";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type DataReferenceBox<V extends IsoInt64 = number> = FullBox & {
    type: "dref";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type EditBox<V extends IsoInt64 = number> = {
    type: "edts";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type EditListBox<V extends IsoInt64 = number> = FullBox & {
    type: "elst";
    entries: EditListEntry<V>[];
};

// @public
export type EditListEntry<V extends IsoInt64 = number> = {
    segmentDuration: V;
    mediaTime: V;
    mediaRateInteger: number;
    mediaRateFraction: number;
};

// @public
export function endIsoBox(cursor: IsoBoxWriteCursor, start: number): void;

// @public
export type EventMessageBox<V extends IsoInt64 = number> = FullBox & {
    type: "emsg";
    schemeIdUri: string;
    value: string;
    timescale: number;
    presentationTimeDelta?: number;
    presentationTime?: V;
    eventDuration: number;
    id: number;
    messageData: Uint8Array;
};

// @public
export type ExtendedLanguageBox = FullBox & {
    type: "elng";
    extendedLanguage: string;
};

// @public
export type FileTypeBox = TypeBox<"ftyp">;

// @public
export function filterIsoBoxes<T, S extends T>(boxes: Iterable<T>, callback: (box: T) => box is S, config?: TraverseIsoBoxesConfig): S[];

// @public
export function filterIsoBoxes<T>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T[];

// @public
export function findIsoBox<T, S extends T>(boxes: Iterable<T>, callback: (box: T) => box is S, config?: TraverseIsoBoxesConfig): S | null;

// @public
export function findIsoBox<T>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T | null;

// @public
export type FreeSpaceBox<T extends "free" | "skip" = "free"> = {
    type: T;
    data: Uint8Array;
};

// @public
export type FullBox = {
    version: number;
    flags: number;
};

// @public
export type GroupsListBox<V extends IsoInt64 = number> = {
    type: "grpl";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type HandlerBox = FullBox & {
    type: "hdlr";
    preDefined?: number;
    handlerType: string;
    reserved?: number[];
    name: string;
};

// @public
export type IdentifiedMediaDataBox = {
    type: "imda";
    imdaIdentifier: number;
    data: Uint8Array;
};

// @public
export function isContainer<T extends {
    type?: IsoBoxType;
}>(box: T): box is [Extract<T, {
    boxes: unknown;
} | {
    type: keyof IsoBoxContainerMap;
}>] extends [never] ? T & Extract<IsoBox<IsoInt64>, {
    boxes: unknown;
}> : Extract<T, {
    boxes: unknown;
} | {
    type: keyof IsoBoxContainerMap;
}>;

// @public
export function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64 = number>(type: T, box: IsoBox<V> | {
    type?: string;
} | null | undefined): box is IsoBoxMap<V>[T];

// @public
export function isIsoBoxType<T extends keyof IsoBoxMap>(type: T, box: unknown): box is IsoBoxMap[T];

// @public
export type IsoBox<V extends IsoInt64 = number> = IsoBoxMap<V>[keyof IsoBoxMap<V>];

// @public
export type IsoBoxContainer<V extends IsoInt64 = number> = IsoBoxContainerMap<V>[keyof IsoBoxContainerMap<V>];

// @public
export type IsoBoxContainerMap<V extends IsoInt64 = number> = {
    dinf: DataInformationBox<V>;
    edts: EditBox<V>;
    grpl: GroupsListBox<V>;
    ludt: LoudnessBox<V>;
    mdia: MediaBox<V>;
    meco: AdditionalMetadataContainerBox<V>;
    mfra: MovieFragmentRandomAccessBox<V>;
    minf: MediaInformationBox<V>;
    moof: MovieFragmentBox<V>;
    moov: MovieBox<V>;
    mvex: MovieExtendsBox<V>;
    rinf: RestrictedSchemeInfoBox<V>;
    schi: SchemeInformationBox<V>;
    sinf: ProtectionSchemeInfoBox<V>;
    stbl: SampleTableBox<V>;
    strd: SubTrackDefinition<V>;
    strk: SubTrack<V>;
    traf: TrackFragmentBox<V>;
    trak: TrackBox<V>;
    tref: TrackReferenceBox<V>;
    trgr: TrackGroupBox<V>;
    udta: UserDataBox<V>;
    vttc: WebVttCueBox<V>;
};

// @public
export type IsoBoxData = ArrayBufferLike | ArrayBufferView;

// @public
export type IsoBoxMap<V extends IsoInt64 = number> = IsoBuiltInBoxMap<V> & IsoCustomBoxMap;

// @public
export type IsoBoxReadConfig<V extends IsoInt64 = number> = {
    readers?: NoInfer<IsoBoxReaderMap<V>>;
} & ([V] extends [bigint] ? {
    int64: IsoInt64Reader<V>;
} : {
    int64?: IsoInt64Reader<V>;
});

// @public
export type IsoBoxReadCursor<V extends IsoInt64 = number> = {
    readonly view: DataView;
    readonly start: number;
    pos: number;
    readonly end: number;
    readonly readers?: Record<IsoBoxType, {
        r(cursor: IsoBoxReadCursor<V>, type: IsoBoxType): {
            type: IsoBoxType;
        };
    }["r"]>;
} & ([V] extends [bigint] ? {
    readonly int64: IsoInt64Reader<V>;
} : {
    readonly int64?: IsoInt64Reader<V>;
});

// @public
export type IsoBoxReader<B extends {
    type: IsoBoxType;
} = {
    type: IsoBoxType;
}, V extends IsoInt64 = number> = (cursor: IsoBoxReadCursor<V>, type: B["type"]) => B;

// @public
export type IsoBoxReaderMap<V extends IsoInt64 = number> = { [K in keyof IsoBoxMap]?: IsoBoxReader<IsoBoxMap<V>[K], V>; } & {
    url?: IsoBoxReader<IsoBoxMap<V>["url "], V>;
    urn?: IsoBoxReader<IsoBoxMap<V>["urn "], V>;
};

// @public
export type IsoBoxStreamable = IsoBox<IsoInt64> | IsoRawBox | ArrayBufferView;

// @public
export type IsoBoxType = string;

// @public
export type IsoBoxWriteConfig = {
    writers?: IsoBoxWriterMap;
};

// @public
export type IsoBoxWriteCursor = {
    readonly view: DataView;
    readonly bytes: Uint8Array<ArrayBuffer>;
    pos: number;
    readonly writers?: IsoBoxWriterMap;
};

// @public
export type IsoBoxWriter<B> = (cursor: IsoBoxWriteCursor, box: B) => void;

// @public
export type IsoBoxWriterMap = { [K in keyof IsoBoxMap]?: IsoBoxWriter<IsoBoxMap<IsoInt64>[K]>; } & {
    url?: IsoBoxWriter<IsoBoxMap<IsoInt64>["url "]>;
    urn?: IsoBoxWriter<IsoBoxMap<IsoInt64>["urn "]>;
};

// @public
export type IsoBuiltInBoxMap<V extends IsoInt64 = number> = {
    "ac-3": AudioSampleEntry<"ac-3", V>;
    "ac-4": AudioSampleEntry<"ac-4", V>;
    ardi: AudioRenderingIndicationBox;
    av01: VisualSampleEntry<"av01", V>;
    avc1: VisualSampleEntry<"avc1", V>;
    avc2: VisualSampleEntry<"avc2", V>;
    avc3: VisualSampleEntry<"avc3", V>;
    avc4: VisualSampleEntry<"avc4", V>;
    co64: ChunkLargeOffsetBox<V>;
    ctts: CompositionOffsetBox;
    dinf: DataInformationBox<V>;
    dref: DataReferenceBox<V>;
    edts: EditBox<V>;
    dav1: VisualSampleEntry<"dav1", V>;
    dva1: VisualSampleEntry<"dva1", V>;
    dvav: VisualSampleEntry<"dvav", V>;
    dvh1: VisualSampleEntry<"dvh1", V>;
    dvhe: VisualSampleEntry<"dvhe", V>;
    "ec-3": AudioSampleEntry<"ec-3", V>;
    elng: ExtendedLanguageBox;
    elst: EditListBox<V>;
    emsg: EventMessageBox<V>;
    enca: AudioSampleEntry<"enca", V>;
    encv: VisualSampleEntry<"encv", V>;
    fLaC: AudioSampleEntry<"fLaC", V>;
    free: FreeSpaceBox<"free">;
    frma: OriginalFormatBox;
    ftyp: FileTypeBox;
    grpl: GroupsListBox<V>;
    hdlr: HandlerBox;
    hev1: VisualSampleEntry<"hev1", V>;
    hvc1: VisualSampleEntry<"hvc1", V>;
    iden: WebVttCueIdBox;
    imda: IdentifiedMediaDataBox;
    kind: KindBox;
    labl: LabelBox;
    ludt: LoudnessBox<V>;
    mdat: MediaDataBox;
    mdhd: MediaHeaderBox<V>;
    mdia: MediaBox<V>;
    meco: AdditionalMetadataContainerBox<V>;
    mehd: MovieExtendsHeaderBox<V>;
    meta: MetaBox<V>;
    mfhd: MovieFragmentHeaderBox;
    mfra: MovieFragmentRandomAccessBox<V>;
    mfro: MovieFragmentRandomAccessOffsetBox;
    minf: MediaInformationBox<V>;
    moof: MovieFragmentBox<V>;
    moov: MovieBox<V>;
    mp4a: AudioSampleEntry<"mp4a", V>;
    mvex: MovieExtendsBox<V>;
    mvhd: MovieHeaderBox<V>;
    Opus: AudioSampleEntry<"Opus", V>;
    payl: WebVttCuePayloadBox;
    prft: ProducerReferenceTimeBox<V>;
    prsl: PreselectionGroupBox<V>;
    pssh: ProtectionSystemSpecificHeaderBox;
    rinf: RestrictedSchemeInfoBox<V>;
    schi: SchemeInformationBox<V>;
    schm: SchemeTypeBox;
    sdtp: SampleDependencyTypeBox;
    sidx: SegmentIndexBox<V>;
    sinf: ProtectionSchemeInfoBox<V>;
    skip: FreeSpaceBox<"skip">;
    smhd: SoundMediaHeaderBox;
    ssix: SubsegmentIndexBox;
    stbl: SampleTableBox<V>;
    stco: ChunkOffsetBox;
    sthd: SubtitleMediaHeaderBox;
    strd: SubTrackDefinition<V>;
    strk: SubTrack<V>;
    stsc: SampleToChunkBox;
    stsd: SampleDescriptionBox<V>;
    stss: SyncSampleBox;
    stsz: SampleSizeBox;
    sttg: WebVttSettingsBox;
    stts: TimeToSampleBox;
    styp: SegmentTypeBox;
    subs: SubSampleInformationBox;
    stz2: CompactSampleSizeBox;
    tenc: TrackEncryptionBox;
    tfdt: TrackFragmentBaseMediaDecodeTimeBox<V>;
    tfhd: TrackFragmentHeaderBox<V>;
    tfra: TrackFragmentRandomAccessBox<V>;
    tkhd: TrackHeaderBox<V>;
    traf: TrackFragmentBox<V>;
    trak: TrackBox<V>;
    tref: TrackReferenceBox<V>;
    trex: TrackExtendsBox;
    trgr: TrackGroupBox<V>;
    trun: TrackRunBox;
    udta: UserDataBox<V>;
    "url ": DataEntryUrlBox;
    "urn ": DataEntryUrnBox;
    vlab: WebVttSourceLabelBox;
    vmhd: VideoMediaHeaderBox;
    vp09: VisualSampleEntry<"vp09", V>;
    vttc: WebVttCueBox<V>;
    vttC: WebVttConfigurationBox;
    vtte: WebVttEmptySampleBox;
};

// @public
export interface IsoCustomBoxMap {}

// @public
export type IsoInt64 = number | bigint;

// @public
export type IsoInt64Reader<V extends IsoInt64 = number> = (cursor: IsoBoxReadCursor<IsoInt64>, size: 4 | 8, signed: boolean) => V;

// @public
export type IsoRawBox = {
    type?: undefined;
    boxType: IsoBoxType;
    bytes: Uint8Array;
    headerSize?: number;
    userType?: Uint8Array;
};

// @public
export type KindBox = FullBox & {
    type: "kind";
    schemeUri: string;
    value: string;
};

// @public
export type LabelBox = FullBox & {
    type: "labl";
    flags: number;
    labelId: number;
    language: string;
    label: string;
};

// @public
export type LoudnessBox<V extends IsoInt64 = number> = {
    type: "ludt";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MediaBox<V extends IsoInt64 = number> = {
    type: "mdia";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MediaDataBox = {
    type: "mdat";
    data: Uint8Array;
};

// @public
export type MediaHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mdhd";
    creationTime: V;
    modificationTime: V;
    timescale: number;
    duration: V;
    language: string;
    preDefined?: number;
};

// @public
export type MediaInformationBox<V extends IsoInt64 = number> = {
    type: "minf";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MetaBox<V extends IsoInt64 = number> = FullBox & {
    type: "meta";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MovieBox<V extends IsoInt64 = number> = {
    type: "moov";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MovieExtendsBox<V extends IsoInt64 = number> = {
    type: "mvex";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MovieExtendsHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mehd";
    fragmentDuration: V;
};

// @public
export type MovieFragmentBox<V extends IsoInt64 = number> = {
    type: "moof";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MovieFragmentHeaderBox = FullBox & {
    type: "mfhd";
    sequenceNumber: number;
};

// @public
export type MovieFragmentRandomAccessBox<V extends IsoInt64 = number> = {
    type: "mfra";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
    type: "mfro";
    mfraSize: number;
};

// @public
export type MovieHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mvhd";
    creationTime: V;
    modificationTime: V;
    timescale: number;
    duration: V;
    rate: number;
    volume: number;
    matrix: [a: number, b: number, u: number, c: number, d: number, v: number, x: number, y: number, w: number];
    preDefined?: number[];
    nextTrackId: number;
};

// @public
export function nextIsoBox(cursor: IsoBoxReadCursor<IsoInt64>): IsoBoxType | null;

// @public
export type OriginalFormatBox = {
    type: "frma";
    dataFormat: string;
};

// @public
export type ParsedIsoBox<V extends IsoInt64 = number> = IsoBox<V> | IsoRawBox;

// @public
export type PreselectionGroupBox<V extends IsoInt64 = number> = FullBox & {
    type: "prsl";
    groupId: number;
    entityId: number[];
    preselectionTag?: string;
    selectionPriority?: number;
    interleavingTag?: string;
    boxes: ParsedIsoBox<V>[];
};

// @public
export type ProducerReferenceTimeBox<V extends IsoInt64 = number> = FullBox & {
    type: "prft";
    referenceTrackId: number;
    ntpTimestampSec: number;
    ntpTimestampFrac: number;
    mediaTime: V;
};

// @public
export type ProtectionSchemeInfoBox<V extends IsoInt64 = number> = {
    type: "sinf";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type ProtectionSystemSpecificHeaderBox = FullBox & {
    type: "pssh";
    systemId: Uint8Array;
    kid: Uint8Array[];
    data: Uint8Array;
};

// @public
export function readArdi(cursor: IsoBoxReadCursor<IsoInt64>): AudioRenderingIndicationBox;

// @public
export function readAvc1<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"avc1", V>;

// @public
export function readAvc2<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"avc2", V>;

// @public
export function readAvc3<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"avc3", V>;

// @public
export function readAvc4<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"avc4", V>;

// @public
export function readBytes(cursor: IsoBoxReadCursor<IsoInt64>, length: number): Uint8Array;

// @public
export function readChildBoxes<V extends IsoInt64 = number>(cursor: IsoBoxReadCursor<V>, count?: number): ParsedIsoBox<V>[];

// @public
export function readCo64<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): ChunkLargeOffsetBox<V>;

// @public
export function readCtts(cursor: IsoBoxReadCursor<IsoInt64>): CompositionOffsetBox;

// @public
export function readDinf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): DataInformationBox<V>;

// @public
export function readDref<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): DataReferenceBox<V>;

// @public
export function readEdts<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditBox<V>;

// @public
export function readElng(cursor: IsoBoxReadCursor<IsoInt64>): ExtendedLanguageBox;

// @public
export function readElst<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditListBox<V>;

// @public
export function readEmsg<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EventMessageBox<V>;

// @public
export function readEnca<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): AudioSampleEntry<"enca", V>;

// @public
export function readEncv<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"encv", V>;

// @public
export function readFourCc(cursor: IsoBoxReadCursor<IsoInt64>): string;

// @public
export function readFree(cursor: IsoBoxReadCursor<IsoInt64>): FreeSpaceBox;

// @public
export function readFrma(cursor: IsoBoxReadCursor<IsoInt64>): OriginalFormatBox;

// @public
export function readFtyp(cursor: IsoBoxReadCursor<IsoInt64>): FileTypeBox;

// @public
export function readGrpl<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): GroupsListBox<V>;

// @public
export function readHdlr(cursor: IsoBoxReadCursor<IsoInt64>): HandlerBox;

// @public
export function readHev1<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"hev1", V>;

// @public
export function readHvc1<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): VisualSampleEntry<"hvc1", V>;

// @public
export function readIden(cursor: IsoBoxReadCursor<IsoInt64>): WebVttCueIdBox;

// @public
export function readImda(cursor: IsoBoxReadCursor<IsoInt64>): IdentifiedMediaDataBox;

// @public
export function readInt16(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readInt32(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readInt64AsBigInt(cursor: IsoBoxReadCursor<IsoInt64>, size: 4 | 8, signed: boolean): bigint;

// @public
export function readInt8(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readIsoBoxes<V extends IsoInt64 = number>(raw: IsoBoxData, config?: IsoBoxReadConfig<V>): ParsedIsoBox<V>[];

// @public
export function readKind(cursor: IsoBoxReadCursor<IsoInt64>): KindBox;

// @public
export function readLabl(cursor: IsoBoxReadCursor<IsoInt64>): LabelBox;

// @public
export function readLudt<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): LoudnessBox<V>;

// @public
export function readMdat(cursor: IsoBoxReadCursor<IsoInt64>): MediaDataBox;

// @public
export function readMdhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MediaHeaderBox<V>;

// @public
export function readMdia<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MediaBox<V>;

// @public
export function readMeco<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): AdditionalMetadataContainerBox<V>;

// @public
export function readMehd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieExtendsHeaderBox<V>;

// @public
export function readMeta<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MetaBox<V>;

// @public
export function readMfhd(cursor: IsoBoxReadCursor<IsoInt64>): MovieFragmentHeaderBox;

// @public
export function readMfra<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieFragmentRandomAccessBox<V>;

// @public
export function readMfro(cursor: IsoBoxReadCursor<IsoInt64>): MovieFragmentRandomAccessOffsetBox;

// @public
export function readMinf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MediaInformationBox<V>;

// @public
export function readMoof<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieFragmentBox<V>;

// @public
export function readMoov<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieBox<V>;

// @public
export function readMp4a<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): AudioSampleEntry<"mp4a", V>;

// @public
export function readMvex<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieExtendsBox<V>;

// @public
export function readMvhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieHeaderBox<V>;

// @public
export function readPayl(cursor: IsoBoxReadCursor<IsoInt64>): WebVttCuePayloadBox;

// @public
export function readPrft<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): ProducerReferenceTimeBox<V>;

// @public
export function readPrsl<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): PreselectionGroupBox<V>;

// @public
export function readPssh(cursor: IsoBoxReadCursor<IsoInt64>): ProtectionSystemSpecificHeaderBox;

// @public
export function readRinf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): RestrictedSchemeInfoBox<V>;

// @public
export function readSchi<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SchemeInformationBox<V>;

// @public
export function readSchm(cursor: IsoBoxReadCursor<IsoInt64>): SchemeTypeBox;

// @public
export function readSdtp(cursor: IsoBoxReadCursor<IsoInt64>): SampleDependencyTypeBox;

// @public
export function readSidx<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SegmentIndexBox<V>;

// @public
export function readSinf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): ProtectionSchemeInfoBox<V>;

// @public
export function readSkip(cursor: IsoBoxReadCursor<IsoInt64>): FreeSpaceBox<"skip">;

// @public
export function readSmhd(cursor: IsoBoxReadCursor<IsoInt64>): SoundMediaHeaderBox;

// @public
export function readSsix(cursor: IsoBoxReadCursor<IsoInt64>): SubsegmentIndexBox;

// @public
export function readStbl<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SampleTableBox<V>;

// @public
export function readStco(cursor: IsoBoxReadCursor<IsoInt64>): ChunkOffsetBox;

// @public
export function readSthd(cursor: IsoBoxReadCursor<IsoInt64>): SubtitleMediaHeaderBox;

// @public
export function readStrd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SubTrackDefinition<V>;

// @public
export function readStrk<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SubTrack<V>;

// @public
export function readStsc(cursor: IsoBoxReadCursor<IsoInt64>): SampleToChunkBox;

// @public
export function readStsd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SampleDescriptionBox<V>;

// @public
export function readStss(cursor: IsoBoxReadCursor<IsoInt64>): SyncSampleBox;

// @public
export function readStsz(cursor: IsoBoxReadCursor<IsoInt64>): SampleSizeBox;

// @public
export function readSttg(cursor: IsoBoxReadCursor<IsoInt64>): WebVttSettingsBox;

// @public
export function readStts(cursor: IsoBoxReadCursor<IsoInt64>): TimeToSampleBox;

// @public
export function readStyp(cursor: IsoBoxReadCursor<IsoInt64>): SegmentTypeBox;

// @public
export function readStz2(cursor: IsoBoxReadCursor<IsoInt64>): CompactSampleSizeBox;

// @public
export function readSubs(cursor: IsoBoxReadCursor<IsoInt64>): SubSampleInformationBox;

// @public
export function readTemplate16(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readTemplate32(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readTenc(cursor: IsoBoxReadCursor<IsoInt64>): TrackEncryptionBox;

// @public
export function readTerminatedUtf8(cursor: IsoBoxReadCursor<IsoInt64>): string;

// @public
export function readTfdt<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackFragmentBaseMediaDecodeTimeBox<V>;

// @public
export function readTfhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackFragmentHeaderBox<V>;

// @public
export function readTfra<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackFragmentRandomAccessBox<V>;

// @public
export function readTkhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackHeaderBox<V>;

// @public
export function readTraf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackFragmentBox<V>;

// @public
export function readTrak<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackBox<V>;

// @public
export function readTref<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackReferenceBox<V>;

// @public
export function readTrex(cursor: IsoBoxReadCursor<IsoInt64>): TrackExtendsBox;

// @public
export function readTrgr<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackGroupBox<V>;

// @public
export function readTrun(cursor: IsoBoxReadCursor<IsoInt64>): TrackRunBox;

// @public
export function readUdta<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): UserDataBox<V>;

// @public
export function readUint16(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readUint24(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readUint32(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readUint64(cursor: IsoBoxReadCursor<IsoInt64>): bigint;

// @public
export function readUint8(cursor: IsoBoxReadCursor<IsoInt64>): number;

// @public
export function readUrl(cursor: IsoBoxReadCursor<IsoInt64>): DataEntryUrlBox;

// @public
export function readUrn(cursor: IsoBoxReadCursor<IsoInt64>): DataEntryUrnBox;

// @public
export function readUtf8(cursor: IsoBoxReadCursor<IsoInt64>, length: number): string;

// @public
export function readVlab(cursor: IsoBoxReadCursor<IsoInt64>): WebVttSourceLabelBox;

// @public
export function readVmhd(cursor: IsoBoxReadCursor<IsoInt64>): VideoMediaHeaderBox;

// @public
export function readVttC(cursor: IsoBoxReadCursor<IsoInt64>): WebVttConfigurationBox;

// @public
export function readVttc<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): WebVttCueBox<V>;

// @public
export function readVtte(_cursor: IsoBoxReadCursor<IsoInt64>): WebVttEmptySampleBox;

// @public
export function readWideInt<V extends IsoInt64 = number>(cursor: IsoBoxReadCursor<V>, size: 4 | 8): V;

// @public
export function readWideUint<V extends IsoInt64 = number>(cursor: IsoBoxReadCursor<V>, size: 4 | 8): V;

// @public
export type RestrictedSchemeInfoBox<V extends IsoInt64 = number> = {
    type: "rinf";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type SampleDependencyTypeBox = FullBox & {
    type: "sdtp";
    sampleDependencyTable: Uint8Array;
};

// @public
export type SampleDescriptionBox<V extends IsoInt64 = number, E extends SampleEntry<IsoBoxType, V> | IsoRawBox = AudioSampleEntry<AudioSampleEntryType, V> | VisualSampleEntry<VisualSampleEntryType, V> | IsoRawBox> = FullBox & {
    type: "stsd";
    boxes: E[];
};

// @public
export type SampleEntry<T extends IsoBoxType = IsoBoxType, V extends IsoInt64 = number> = {
    type: T;
    dataReferenceIndex: number;
    boxes: ParsedIsoBox<V>[];
};

// @public
export type SampleSizeBox = FullBox & {
    type: "stsz";
    sampleSize: number;
    sampleCount?: number;
    entrySize?: number[];
};

// @public
export type SampleTableBox<V extends IsoInt64 = number> = {
    type: "stbl";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type SampleToChunkBox = FullBox & {
    type: "stsc";
    entries: SampleToChunkEntry[];
};

// @public
export type SampleToChunkEntry = {
    firstChunk: number;
    samplesPerChunk: number;
    sampleDescriptionIndex: number;
};

// @public
export type SchemeInformationBox<V extends IsoInt64 = number> = {
    type: "schi";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type SchemeTypeBox = FullBox & {
    type: "schm";
    schemeType: string;
    schemeVersion: number;
    schemeUri?: string;
};

// @public
export function seekIsoBox<V extends IsoInt64 = number>(data: IsoBoxReadCursor<V>, path: readonly IsoBoxType[]): IsoBoxReadCursor<V> | null;

// @public
export function seekIsoBox<V extends IsoInt64 = number>(data: IsoBoxData, path: readonly IsoBoxType[], config?: IsoBoxReadConfig<V>): IsoBoxReadCursor<V> | null;

// @public
export type SegmentIndexBox<V extends IsoInt64 = number> = FullBox & {
    type: "sidx";
    referenceId: number;
    timescale: number;
    earliestPresentationTime: V;
    firstOffset: V;
    references: SegmentIndexReference[];
};

// @public
export type SegmentIndexReference = {
    subsegmentDuration: number;
    referenceType: number;
    referencedSize: number;
    startsWithSap: number;
    sapType: number;
    sapDeltaTime: number;
};

// @public
export type SegmentTypeBox = TypeBox<"styp">;

// @public
export type SoundMediaHeaderBox = FullBox & {
    type: "smhd";
    balance: number;
};

// @public
export type SubSampleInformationBox = FullBox & {
    type: "subs";
    entries: SubSampleInformationEntry[];
};

// @public
export type SubSampleInformationEntry = {
    sampleDelta: number;
    subsamples: SubSampleInformationSubsample[];
};

// @public
export type SubSampleInformationSubsample = {
    subsampleSize: number;
    subsamplePriority: number;
    discardable: number;
    codecSpecificParameters: number;
};

// @public
export type SubsegmentIndexBox = FullBox & {
    type: "ssix";
    subsegments: SubsegmentIndexSubsegment[];
};

// @public
export type SubsegmentIndexRange = {
    level: number;
    rangeSize: number;
};

// @public
export type SubsegmentIndexSubsegment = {
    ranges: SubsegmentIndexRange[];
};

// @public
export type SubtitleMediaHeaderBox = FullBox & {
    type: "sthd";
};

// @public
export type SubTrack<V extends IsoInt64 = number> = {
    type: "strk";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type SubTrackDefinition<V extends IsoInt64 = number> = {
    type: "strd";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type SyncSampleBox = FullBox & {
    type: "stss";
    sampleNumber: number[];
};

// @public
export type TimeToSampleBox = FullBox & {
    type: "stts";
    entries: TimeToSampleEntry[];
};

// @public
export type TimeToSampleEntry = {
    sampleCount: number;
    sampleDelta: number;
};

// @public
export type TrackBox<V extends IsoInt64 = number> = {
    type: "trak";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type TrackEncryptionBox = FullBox & {
    type: "tenc";
    defaultPerSampleIvSize: number;
    defaultKid: Uint8Array;
    defaultIsProtected: number;
    defaultCryptByteBlock?: number;
    defaultSkipByteBlock?: number;
    defaultConstantIv?: Uint8Array;
};

// @public
export type TrackExtendsBox = FullBox & {
    type: "trex";
    trackId: number;
    defaultSampleDescriptionIndex: number;
    defaultSampleDuration: number;
    defaultSampleSize: number;
    defaultSampleFlags: number;
};

// @public
export type TrackFragmentBaseMediaDecodeTimeBox<V extends IsoInt64 = number> = FullBox & {
    type: "tfdt";
    baseMediaDecodeTime: V;
};

// @public
export type TrackFragmentBox<V extends IsoInt64 = number> = {
    type: "traf";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type TrackFragmentHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "tfhd";
    trackId: number;
    baseDataOffset?: V;
    sampleDescriptionIndex?: number;
    defaultSampleDuration?: number;
    defaultSampleSize?: number;
    defaultSampleFlags?: number;
};

// @public
export type TrackFragmentRandomAccessBox<V extends IsoInt64 = number> = FullBox & {
    type: "tfra";
    trackId: number;
    lengthSizeOfTrafNum: number;
    lengthSizeOfTrunNum: number;
    lengthSizeOfSampleNum: number;
    entries: TrackFragmentRandomAccessEntry<V>[];
};

// @public
export type TrackFragmentRandomAccessEntry<V extends IsoInt64 = number> = {
    time: V;
    moofOffset: V;
    trafNumber: number;
    trunNumber: number;
    sampleNumber: number;
};

// @public
export type TrackGroupBox<V extends IsoInt64 = number> = {
    type: "trgr";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type TrackHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "tkhd";
    creationTime: V;
    modificationTime: V;
    trackId: number;
    duration: V;
    layer: number;
    alternateGroup: number;
    volume: number;
    matrix: [a: number, b: number, u: number, c: number, d: number, v: number, x: number, y: number, w: number];
    width: number;
    height: number;
};

// @public
export type TrackReferenceBox<V extends IsoInt64 = number> = {
    type: "tref";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type TrackRunBox = FullBox & {
    type: "trun";
    dataOffset?: number;
    firstSampleFlags?: number;
    samples: TrackRunSample[];
};

// @public
export type TrackRunSample = {
    sampleDuration?: number;
    sampleSize?: number;
    sampleFlags?: number;
    sampleCompositionTimeOffset?: number;
};

// @public
export function traverseIsoBoxes<T>(boxes: Iterable<T>, config?: TraverseIsoBoxesConfig): Generator<T>;

// @public
export type TraverseIsoBoxesConfig = {
    depthFirst?: boolean;
    maxDepth?: number;
};

// @public
export type TypeBox<T extends "ftyp" | "styp"> = {
    type: T;
    majorBrand: string;
    minorVersion: number;
    compatibleBrands: string[];
};

// @public
export type UserDataBox<V extends IsoInt64 = number> = {
    type: "udta";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type VideoMediaHeaderBox = FullBox & {
    type: "vmhd";
    graphicsMode: number;
    opColor: [red: number, green: number, blue: number];
};

// @public
export type VisualSampleEntry<T extends IsoBoxType = VisualSampleEntryType, V extends IsoInt64 = number> = SampleEntry<T, V> & {
    type: T;
    preDefined1?: number;
    preDefined2?: number[];
    width: number;
    height: number;
    horizResolution: number;
    vertResolution: number;
    frameCount: number;
    compressorName: string;
    depth: number;
    preDefined3?: number;
};

// @public
export type VisualSampleEntryType = "avc1" | "avc2" | "avc3" | "avc4" | "hev1" | "hvc1" | "encv" | "av01" | "dav1" | "dva1" | "dvav" | "dvh1" | "dvhe" | "vp09";

// @public
export type WebVttConfigurationBox = {
    type: "vttC";
    config: string;
};

// @public
export type WebVttCueBox<V extends IsoInt64 = number> = {
    type: "vttc";
    boxes: ParsedIsoBox<V>[];
};

// @public
export type WebVttCueIdBox = {
    type: "iden";
    cueId: string;
};

// @public
export type WebVttCuePayloadBox = {
    type: "payl";
    cueText: string;
};

// @public
export type WebVttEmptySampleBox = {
    type: "vtte";
};

// @public
export type WebVttSettingsBox = {
    type: "sttg";
    settings: string;
};

// @public
export type WebVttSourceLabelBox = {
    type: "vlab";
    sourceLabel: string;
};

// @public
export function writeArdi(cursor: IsoBoxWriteCursor, box: AudioRenderingIndicationBox): void;

// @public
export function writeAudioSampleEntry<T extends IsoBoxType = AudioSampleEntryType>(cursor: IsoBoxWriteCursor, box: AudioSampleEntry<T, IsoInt64>): void;

// @public
export function writeAvc1(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"avc1", IsoInt64>): void;

// @public
export function writeAvc2(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"avc2", IsoInt64>): void;

// @public
export function writeAvc3(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"avc3", IsoInt64>): void;

// @public
export function writeAvc4(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"avc4", IsoInt64>): void;

// @public
export function writeBytes(cursor: IsoBoxWriteCursor, data: ArrayLike<number>): void;

// @public
export function writeChildBoxes(cursor: IsoBoxWriteCursor, boxes: Iterable<IsoBoxStreamable>): void;

// @public
export function writeCo64(cursor: IsoBoxWriteCursor, box: ChunkLargeOffsetBox<IsoInt64>): void;

// @public
export function writeCtts(cursor: IsoBoxWriteCursor, box: CompositionOffsetBox): void;

// @public
export function writeDinf(cursor: IsoBoxWriteCursor, box: DataInformationBox<IsoInt64>): void;

// @public
export function writeDref(cursor: IsoBoxWriteCursor, box: DataReferenceBox<IsoInt64>): void;

// @public
export function writeEdts(cursor: IsoBoxWriteCursor, box: EditBox<IsoInt64>): void;

// @public
export function writeElng(cursor: IsoBoxWriteCursor, box: ExtendedLanguageBox): void;

// @public
export function writeElst(cursor: IsoBoxWriteCursor, box: EditListBox<IsoInt64>): void;

// @public
export function writeEmsg(cursor: IsoBoxWriteCursor, box: EventMessageBox<IsoInt64>): void;

// @public
export function writeEnca(cursor: IsoBoxWriteCursor, box: AudioSampleEntry<"enca", IsoInt64>): void;

// @public
export function writeEncv(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"encv", IsoInt64>): void;

// @public
export function writeFourCc(cursor: IsoBoxWriteCursor, value: string): void;

// @public
export function writeFree(cursor: IsoBoxWriteCursor, box: FreeSpaceBox<"free">): void;

// @public
export function writeFrma(cursor: IsoBoxWriteCursor, box: OriginalFormatBox): void;

// @public
export function writeFtyp(cursor: IsoBoxWriteCursor, box: FileTypeBox): void;

// @public
export function writeGrpl(cursor: IsoBoxWriteCursor, box: GroupsListBox<IsoInt64>): void;

// @public
export function writeHdlr(cursor: IsoBoxWriteCursor, box: HandlerBox): void;

// @public
export function writeHev1(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"hev1", IsoInt64>): void;

// @public
export function writeHvc1(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<"hvc1", IsoInt64>): void;

// @public
export function writeIden(cursor: IsoBoxWriteCursor, box: WebVttCueIdBox): void;

// @public
export function writeImda(cursor: IsoBoxWriteCursor, box: IdentifiedMediaDataBox): void;

// @public
export function writeInt16(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeInt32(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeInt8(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeIsoBox(box: IsoBoxStreamable, config?: IsoBoxWriteConfig): Uint8Array<ArrayBuffer>;

// @public
export function writeIsoBoxes(boxes: Iterable<IsoBoxStreamable>, config?: IsoBoxWriteConfig): Uint8Array<ArrayBuffer>;

// @public
export function writeKind(cursor: IsoBoxWriteCursor, box: KindBox): void;

// @public
export function writeLabl(cursor: IsoBoxWriteCursor, box: LabelBox): void;

// @public
export function writeLudt(cursor: IsoBoxWriteCursor, box: LoudnessBox<IsoInt64>): void;

// @public
export function writeMdat(cursor: IsoBoxWriteCursor, box: MediaDataBox): void;

// @public
export function writeMdhd(cursor: IsoBoxWriteCursor, box: MediaHeaderBox<IsoInt64>): void;

// @public
export function writeMdia(cursor: IsoBoxWriteCursor, box: MediaBox<IsoInt64>): void;

// @public
export function writeMeco(cursor: IsoBoxWriteCursor, box: AdditionalMetadataContainerBox<IsoInt64>): void;

// @public
export function writeMehd(cursor: IsoBoxWriteCursor, box: MovieExtendsHeaderBox<IsoInt64>): void;

// @public
export function writeMeta(cursor: IsoBoxWriteCursor, box: MetaBox<IsoInt64>): void;

// @public
export function writeMfhd(cursor: IsoBoxWriteCursor, box: MovieFragmentHeaderBox): void;

// @public
export function writeMfra(cursor: IsoBoxWriteCursor, box: MovieFragmentRandomAccessBox<IsoInt64>): void;

// @public
export function writeMfro(cursor: IsoBoxWriteCursor, box: MovieFragmentRandomAccessOffsetBox): void;

// @public
export function writeMinf(cursor: IsoBoxWriteCursor, box: MediaInformationBox<IsoInt64>): void;

// @public
export function writeMoof(cursor: IsoBoxWriteCursor, box: MovieFragmentBox<IsoInt64>): void;

// @public
export function writeMoov(cursor: IsoBoxWriteCursor, box: MovieBox<IsoInt64>): void;

// @public
export function writeMp4a(cursor: IsoBoxWriteCursor, box: AudioSampleEntry<"mp4a", IsoInt64>): void;

// @public
export function writeMvex(cursor: IsoBoxWriteCursor, box: MovieExtendsBox<IsoInt64>): void;

// @public
export function writeMvhd(cursor: IsoBoxWriteCursor, box: MovieHeaderBox<IsoInt64>): void;

// @public
export function writePayl(cursor: IsoBoxWriteCursor, box: WebVttCuePayloadBox): void;

// @public
export function writePrft(cursor: IsoBoxWriteCursor, box: ProducerReferenceTimeBox<IsoInt64>): void;

// @public
export function writePrsl(cursor: IsoBoxWriteCursor, box: PreselectionGroupBox<IsoInt64>): void;

// @public
export function writePssh(cursor: IsoBoxWriteCursor, box: ProtectionSystemSpecificHeaderBox): void;

// @public
export function writeRinf(cursor: IsoBoxWriteCursor, box: RestrictedSchemeInfoBox<IsoInt64>): void;

// @public
export function writeSchi(cursor: IsoBoxWriteCursor, box: SchemeInformationBox<IsoInt64>): void;

// @public
export function writeSchm(cursor: IsoBoxWriteCursor, box: SchemeTypeBox): void;

// @public
export function writeSdtp(cursor: IsoBoxWriteCursor, box: SampleDependencyTypeBox): void;

// @public
export function writeSidx(cursor: IsoBoxWriteCursor, box: SegmentIndexBox<IsoInt64>): void;

// @public
export function writeSinf(cursor: IsoBoxWriteCursor, box: ProtectionSchemeInfoBox<IsoInt64>): void;

// @public
export function writeSkip(cursor: IsoBoxWriteCursor, box: FreeSpaceBox<"skip">): void;

// @public
export function writeSmhd(cursor: IsoBoxWriteCursor, box: SoundMediaHeaderBox): void;

// @public
export function writeSsix(cursor: IsoBoxWriteCursor, box: SubsegmentIndexBox): void;

// @public
export function writeStbl(cursor: IsoBoxWriteCursor, box: SampleTableBox<IsoInt64>): void;

// @public
export function writeStco(cursor: IsoBoxWriteCursor, box: ChunkOffsetBox): void;

// @public
export function writeSthd(cursor: IsoBoxWriteCursor, box: SubtitleMediaHeaderBox): void;

// @public
export function writeStrd(cursor: IsoBoxWriteCursor, box: SubTrackDefinition<IsoInt64>): void;

// @public
export function writeStrk(cursor: IsoBoxWriteCursor, box: SubTrack<IsoInt64>): void;

// @public
export function writeStsc(cursor: IsoBoxWriteCursor, box: SampleToChunkBox): void;

// @public
export function writeStsd(cursor: IsoBoxWriteCursor, box: SampleDescriptionBox<IsoInt64>): void;

// @public
export function writeStss(cursor: IsoBoxWriteCursor, box: SyncSampleBox): void;

// @public
export function writeStsz(cursor: IsoBoxWriteCursor, box: SampleSizeBox): void;

// @public
export function writeSttg(cursor: IsoBoxWriteCursor, box: WebVttSettingsBox): void;

// @public
export function writeStts(cursor: IsoBoxWriteCursor, box: TimeToSampleBox): void;

// @public
export function writeStyp(cursor: IsoBoxWriteCursor, box: SegmentTypeBox): void;

// @public
export function writeStz2(cursor: IsoBoxWriteCursor, box: CompactSampleSizeBox): void;

// @public
export function writeSubs(cursor: IsoBoxWriteCursor, box: SubSampleInformationBox): void;

// @public
export function writeTemplate16(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeTemplate32(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeTenc(cursor: IsoBoxWriteCursor, box: TrackEncryptionBox): void;

// @public
export function writeTerminatedUtf8(cursor: IsoBoxWriteCursor, value: string): void;

// @public
export function writeTfdt(cursor: IsoBoxWriteCursor, box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>): void;

// @public
export function writeTfhd(cursor: IsoBoxWriteCursor, box: TrackFragmentHeaderBox<IsoInt64>): void;

// @public
export function writeTfra(cursor: IsoBoxWriteCursor, box: TrackFragmentRandomAccessBox<IsoInt64>): void;

// @public
export function writeTkhd(cursor: IsoBoxWriteCursor, box: TrackHeaderBox<IsoInt64>): void;

// @public
export function writeTraf(cursor: IsoBoxWriteCursor, box: TrackFragmentBox<IsoInt64>): void;

// @public
export function writeTrak(cursor: IsoBoxWriteCursor, box: TrackBox<IsoInt64>): void;

// @public
export function writeTref(cursor: IsoBoxWriteCursor, box: TrackReferenceBox<IsoInt64>): void;

// @public
export function writeTrex(cursor: IsoBoxWriteCursor, box: TrackExtendsBox): void;

// @public
export function writeTrgr(cursor: IsoBoxWriteCursor, box: TrackGroupBox<IsoInt64>): void;

// @public
export function writeTrun(cursor: IsoBoxWriteCursor, box: TrackRunBox): void;

// @public
export function writeUdta(cursor: IsoBoxWriteCursor, box: UserDataBox<IsoInt64>): void;

// @public
export function writeUint16(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeUint24(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeUint32(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeUint64(cursor: IsoBoxWriteCursor, value: bigint): void;

// @public
export function writeUint8(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeUrl(cursor: IsoBoxWriteCursor, box: DataEntryUrlBox): void;

// @public
export function writeUrn(cursor: IsoBoxWriteCursor, box: DataEntryUrnBox): void;

// @public
export function writeUtf8(cursor: IsoBoxWriteCursor, value: string): void;

// @public
export function writeVisualSampleEntry<T extends IsoBoxType = VisualSampleEntryType>(cursor: IsoBoxWriteCursor, box: VisualSampleEntry<T, IsoInt64>): void;

// @public
export function writeVlab(cursor: IsoBoxWriteCursor, box: WebVttSourceLabelBox): void;

// @public
export function writeVmhd(cursor: IsoBoxWriteCursor, box: VideoMediaHeaderBox): void;

// @public
export function writeVttC(cursor: IsoBoxWriteCursor, box: WebVttConfigurationBox): void;

// @public
export function writeVttc(cursor: IsoBoxWriteCursor, box: WebVttCueBox<IsoInt64>): void;

// @public
export function writeVtte(cursor: IsoBoxWriteCursor, _box: WebVttEmptySampleBox): void;

// @public
export function writeWideInt(cursor: IsoBoxWriteCursor, value: number | bigint, size: 4 | 8): void;

// @public
export function writeWideUint(cursor: IsoBoxWriteCursor, value: number | bigint, size: 4 | 8): void;

// (No @packageDocumentation comment for this package)

```
