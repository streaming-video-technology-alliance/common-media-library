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

`readIsoBoxes` and `writeIsoBoxes` keep their names and their `readers` and `writers` maps. The built-in readers and writers keep their names. A trial build of six boxes was faster and smaller than version 1 in every scenario. [Results of a trial build](#results-of-a-trial-build) shows the numbers and their limits.

## Motivation

Version 1 has four costs that an internal change cannot remove. The classes and the function signatures are public.

1. **One view for each box.** `IsoBoxReadView.readBox` creates a new `IsoBoxReadView` for every box. The class has 16 methods that are arrow function fields. As a result, each box allocates 16 functions and a `DataView`.
2. **Unused methods remain in the bundle.** A bundler cannot remove an unused method of a class. A minifier cannot shorten a method name. Every reader contains names such as `readUint` in full.
3. **Each writer computes its size.** A writer adds the size of every field, allocates a buffer of that size, and then writes the fields. The size code and the write code can disagree. A container writer then copies the bytes of its child boxes into a new buffer.
4. **A read decodes by default.** A player needs a few boxes, such as `tfdt`, `sidx`, or `emsg`. `readIsoBoxes` is the only entry point, and it creates a view for every box that it passes.

The result of `readIsoBoxes` is also not the input of `writeIsoBoxes`. A parsed box has the fields `view` and `size`, and the `IsoBoxStreamable` type is a union of four types.

## Guide-level explanation

### Read one box

The example in [Summary](#summary) reads one box. `seekIsoBox` compares the 4-byte type codes and creates one read cursor.

The `int64` option of the accepted RFC [`int64` reader option](uint64-reader-config.md) moves to the read cursor:

```ts
import { readInt64AsBigInt, readTfdt, seekIsoBox } from '@svta/cml-iso-bmff'

export function getExactDecodeTime(segment: Uint8Array): bigint | undefined {
	const cursor = seekIsoBox(segment, ['moof', 'traf', 'tfdt'], { int64: readInt64AsBigInt })

	return cursor ? readTfdt(cursor).baseMediaDecodeTime : undefined
}
```

### Read and write a tree

The two calls have the same arguments as in version 1. Only the return type of `writeIsoBoxes` changes.

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

A box with no reader in the map becomes a **raw box**: `{ type, bytes }`. The `bytes` field is a view of the complete box, with its header. `writeIsoBoxes` copies a raw box unchanged. The `mdat` box in `copySegment` is a raw box.

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

### Functions

| Function | Purpose |
|---|---|
| `seekIsoBox(data, path, config?)` | Returns a read cursor for the first box at the path, or `null`. `data` is bytes or a read cursor. |
| `createIsoBoxReadCursor(data, config?)` | Returns a read cursor for the bytes. |
| `readIsoBoxes(data, config?)` | Returns the boxes as a tree. The signature does not change. |
| `createIsoBoxWriteCursor(config?)` | Returns a write cursor. `config.capacity` sets the first buffer size. |
| `beginIsoBox(cursor, type)` | Writes a box header with no size. Returns the start position. |
| `beginIsoFullBox(cursor, type, version, flags)` | Does the same and writes the version and the flags. |
| `endIsoBox(cursor, start)` | Writes the size into the header at `start`. |
| `writeIsoBoxes(boxes, config)` | Returns one `Uint8Array<ArrayBuffer>` with every box. |
| `writeIsoBox(box, config?)` | Returns one `Uint8Array<ArrayBuffer>` with the box. |

Each method of the two view classes becomes a field function. A method with a `size` parameter becomes one function for each size.

| Version 1 method | Version 2.0.0 field functions |
|---|---|
| `view.readUint(size)` | `readUint8`, `readUint16`, `readUint24`, `readUint32` |
| `view.readInt(size)` | `readInt8`, `readInt16`, `readInt32` |
| `view.readUint64()` | `readUint64` |
| `view.readWideUint(size)`, `view.readWideInt(size)` | `readWideUint`, `readWideInt` |
| `view.readTemplate(size)` | `readTemplate16`, `readTemplate32` |
| `view.readString(size)`, `view.readUtf8(size)` | `readString`, `readUtf8` |
| `view.readData(size)` | `readBytes` |
| `view.readBoxes()` | `readChildBoxes` |
| `view.readFullBox()` | `readUint32` and two bit operations |
| `view.readArray(...)`, `view.readEntries(...)` | A loop in the reader |

The write cursor has the same field functions with the `write` prefix. `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`, and `isIsoBoxType` do not change.

### Contract

- A field function that reads past `cursor.end` throws a `RangeError`. As a result, a reader cannot read the bytes of the next box.
- `seekIsoBox` treats the body of each box in the path as a list of boxes. The function returns `null` for a missing box and for a truncated box.
- A box in the path with fields before its child boxes needs two calls. `meta` and `stsd` are such boxes. The caller moves `cursor.pos` past the fields and calls `seekIsoBox` with the cursor.
- `readIsoBoxes` stops before a truncated box, as in version 1.
- A parsed box has only `type` and its fields. The fields `view`, `size`, `largesize`, and `usertype` do not exist. A reader for a `uuid` box reads the 16 bytes of the user type.
- Automatic container handling does not change. A container box with no map entry is read and written through its `boxes` field.
- `writeIsoBoxes` throws for a box that has no writer, no `boxes` field, and no `bytes` field.
- A writer follows the same rules as in version 1. The flags and the version decide which fields the writer writes.
- The write cursor doubles its buffer when a field does not fit. `writeIsoBoxes` returns a copy with the exact size.

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

Method: Node 24.22 on Apple silicon, one process for each row, the median of three runs. The bundle entries keep `@svta/cml-utils` external.

Limits of the numbers:

- The trial build has no `uuid` user type, no `int64` option, and no string fields. The real code will be larger.
- The size difference is mostly fixed code: two classes against two plain objects. The difference for each added reader is smaller.
- The heap column does not count the bytes of an `ArrayBuffer`. V8 stores those bytes outside the heap.
- The row "Read `tfdt` from a segment" for version 1 uses `readIsoBoxes` with three readers, then `findIsoBox`.

## Drawbacks

- **Every custom reader and custom writer changes.** The change is mechanical: `view.readUint(4)` becomes `readUint32(cursor)`. The size code of a writer is deleted.
- **Code that uses `view` or `size` of a parsed box changes.** An adopter who needs the bytes of a box omits its reader and uses the raw box.
- **`writeIsoBoxes` returns one array, not one array for each box.**
- **A large payload without a `capacity` value is slower.** The second table shows the cost. The buffer grows several times, and each growth copies the bytes.
- **Two accepted RFCs change before a release.** The `int64` option and the container functions are not published yet. The names and the rules of both RFCs do not change. The signatures take a cursor.
- **The package has more exports.** One method with a `size` parameter becomes up to four functions.
- **The work is large.** The change touches 87 readers. The change also touches 85 writers. The test fixtures and the round-trip test already cover them.

## Rationale and alternatives

### Why a plain object and functions

A bundler removes an unused function and shortens every function name. A plain object with three fields costs one allocation. The tree reader uses one read cursor for all boxes and changes `pos` and `end` for each box.

### Why one buffer for writes

The writer of a box no longer states its size, so the size cannot be wrong. A container box writes its child boxes into the same buffer. No child bytes are copied.

### Rejected alternatives

- **A table of fields for each box and one generic reader and writer.** The source is the smallest. A generic loop is slow for boxes with many entries, such as `trun` and `senc`. Types that TypeScript derives from a table give long error messages.
- **One object for each box with `read` and `write` properties.** A bundler keeps every property of an imported object. A player that only reads boxes would receive every writer.
- **Keep the classes and move the methods to the prototype.** This change removes the 16 functions for each view. The change keeps one view for each box and the full method names.
- **Add `seekIsoBox` in version 1 and change nothing else.** The function can ship in a minor version. The built-in readers take an `IsoBoxReadView`, so the function would create a view for the box. The other three costs remain.
- **Compute the size in a first pass.** Each writer would need a second function for the size, as today.

## Prior art

- hls.js exports `findBox(data, path)` in `mp4-tools.ts`. The function returns the bodies of the boxes at a path.
- shaka-player has `Mp4Parser`. A caller registers a function for each box type, and the parser calls only those functions.
- codem-isoboxer parses the complete tree.

## Unresolved questions

1. **Release order.** The `[Unreleased]` section has additions to the view classes, such as `readWideUint`. Should a version 1.1.0 publish them first, or should version 2.0.0 replace them before any release?
2. **Large payloads.** Is the `capacity` option enough? An alternative keeps a large byte array by reference and joins the parts once. That alternative is not measured.
3. **Boxes with fields before child boxes.** Should `seekIsoBox` know the offsets for `meta` and `stsd`, or know no box type?
4. **Migration help.** Should version 2.0.0 export a function that adapts a version 1 custom reader? The default answer is no.
5. **Names.** `seekIsoBox`, `beginIsoBox`, `endIsoBox`, and the field functions with a size in the name are proposals.
6. **Path syntax.** `seekIsoBox` takes an array of box types. hls.js uses the same form.

## Future possibilities

- A function that returns every box at a path, for segments with more than one `moof` box.
- A `ReadableStream` writer that writes a large `mdat` payload without a copy.

## Final Decision

Pending review.
