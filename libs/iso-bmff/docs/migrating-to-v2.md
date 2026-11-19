---
title: Migrating to Version 2
description: Update code from version 1 to version 2.0.0
---

# Migrating to Version 2

Version 2.0.0 replaces the classes `IsoBoxReadView` and `IsoBoxWriteView` with two plain objects: the read cursor and the write cursor. A field function reads or writes one field at the position of a cursor. Every built-in reader and writer takes a cursor.

The guide uses two terms:

- A **box object** is an object with a `type` field and the fields of the box, such as the result of `readTfdt`.
- A **raw box** is the result of `readIsoBoxes` for a box with no reader and a type outside `CONTAINERS`: `{ type, bytes, headerSize }`.

The compiler reports most changes. The tables in this guide list each change and its replacement.

## Reading boxes

`readIsoBoxes` keeps its arguments. Its result changes:

- A box with no reader and a type outside `CONTAINERS` is a raw box. `bytes` is the complete box, with its header. The body is `box.bytes.subarray(box.headerSize)`. The bytes share memory with the input.
- A box object has only `type` and its fields. The fields `view`, `size`, `largesize`, and `usertype` do not exist.
- A test of `box.type` does not exclude a raw box, because a raw box can have any type. Narrow a box with `isIsoBoxType`.
- The result types of a custom readers map apply only to the boxes at the top level. A child in a `boxes` field has the type `ParsedIsoBox`. Cast a child with a custom reader to the result type of that reader.

```typescript
import { findIsoBox, isIsoBoxType, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });

const tfdt = findIsoBox(boxes, (box) => isIsoBoxType("tfdt", box));

console.log(tfdt?.baseMediaDecodeTime);
```

| Version 1 | Version 2.0.0 |
|---|---|
| `box.view` | Omit the reader of the box, and use `box.bytes` of the raw box |
| `box.size` | `box.bytes.length` of a raw box |
| `box.largesize` | `box.bytes.length` of a raw box |
| `box.usertype` of a parsed `uuid` box | `box.usertype` of a raw `uuid` box, or `readBytes(cursor, 16)` in a reader |
| `if (box.type === "tfdt")` before a field read | `if (isIsoBoxType("tfdt", box))` |
| `readStsd<Avc1Box>` | `readStsd`, then `isIsoBoxType` for each entry |
| `stsd.entries`, `dref.entries` | `stsd.boxes`, `dref.boxes` |
| An error `Truncated box` from a custom reader | The error reaches the caller of `readIsoBoxes`. A truncated box stops the read with no error. |

`seekIsoBox` reads one box without a read of the other boxes. Use it in place of a full read when your code needs one box, such as `tfdt`. See [Reading one box](reading-boxes.md#reading-one-box).

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

The table shows the replacement for each member of `IsoBoxReadView`. A method with a `size` parameter becomes one function for each size.

| `IsoBoxReadView` member | Version 2.0.0 |
|---|---|
| `new IsoBoxReadView(raw, config)` | `createIsoBoxReadCursor(raw, config)` |
| `view.readUint(1)`, `view.readUint(2)`, `view.readUint(3)`, `view.readUint(4)` | `readUint8(cursor)`, `readUint16(cursor)`, `readUint24(cursor)`, `readUint32(cursor)` |
| `view.readUint(8)` | `readWideUint(cursor, 8)` |
| `view.readInt(1)`, `view.readInt(2)`, `view.readInt(4)` | `readInt8(cursor)`, `readInt16(cursor)`, `readInt32(cursor)` |
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
| `view.buffer`, `view.byteOffset`, `view.byteLength` | `cursor.view.buffer`, `cursor.view.byteOffset`, `cursor.view.byteLength` |

A read past `cursor.end` throws a `RangeError`, so a reader cannot read the bytes of the next box. A length below 0 throws a `RangeError` too. No length value has a special meaning.

The function of the `int64` option takes a read cursor in place of a view. `readInt64AsBigInt` and `createInt64OverflowReader` take the cursor.

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

A writer does not compute the size of its box. `endIsoBox` writes the size, and throws a `RangeError` for a box above 2^32 - 1 bytes. `writeFourCc`, `beginIsoBox`, and `beginIsoFullBox` throw a `RangeError` for a code that does not have 4 characters.

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

A field rename changes the keys of a reader result. The compiler does not report code that reads a field with a string key.

### Removed exports

| Version 1 | Version 2.0.0 |
|---|---|
| `IsoBoxReadView`, `IsoBoxWriteView` | The read cursor and the write cursor. See [Custom readers](#custom-readers) and [Custom writers](#custom-writers). |
| `ParsedBox`, `IsoTypedParsedBox` | `ParsedIsoBox` |
| `IsoFieldTypeMap`, `UINT`, `INT`, `TEMPLATE`, `STRING`, `UTF8`, `DATA`, `IsoBoxFields` | The field functions, such as `readUint32` |
| `IsoBoxReadableStream` | `createIsoBoxReadableStream` |
| `isFullBox` | `isIsoBoxType`, or a test such as `'version' in box && 'flags' in box` |
| The child types, such as `MovieBoxChild` and `VisualSampleEntryBoxChild` | `ParsedIsoBox` |
| `TrackReferenceTypeBox` | A raw box. A child of a `tref` box is a raw box. |
| The aliases `co64`, `stz2`, `url`, and `urn` | `ChunkLargeOffsetBox`, `CompactSampleSizeBox`, `DataEntryUrlBox`, `DataEntryUrnBox`, or a key of `IsoBoxMap` such as `IsoBoxMap['co64']` |
| `SyncSample`, `Entity` | A `number` in `sampleNumber` and `entityId` |
| The types of 16 boxes with no reader and no writer: `hmhd`, `iinf`, `iloc`, `imif`, `infe`, `ipro`, `iref`, `nmhd`, `pitm`, `saio`, `saiz`, `sbgp`, `senc`, `sgpd`, `stdp`, and `stsh` | A type that your code declares, with a custom reader |

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

### Changed types

| Version 1 | Version 2.0.0 |
|---|---|
| The `boxes` field of a container has a list of child types | The `boxes` field of every box type is `ParsedIsoBox<V>[]`. Narrow a child with `isIsoBoxType`. |
| A child of a sample entry can be a `Uint8Array` | A child is a box object or a raw box, such as `{ type: "esds", bytes }` |
| `SampleEntry<T, C>` | `SampleEntry<T, V>` |
| `SampleDescriptionBox<E>` | `SampleDescriptionBox<V, E>` |
| `Box` with no type argument | `Box<"abcd">` for one box type, or `IsoBox` |
| A reader result with `type: string` adds a member to the result type | Give the `type` field a literal type, such as `"abcd" as const` |
| `IsoBoxReader<B, T, V>`, with the box type `T` as the second parameter | `IsoBoxReader<B, V>`, with the type `V` of the 64-bit fields as the second parameter. Replace `IsoBoxReader<MyBox, 'abcd', bigint>` with `IsoBoxReader<MyBox, bigint>`. `B` has a `type` field. |
| `IsoBoxWriter<B>` returns an `ArrayBufferView` | `IsoBoxWriter<B>` takes the cursor and the box, and returns nothing |
| `IsoBoxReaderMap` and `IsoBoxWriterMap` accept a function under any key | A reader or a writer under the key of another known box type is a compile error |
