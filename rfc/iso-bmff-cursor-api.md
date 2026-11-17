---
status: draft
---

# RFC: Cursor API for ISO BMFF readers and writers

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-11-16 |
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

export function getBaseMediaDecodeTime(segment: Uint8Array): number | undefined {
	const cursor = seekIsoBox(segment, ['moof', 'traf', 'tfdt'])

	return cursor ? readTfdt(cursor).baseMediaDecodeTime : undefined
}
```

`readIsoBoxes` and `writeIsoBoxes` keep their names and their `readers` and `writers` maps. The built-in readers and writers keep their names. A trial build of six boxes was faster and smaller than version 1 in three scenarios. A write of a large payload was slower with the default buffer. [Results of a trial build](#results-of-a-trial-build) shows the numbers and their limits.

## Motivation

Version 1 has four costs that an internal change cannot remove. The classes and the function signatures are public. [Baseline](#baseline) states which code this RFC calls version 1.

1. **One view for each box.** `IsoBoxReadView.readBox` creates a new `IsoBoxReadView` for every box. The class has 14 methods that are arrow function fields. As a result, each box allocates 14 functions and a `DataView`.
2. **Unused methods remain in the bundle.** A bundler cannot remove an unused method of a class. A minifier cannot shorten a method name. Every reader contains names such as `readUint` in full.
3. **Each writer computes its size.** A writer adds the size of every field, allocates a buffer of that size, and then writes the fields. The size code and the write code can disagree. A container writer then copies the bytes of its child boxes into a new buffer.
4. **A read decodes by default.** A player needs a few boxes, such as `tfdt`, `sidx`, or `emsg`. `readIsoBoxes` is the only function that reads a buffer. The function creates a view for every box that it reads.

The result type of `readIsoBoxes` is also not the box type that a writer takes. A parsed box has the fields `view` and `size`, and the `IsoBoxStreamable` type is a union of four types.

## Guide-level explanation

### Read one box

The example in [Summary](#summary) reads one box. `seekIsoBox` compares the 4-byte type codes and creates one read cursor.

Version 1 has no `int64` option. The accepted RFC [`int64` reader option](uint64-reader-config.md) defines the option. In version 2.0.0, the option is a field of the read cursor:

```ts
import { readInt64AsBigInt, readTfdt, seekIsoBox } from '@svta/cml-iso-bmff'

export function getExactDecodeTime(segment: Uint8Array): bigint | undefined {
	const cursor = seekIsoBox(segment, ['moof', 'traf', 'tfdt'], { int64: readInt64AsBigInt })

	return cursor ? readTfdt(cursor).baseMediaDecodeTime : undefined
}
```

### Read and write a tree

The two calls have the same arguments as in version 1. The return type of `writeIsoBoxes` changes. The box types also change. [Contract](#contract) and [Count fields](#count-fields) list the removed fields.

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

A box with no reader in the map and a type outside `CONTAINERS` becomes a **raw box**: `{ type, bytes }`. The `bytes` field is a view of the complete box, with its header. `writeIsoBoxes` copies a raw box unchanged. The `mdat` box in `copySegment` is a raw box.

### Write a custom reader

A reader takes the read cursor and returns the box. The position of the cursor is the first byte after the box header.

```ts
import { readUint32, type IsoBoxReadCursor } from '@svta/cml-iso-bmff'

type MovieFragmentHeaderBox = {
	type: 'mfhd'
	version: number
	flags: number
	sequenceNumber: number
}

export function readMfhd(cursor: IsoBoxReadCursor): MovieFragmentHeaderBox {
	const header = readUint32(cursor)

	return {
		type: 'mfhd',
		version: header >>> 24,
		flags: header & 0xffffff,
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

### Baseline

In this RFC, version 1 is the package code of the branch `feat/iso-bmff-v2`. That code is version 1.0.7 with two unreleased code changes. With the first change, `isIsoBoxType` accepts `unknown`. With the second change, `writeIsoBox` returns `Uint8Array<ArrayBuffer>` and `writeIsoBoxes` returns `Uint8Array<ArrayBuffer>[]`.

`main` has later unreleased changes to version 1. The branch `feat/iso-bmff-v2` does not have those changes. For version 2.0.0, this RFC uses the rules in the next table. Version 1 does not follow those rules. Each row states only the rule that this RFC uses from the change.

| Rule in version 2.0.0 | Version 1 | Change on `main` |
|---|---|---|
| The read cursor has the `int64` option. | No `int64` option. A reader returns a field of 8 bytes as a `number`. | [#645](https://github.com/streaming-video-technology-alliance/common-media-library/pull/645) |
| `readUint64` and `writeUint64` read and write a field of 8 bytes as a `bigint`. | No `readUint64` method and no `writeUint64` method. | [#612](https://github.com/streaming-video-technology-alliance/common-media-library/pull/612) |
| Each container box has a named reader, such as `readMoof`, and a named writer. | No named readers and no named writers. | [#654](https://github.com/streaming-video-technology-alliance/common-media-library/pull/654) |
| `stco`, `stsc`, and `stsz` have a reader. | A writer and no reader. | [#621](https://github.com/streaming-video-technology-alliance/common-media-library/pull/621) |
| A read stops if the data ends inside a box header. | The read throws a `RangeError`. | [#661](https://github.com/streaming-video-technology-alliance/common-media-library/pull/661) |
| The flags decide which fields `writeUrl`, `writeSchm`, and `writePrsl` write. | `writeUrl` ignores flag 0x000001. `writeSchm` and `writePrsl` omit an empty string if the flag for that string is set. | [#626](https://github.com/streaming-video-technology-alliance/common-media-library/pull/626), [#640](https://github.com/streaming-video-technology-alliance/common-media-library/pull/640), [#627](https://github.com/streaming-video-technology-alliance/common-media-library/pull/627) |
| A `ctts` box with box version 2 or above has no entries. | `readCtts` and `writeCtts` read and write the entries for every box version. | [#674](https://github.com/streaming-video-technology-alliance/common-media-library/pull/674) |
| `kid` of `pssh` has 16 bytes for each key ID. | `readPssh` and `writePssh` read and write one byte for each key ID. | [#657](https://github.com/streaming-video-technology-alliance/common-media-library/pull/657) |
| `tenc` has the constant IV. | `readTenc` and `writeTenc` do not read or write the constant IV. | [#658](https://github.com/streaming-video-technology-alliance/common-media-library/pull/658) |

[Unresolved questions](#unresolved-questions) asks about the other changes of `main`.

### Types

```ts
type IsoBoxReadCursor<V extends IsoInt64 = number> = {
	view: DataView
	pos: number
	end: number
	readers?: IsoBoxReaderMap<V>
	int64?: IsoInt64Reader<V>
}

type IsoBoxWriteCursor = {
	view: DataView
	bytes: Uint8Array<ArrayBuffer>
	pos: number
	writers?: IsoBoxWriterMap
}

type IsoBoxReader<B = unknown, V extends IsoInt64 = number> = (cursor: IsoBoxReadCursor<V>) => B
type IsoBoxWriter<B> = (cursor: IsoBoxWriteCursor, box: B) => void
type IsoRawBox = { type: IsoBoxType; bytes: Uint8Array }
```

The accepted RFC [`int64` reader option](uint64-reader-config.md) defines the types `IsoInt64` and `IsoInt64Reader`. In version 2.0.0, an `IsoInt64Reader` takes a read cursor. `IsoBoxReaderMap` gains the type parameter `V`.

### Functions

| Function | Purpose |
|---|---|
| `seekIsoBox(data, path, config?)` | Returns a read cursor for the first box at the path, or `null`. `data` is bytes or a read cursor. |
| `createIsoBoxReadCursor(data, config?)` | Returns a read cursor for the bytes. |
| `readIsoBoxes(data, config?)` | Returns the boxes as a tree. The arguments do not change, except for the `int64` option of `config`. |
| `createIsoBoxWriteCursor(config?)` | Returns a write cursor. `config.capacity` sets the first buffer size. |
| `beginIsoBox(cursor, type)` | Writes a box header with no size. Returns the start position. |
| `beginIsoFullBox(cursor, type, version, flags)` | Does the same and writes the version and the flags. |
| `endIsoBox(cursor, start)` | Writes the size into the header at `start`. |
| `writeIsoBoxes(boxes, config)` | Returns one `Uint8Array<ArrayBuffer>` with every box. |
| `writeIsoBox(box, config?)` | Returns one `Uint8Array<ArrayBuffer>` with the box. |

The next table shows the replacements for the read methods of `IsoBoxReadView`. A method with a `size` parameter becomes one function for each size. The table has no row for `slice`, `jump`, and `readBox`.

| Version 1 method | Version 2.0.0 field functions |
|---|---|
| `view.readUint(size)`, 1 to 4 bytes | `readUint8`, `readUint16`, `readUint24`, `readUint32` |
| `view.readInt(size)`, 1, 2, or 4 bytes | `readInt8`, `readInt16`, `readInt32` |
| `view.readUint(size)`, `view.readInt(size)`, 4 or 8 bytes by the box version | `readWideUint`, `readWideInt` |
| None | `readUint64` |
| `view.readTemplate(size)` | `readTemplate16`, `readTemplate32` |
| `view.readString(size)`, `view.readUtf8(size)` | `readString`, `readUtf8` |
| `view.readData(size)` | `readBytes` |
| `view.readBoxes()` | `readChildBoxes` |
| `view.readFullBox()` | `readUint32` and two bit operations |
| `view.readArray(...)`, `view.readEntries(...)` | A loop in the reader |

The accepted RFC [`int64` reader option](uint64-reader-config.md) defines `readWideUint` and `readWideInt`. [#612](https://github.com/streaming-video-technology-alliance/common-media-library/pull/612) added `readUint64` on `main`. A reader in version 1 of the package reads a field of 8 bytes as a `number`.

The write cursor has the same field functions with the `write` prefix. `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` do not change. `isIsoBoxType` keeps its two arguments. The TypeScript types of the boxes gain the type parameter `V`. As a result, the result type of `isIsoBoxType` changes.

### Contract

- A field function that reads past `cursor.end` throws a `RangeError`. As a result, a reader cannot read the bytes of the next box.
- `seekIsoBox` treats the body of each box in the path as a list of boxes. The function returns `null` for a missing box and for a truncated box.
- A box in the path with fields before its child boxes needs two calls. `meta` and `stsd` are such boxes. The caller moves `cursor.pos` past the fields and calls `seekIsoBox` with the cursor.
- `readIsoBoxes` stops before a truncated box. [Baseline](#baseline) states the difference from version 1.
- A parsed box has only `type` and its fields. The fields `view`, `size`, `largesize`, and `usertype` do not exist. A reader for a `uuid` box reads the 16 bytes of the user type.
- Some boxes have a type in `CONTAINERS` and no map entry. The package reads and writes such a box through its `boxes` field, as in version 1.
- `writeIsoBoxes` throws for a box that has no writer, no `boxes` field, and no `bytes` field. [Unresolved questions](#unresolved-questions) asks about a box with a `boxes` field, no writer, and a type outside `CONTAINERS`.
- The flags and the box version decide which fields a writer writes. [Count fields](#count-fields) states the exception. [Baseline](#baseline) lists the writers of version 1 that do not follow the rule.
- The write cursor doubles its buffer when a field does not fit. `writeIsoBoxes` returns a copy with the exact size.

### Count fields

Many box types have a count next to an array, such as `sampleCount` and `samples` in `trun`. Version 1 has both fields. The two fields can disagree. Version 2.0.0 has one source for each count.

**Rule 1.** If the syntax has a table for the count, the box type has no count field. The writer writes the length of the array. Code that needs the count reads the length of the array.

| Box | Removed field | Array |
|---|---|---|
| `trun` | `sampleCount` | `samples` |
| `stco`, `co64` | `entryCount` | `chunkOffset` |
| `stz2` | `sampleCount` | `entrySize` |
| `stts`, `stsc`, `stss`, `stsh`, `elst`, `sbgp`, `sgpd`, `dref`, `stsd`, `subs` | `entryCount` | `entries` |
| `ctts`, version 0 or 1 | `entryCount` | `entries` |
| `stsz`, `sampleSize` is 0 | `sampleCount` | `entrySize` |
| `saiz`, `defaultSampleInfoSize` is 0 | `sampleCount` | `sampleInfoSize` |
| `saio` | `entryCount` | `offset` |
| `tfra` | `numberOfEntry` | `entries` |
| `ssix` | `subsegmentCount` | `subsegments` |
| `prsl` | `numEntitiesInGroup` | `entities` |
| `senc` | `sampleCount` | `samples` |
| `pssh` | `kidCount`, `dataSize` | `kid`, `data` |
| `iinf`, `ipro` | `entryCount`, `protectionCount` | `boxes` |
| `iloc`, version 0 to 2 | `itemCount` | `items` |
| `iref` child | `referenceCount` | `toItemId` |
| `subs` entry | `subsampleCount` | `subsamples` |
| `ssix` subsegment | `rangesCount` | `ranges` |

- `trun` follows rule 1 in every form. The flags 0x100 to 0x800 add the fields of a row. If the box sets none of those flags, a row has 0 bytes. The reader then returns one empty object for each sample.
- `senc` follows rule 1 in every form. A row of `senc` can also have 0 bytes. The IV size is not a field of `senc`, so a custom reader needs that size to split the rows.
- The `kid` field of `pssh` is a list of bytes, with 16 bytes for each key ID. The count is the length of `kid` divided by 16. If the box version is 1 or above, the writer writes the count. A box with box version 0 has no count and no key IDs.
- `tenc` gains the optional array `defaultConstantIv`. `tenc` gains no size field for the array. The writer writes the length of the array as the size. With no array, the writer writes no size and no bytes.
- `entrySize` of `stsz` and `sampleInfoSize` of `saiz` are optional. With no array, the writer writes a count of 0.
- `sidx` already has no count field. `writeSidx` writes the length of `references`.

**Rule 2.** If the syntax has a count and no table, the count is an optional field. The reader sets the field only in that form. In that form, the writer writes the value of the field, or 0 for a missing field.

| Box | Form with no table | Optional field |
|---|---|---|
| `stsz` | `sampleSize` is not 0 | `sampleCount` |
| `saiz` | `defaultSampleInfoSize` is not 0 | `sampleCount` |
| `ctts` | Version 2 or above | `entryCount` |

The package has a type and no reader or writer for 12 of these boxes. The boxes are `co64`, `stz2`, `stsh`, `sbgp`, `sgpd`, `saio`, `saiz`, `senc`, `iinf`, `ipro`, `iloc`, and `iref`. For those boxes, the two rules change only the type. [Baseline](#baseline) lists three more boxes. Version 1 of the package has no reader for those boxes.

A field that is not the length of an array does not change. Examples are `channelcount`, `frameCount`, `samplesPerChunk`, and the `sampleCount` of an entry in `stts`.

Migration:

- `box.sampleCount` becomes `box.samples.length`. The compiler reports each read of a removed field.
- The compiler does not report a count that a variable passes to a writer. The writer ignores that count.
- A rule 2 field is optional. For `stsz`, the sample count is the length of `entrySize` if `sampleSize` is 0. In the other form, the sample count is `sampleCount`.

### Results of a trial build

The trial build has the six boxes `moof`, `mfhd`, `traf`, `tfhd`, `tfdt`, and `trun`. The input is a `moof` box with 120 samples and an `mdat` box. The trial build returns the same values and the same bytes as version 1 for that input. A read and a write of three test fixtures returned the input bytes.

| Scenario | Version | Time per call | Heap per call | Bundle, min+gzip |
|---|---|---|---|---|
| Read `tfdt` from a segment | 1 | 5131 ns | 14078 B | 1835 B |
| | Trial build | 118 ns | 211 B | 574 B |
| Read the `moof` tree | 1 | 11388 ns | 21842 B | 1904 B |
| | Trial build | 1727 ns | 10483 B | 869 B |
| Write the `moof` tree | 1 | 5652 ns | 11800 B | 1476 B |
| | Trial build | 2759 ns | 932 B | 854 B |

A second test writes a `moof` box and an `mdat` box of 1 MB.

| Version | Time per call |
|---|---|
| 1 | 63 µs |
| Trial build, first buffer of 1 KB | 120 µs |
| Trial build, `capacity` of the full size, no final copy | 49 µs |

Method: Node 24.22 on Apple silicon, one process for each row, the median of three runs. The bundle entries keep `@svta/cml-utils` external.

Limits of the numbers:

- The trial build has no `uuid` user type, no `int64` option, and no string fields. The real code will be larger.
- The trial build keeps the `sampleCount` field of `trun`. The trial build does not follow the rules of [Count fields](#count-fields).
- The size difference is mostly fixed code: two classes against two plain objects. The difference for each added reader is smaller.
- The heap column does not count the bytes of an `ArrayBuffer`. V8 stores those bytes outside the heap.
- The row "Read `tfdt` from a segment" for version 1 uses `readIsoBoxes` with one reader, then `findIsoBox`.
- Version 1 has no reader and no writer for `moof` and `traf`. Version 1 reads and writes those two boxes through their `boxes` field.

## Drawbacks

- **Every custom reader and custom writer changes.** The change is mechanical: `view.readUint(4)` becomes `readUint32(cursor)`. The size code of a writer is deleted.
- **Code that uses `view` or `size` of a parsed box changes.** An adopter who needs the bytes of a box omits its reader and uses the raw box.
- **`writeIsoBoxes` returns one array, not one array for each box.**
- **A large payload without a `capacity` value is slower.** The second table shows the cost. The buffer grows several times, and each growth copies the bytes.
- **The function signatures of two accepted RFCs change.** Version 1 has no `int64` option and no named readers or named writers for container boxes. Version 2.0.0 implements both RFCs. The names and the rules of both RFCs do not change. The functions of both RFCs take a cursor.
- **The package has more exports.** One method with a `size` parameter becomes up to five functions.
- **Code that reads or sets a count field changes.** [Count fields](#count-fields) lists the removed fields. A caller who builds a `trun` box with rows of 0 bytes passes one empty object for each sample.
- **The work is large.** The change modifies 62 readers. The change also modifies 65 writers. Version 1 has no test that reads and writes every fixture. The fixtures also do not contain every box type.

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
- **Keep the classes and move the methods to the prototype.** This change removes the 14 functions for each view. The change keeps one view for each box and the full method names.
- **Add `seekIsoBox` in version 1 and change nothing else.** The function can ship in a minor version. The built-in readers take an `IsoBoxReadView`, so the function would create a view for the box. The other three costs remain.
- **Compute the size in a first pass.** Each writer would still need separate code for the size, as in version 1.

## Prior art

- hls.js exports `findBox(data, path)` in `mp4-tools.ts`. The function returns the bodies of the boxes at a path.
- shaka-player has `Mp4Parser`. A caller registers a function for each box type, and the parser calls only those functions.
- codem-isoboxer parses the complete tree.

## Unresolved questions

1. **Unreleased changes of `main`.** The `[Unreleased]` section of the changelog on `main` has 98 entries that the branch `feat/iso-bmff-v2` does not have. [Baseline](#baseline) lists the changes that this RFC uses. Should version 2.0.0 include the other changes? Should the project publish the changes of `main` as version 1.1.0 first?
2. **Large payloads.** Is the `capacity` option enough? An alternative keeps a large byte array by reference and joins the parts once. That alternative is not measured.
3. **Boxes with fields before child boxes.** Should `seekIsoBox` know the offsets for `meta` and `stsd`, or know no box type?
4. **Migration help.** Should version 2.0.0 export a function that adapts a version 1 custom reader? The default answer is no.
5. **Names.** `seekIsoBox`, `beginIsoBox`, `endIsoBox`, and the field functions with a size in the name are proposals.
6. **Path syntax.** `seekIsoBox` takes an array of box types. hls.js uses the same form.
7. **A count above the field width.** Some counts are 8 or 16 bits wide. The reference count of `sidx` is a 16-bit field. That field cannot state 65536 entries. `writeSidx` of version 1 writes 0 for that array, and still writes every reference. Should the writer throw a `RangeError`?
8. **A count for rows of 0 bytes.** A `trun` box of 16 bytes can state any sample count. The reader creates one object for each sample, as in version 1. Should the reader limit that count?
9. **A `kid` length that is not a multiple of 16.** Should `writePssh` throw a `RangeError`, or write only the complete key IDs?
10. **A box with a `boxes` field and a type outside `CONTAINERS`.** With no writer for such a box, version 1 writes only the header and the child boxes. Version 1 does not write the other fields. Should `writeIsoBoxes` throw for that box?

## Future possibilities

- A function that returns every box at a path, for segments with more than one `moof` box.
- A `ReadableStream` writer that writes a large `mdat` payload without a copy.

## Final Decision

Pending review.
