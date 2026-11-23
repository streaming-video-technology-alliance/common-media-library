---
status: accepted
---

# RFC: Cursor API for ISO BMFF readers and writers

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-11-17 |
| **Package** | `@svta/cml-iso-bmff` |
| **Breaking change** | Yes. The RFC proposes version 2.0.0. |
| **Issue** | None |

## Summary

Version 2.0.0 replaces the classes `IsoBoxReadView` and `IsoBoxWriteView` with two plain objects and a set of exported functions.

- A **read cursor** is a plain object with a `DataView`, a position, and an end position.
- A **write cursor** is a plain object with one buffer that grows, and a position.
- A **field function** reads or writes one field at the position of a cursor. `readUint32(cursor)` is a field function.

The package also gains `seekIsoBox`. The function finds a box by its path and decodes no other box.

```ts
import { readTfdt, seekIsoBox } from '@svta/cml-iso-bmff'

export function getBaseMediaDecodeTime(segment: Uint8Array): number | null {
	const cursor = seekIsoBox(segment, ['moof', 'traf', 'tfdt'])

	return cursor ? readTfdt(cursor).baseMediaDecodeTime : null
}
```

`readIsoBoxes` and `writeIsoBoxes` keep their names and their `readers` and `writers` maps. The built-in readers and writers keep their names. The [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) renames four sample entry functions. A trial build of six boxes was faster and smaller than version 1 in three scenarios. A write of a large payload was slower with the default buffer. [Results of a trial build](#results-of-a-trial-build) shows the numbers and their limits.

## Motivation

Version 1 has four costs that an internal change cannot remove. The classes and the function signatures are public.

1. **One view for each box.** `IsoBoxReadView.readBox` creates a new `IsoBoxReadView` for every box. The class has 15 methods that are arrow function fields. As a result, each box allocates 15 functions and a `DataView`, or 17 functions with the `int64` option.
2. **Unused methods remain in the bundle.** A bundler cannot remove an unused method of a class. A minifier cannot shorten a method name. Every reader contains names such as `readUint` in full.
3. **Each writer computes its size.** A writer adds the size of every field, allocates a buffer of that size, and then writes the fields. The size code and the write code can disagree. A container writer then copies the bytes of its child boxes into a new buffer.
4. **A read visits every box.** A player needs a few boxes, such as `tfdt`, `sidx`, or `emsg`. Every entry point of version 1 creates a view for every box that the entry point passes. The entry points are `readIsoBoxes`, the iterator of `IsoBoxReadView`, `readBoxes`, and `readBox`.

The result type of `readIsoBoxes` is also not the box type that a writer takes. A parsed box has the fields `view` and `size`, and the `IsoBoxStreamable` type is a union of four types.

## Guide-level explanation

### Read one box

The example in [Summary](#summary) reads one box. `seekIsoBox` compares the 4-byte type codes and creates one read cursor.

The `int64` option of the accepted RFC [`int64` reader option](uint64-reader-config.md) moves to the read cursor:

```ts
import { readInt64AsBigInt, readTfdt, seekIsoBox } from '@svta/cml-iso-bmff'

export function getExactDecodeTime(segment: Uint8Array): bigint | null {
	const cursor = seekIsoBox(segment, ['moof', 'traf', 'tfdt'], { int64: readInt64AsBigInt })

	return cursor ? readTfdt(cursor).baseMediaDecodeTime : null
}
```

### Read and write a tree

The two calls have the same arguments as in version 1. The return type of `writeIsoBoxes` changes. The box types also change. A custom reader or writer in a map has the new signature. [Contract](#contract) and [Count fields](#count-fields) list the removed fields.

```ts
import {
	readIsoBoxes,
	readTfdt,
	readTrun,
	writeIsoBoxes,
	writeTfdt,
	writeTrun,
} from '@svta/cml-iso-bmff'

export function copySegment(segment: Uint8Array): Uint8Array<ArrayBuffer> {
	const boxes = readIsoBoxes(segment, { readers: { tfdt: readTfdt, trun: readTrun } })

	return writeIsoBoxes(boxes, { writers: { tfdt: writeTfdt, trun: writeTrun } })
}
```

A box with no reader in the map and a type outside `CONTAINERS` becomes a **raw box**: `{ type, bytes }`. The `bytes` field is a view of the complete box, with its header. That view shares memory with the input. `writeIsoBoxes` copies a raw box unchanged. The `mdat` box in `copySegment` is a raw box. A box with a type in `CONTAINERS` is never a raw box.

### Write a custom reader

A reader takes the read cursor and the box type, and returns the box. The position of the cursor is the first byte after the box header. A reader for one box type can omit the type parameter.

```ts
import { readUint8, readUint24, readUint32, type IsoBoxReadCursor } from '@svta/cml-iso-bmff'

type MovieFragmentHeaderBox = {
	type: 'mfhd'
	version: number
	flags: number
	sequenceNumber: number
}

export function readMfhd(cursor: IsoBoxReadCursor): MovieFragmentHeaderBox {
	return {
		type: 'mfhd',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		sequenceNumber: readUint32(cursor),
	}
}
```

### Write a custom writer

A writer takes the write cursor and the box. The writer does not compute a size. `endIsoBox` writes the size into the header.

```ts
import {
	beginIsoFullBox,
	endIsoBox,
	writeUint32,
	type IsoBoxWriteCursor,
} from '@svta/cml-iso-bmff'

export function writeMfhd(cursor: IsoBoxWriteCursor, box: MovieFragmentHeaderBox): void {
	const start = beginIsoFullBox(cursor, 'mfhd', box.version, box.flags)

	writeUint32(cursor, box.sequenceNumber)
	endIsoBox(cursor, start)
}
```

The same writer in version 1 has four statements that compute the size.

## Reference-level explanation

### Types

```ts
type IsoBoxReadCursor<V extends IsoInt64 = number> = {
	readonly view: DataView
	readonly start: number
	pos: number
	readonly end: number
	readonly readers?: Record<
		IsoBoxType,
		{ r(cursor: IsoBoxReadCursor<V>, type: IsoBoxType): { type: IsoBoxType } }['r']
	>
} & ([V] extends [bigint] ? { readonly int64: IsoInt64Reader<V> } : { readonly int64?: IsoInt64Reader<V> })

type IsoBoxWriteCursor = {
	readonly view: DataView
	readonly bytes: Uint8Array<ArrayBuffer>
	pos: number
	readonly writers?: IsoBoxWriterMap
}

type IsoBoxReader<B extends { type: IsoBoxType } = { type: IsoBoxType }, V extends IsoInt64 = number> = (
	cursor: IsoBoxReadCursor<V>,
	type: B['type'],
) => B
type IsoBoxReaderMap<V extends IsoInt64 = number> = {
	[K in keyof IsoBoxMap]?: IsoBoxReader<{ type: K }, V>
} & { [type: IsoBoxType]: IsoBoxReader<{ type: IsoBoxType }, V> }
type IsoBoxWriter<B> = (cursor: IsoBoxWriteCursor, box: B) => void
type IsoBoxWriterMap = {
	[K in keyof IsoBoxMap]?: IsoBoxWriter<IsoBoxMap<IsoInt64>[K]>
} & { [type: IsoBoxType]: IsoBoxWriter<never> }
type IsoRawBox = { type: IsoBoxType; bytes: Uint8Array; headerSize?: number; usertype?: Uint8Array }
```

A read cursor of the `bigint` mode always has the `int64` function. That rule is the rule of the accepted RFC [`int64` reader option](uint64-reader-config.md) for the view. A type that promises `bigint` fields therefore always has the function that produces those fields.

**Variance of the cursor.** The accepted `int64` RFC requires a read handle that is covariant in `V`. A reader of either mode takes `IsoBoxReadCursor<IsoInt64>`. A cursor of each mode must be assignable to that type. The `readers` field declares its entries with a method signature, so TypeScript compares the cursor parameter of an entry in both directions. A field of the type `IsoBoxReaderMap<V>` puts `V` in a parameter position and makes the cursor invariant in `V`. A model with TypeScript 6.0.3 tested both forms. The form with `IsoBoxReaderMap<V>` gave 8 errors. The model with the method signature, the `readonly` fields, and the conditional `int64` field compiled with no error and no cast. A cursor of one mode still rejects a cursor of the other mode. The model had no `type` parameter in the reader signature. The implementation adds the type tests of the `int64` RFC for the cursor, with that parameter.

**Map types.** The two maps list the known box types for completion. A reader or a writer under the wrong key is a compile error, and a custom key still compiles. Both maps also accept the keys `url` and `urn` for `'url '` and `'urn '`. A model with TypeScript 6.0.3 compiled these map types with the read cursor of this section and passed the cases of the variance model. The [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) states these rules in theme 4.

**Fields that only the package changes.** The fields `view`, `start`, `end`, `readers`, `int64`, `bytes`, and `writers` are `readonly`. `pos` is writable, because a caller moves the position. The package functions take an internal type with no `readonly`. That type needs no cast.

**Raw box.** `readIsoBoxes` sets `headerSize` on every raw box. The value is 8, or 16 with `largesize`, and 16 more for a `uuid` box. The body of a raw box is `box.bytes.subarray(box.headerSize)`. `readIsoBoxes` sets `usertype` only on a raw `uuid` box, as a 16-byte view of `bytes`. `writeIsoBoxes` ignores `headerSize` and `usertype`, so a box that code builds needs neither field.

### Functions

| Function | Purpose |
|---|---|
| `seekIsoBox(data, path, config?)` | Returns a read cursor for the first box at the path, or `null`. `data` is an `IsoBoxData` value or a read cursor. |
| `createIsoBoxReadCursor(data, config?)` | Returns a read cursor for an `IsoBoxData` value. |
| `readIsoBoxes(data, config?)` | Returns the boxes as a tree. The call form does not change. The result type changes. [Result type](#result-type) states the change. |
| `nextIsoBox(cursor)` | Returns the type of the box at `cursor.pos` and moves `pos` to the first byte after that box. Returns `null` at `cursor.end` and before a truncated box, and does not move `pos`. |
| `createIsoBoxWriteCursor(config?)` | Returns a write cursor. `config.capacity` sets the first buffer size. |
| `beginIsoBox(cursor, type)` | Writes a box header with no size. Returns the start position. |
| `beginIsoFullBox(cursor, type, version, flags)` | Does the same and writes the version and the flags. |
| `endIsoBox(cursor, start)` | Writes the size into the header at `start`. |
| `writeIsoBoxes(boxes, config?)` | Returns one `Uint8Array<ArrayBuffer>` with every box. |
| `writeIsoBox(box, config?)` | Returns one `Uint8Array<ArrayBuffer>` with the box. |

The next table shows the replacements for the read members of `IsoBoxReadView`. A method with a `size` parameter becomes one function for each size. The package has no function for `slice`, `jump`, `readBox`, and `bytesRemaining`. The table shows an expression for each of them.

| Version 1 member | Version 2.0.0 replacement |
|---|---|
| `view.readUint(size)` | `readUint8`, `readUint16`, `readUint24`, `readUint32` |
| `view.readInt(size)` | `readInt8`, `readInt16`, `readInt32` |
| `view.readUint64()` | `readUint64` |
| `view.readWideUint(size)`, `view.readWideInt(size)` | `readWideUint`, `readWideInt` |
| `view.readTemplate(size)` | `readTemplate16`, `readTemplate32` |
| `view.readString(size)`, `view.readUtf8(size)` | `readFourCc`, `readUtf8`, `readTerminatedUtf8` |
| `view.readData(size)` | `readBytes` |
| `view.readBoxes()` | `readChildBoxes` |
| `view.readFullBox()` | `readUint8` for the version, and `readUint24` for the flags |
| `view.readArray(...)`, `view.readEntries(...)` | A loop in the reader |
| `view.bytesRemaining` | `cursor.end - cursor.pos` |
| `view.jump(size)` | `cursor.pos += size` |
| `view.readBox()` | `nextIsoBox` or `readChildBoxes` |
| `view.slice(offset, size)` | `readBytes`, then `createIsoBoxReadCursor` |

The write cursor has the same field functions with the `write` prefix. `writeBytes` takes one `ArrayLike<number>`. The [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) states the rules of the string functions in theme 8. `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` do not change. The TSDoc of the `maxDepth` option states that a negative value or `NaN` visits no box. The first signature of `isIsoBoxType` takes a parsed box with a `view` field, so that signature changes. [Result type](#result-type) states the change.

### Contract

Read cursor:

- `start`, `pos`, and `end` count bytes from the first byte of `cursor.view`, not from the start of its `ArrayBuffer`. `start` is the first byte of the box header, and `end` is the first byte after the box. The bytes from `start` to `end` are the complete box. `cursor.view.getUint8(cursor.pos)` reads the next byte. A cursor for an `ArrayBufferView` input keeps the `byteOffset` and `byteLength` of the input, so `pos` starts at 0.
- The position of the cursor for a reader is the first byte after the box header. A `uuid` box is the exception: the position is the first byte of `usertype`. A reader for a `uuid` box reads the 16 bytes of `usertype` with `readBytes`. The package has no reader for a `uuid` box.
- A field function that reads past `cursor.end` throws a `RangeError`. As a result, a reader cannot read the bytes of the next box.
- The tree reader passes the box type to a reader as the second argument, as version 1 does. A reader for several box types uses that argument for its `type` field.
- A reader returns the complete box with its `type` field. `readIsoBoxes` uses the returned object, with no merge and no check. The value type of `IsoBoxReaderMap` requires a result with a `type` field, so a reader with no `type` is a compile error.
- `readBytes` returns a view that shares memory with the input, as `readData` does in version 1. A caller that needs a copy calls `slice()` on the result.
- The tree reader uses one read cursor for all boxes. After a reader returns, `readIsoBoxes` and `readChildBoxes` set `pos` to the end of the box. The two functions also set `end` to the end of the parent box. A reader can therefore stop before the end of its box.
- The cursor that a reader receives is valid only until the reader returns. The tree reader then uses the same object for the next box. A reader that needs the bytes later keeps the result of `readBytes`. A cursor from `seekIsoBox` or `createIsoBoxReadCursor` belongs to the caller and has no such limit.
- `seekIsoBox` treats the body of each box in the path as a list of boxes. The function returns `null` for a missing box and for a truncated box. The caller knows whether the data is complete. For partial data, a `null` result means that the caller can try again with more bytes.
- `seekIsoBox` knows no box type. A box in the path with fields before its child boxes needs two calls. `meta`, `stsd`, and the sample entries are such boxes. The caller moves `cursor.pos` past the fields and calls `seekIsoBox` with the cursor. The caller can also read the box with its reader, such as `readStsd`, and use the `boxes` field.
- `readIsoBoxes`, `readChildBoxes`, and `nextIsoBox` stop before a truncated box, as `readIsoBoxes` does in version 1. A `uuid` box with a size below its header plus 16 bytes is truncated, as in version 1 ([#664](https://github.com/streaming-video-technology-alliance/common-media-library/pull/664)). After `readChildBoxes` or `nextIsoBox` stops, the position of the cursor is the first byte of the truncated box. A player that reads partial data can then continue with more bytes. That position covers the boxes of one level. That position does not separate a truncated box from a box with a bad size.
- The tree reader checks the size of a box before it calls the reader. The tree reader does not catch an error of a reader, so that error always reaches the caller.
- A read throws a `RangeError` for a box that is deeper than 128 levels. The message has the box type and the limit.
- `nextIsoBox` parses no content and allocates nothing for each box. The caller can keep `cursor.pos` before the call. The bytes from that position to the new position are the complete box.
- A parsed box has only `type` and its fields. The fields `view`, `size`, `largesize`, and `usertype` do not exist. A raw `uuid` box has the `usertype` field of [Types](#types).

Write cursor:

- `pos` counts bytes from the first byte of `view` and `bytes`. Both fields cover the complete buffer, with unused capacity. The written bytes are `cursor.bytes.subarray(0, cursor.pos)`.
- The write cursor doubles its buffer when a field does not fit. The growth allocates a new `ArrayBuffer`, copies the bytes, and replaces `cursor.view` and `cursor.bytes`. A writer writes through the field functions. A writer that stores `cursor.view` or `cursor.bytes` in a variable writes into the old buffer after a growth.
- `writeIsoBoxes` and `writeIsoBox` return a copy with the exact size. Their configuration has no `capacity` option. A caller that needs no final copy uses the write cursor directly.
- `writeFourCc`, `beginIsoBox`, and `beginIsoFullBox` throw a `RangeError` for a four-character code that is not 4 characters. The message has the received value.
- A writer for a `uuid` box calls `beginIsoBox(cursor, 'uuid')` and then writes the 16 bytes of `usertype` with `writeBytes`.
- `endIsoBox` throws a `RangeError` for a box above 2^32 - 1 bytes. The message has the box type and the size. The write cursor writes the size after the body, so `beginIsoBox` must choose the header size before the body. Version 1 also fails for such a box, because the built-in writers compute the size with a header of 8 bytes.
- As in version 1, `readIsoBoxes` and `writeIsoBoxes` use the `boxes` field of a box with no map entry only for a type in `CONTAINERS`.
- For every other box with no writer and no `bytes` field, `writeIsoBoxes` throws an error. A `boxes` field does not change that rule. The message starts with "No writer found for box type". Examples are `meta`, `prsl`, and the sample entries. [#673](https://github.com/streaming-video-technology-alliance/common-media-library/pull/673) set the same rule for version 1 in issue 651.
- A writer follows the same rules as in version 1, except for count fields. The flags and the box version decide which fields the writer writes. [Count fields](#count-fields) states the exception.

### Result type

The box types of version 1 let code compile that reads a field that does not exist at run time. The cursor types define the result type again, so version 2.0.0 is the release that can correct these defects.

- The result type of `readIsoBoxes` has the parsed fields of every built-in box type. A box with no reader in the map has only the header fields at run time.
- The `boxes` field of 12 container types is a closed list of child types. The specification allows other child boxes, so a test for a legal child box is a compile error. Three of the 26 exported child types are `any`.
- `isIsoBoxType` narrows a box with no parsed fields to the complete box type.
- A custom reader with no `type` in its result removes `type` from every box of the result type. A map of the exported type `IsoBoxReaderMap` has the same effect.
- `Box<T>` has the default `never`, so code cannot write a box of an unknown type as a value.
- `SampleDescriptionBox` claims the fields of a sample entry for every entry. `readStsd` has a type parameter that only casts. `writeStsd` rejects the type that `readStsd` returns.

Rules:

1. The result of `readIsoBoxes` and every `boxes` field use one element type: the box types and `IsoRawBox`. For a readers map with literal keys, the box types are the result type of each reader and the container types. A built-in box type with no reader in the map is not in the result type. For a map with keys that are not literal, the box types are the built-in box types.
2. `IsoRawBox` has the type `IsoBoxType`, so the test `box.type === 'tfdt'` does not exclude a raw box. `isIsoBoxType(type, box)` returns `false` for a value with a `bytes` field. That function is the guard that narrows a box to a box type. The first signature of `isIsoBoxType` takes `IsoBox<V> | { type: string } | null | undefined`.
3. A reader result with a `type` field that is not a literal adds no member to the result type. A map of the type `IsoBoxReaderMap` therefore gives the result type of a map with keys that are not literal.
4. `readStsd` has no type parameter. The default entry type of `SampleDescriptionBox` includes `IsoRawBox`. `writeStsd` accepts the entry type that `readStsd` returns.
5. The 26 exported child types are removed. `Box` has no default type argument.
6. `ParsedBox` and `IsoTypedParsedBox` are removed, because a parsed box has no `view` and no `size`. `ParsedIsoBox<V>` is the name of the element type of rule 1.

Cost: code that reads a field after the test `box.type === 'tfdt'` alone does not compile. The migration is `isIsoBoxType('tfdt', box)`.

### Raw boxes in `writeIsoBoxes`

In version 1, a writer in the map comes before the source bytes of a box. A box that a read with no reader returned has only the header fields. If the map has a writer for its type, the writer writes zeros for the missing fields or throws.

`writeIsoBoxes` handles a box in the next order.

1. A box with a `bytes` field: the function copies the bytes.
2. A box with a writer in the map: the function calls the writer.
3. A box with a type in `CONTAINERS`: the function writes the `boxes` field.
4. Any other box: the function throws.

The field name `bytes` is reserved for the raw box. No built-in box type has a field with that name. A reader must not return a field with that name. To change a raw box, code builds a box object with the fields and no `bytes` field. Some version 1 code adds fields to a box with no reader and relies on the writer. That code must build a new box object with no `bytes` field.

### Count fields

Many box types have a count next to an array, such as `sampleCount` and `samples` in `trun`. Version 1 has both fields. The two fields can disagree. Version 2.0.0 has one source for each count.

**Rule 1.** If the syntax has a table for the count, the box type has no count field. The writer writes the length of the array. Code that needs the count reads the length of the array.

| Box | Removed field | Array |
|---|---|---|
| `trun` | `sampleCount` | `samples` |
| `stco`, `co64` | `entryCount` | `chunkOffset` |
| `stz2` | `sampleCount` | `entrySize` |
| `stts`, `stsc`, `stsh`, `elst`, `sbgp`, `sgpd`, `subs` | `entryCount` | `entries` |
| `dref`, `stsd` | `entryCount` | `boxes` |
| `stss` | `entryCount` | `sampleNumber` |
| `ctts`, version 0 or 1 | `entryCount` | `entries` |
| `stsz`, `sampleSize` is 0 | `sampleCount` | `entrySize` |
| `saiz`, `defaultSampleInfoSize` is 0 | `sampleCount` | `sampleInfoSize` |
| `saio` | `entryCount` | `offset` |
| `tfra` | `numberOfEntry` | `entries` |
| `ssix` | `subsegmentCount` | `subsegments` |
| `prsl` | `numEntitiesInGroup` | `entityId` |
| `senc` | `sampleCount` | `samples` |
| `pssh` | `kidCount`, `dataSize` | `kid`, `data` |
| `tenc` | `defaultConstantIvSize` | `defaultConstantIv` |
| `iinf`, `ipro` | `entryCount`, `protectionCount` | `boxes` |
| `iloc`, version 0 to 2 | `itemCount` | `items` |
| `iref` child | `referenceCount` | `toItemId` |
| `subs` entry | `subsampleCount` | `subsamples` |
| `ssix` subsegment | `rangesCount` | `ranges` |

- `trun` follows rule 1 in every form. The flags 0x100 to 0x800 add the fields of a row. If the box sets none of those flags, a row has 0 bytes. The reader then returns one empty object for each sample. The reader sets no limit on that count. The TSDoc of `readTrun` states that the reader creates one object for each sample of `sample_count`.
- `senc` follows rule 1 in every form. A row of `senc` can also have 0 bytes. The IV size is not a field of `senc`, so a custom reader needs that size to split the rows.
- The `kid` field of `pssh` has one 16-byte `Uint8Array` for each key ID, as theme 3 of the [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) states. For version 1 or above, the writer writes the length of `kid`. A box of version 0 has no count and no key IDs.
- `defaultConstantIv` of `tenc` is optional. With no array, the writer writes no size and no bytes, as in version 1.
- `entrySize` of `stsz` and `sampleInfoSize` of `saiz` are optional. With no array, the writer writes a count of 0.
- `sidx` already has no count field. `writeSidx` writes the length of `references`.
- Three count fields are narrower than 32 bits. `reference_count` of `sidx` has 16 bits (ISO/IEC 14496-12:2015, 8.16.3). `subsample_count` of a `subs` entry has 16 bits (8.7.7). `default_constant_IV_size` of `tenc` has 8 bits. For a longer array, the writer throws a `RangeError`. The message has the box type, the array length, and the limit. Version 1 writes the low bits of the length, so the box cannot be parsed.

**Rule 2.** If the syntax has a count and no table, the count is an optional field. The reader sets the field only in that form. In that form, the writer writes the value of the field, or 0 for a missing field.

| Box | Form with no table | Optional field |
|---|---|---|
| `stsz` | `sampleSize` is not 0 | `sampleCount` |
| `saiz` | `defaultSampleInfoSize` is not 0 | `sampleCount` |
| `ctts` | Version 2 or above | `entryCount` |

The package has a type and no reader or writer for 12 of these boxes. The boxes are `co64`, `stz2`, `stsh`, `sbgp`, `sgpd`, `saio`, `saiz`, `senc`, `iinf`, `ipro`, `iloc`, and `iref`. Issue 652 adds the readers and writers of `co64` and `stz2`. Theme 6 of the [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) removes the types of the other 10 boxes. The rows of the removed types apply when a reader and a writer come in a minor release.

A field that is not the length of an array does not change. Examples are `channelcount`, `frameCount`, `samplesPerChunk`, and the `sampleCount` of an entry in `stts`.

Migration:

- `box.sampleCount` becomes `box.samples.length`. The compiler reports each read of a removed field.
- The compiler does not report a count that a variable passes to a writer. The writer ignores that count.
- A rule 2 field is optional. For `stsz`, the sample count is the length of `entrySize` if `sampleSize` is 0. In the other form, the sample count is `sampleCount`.

### Changes to accepted RFCs

This RFC changes five rules of two accepted RFCs. No release contains the code of either RFC yet. Version 2.0.0 is the first release with that code, so the `implemented-in` field of both RFCs names version 2.0.0.

| Accepted RFC | Rule today | Rule in version 2.0.0 |
|---|---|---|
| [`int64` reader option](uint64-reader-config.md) | The two wide write methods are fields of `IsoBoxWriteView`. The decision of 2026-11-10 keeps the same API for the read view and the write view. | `writeWideUint` and `writeWideInt` are field functions. The read side also has field functions, so the reason of that decision still holds. |
| [`int64` reader option](uint64-reader-config.md) | The first parameter of `IsoInt64Reader` is a view of either mode. | The first parameter is a read cursor of either mode. The function reads with the field functions. |
| [`int64` reader option](uint64-reader-config.md) | `defaultReaderConfig` and `defaultWriterConfig` build the default configuration. | The functions are `createDefaultReaderConfig` and `createDefaultWriterConfig`, as theme 5 of the [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) states. |
| [Container readers and writers](iso-bmff-container-readers-writers.md) | A container writer takes a required `config` argument with the writers. That RFC rejects an optional `config`, because a missing writer for a child box then fails at run time. | A container writer takes the write cursor, and the cursor has the writers. A missing writer for a child box throws at run time, as [Contract](#contract) states. |
| [Container readers and writers](iso-bmff-container-readers-writers.md) | A writer returns an `IsoBoxWriteView`. `writeIsoBoxes` returns one array for each box. | A writer returns nothing. `writeIsoBoxes` returns one array. |

The `int64` option does not change. The [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) renames some exported names, and its theme 5 lists each rename. The default of the `int64` option stays `number`. The pull request that implements this RFC amends both accepted RFCs. Each amendment adds a dated line to the Final Decision section.

### Migration

Version 2.0.0 ships the guide `docs/migrating-to-v2.md`. The guide has one row for each removed class member and for each removed box field. The package has no function that adapts a version 1 reader. The changelog links to the guide. Some `[Unreleased]` entries of the changelog name members of `IsoBoxReadView` and `IsoBoxWriteView`. Each pull request that replaces a member also amends or removes the entries for that member. The pull requests that implement this RFC also rewrite the reading guide, the writing guide, and the utilities guide. The guides use "box object" for an object with fields, and "raw box" for `{ type, bytes }`.

### Results of a trial build

The trial build has the six boxes `moof`, `mfhd`, `traf`, `tfhd`, `tfdt`, and `trun`. The input is a `moof` box with 120 samples and an `mdat` box. The trial build returns the same values and the same bytes as version 1 for that input. A read and a write of three test fixtures returned the input bytes.

| Scenario | Version | Time per call | Heap per call | Bundle, min+gzip |
|---|---|---|---|---|
| Read `tfdt` from a segment | 1 | 4774 ns | 14662 B | 1927 B |
| | Trial build | 116 ns | 211 B | 574 B |
| Read the `moof` tree | 1 | 11109 ns | 22477 B | 2001 B |
| | Trial build | 1733 ns | 10483 B | 869 B |
| Write the `moof` tree | 1 | 5179 ns | 12724 B | 1696 B |
| | Trial build | 2491 ns | 932 B | 854 B |

A second test writes a `moof` box and an `mdat` box of 1 MB.

| Version | Time per call |
|---|---|
| 1 | 60 µs |
| Trial build, first buffer of 1 KB | 126 µs |
| Trial build, `capacity` of the full size, no final copy | 48 µs |

The third row uses the buffer of the write cursor with no final copy. `writeIsoBoxes` always returns a copy, so only a direct use of the write cursor gets that time. The table has no row for a `capacity` of the full size with the final copy.

A later model of the same write shows where the time goes. The model is not the trial build. It wrote a `moof` box of 1.5 KB and an `mdat` box of 1 MB. Each row is one process and the median of 30 batches.

| Model | Time per call |
|---|---|
| First buffer of 1 KB, final copy | 116 µs |
| `capacity` above the full size, final copy | 103 µs |
| `capacity` of the full size, no final copy | 43 µs |
| First buffer of 1 KB, a view with no final copy | 60 µs |

The final copy costs most of the time, and the growth of the buffer costs little. A caller knows the size of `mdat`, but not the size of `moof`. A `capacity` option on `writeIsoBoxes` would therefore save little.

Method: Node 24.22 on Apple silicon, one process for each row, the median of three runs. The bundle entries keep `@svta/cml-utils` external.

The version 1 rows describe `main` at commit c8346ca6b. PRs 702 to 714 changed version 1 after that commit. A second test compared `main` before and after those PRs, with one test program for both. The read of `tfdt` was 10% faster after the PRs. Each other time, heap value, and bundle size changed by less than 3%. The comparison in the first table therefore still applies to version 1 at commit e9eadc2b8.

Limits of the numbers:

- The trial build has no `uuid` user type, no `int64` option, and no string fields. The real code will be larger.
- The trial build keeps the `sampleCount` field of `trun`. The trial build does not follow the rules of [Count fields](#count-fields).
- The size difference is mostly fixed code: two classes against two plain objects. The difference for each added reader is smaller.
- The heap column does not count the bytes of an `ArrayBuffer`. V8 stores those bytes outside the heap.
- The row "Read `tfdt` from a segment" for version 1 uses `readIsoBoxes` with three readers, then `findIsoBox`.

## Drawbacks

- **Every custom reader and custom writer changes.** The change is mechanical: `view.readUint(4)` becomes `readUint32(cursor)`. The size code of a writer is deleted. A custom reader with no `type` field in its result is a compile error.
- **A custom reader for a `uuid` box starts 16 bytes earlier.** The reader reads `usertype` first. On a raw `uuid` box, `usertype` is a `Uint8Array`, not a `number[]`.
- **Code that uses `view` or `size` of a parsed box changes.** An adopter who needs the bytes of a box with a type outside `CONTAINERS` omits its reader and uses the raw box. A box with a type in `CONTAINERS` is never a raw box. A custom reader for such a box gets its bytes from `cursor.start` to `cursor.end`.
- **`writeIsoBoxes` returns one array, not one array for each box.**
- **A direct call of a built-in writer changes.** In version 1, the call returns an `IsoBoxWriteView`. In version 2.0.0, a writer takes a cursor and returns nothing. `writeIsoBox(box, { writers: { emsg: writeEmsg } })` returns the bytes of one box. A caller that wants no final copy creates a cursor with `createIsoBoxWriteCursor`, calls the writer, and reads `cursor.bytes.subarray(0, cursor.pos)`.
- **A large payload without a `capacity` value is slower.** The second table shows the cost. The buffer grows several times, and each growth copies the bytes.
- **Two accepted RFCs change before a release.** The `int64` option and the container functions are not published yet. [Changes to accepted RFCs](#changes-to-accepted-rfcs) lists each rule that changes.
- **Two packages of the repository change.** `@svta/cml-c2pa` reads the `view` and the `usertype` of a `uuid` box. `@svta/cml-drm` joins the arrays that `writeIsoBoxes` returns. Both packages change in the pull request that implements this RFC. Their next release requires `@svta/cml-iso-bmff` 2 and rejects version 1. The public API of the two packages does not change. Both packages get a major version, set with `npm run ver` before `npm run prepare-release`. The release script otherwise gives a patch version with the peer range `^2.0.0`. An adopter with `^1` ranges would then get a peer conflict on the next update. The major version of `@svta/cml-drm` gives `@svta/cml-cmaf-ham` a patch version for its peer range.
- **The package has more exports.** One method with a `size` parameter becomes up to four functions.
- **Code that reads or sets a count field changes.** [Count fields](#count-fields) lists the removed fields. A caller who builds a `trun` box with rows of 0 bytes passes one empty object for each sample.
- **The work is large.** The change modifies 84 readers. The change also modifies 84 writers. The round-trip test covers the boxes that the test fixtures contain. The fixtures do not contain every box type.

## Rationale and alternatives

### Why a plain object and functions

A bundler removes an unused function and shortens every function name. A plain object with three fields costs one allocation. The tree reader uses one read cursor for all boxes and changes `pos` and `end` for each box.

### Why one buffer for writes

The writer of a box no longer states its size, so the size cannot be wrong. A container box writes its child boxes into the same buffer. No child bytes are copied.

### Why counts are not getters

A getter that returns the length of the array keeps the count field. A test built a `subs` box with 120 entries. The box and each entry have a count. The table shows three getter variants and two variants with no getter.

| Variant | Time per box | Heap per box | Plain object |
|---|---|---|---|
| No count field | 2526 ns | 42742 B | Yes |
| Count as a data field | 2584 ns | 43707 B | Yes |
| Getter in the object literal | 23390 ns | 84576 B | Yes |
| Getter through `Object.defineProperty`, not enumerable | 13530 ns | 42742 B | Yes |
| Getter on a shared prototype (a class) | 2600 ns | 43149 B | No |

- V8 stores an object literal with a getter in dictionary mode. Dictionary mode is slower than the default mode.
- `Object.defineProperty` adds one call for each object.
- An object with a shared prototype is not a plain object. A class and `Object.create` both produce such an object.
- `JSON.stringify`, a spread copy, and `structuredClone` copy only the enumerable fields of the object itself. The copy has no count for the last two variants.
- For a getter in the object literal, the copy contains the count as a number. That number does not change when the array changes.
- Each getter variant needs two types for a box: the read output and the write input. With one type, a hand-built box must state the count.
- A data field has a low cost. The field can disagree with the array after an edit.

Limits of the numbers:

- The test ran on Node 24.22 and on no other engine.
- The test reader is not the trial build, and it has no cursor functions.
- Each value is the median of three runs. The time difference between the first two rows and the last row is inside the spread of the runs.
- The heap value of the last row includes an effect of the forced garbage collection in the test. With more calls after that collection, the last row equals the first row.

### Rejected alternatives

- **A table of fields for each box and one generic reader and writer.** The source is the smallest. A generic loop is slow for boxes with many entries, such as `trun` and `senc`. Types that TypeScript derives from a table give long error messages.
- **One object for each box with `read` and `write` properties.** A bundler keeps every property of an imported object. A player that only reads boxes would receive every writer.
- **Keep the classes and move the methods to the prototype.** This change removes the 15 functions for each view. The change keeps one view for each box and the full method names.
- **Add `seekIsoBox` in version 1 and change nothing else.** The function can ship in a minor version. The built-in readers take an `IsoBoxReadView`, so the function would create a view for the box. The other three costs remain.
- **Compute the size in a first pass.** Each writer would still need separate code for the size, as in version 1.

## Prior art

- hls.js exports `findBox(data, path)` in `mp4-tools.ts`. The function returns the bodies of the boxes at a path.
- shaka-player has `Mp4Parser`. A caller registers a function for each box type, and the parser calls only those functions.
- codem-isoboxer parses the complete tree.

## Unresolved questions

The maintainer decided each question on 2026-11-18. The rules of this RFC state the decisions.

1. **Release order.** The `[Unreleased]` section has 128 entries. 36 entries name a view class or the `view` field, such as `readWideUint`. 51 entries are fixes. [#681](https://github.com/streaming-video-technology-alliance/common-media-library/pull/681) prepared a version 1.1.0 and closed with no merge on 2026-11-17. Should a version 1.1.0 publish these entries first, or should version 2.0.0 replace the entries before any release? **Decision:** version 2.0.0 comes first, with no version 1.1.0. The 51 fixes ship in version 2.0.0. Phase 1 of the build order of the [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) can start now. The amendments of [Changes to accepted RFCs](#changes-to-accepted-rfcs) are required.
2. **Large payloads.** Is the `capacity` option of the write cursor enough? Should the configuration of `writeIsoBoxes` and `writeIsoBox` also take `capacity`? Should the functions return the buffer with no copy when the written length equals the buffer length? **Decision:** the `capacity` option of the write cursor is enough. `writeIsoBoxes` and `writeIsoBox` have no `capacity` option and always return a copy. The model in [Results of a trial build](#results-of-a-trial-build) shows that the final copy costs most of the time. The design that keeps a large byte array by reference stays a future possibility.
3. **Boxes with fields before child boxes.** Should `seekIsoBox` know the offsets for `meta` and `stsd`, or know no box type? **Decision:** `seekIsoBox` knows no box type, as hls.js does. The review rejected a built-in table of offsets and a map of skip functions.
4. **Migration help.** Should version 2.0.0 export a function that adapts a version 1 custom reader? **Decision:** no. `IsoBoxReadView` alone is 1606 bytes after minification and gzip.
5. **Names.** `seekIsoBox`, `nextIsoBox`, `beginIsoBox`, `endIsoBox`, and the field functions with a size in the name are proposals. **Decision:** keep the names.
   - Should the field functions have the `Iso` token, as `seekIsoBox` has? hls.js declares `readUint16`, `readUint32`, `readUint64`, and `writeUint32` with other parameters in `mp4-tools.ts`. The accepted `int64` RFC names `readWideUint` and `readInt64AsBigInt` with no token. The box functions, such as `readTfdt`, have no token. **Decision:** no token.
   - Should version 2.0.0 rename `readVttc`, `readVttC`, `writeVttc`, and `writeVttC`? The names differ only in case. **Decision:** keep all four names. A box function takes its name from the four-character code, with no exception. The review of PR 654 accepted the move of two pages of the API reference.
6. **Path syntax.** `seekIsoBox` takes an array of box types. hls.js uses the same form. **Decision:** an array of box types.
7. **A count above the field width.** Some counts are 8 or 16 bits wide. The reference count of `sidx` is a 16-bit field. That field cannot state 65536 entries. `writeSidx` of version 1 writes 0 for that array, and still writes every reference. Should the writer throw a `RangeError`? **Decision:** yes. [Count fields](#count-fields) states the rule.
8. **A count for rows of 0 bytes.** A `trun` box of 16 bytes can state any sample count. The reader creates one object for each sample, as in version 1. Should the reader limit that count? **Decision:** no. The TSDoc of `readTrun` states the rule. shaka-player sets no limit either.
9. **A `kid` length that is not a multiple of 16.** No longer applies. `kid` has one entry for each key ID, as the [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) states.
10. **A parsed box with a reader, no writer, and a type outside `CONTAINERS`.** Version 1 writes the bytes of the `view` field of such a box. A parsed box has no `view` field in version 2.0.0, so `writeIsoBoxes` throws by the rule of [Contract](#contract). The adopter adds the writer, or removes the reader so that the box stays a raw box. Is that change acceptable? **Decision:** yes.
11. **Members of `IsoBoxReadView` with no replacement.** This RFC states no replacement for `slice`, `jump`, `readBox`, and `bytesRemaining`. Should a reader use `cursor.pos` and `cursor.end`, or should the package export a function for each member? **Decision:** no function. [Functions](#functions) shows an expression for each member.
12. **The box type argument of a reader.** In version 1, a reader takes the box type as a second argument. Should the read cursor have the box type, or should a reader keep the second argument? **Decision:** a reader keeps the second argument. [Types](#types) and [Contract](#contract) state the rule.
13. **The start of a box.** A cursor from `seekIsoBox` and the cursor of a reader have their position after the box header. The header has 8, 16, 24, or 32 bytes, so the caller cannot compute the first byte of the box. `parsePsshList` of `@svta/cml-drm` needs that first byte. Should the read cursor have a `start` field? **Decision:** yes. The alternative is a field with the bytes on each parsed box. That field keeps the source buffer in memory and gives the writer two sources for one box.

The review of the box types RFC added three questions:

25. **`defaultConstantIvSize` of `tenc`.** [Count fields](#count-fields) removes the field. PR 658 kept the field in version 1, to avoid a break in a minor release. Should version 2.0.0 remove it? **Decision:** yes. No release contains the field, because version 1.1.0 does not ship.
26. **The type parameter of the traversal functions.** `traverseIsoBoxes`, `findIsoBox`, and `filterIsoBoxes` have a type parameter `T` with no constraint. A `Uint8Array` input therefore compiles and yields numbers. Should `T` extend `object`? **Decision:** no. A predicate that reads `box.type` already fails to compile for a number. The traversal functions do not change.
27. **An invalid `maxDepth`.** A `maxDepth` of -1 or `NaN` makes the traversal yield nothing, so `findIsoBox` returns `null` for a configuration error. Should the traversal throw a `RangeError`? **Decision:** no. A throw adds 49 bytes after minification and gzip to a bundle with `findIsoBox`. The TSDoc of the option states the rule.

## Future possibilities

- A function that returns every box at a path, for segments with more than one `moof` box.
- A `ReadableStream` writer that writes a large `mdat` payload without a copy.
- A write cursor that keeps a large byte array by reference and joins the parts once.
- A writer for a box above 4 GiB, with a header of 16 bytes and `largesize`.
- A function that selects the reader of a `uuid` box by its user type (issue 694).

## Final Decision

Accepted on 2026-11-18. Version 2.0.0 of `@svta/cml-iso-bmff` contains this RFC and the [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715). The work follows the build order of the box types RFC.

Decided on 2026-11-17:

- **Variance of the cursor.** The `readers` field of the read cursor declares its entries with a method signature.
- **Fields that only the package changes.** The cursor fields other than `pos` are `readonly`.
- **Header size of a raw box.** A raw box from `readIsoBoxes` has a `headerSize` field.
- **User type of a `uuid` box.** The cursor of a `uuid` reader starts at `usertype`. A raw `uuid` box has a 16-byte `usertype` view. The package has no `uuid` reader.
- **`type` of a parsed box.** A reader returns the complete box with its `type` field.
- **Result type.** The six rules of [Result type](#result-type) apply.
- **Order in `writeIsoBoxes`.** A `bytes` field comes first, then the writer, then the container form.
- **Position after a truncated box.** The cursor stops at the first byte of the truncated box.
- **Step over sibling boxes.** The package exports `nextIsoBox`.
- **Box above 4 GiB.** `endIsoBox` throws a `RangeError`.
- **Version of `@svta/cml-drm` and `@svta/cml-c2pa`.** Both packages get a major version.
- **Changes from the box types RFC.** The [box types RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/715) was accepted on 2026-11-17. Its section "Changes to the cursor RFC" lists the changes of this text.

Decided on 2026-11-18:

- **Questions 1 to 8, 10 to 13, and 25 to 27.** [Unresolved questions](#unresolved-questions) states each decision. Version 2.0.0 comes first, with no version 1.1.0. Question 26 differs from its default: the traversal functions keep a type parameter with no constraint.

Amended on 2026-11-18, by the review of phase 2 ([#729](https://github.com/streaming-video-technology-alliance/common-media-library/pull/729)):

- **Result type rule 1.** The result types of a readers map apply only to the top level of the result of `readIsoBoxes`. The element type of every `boxes` field is `ParsedIsoBox<V>`, the built-in box types and `IsoRawBox`. A child with a custom reader has that type too. Code that reads such a child casts it to the result type of its reader. Box types that are generic in the element type of `boxes` would change every box type with child boxes.
- **Changes to accepted RFCs.** The table has no row for the container readers. A container reader of the [container RFC](iso-bmff-container-readers-writers.md) takes a read cursor in place of an `IsoBoxReadView`. The amendment of that RFC states the change.

Amended on 2026-11-22, by the review of [#756](https://github.com/streaming-video-technology-alliance/common-media-library/pull/756):

- **Count fields, rule 2, and the flags rule.** A field that a flag or the version selects must have a value. The writer throws a `RangeError` for a missing value and does not write 0. Examples are `sampleDuration` of `trun` with the flag 0x100, and `entryCount` of `ctts` of version 2 or above. A field with a default in the specification, such as `pre_defined`, stays optional.
- **Read cursor.** A length is an integer of 0 or more. A length that is not an integer throws the `RangeError` of a read past `cursor.end`, and the cursor does not move. A read with such a length left a position that is not an integer, and every later read in the process was slower.
- **Write field functions.** Each function throws a `RangeError` for a value that its field cannot hold, and the cursor does not move. The [box types RFC](iso-bmff-v2-box-types.md) states the rules.

Amended on 2026-11-23, by the review of the box types ([#759](https://github.com/streaming-video-technology-alliance/common-media-library/pull/759)):

- **Raw box.** A raw box is `{ boxType, bytes, headerSize, usertype }`. `boxType` has the four-character code, and a raw box has no `type` field. The name follows `boxtype` of ISO/IEC 14496-12:2015 clause 4.2.
- **Result type, rule 1.** The result type of `readIsoBoxes` is `ParsedIsoBox<V>[]` for every readers map. `ParsedIsoBox<V>` is the box types of `IsoBoxMap` and `IsoRawBox`. The result type does not follow the readers map, and `IsoBoxReaderReturn` leaves the package.
- **Result type, rule 2.** The test `box.type === 'tfdt'` narrows a box to that box type. The test `!box.type` narrows a box to `IsoRawBox`. The four-character code of any box is `box.type ?? box.boxType`.
- **`isIsoBoxType`.** The function stays. It takes a value that can be `null`, `undefined`, or of an unknown type. The first signature takes `IsoBox<V> | { type?: string } | null | undefined`.
- **Result type, rule 3.** A reader result with a `type` field that is not a literal is a compile error.
- **Cost of the result type.** The version 1 test `box.type === 'tfdt'` compiles again, so the migration to `isIsoBoxType` is not necessary. The new cost is a test that compiles and never matches. A box with no reader is a raw box, and a test of `type` never matches a raw box.
- **Map types.** The two maps take a key of `IsoBoxMap` only. A custom key needs a declaration in `IsoCustomBoxMap`. The [box types RFC](iso-bmff-v2-box-types.md) states the rules.
- **`isContainer`.** The function returns `false` for a raw box.
- **Raw boxes in `writeIsoBoxes`.** The order does not change. The example of a raw box is now `{ boxType: 'esds', bytes }`.
