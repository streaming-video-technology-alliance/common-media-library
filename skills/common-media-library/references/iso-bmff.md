<!-- libs/iso-bmff/README.md -->
# @svta/cml-iso-bmff

Read and write ISO Base Media File Format (ISO BMFF) boxes.

Documentation: [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/)

## When to use

- Read the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTrex`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read a 64-bit field, such as a tfdt time at a 10 MHz timescale, exactly or with an overflow report: `readInt64AsBigInt`, `createInt64OverflowReader`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Write or patch boxes, such as inserting emsg or rewriting tfdt, to byte arrays or a ReadableStream: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`, `createIsoBoxReadableStream`
- Read or write a container box, such as moov or moof, with an optional named function: `readMoov`, `writeMoov`
- Read or write a box type that the package does not name: `createIsoBoxReadCursor`, `readUint32`, `readChildBoxes`, `IsoBoxWriteView`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.

## Installation

```bash
npm i @svta/cml-iso-bmff
```

## Quick start

Read the boxes of a media segment, and find the `tfdt` box inside `moof` and `traf`:

```typescript
import { findIsoBox, isIsoBoxType, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/segment.m4s").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });
const tfdt = findIsoBox(boxes, (box) => isIsoBoxType("tfdt", box));

console.log(tfdt?.baseMediaDecodeTime);
```

Write boxes to byte arrays:

```typescript
import { writeFtyp, writeIsoBoxes } from "@svta/cml-iso-bmff";

const byteArrays = writeIsoBoxes(
	[{ type: "ftyp", majorBrand: "isom", minorVersion: 1, compatibleBrands: ["isom"] }],
	{ writers: { ftyp: writeFtyp } },
);
```

## Runtime requirements

Some exports need a runtime API:

| API | Exports | Fallback |
| --- | --- | --- |
| `TextEncoder` | Every writer of a UTF-8 string field, such as `writeHdlr` and `writeEmsg` | None |
| `BigInt` | `readInt64AsBigInt`, `readUint64`, `IsoBoxWriteView.writeUint64`, and the boxes with `bigint` fields | None, and no check |
| `DataView` methods `getBigUint64`, `setBigUint64`, and `setBigInt64` | `readInt64AsBigInt`, `readUint64`, `IsoBoxWriteView.writeUint64`, `IsoBoxWriteView.writeWideUint`, and `IsoBoxWriteView.writeWideInt` with a `bigint` of 8 bytes | None, and no check |
| `ReadableStream` | `createIsoBoxReadableStream` | None. The function throws an `Error` with the message "ReadableStream is not available in this environment" |

## Usage

- [Reading boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md) - Read ISO BMFF boxes from a buffer
- [Writing boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md) - Write boxes to byte arrays or streams
- [Utilities](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/utilities.md) - Traverse boxes and type guards

<!-- libs/iso-bmff/docs/reading-boxes.md -->
---
title: Reading Boxes
description: Read ISO BMFF boxes from a buffer
---

# Reading Boxes

The `readIsoBoxes` function reads boxes from a buffer and returns an array of parsed boxes. By default, the function reads only the box header. To read the content of a box, provide a reader function for that box type.

> [!NOTE]
> The function reads container boxes automatically, so they do not need a reader function. The `CONTAINERS` constant lists all known container types. Each container type also has a named reader, such as `readMoov` and `readMoof`. A container reader in the `readers` map is optional and does not change the result.

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

## Extending a built-in reader

A custom reader can call a built-in reader and add fields to the result. The result type of `readIsoBoxes` follows the custom reader. A key in the reader map replaces the built-in type of that box in the result type. A test of `box.type` does not exclude a raw box, so the loop also tests for the `frames` field.

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

for (const box of boxes) {
	if (box.type === "emsg" && "frames" in box) {
		console.log(box.frames);
	}
}
```

A byte field such as `messageData` is a view over the input data. The field shares memory with that data and is not a copy. To keep the bytes after your code releases or changes the input, call `slice()` on the field.

`readIsoBoxes` finds a reader by the exact type and by the trimmed type. A reader under the key `url` reads the `"url "` box. The box type has a trailing space. The result type then replaces the built-in `"url "` type with the return type of that reader.

## Incomplete boxes

A box is incomplete when the data ends inside the header or inside the body of the box. A box is also incomplete when its size is below the size of its header. `readIsoBoxes` stops before the first incomplete box and returns the boxes before that box. The function does not throw for an incomplete box.

A box with a reader in the configuration and a body shorter than its fields is not an incomplete box. `readIsoBoxes` then throws a `RangeError` and returns no boxes. If the data comes from the network, call `readIsoBoxes` inside a `try` block.

The size of a box includes its header. The header has 8 bytes, or 16 bytes when `size` is 1 and a `largesize` field follows (ISO/IEC 14496-12, clause 4.2). The header of a `uuid` box has 16 more bytes for the `usertype` field. A `size` of 0 is valid and means that the box extends to the end of the data.

The same rule applies to the child boxes of a container and of a sample entry. Some QuickTime files have 4 zero bytes after the last child box of a `udta` box. Other QuickTime files have those bytes at the end of an `avc1` or `hvc1` sample entry. A box header has at least 8 bytes, so the reader stops before those bytes. The parsed box has the child boxes and no field for those bytes.

A writer builds a container or a sample entry from the child boxes of the parsed box. A write therefore omits those bytes. The written box is shorter than the source box by those bytes. If the `moov` box precedes the `mdat` box, the chunk offsets of the written file then address other bytes. The `mfraSize` field of an `mfro` box has the same limit. See [Writing a changed `mfra` box](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md#writing-a-changed-mfra-box).

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
| `emsg`                 | `presentationTime` of a version 1 box           |
| `mehd`                 | `fragmentDuration`                              |
| `mvhd`, `mdhd`, `tkhd` | `creationTime`, `modificationTime`, `duration`  |
| `elst`                 | `segmentDuration` and `mediaTime` of each entry |
| `tfhd`                 | `baseDataOffset`                                |

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

// A readers map in a variable needs a type argument for a generic custom reader.
const readers = { tfdt: readTfdtWide<bigint> };
const stored = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers });
```

A readers map in a variable gives the same types as an inline map for the built-in readers. TypeScript does not select the type of a generic custom reader in a variable. Without the type argument, the fields of that reader have the type `number | bigint`. A custom reader whose result equals the built-in box type gets the fields of the configuration without a type argument.

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

If your code needs the exact value of one field only, a custom reader can call `readUint64`. The function returns a `bigint` and needs no option:

```typescript
import {
	readIsoBoxes,
	readUint24,
	readUint32,
	readUint64,
	readUint8,
	type IsoBoxReadCursor,
} from "@svta/cml-iso-bmff";

const readTfdt64 = (cursor: IsoBoxReadCursor) => {
	const version = readUint8(cursor);
	const flags = readUint24(cursor);
	const baseMediaDecodeTime =
		version === 1 ? readUint64(cursor) : BigInt(readUint32(cursor));
	return { type: "tfdt" as const, version, flags, baseMediaDecodeTime };
};

const boxes = readIsoBoxes(buffer, {
	readers: {
		tfdt: readTfdt64,
	},
});
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

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes)) {
	console.log(box.type);
}
```

This example traverses breadth-first, and stops at the children of the root boxes:

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes, { depthFirst: false, maxDepth: 1 })) {
	console.log(box.type);
}
```

## Finding boxes

`findIsoBox` returns the first box that matches a callback, or `null`. `filterIsoBoxes` returns every box that matches. Both functions traverse the boxes as `traverseIsoBoxes` does and take the same configuration. A callback that tests `box.type` narrows the result to that box type.

```typescript
import {
	createDefaultReaderConfig,
	filterIsoBoxes,
	findIsoBox,
	isIsoBoxType,
	readIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, createDefaultReaderConfig());

const tfdt = findIsoBox(boxes, (box) => isIsoBoxType("tfdt", box));
const trafs = filterIsoBoxes(boxes, (box) => box.type === "traf");

console.log(tfdt?.baseMediaDecodeTime, trafs.length);
```

The traversal follows the `boxes` field. If the `readers` map has `readStsd`, the search also reaches the sample entries. If the map has `readDref`, the search also reaches the data entries.

`isIsoBoxType` checks the type of one box and narrows the box to that type:

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

The package provides type guards that check whether a box is a container box or a full box. These guards narrow the type of a box in TypeScript.

`isContainer` checks whether a box is a container box.

```typescript
import { isContainer, type IsoBox } from "@svta/cml-iso-bmff";

const box: IsoBox = { type: "moov", boxes: [] };
const container = isContainer(box);
```

After `isContainer` returns `true`, each element of `box.boxes` has a box type. Test the `type` of a child before you read a field of that child.

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
description: Write boxes to byte arrays or streams
---

# Writing Boxes

The `writeIsoBoxes` function writes boxes. It takes an iterable of streamable items and returns an array of `Uint8Array`s. Streamable items include:

- Raw box objects, such as `{ type: 'ftyp', majorBrand: 'isom', minorVersion: 1, compatibleBrands: ['isom'] }`
- `ArrayBufferView`s such as `Uint8Array` and `DataView`.
- Boxes that `readIsoBoxes` returns. If the `writers` map has a writer for the type, the function writes the fields of the box. If the map has no writer and the type is not a container, the function writes the source bytes of the box. A changed field then has no effect.

If you provide raw box objects, also provide a configuration object that names the writers for those box types. The key of the `writers` map is the exact four-character type. The keys `'url '` and `'urn '` have a trailing space.

A writer follows the `flags` and the `version` of the box. The writer writes a field only when the flags or the version select that field. A writer does not throw for a missing numeric field that the flags select, and writes 0. A missing list field, such as `samples` of a `trun` box, throws a `TypeError`.

> [!NOTE]
> The function writes container boxes automatically, so they do not need a writer function. The `CONTAINERS` constant lists all known container types. Each container type also has a named writer, such as `writeMoov` and `writeMoof`. A container writer in the `writers` map is optional and does not change the written bytes.
>
> The function does not write a box of another type as a container, even if the box has a `boxes` field. Examples are `meta` and the sample entries. If the `writers` map has no writer for such a type, the function writes the `view` bytes of a parsed box. For a box with no `view`, the function throws `No writer found for box type`.

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

const byteArrays = writeIsoBoxes(boxes, createDefaultWriterConfig());

for (const byteArray of byteArrays) {
	sourceBuffer.appendBuffer(byteArray);
	await new Promise((resolve) =>
		sourceBuffer.addEventListener("updateend", resolve, { once: true }),
	);
}
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

const byteArrays = writeIsoBoxes(boxes, {
	writers: {
		ftyp: writeFtyp,
		mdat: writeMdat,
	},
});

for (const byteArray of byteArrays) {
	sourceBuffer.appendBuffer(byteArray);
	await new Promise((resolve) =>
		sourceBuffer.addEventListener("updateend", resolve, { once: true }),
	);
}
```

## Streaming boxes

The `createIsoBoxReadableStream` function writes boxes to a readable stream. It supports both the default config and specific writers. The function needs `ReadableStream`. On a runtime without `ReadableStream`, the function throws an error.

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
	const byteArrays = writeIsoBoxes(boxes, { writers: { tfdt: writeTfdt } });
}
```

A raw box object can hold a `bigint` too:

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

A writer does not check the range of a `number`. In an unsigned 64-bit field, a `number` of 2^64 or more writes all bits set. The default reader returns 2^64 for a field with all bits set, so a read and then a write keep that field. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. See [Reporting a rounded value](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#reporting-a-rounded-value) for the read of that value.

A custom writer calls `writeWideUint` or `writeWideInt` on `IsoBoxWriteView`. Both methods take a `number` or a `bigint`, and the size of the field in bytes, 4 or 8:

```typescript
import {
	IsoBoxWriteView,
	type IsoInt64,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from "@svta/cml-iso-bmff";

const writeTfdtWide = (box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>) => {
	const size = box.version === 1 ? 8 : 4;
	const writer = new IsoBoxWriteView("tfdt", 12 + size);
	writer.writeFullBox(box.version, box.flags);
	writer.writeWideUint(box.baseMediaDecodeTime, size);
	return writer;
};
```

`writeUint64` writes a 64-bit field from a `bigint` only:

```typescript
import { IsoBoxWriteView } from "@svta/cml-iso-bmff";

const writeTfdt64 = (baseMediaDecodeTime: bigint) => {
	const writer = new IsoBoxWriteView("tfdt", 20);
	writer.writeFullBox(1, 0);
	writer.writeUint64(baseMediaDecodeTime);
	return writer;
};

const tfdt = writeTfdt64(BigInt("17900000000000000"));
```

The view implements `ArrayBufferView`. Pass the view to `writeIsoBoxes` in the same list as raw box objects.

## Writing a changed `mfra` box

The `mfraSize` field of an `mfro` box is the size in bytes of the enclosing `mfra` box. `writeMfro` writes the stored value, and `writeMfra` does not change it. After a change to the children of an `mfra` box, set `mfraSize` to the new size of the `mfra` box.

## Type safety

In TypeScript, give a raw box object a box type. Annotate the object with a box type from the package:

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
    boxes: AdditionalMetadataContainerBoxChild<V>[];
};

// @public
export type AdditionalMetadataContainerBoxChild<V extends IsoInt64 = number> = IsoBox<V>;

// @public
export type AudioRenderingIndicationBox = FullBox & {
    type: "ardi";
    audioRenderingIndication: number;
};

// @public
export type AudioSampleEntry<T extends IsoBoxType = AudioSampleEntryType> = SampleEntry & {
    type: T;
    entryVersion?: number;
    channelCount: number;
    sampleSize: number;
    preDefined?: number;
    sampleRate: number;
    boxes: AudioSampleEntryChild[];
};

// @public
export type AudioSampleEntryChild = any;

// @public
export type AudioSampleEntryType = "mp4a" | "enca";

// @public
export function beginIsoBox(cursor: IsoBoxWriteCursor, type: string): number;

// @public
export function beginIsoFullBox(cursor: IsoBoxWriteCursor, type: string, version: number, flags: number): number;

// @public
export type Box<T extends IsoBoxType = never> = {
    type: T;
};

// @public
export type ChunkLargeOffsetBox = FullBox & {
    type: "co64";
    entryCount: number;
    chunkOffset: number[];
};

// @public
export type ChunkOffsetBox = FullBox & {
    type: "stco";
    entryCount: number;
    chunkOffset: number[];
};

// @public
export type CompactSampleSizeBox = FullBox & {
    type: "stz2";
    fieldSize: number;
    sampleCount: number;
    entrySize: number[];
};

// @public
export type CompositionOffsetBox = FullBox & {
    type: "ctts";
    entryCount: number;
    entries: CompositionOffsetEntry[];
};

// @public
export type CompositionOffsetEntry = {
    sampleCount: number;
    sampleOffset: number;
};

// @public
export const CONTAINERS: string[];

// @public
export function createAudioSampleEntryReader<T extends IsoBoxType>(type: T): (cursor: IsoBoxReadCursor<IsoInt64>) => AudioSampleEntry<T>;

// @public
export function createDefaultReaderConfig<V extends IsoInt64 = number>(...options: [V] extends [bigint] ? [options: {
    int64: IsoInt64Reader<V>;
}] : [options?: {
    int64?: IsoInt64Reader<V>;
}]): IsoBoxReadConfig<V>;

// @public
export function createDefaultReaderConfig(options?: {
    int64?: IsoInt64Reader;
}): IsoBoxReadConfig;

// @public
export function createDefaultWriterConfig(): Required<IsoBoxWriteConfig>;

// @public
export function createInt64OverflowReader(onOverflow: (error: RangeError) => void): IsoInt64Reader;

// @public
export function createIsoBoxReadableStream(boxes: Iterable<IsoBoxStreamable<IsoInt64>>, config?: IsoBoxWriteConfig): ReadableStream<Uint8Array>;

// @public
export function createIsoBoxReadCursor<V extends IsoInt64 = number>(data: IsoBoxData, ...config: [V] extends [bigint] ? [config: IsoBoxReadConfig<V>] : [config?: IsoBoxReadConfig<V>]): IsoBoxReadCursor<V>;

// @public
export function createIsoBoxWriteCursor(config?: {
    capacity?: number;
}): IsoBoxWriteCursor;

// @public
export function createVisualSampleEntryReader<T extends IsoBoxType>(type: T): (cursor: IsoBoxReadCursor<IsoInt64>) => VisualSampleEntry<T>;

// @public
export type DataEntryUrlBox = FullBox & {
    type: "url ";
    location: string;
};

// @public
export type DataEntryUrnBox = FullBox & {
    type: "urn ";
    name: string;
    location: string;
};

// @public
export type DataInformationBox = {
    type: "dinf";
    boxes: DataInformationBoxChild[];
};

// @public
export type DataInformationBoxChild = DataReferenceBox;

// @public
export type DataReferenceBox = FullBox & {
    type: "dref";
    entryCount: number;
    boxes: (DataEntryUrlBox | DataEntryUrnBox)[];
};

// @public
export type EditBox<V extends IsoInt64 = number> = {
    type: "edts";
    boxes: EditBoxChild<V>[];
};

// @public
export type EditBoxChild<V extends IsoInt64 = number> = EditListBox<V>;

// @public
export type EditListBox<V extends IsoInt64 = number> = FullBox & {
    type: "elst";
    entryCount: number;
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
export type EventMessageBox<V extends IsoInt64 = number> = EventMessageBoxV0 | EventMessageBoxV1<V> | EventMessageBoxUnrecognizedVersion;

// @public
export type EventMessageBoxBase = FullBox & {
    type: "emsg";
    schemeIdUri: string;
    value: string;
    timescale: number;
    eventDuration: number;
    id: number;
    messageData: Uint8Array;
};

// @public
export type EventMessageBoxUnrecognizedVersion = EventMessageBoxBase & {
    version: EventMessageBoxUnrecognizedVersionNumber;
    presentationTimeDelta: number;
    presentationTime: number;
};

// @public
export type EventMessageBoxUnrecognizedVersionNumber<A extends number[] = [0, 1]> = A["length"] extends 256 ? Exclude<A[number], 0 | 1> : EventMessageBoxUnrecognizedVersionNumber<[...A, A["length"]]>;

// @public
export type EventMessageBoxV0 = EventMessageBoxBase & {
    version: 0;
    presentationTimeDelta: number;
};

// @public
export type EventMessageBoxV1<V extends IsoInt64 = number> = EventMessageBoxBase & {
    version: 1;
    presentationTime: V;
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
export function fourCcToUint32(str: string): number;

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
    boxes: GroupsListBoxChild<V>[];
};

// @public
export type GroupsListBoxChild<V extends IsoInt64 = number> = IsoBox<V>;

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
export function isContainer<T extends IsoBox<IsoInt64> | Box<IsoBox["type"]> | IsoRawBox>(box: T): box is [Extract<T, IsoBoxContainer<IsoInt64>>] extends [never] ? T & IsoBoxContainer<IsoInt64> : Extract<T, IsoBoxContainer<IsoInt64>>;

// @public
export function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64 = number>(type: T, box: IsoBox<V> | {
    type: string;
} | null | undefined): box is IsoBoxMap<V>[T];

// @public
export function isIsoBoxType<T extends keyof IsoBoxMap>(type: T, box: unknown): box is IsoBoxMap[T];

// @public
export type IsoBox<V extends IsoInt64 = number> = IsoBoxMap<V>[keyof IsoBoxMap<V>];

// @public
export type IsoBoxContainer<V extends IsoInt64 = number> = IsoBoxContainerMap<V>[keyof IsoBoxContainerMap<V>];

// @public
export type IsoBoxContainerMap<V extends IsoInt64 = number> = {
    dinf: DataInformationBox;
    edts: EditBox<V>;
    grpl: GroupsListBox<V>;
    mdia: MediaBox<V>;
    meco: AdditionalMetadataContainerBox<V>;
    mfra: MovieFragmentRandomAccessBox<V>;
    minf: MediaInformationBox;
    moof: MovieFragmentBox<V>;
    moov: MovieBox<V>;
    mvex: MovieExtendsBox<V>;
    schi: SchemeInformationBox;
    sinf: ProtectionSchemeInfoBox;
    stbl: SampleTableBox;
    strk: SubTrack<V>;
    traf: TrackFragmentBox<V>;
    trak: TrackBox<V>;
    tref: TrackReferenceBox;
    udta: UserDataBox<V>;
    vttc: WebVttCueBox;
};

// @public
export type IsoBoxData = ArrayBufferLike | ArrayBufferView;

// @public
export type IsoBoxMap<V extends IsoInt64 = number> = {
    ardi: AudioRenderingIndicationBox;
    avc1: VisualSampleEntry<"avc1">;
    avc2: VisualSampleEntry<"avc2">;
    avc3: VisualSampleEntry<"avc3">;
    avc4: VisualSampleEntry<"avc4">;
    co64: ChunkLargeOffsetBox;
    ctts: CompositionOffsetBox;
    dinf: DataInformationBox;
    dref: DataReferenceBox;
    edts: EditBox<V>;
    elng: ExtendedLanguageBox;
    elst: EditListBox<V>;
    emsg: EventMessageBox<V>;
    enca: AudioSampleEntry<"enca">;
    encv: VisualSampleEntry<"encv">;
    free: FreeSpaceBox<"free">;
    frma: OriginalFormatBox;
    ftyp: FileTypeBox;
    grpl: GroupsListBox<V>;
    hdlr: HandlerBox;
    hev1: VisualSampleEntry<"hev1">;
    hvc1: VisualSampleEntry<"hvc1">;
    iden: WebVttCueIdBox;
    imda: IdentifiedMediaDataBox;
    kind: KindBox;
    labl: LabelBox;
    mdat: MediaDataBox;
    mdhd: MediaHeaderBox<V>;
    mdia: MediaBox<V>;
    meco: AdditionalMetadataContainerBox<V>;
    mehd: MovieExtendsHeaderBox<V>;
    meta: MetaBox<V>;
    mfhd: MovieFragmentHeaderBox;
    mfra: MovieFragmentRandomAccessBox<V>;
    mfro: MovieFragmentRandomAccessOffsetBox;
    minf: MediaInformationBox;
    moof: MovieFragmentBox<V>;
    moov: MovieBox<V>;
    mp4a: AudioSampleEntry<"mp4a">;
    mvex: MovieExtendsBox<V>;
    mvhd: MovieHeaderBox<V>;
    payl: WebVttCuePayloadBox;
    prft: ProducerReferenceTimeBox<V>;
    prsl: PreselectionGroupBox;
    pssh: ProtectionSystemSpecificHeaderBox;
    schi: SchemeInformationBox;
    schm: SchemeTypeBox;
    sdtp: SampleDependencyTypeBox;
    sidx: SegmentIndexBox<V>;
    sinf: ProtectionSchemeInfoBox;
    skip: FreeSpaceBox<"skip">;
    smhd: SoundMediaHeaderBox;
    ssix: SubsegmentIndexBox;
    stbl: SampleTableBox;
    stco: ChunkOffsetBox;
    sthd: SubtitleMediaHeaderBox;
    strk: SubTrack<V>;
    stsc: SampleToChunkBox;
    stsd: SampleDescriptionBox;
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
    tref: TrackReferenceBox;
    trex: TrackExtendsBox;
    trun: TrackRunBox;
    udta: UserDataBox<V>;
    "url ": DataEntryUrlBox;
    "urn ": DataEntryUrnBox;
    vlab: WebVttSourceLabelBox;
    vmhd: VideoMediaHeaderBox;
    vttc: WebVttCueBox;
    vttC: WebVttConfigurationBox;
    vtte: WebVttEmptySampleBox;
};

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
export type IsoBoxReaderMap<V extends IsoInt64 = number> = { [K in keyof IsoBoxMap]?: IsoBoxReader<{
        type: K;
    }, V>; } & {
    url?: IsoBoxReader<{
        type: "url ";
    }, V>;
    urn?: IsoBoxReader<{
        type: "urn ";
    }, V>;
} & Record<IsoBoxType, {
    r(cursor: IsoBoxReadCursor<V>, type: never): {
        type: IsoBoxType;
    };
}["r"]>;

// @public
export type IsoBoxReaderReturn<T, V extends IsoInt64 = number> = NonNullable<{ [K in keyof T]: NonNullable<T[K]> extends ((...args: never[]) => infer B) ? 0 extends 1 & B ? B : [B] extends [{
        type: infer N extends keyof IsoBoxMap;
    }] ? [B] extends [IsoBoxMap<IsoInt64>[N]] ? [IsoBoxMap<IsoInt64>[N]] extends [B] ? IsoBoxMap<V>[N] : B : B : B : never; }[keyof T]> | (NonNullable<{ [K in keyof T]: T[K] extends ((...args: never[]) => unknown) ? K extends "url" | "urn" ? K | `${K} ` : K : never; }[keyof T]> extends (infer R) ? [string] extends [R] ? IsoBox<V> : Exclude<IsoBoxContainer<V>, {
    type: R;
}> : never) | IsoRawBox;

// @public
export type IsoBoxStreamable<V extends IsoInt64 = number> = IsoBox<V> | ParsedIsoBox<V> | {
    type: IsoBoxType;
} | ArrayBufferView;

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
};

// @public
export type IsoBoxWriter<B> = (box: B, config: IsoBoxWriteConfig) => ArrayBufferView;

// @public
export type IsoBoxWriterMap = Record<string, IsoBoxWriter<any>>;

// @public
export class IsoBoxWriteView {
    constructor(type: string, size: number);
    get buffer(): ArrayBufferLike;
    get byteLength(): number;
    get byteOffset(): number;
    writeArray: <T extends keyof IsoFieldTypeMap>(data: number[], type: T, size: number, length: number) => void;
    writeBoxHeader: (type: string, size: number) => void;
    writeBytes: (data: Uint8Array | Uint8Array[]) => void;
    writeFullBox(version: number, flags: number): void;
    writeInt: (value: number, size: number) => void;
    writeString: (value: string) => void;
    writeTemplate: (value: number, size: number) => void;
    writeTerminatedString: (value: string) => void;
    writeUint: (value: number, size: number) => void;
    writeUint64: (value: bigint) => void;
    writeUtf8TerminatedString: (value: string) => void;
    writeWideInt: (value: number | bigint, size: 4 | 8) => void;
    writeWideUint: (value: number | bigint, size: 4 | 8) => void;
}

// @public
export type IsoFieldTypeMap = {
    uint: number;
    int: number;
    template: number;
    string: string;
    data: Uint8Array;
    utf8: string;
};

// @public
export type IsoInt64 = number | bigint;

// @public
export type IsoInt64Reader<V extends IsoInt64 = number> = (cursor: IsoBoxReadCursor<IsoInt64>, size: 4 | 8, signed: boolean) => V;

// @public
export type IsoRawBox = {
    type: IsoBoxType;
    bytes: Uint8Array;
    headerSize?: number;
    usertype?: Uint8Array;
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
export type MediaBox<V extends IsoInt64 = number> = {
    type: "mdia";
    boxes: MediaBoxChild<V>[];
};

// @public
export type MediaBoxChild<V extends IsoInt64 = number> = MediaHeaderBox<V> | HandlerBox | MediaInformationBox;

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
export type MediaInformationBox = {
    type: "minf";
    boxes: MediaInformationBoxChild[];
};

// @public
export type MediaInformationBoxChild = VideoMediaHeaderBox | SoundMediaHeaderBox | DataInformationBox | SampleTableBox | SubtitleMediaHeaderBox;

// @public
export type MetaBox<V extends IsoInt64 = number> = FullBox & {
    type: "meta";
    boxes: MetaBoxChild<V>[];
};

// @public
export type MetaBoxChild<V extends IsoInt64 = number> = HandlerBox | DataInformationBox | GroupsListBox<V>;

// @public
export type MovieBox<V extends IsoInt64 = number> = {
    type: "moov";
    boxes: MovieBoxChild<V>[];
};

// @public
export type MovieBoxChild<V extends IsoInt64 = number> = MovieHeaderBox<V> | TrackBox<V> | MovieExtendsBox<V> | UserDataBox<V>;

// @public
export type MovieExtendsBox<V extends IsoInt64 = number> = {
    type: "mvex";
    boxes: MovieExtendsBoxChild<V>[];
};

// @public
export type MovieExtendsBoxChild<V extends IsoInt64 = number> = MovieExtendsHeaderBox<V> | TrackExtendsBox;

// @public
export type MovieExtendsHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mehd";
    fragmentDuration: V;
};

// @public
export type MovieFragmentBox<V extends IsoInt64 = number> = {
    type: "moof";
    boxes: MovieFragmentBoxChild<V>[];
};

// @public
export type MovieFragmentBoxChild<V extends IsoInt64 = number> = MovieFragmentHeaderBox | TrackFragmentBox<V>;

// @public
export type MovieFragmentHeaderBox = FullBox & {
    type: "mfhd";
    sequenceNumber: number;
};

// @public
export type MovieFragmentRandomAccessBox<V extends IsoInt64 = number> = {
    type: "mfra";
    boxes: MovieFragmentRandomAccessBoxChild<V>[];
};

// @public
export type MovieFragmentRandomAccessBoxChild<V extends IsoInt64 = number> = TrackFragmentRandomAccessBox<V> | MovieFragmentRandomAccessOffsetBox;

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
    matrix: number[];
    preDefined?: number[];
    nextTrackId: number;
};

// @public
export function nextIsoBox(cursor: IsoBoxReadCursor<IsoInt64>): IsoBoxType | null;

// @public
export type OriginalFormatBox = {
    type: "frma";
    dataFormat: number;
};

// @public
export type ParsedIsoBox<V extends IsoInt64 = number> = IsoBox<V> | IsoRawBox;

// @public
export type PreselectionGroupBox = FullBox & {
    type: "prsl";
    groupId: number;
    numEntitiesInGroup: number;
    entityId: number[];
    preselectionTag?: string;
    selectionPriority?: number;
    interleavingTag?: string;
    boxes: PreselectionGroupBoxChild[];
};

// @public
export type PreselectionGroupBoxChild = any;

// @public
export type ProducerReferenceTimeBox<V extends IsoInt64 = number> = FullBox & {
    type: "prft";
    referenceTrackId: number;
    ntpTimestampSec: number;
    ntpTimestampFrac: number;
    mediaTime: V;
};

// @public
export type ProtectionSchemeInfoBox = {
    type: "sinf";
    boxes: ProtectionSchemeInfoBoxChild[];
};

// @public
export type ProtectionSchemeInfoBoxChild = OriginalFormatBox | SchemeTypeBox | SchemeInformationBox;

// @public
export type ProtectionSystemSpecificHeaderBox = FullBox & {
    type: "pssh";
    systemId: number[];
    kidCount: number;
    kid: number[];
    dataSize: number;
    data: number[];
};

// @public
export function readArdi(cursor: IsoBoxReadCursor<IsoInt64>): AudioRenderingIndicationBox;

// @public
export function readAudioSampleEntry<T extends IsoBoxType>(type: T, cursor: IsoBoxReadCursor<IsoInt64>): AudioSampleEntry<T>;

// @public
export function readAvc1(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"avc1">;

// @public
export function readAvc2(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"avc2">;

// @public
export function readAvc3(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"avc3">;

// @public
export function readAvc4(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"avc4">;

// @public
export function readBytes(cursor: IsoBoxReadCursor<IsoInt64>, length: number): Uint8Array;

// @public
export function readChildBoxes<V extends IsoInt64 = number>(cursor: IsoBoxReadCursor<V>, count?: number): ParsedIsoBox<V>[];

// @public
export function readCtts(cursor: IsoBoxReadCursor<IsoInt64>): CompositionOffsetBox;

// @public
export function readDinf(cursor: IsoBoxReadCursor<IsoInt64>): DataInformationBox;

// @public
export function readDref(cursor: IsoBoxReadCursor<IsoInt64>): DataReferenceBox;

// @public
export function readEdts<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditBox<V>;

// @public
export function readElng(cursor: IsoBoxReadCursor<IsoInt64>): ExtendedLanguageBox;

// @public
export function readElst<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditListBox<V>;

// @public
export function readEmsg<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EventMessageBox<V>;

// @public
export function readEnca(cursor: IsoBoxReadCursor<IsoInt64>): AudioSampleEntry<"enca">;

// @public
export function readEncv(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"encv">;

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
export function readHev1(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"hev1">;

// @public
export function readHvc1(cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<"hvc1">;

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
export function readIsoBoxes<const R extends IsoBoxReaderMap<V>, V extends IsoInt64 = number>(raw: IsoBoxData, config: IsoBoxReadConfig<V> & {
    readers: R;
}): IsoBoxReaderReturn<R, V>[];

// @public
export function readIsoBoxes<V extends IsoInt64 = number>(raw: IsoBoxData, ...config: [V] extends [bigint] ? [config: IsoBoxReadConfig<V>] : [config?: IsoBoxReadConfig<V>]): ParsedIsoBox<V>[];

// @public
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadConfig): ParsedIsoBox[];

// @public
export function readKind(cursor: IsoBoxReadCursor<IsoInt64>): KindBox;

// @public
export function readLabl(cursor: IsoBoxReadCursor<IsoInt64>): LabelBox;

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
export function readMinf(cursor: IsoBoxReadCursor<IsoInt64>): MediaInformationBox;

// @public
export function readMoof<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieFragmentBox<V>;

// @public
export function readMoov<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieBox<V>;

// @public
export function readMp4a(cursor: IsoBoxReadCursor<IsoInt64>): AudioSampleEntry<"mp4a">;

// @public
export function readMvex<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieExtendsBox<V>;

// @public
export function readMvhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieHeaderBox<V>;

// @public
export function readPayl(cursor: IsoBoxReadCursor<IsoInt64>): WebVttCuePayloadBox;

// @public
export function readPrft<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): ProducerReferenceTimeBox<V>;

// @public
export function readPrsl(cursor: IsoBoxReadCursor<IsoInt64>): PreselectionGroupBox;

// @public
export function readPssh(cursor: IsoBoxReadCursor<IsoInt64>): ProtectionSystemSpecificHeaderBox;

// @public
export function readSchi(cursor: IsoBoxReadCursor<IsoInt64>): SchemeInformationBox;

// @public
export function readSchm(cursor: IsoBoxReadCursor<IsoInt64>): SchemeTypeBox;

// @public
export function readSdtp(cursor: IsoBoxReadCursor<IsoInt64>): SampleDependencyTypeBox;

// @public
export function readSidx<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SegmentIndexBox<V>;

// @public
export function readSinf(cursor: IsoBoxReadCursor<IsoInt64>): ProtectionSchemeInfoBox;

// @public
export function readSkip(cursor: IsoBoxReadCursor<IsoInt64>): FreeSpaceBox<"skip">;

// @public
export function readSmhd(cursor: IsoBoxReadCursor<IsoInt64>): SoundMediaHeaderBox;

// @public
export function readSsix(cursor: IsoBoxReadCursor<IsoInt64>): SubsegmentIndexBox;

// @public
export function readStbl(cursor: IsoBoxReadCursor<IsoInt64>): SampleTableBox;

// @public
export function readStco(cursor: IsoBoxReadCursor<IsoInt64>): ChunkOffsetBox;

// @public
export function readSthd(cursor: IsoBoxReadCursor<IsoInt64>): SubtitleMediaHeaderBox;

// @public
export function readStrk<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SubTrack<V>;

// @public
export function readStsc(cursor: IsoBoxReadCursor<IsoInt64>): SampleToChunkBox;

// @public
export function readStsd(cursor: IsoBoxReadCursor<IsoInt64>): SampleDescriptionBox;

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
export function readTref(cursor: IsoBoxReadCursor<IsoInt64>): TrackReferenceBox;

// @public
export function readTrex(cursor: IsoBoxReadCursor<IsoInt64>): TrackExtendsBox;

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
export function readVisualSampleEntry<T extends IsoBoxType>(type: T, cursor: IsoBoxReadCursor<IsoInt64>): VisualSampleEntry<T>;

// @public
export function readVlab(cursor: IsoBoxReadCursor<IsoInt64>): WebVttSourceLabelBox;

// @public
export function readVmhd(cursor: IsoBoxReadCursor<IsoInt64>): VideoMediaHeaderBox;

// @public
export function readVttC(cursor: IsoBoxReadCursor<IsoInt64>): WebVttConfigurationBox;

// @public
export function readVttc(cursor: IsoBoxReadCursor<IsoInt64>): WebVttCueBox;

// @public
export function readVtte(_cursor: IsoBoxReadCursor<IsoInt64>): WebVttEmptySampleBox;

// @public
export function readWideInt<V extends IsoInt64 = number>(cursor: IsoBoxReadCursor<V>, size: 4 | 8): V;

// @public
export function readWideUint<V extends IsoInt64 = number>(cursor: IsoBoxReadCursor<V>, size: 4 | 8): V;

// @public
export type SampleDependencyTypeBox = FullBox & {
    type: "sdtp";
    sampleDependencyTable: number[];
};

// @public
export type SampleDescriptionBox<E extends SampleEntry | IsoRawBox = AudioSampleEntry | VisualSampleEntry | IsoRawBox> = FullBox & {
    type: "stsd";
    entryCount: number;
    boxes: E[];
};

// @public
export type SampleEntry<T extends IsoBoxType = IsoBoxType, C = any> = {
    type: T;
    dataReferenceIndex: number;
    boxes: C[];
};

// @public
export type SampleSizeBox = FullBox & {
    type: "stsz";
    sampleSize: number;
    sampleCount: number;
    entrySize?: number[];
};

// @public
export type SampleTableBox = {
    type: "stbl";
    boxes: SampleTableBoxChild[];
};

// @public
export type SampleTableBoxChild = SampleDescriptionBox | TimeToSampleBox | CompositionOffsetBox | SampleToChunkBox | SampleSizeBox | ChunkOffsetBox | SyncSampleBox | SampleDependencyTypeBox;

// @public
export type SampleToChunkBox = FullBox & {
    type: "stsc";
    entryCount: number;
    entries: SampleToChunkEntry[];
};

// @public
export type SampleToChunkEntry = {
    firstChunk: number;
    samplesPerChunk: number;
    sampleDescriptionIndex: number;
};

// @public
export type SchemeInformationBox = {
    type: "schi";
    boxes: SchemeInformationBoxChild[];
};

// @public
export type SchemeInformationBoxChild = TrackEncryptionBox;

// @public
export type SchemeTypeBox = FullBox & {
    type: "schm";
    schemeType: number;
    schemeVersion: number;
    schemeUri?: string;
};

// @public
export function seekIsoBox<V extends IsoInt64 = number>(data: IsoBoxReadCursor<V>, path: readonly IsoBoxType[]): IsoBoxReadCursor<V> | null;

// @public
export function seekIsoBox<V extends IsoInt64 = number>(data: IsoBoxData, path: readonly IsoBoxType[], ...config: [V] extends [bigint] ? [config: IsoBoxReadConfig<V>] : [config?: IsoBoxReadConfig<V>]): IsoBoxReadCursor<V> | null;

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
    entryCount: number;
    entries: SubSampleInformationEntry[];
};

// @public
export type SubSampleInformationEntry = {
    sampleDelta: number;
    subsampleCount: number;
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
    subsegmentCount: number;
    subsegments: SubsegmentIndexSubsegment[];
};

// @public
export type SubsegmentIndexRange = {
    level: number;
    rangeSize: number;
};

// @public
export type SubsegmentIndexSubsegment = {
    rangesCount: number;
    ranges: SubsegmentIndexRange[];
};

// @public
export type SubtitleMediaHeaderBox = FullBox & {
    type: "sthd";
};

// @public
export type SubTrack<V extends IsoInt64 = number> = {
    type: "strk";
    boxes: SubTrackChild<V>[];
};

// @public
export type SubTrackChild<V extends IsoInt64 = number> = IsoBox<V>;

// @public
export type SyncSampleBox = FullBox & {
    type: "stss";
    entryCount: number;
    sampleNumber: number[];
};

// @public
export type TimeToSampleBox = FullBox & {
    type: "stts";
    entryCount: number;
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
    boxes: TrackBoxChild<V>[];
};

// @public
export type TrackBoxChild<V extends IsoInt64 = number> = TrackHeaderBox<V> | TrackReferenceBox | EditBox<V> | MediaBox<V> | UserDataBox<V>;

// @public
export type TrackEncryptionBox = FullBox & {
    type: "tenc";
    defaultPerSampleIvSize: number;
    defaultKid: number[];
    defaultIsProtected: number;
    defaultCryptByteBlock?: number;
    defaultSkipByteBlock?: number;
    defaultConstantIvSize?: number;
    defaultConstantIv?: number[];
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
    boxes: TrackFragmentBoxChild<V>[];
};

// @public
export type TrackFragmentBoxChild<V extends IsoInt64 = number> = TrackFragmentHeaderBox<V> | TrackFragmentBaseMediaDecodeTimeBox<V> | TrackRunBox | SubSampleInformationBox;

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
    numberOfEntry: number;
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
export type TrackHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "tkhd";
    creationTime: V;
    modificationTime: V;
    trackId: number;
    duration: V;
    layer: number;
    alternateGroup: number;
    volume: number;
    matrix: number[];
    width: number;
    height: number;
};

// @public
export type TrackReferenceBox = {
    type: "tref";
    boxes: TrackReferenceBoxChild[];
};

// @public
export type TrackReferenceBoxChild = TrackReferenceTypeBox;

// @public
export type TrackReferenceTypeBox = {
    type: "tref";
    trackIds: number[];
};

// @public
export type TrackRunBox = FullBox & {
    type: "trun";
    sampleCount: number;
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
    boxes: UserDataBoxChild<V>[];
};

// @public
export type UserDataBoxChild<V extends IsoInt64 = number> = IsoBox<V>;

// @public
export type VideoMediaHeaderBox = FullBox & {
    type: "vmhd";
    graphicsMode: number;
    opColor: number[];
};

// @public
export type VisualSampleEntry<T extends IsoBoxType = VisualSampleEntryType> = SampleEntry & {
    type: T;
    preDefined1?: number;
    preDefined2?: number[];
    width: number;
    height: number;
    horizResolution: number;
    vertResolution: number;
    frameCount: number;
    compressorName: number[];
    depth: number;
    preDefined3?: number;
    boxes: VisualSampleEntryChild[];
};

// @public
export type VisualSampleEntryChild = any;

// @public
export type VisualSampleEntryType = "avc1" | "avc2" | "avc3" | "avc4" | "hev1" | "hvc1" | "encv";

// @public
export type WebVttConfigurationBox = {
    type: "vttC";
    config: string;
};

// @public
export type WebVttCueBox = {
    type: "vttc";
    boxes: WebVttCueChild[];
};

// @public
export type WebVttCueChild = WebVttCueIdBox | WebVttCuePayloadBox;

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
export function writeArdi(box: AudioRenderingIndicationBox): IsoBoxWriteView;

// @public
export function writeAudioSampleEntry<T extends AudioSampleEntryType = AudioSampleEntryType>(box: AudioSampleEntry<T>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeAvc1(box: VisualSampleEntry<"avc1">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeAvc2(box: VisualSampleEntry<"avc2">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeAvc3(box: VisualSampleEntry<"avc3">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeAvc4(box: VisualSampleEntry<"avc4">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeBytes(cursor: IsoBoxWriteCursor, data: ArrayLike<number>): void;

// @public
export function writeCtts(box: CompositionOffsetBox): IsoBoxWriteView;

// @public
export function writeDinf(box: DataInformationBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeDref(box: DataReferenceBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeEdts(box: EditBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeElng(box: ExtendedLanguageBox): IsoBoxWriteView;

// @public
export function writeElst(box: EditListBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeEmsg(box: EventMessageBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeEnca(box: AudioSampleEntry<"enca">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeEncv(box: VisualSampleEntry<"encv">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeFourCc(cursor: IsoBoxWriteCursor, value: string): void;

// @public
export function writeFree(box: FreeSpaceBox<"free">): IsoBoxWriteView;

// @public
export function writeFrma(box: OriginalFormatBox): IsoBoxWriteView;

// @public
export function writeFtyp(box: FileTypeBox): IsoBoxWriteView;

// @public
export function writeGrpl(box: GroupsListBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeHdlr(box: HandlerBox): IsoBoxWriteView;

// @public
export function writeHev1(box: VisualSampleEntry<"hev1">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeHvc1(box: VisualSampleEntry<"hvc1">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeIden(box: WebVttCueIdBox): IsoBoxWriteView;

// @public
export function writeImda(box: IdentifiedMediaDataBox): IsoBoxWriteView;

// @public
export function writeInt16(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeInt32(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeInt8(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeIsoBox(box: IsoBoxStreamable<IsoInt64>, config?: IsoBoxWriteConfig): Uint8Array<ArrayBuffer>;

// @public
export function writeIsoBoxes(boxes: Iterable<IsoBoxStreamable<IsoInt64>>, config?: IsoBoxWriteConfig): Uint8Array<ArrayBuffer>[];

// @public
export function writeKind(box: KindBox): IsoBoxWriteView;

// @public
export function writeLabl(box: LabelBox): IsoBoxWriteView;

// @public
export function writeMdat(box: MediaDataBox): IsoBoxWriteView;

// @public
export function writeMdhd(box: MediaHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeMdia(box: MediaBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMeco(box: AdditionalMetadataContainerBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMehd(box: MovieExtendsHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeMeta(box: MetaBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMfhd(box: MovieFragmentHeaderBox): IsoBoxWriteView;

// @public
export function writeMfra(box: MovieFragmentRandomAccessBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMfro(box: MovieFragmentRandomAccessOffsetBox): IsoBoxWriteView;

// @public
export function writeMinf(box: MediaInformationBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMoof(box: MovieFragmentBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMoov(box: MovieBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMp4a(box: AudioSampleEntry<"mp4a">, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMvex(box: MovieExtendsBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeMvhd(box: MovieHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writePayl(box: WebVttCuePayloadBox): IsoBoxWriteView;

// @public
export function writePrft(box: ProducerReferenceTimeBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writePrsl(box: PreselectionGroupBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writePssh(box: ProtectionSystemSpecificHeaderBox): IsoBoxWriteView;

// @public
export function writeSchi(box: SchemeInformationBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeSchm(box: SchemeTypeBox): IsoBoxWriteView;

// @public
export function writeSdtp(box: SampleDependencyTypeBox): IsoBoxWriteView;

// @public
export function writeSidx(box: SegmentIndexBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeSinf(box: ProtectionSchemeInfoBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeSkip(box: FreeSpaceBox<"skip">): IsoBoxWriteView;

// @public
export function writeSmhd(box: SoundMediaHeaderBox): IsoBoxWriteView;

// @public
export function writeSsix(box: SubsegmentIndexBox): IsoBoxWriteView;

// @public
export function writeStbl(box: SampleTableBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeStco(box: ChunkOffsetBox): IsoBoxWriteView;

// @public
export function writeSthd(box: SubtitleMediaHeaderBox): IsoBoxWriteView;

// @public
export function writeStrk(box: SubTrack<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeStsc(box: SampleToChunkBox): IsoBoxWriteView;

// @public
export function writeStsd(box: SampleDescriptionBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeStss(box: SyncSampleBox): IsoBoxWriteView;

// @public
export function writeStsz(box: SampleSizeBox): IsoBoxWriteView;

// @public
export function writeSttg(box: WebVttSettingsBox): IsoBoxWriteView;

// @public
export function writeStts(box: TimeToSampleBox): IsoBoxWriteView;

// @public
export function writeStyp(box: SegmentTypeBox): IsoBoxWriteView;

// @public
export function writeSubs(box: SubSampleInformationBox): IsoBoxWriteView;

// @public
export function writeTemplate16(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeTemplate32(cursor: IsoBoxWriteCursor, value: number): void;

// @public
export function writeTenc(box: TrackEncryptionBox): IsoBoxWriteView;

// @public
export function writeTerminatedUtf8(cursor: IsoBoxWriteCursor, value: string): void;

// @public
export function writeTfdt(box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTfhd(box: TrackFragmentHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTfra(box: TrackFragmentRandomAccessBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTkhd(box: TrackHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTraf(box: TrackFragmentBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeTrak(box: TrackBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeTref(box: TrackReferenceBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeTrex(box: TrackExtendsBox): IsoBoxWriteView;

// @public
export function writeTrun(box: TrackRunBox): IsoBoxWriteView;

// @public
export function writeUdta(box: UserDataBox<IsoInt64>, config: IsoBoxWriteConfig): IsoBoxWriteView;

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
export function writeUrl(box: DataEntryUrlBox): IsoBoxWriteView;

// @public
export function writeUrn(box: DataEntryUrnBox): IsoBoxWriteView;

// @public
export function writeUtf8(cursor: IsoBoxWriteCursor, value: string): void;

// @public
export function writeVisualSampleEntry<T extends VisualSampleEntryType = VisualSampleEntryType>(box: VisualSampleEntry<T>, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeVlab(box: WebVttSourceLabelBox): IsoBoxWriteView;

// @public
export function writeVmhd(box: VideoMediaHeaderBox): IsoBoxWriteView;

// @public
export function writeVttC(box: WebVttConfigurationBox): IsoBoxWriteView;

// @public
export function writeVttc(box: WebVttCueBox, config: IsoBoxWriteConfig): IsoBoxWriteView;

// @public
export function writeVtte(_box: WebVttEmptySampleBox): IsoBoxWriteView;

// @public
export function writeWideInt(cursor: IsoBoxWriteCursor, value: number | bigint, size: 4 | 8): void;

// @public
export function writeWideUint(cursor: IsoBoxWriteCursor, value: number | bigint, size: 4 | 8): void;

// (No @packageDocumentation comment for this package)

```
