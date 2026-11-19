---
title: Writing Boxes
description: Write boxes to a byte array or a stream
---

# Writing Boxes

The `writeIsoBoxes` function writes boxes. It takes an iterable of streamable items and returns one `Uint8Array` with every box. Streamable items include:

- Box objects, such as `{ type: 'ftyp', majorBrand: 'isom', minorVersion: 1, compatibleBrands: ['isom'] }`
- `ArrayBufferView`s such as `Uint8Array` and `DataView`.
- Boxes that `readIsoBoxes` returns. A box with no reader and a type outside `CONTAINERS` is a raw box with a `bytes` field. The function copies those bytes, even if the `writers` map has a writer for the type. To change a raw box, build a box object with the fields and no `bytes` field. A box that a reader returns needs a writer in the `writers` map.

If you provide box objects, also provide a configuration object that names the writers for those box types. The key of the `writers` map is the exact four-character type. The keys `'url '` and `'urn '` have a trailing space. The keys `url` and `urn` also find the writers of those boxes.

A writer follows the `flags` and the `version` of the box. The writer writes a field only when the flags or the version select that field. A writer does not throw for a missing numeric field that the flags select, and writes 0. A missing list field, such as `samples` of a `trun` box, throws a `TypeError`.

> [!NOTE]
> The function writes container boxes automatically, so they do not need a writer function. The `CONTAINERS` constant lists all known container types. Each container type also has a named writer, such as `writeMoov` and `writeMoof`. A container writer in the `writers` map is optional and does not change the written bytes.
>
> The function does not write a box of another type as a container, even if the box has a `boxes` field. Examples are `meta` and the sample entries. A raw box of such a type keeps its bytes. For any other box of such a type with no writer, the function throws `No writer found for box type`.

A write omits the bytes of a source box that the reader stops before. See [Incomplete boxes](reading-boxes.md#incomplete-boxes).

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

`writeFourCc`, `beginIsoBox`, and `beginIsoFullBox` throw a `RangeError` for a code that does not have 4 characters. `endIsoBox` throws a `RangeError` for a box above 2^32 - 1 bytes.

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

The built-in writers take each 64-bit field as a `number` or as a `bigint`. A `number` holds integers up to 2^53 - 1 exactly, and a `bigint` holds the exact value. The guide [Reading 64-bit fields](reading-boxes.md#reading-64-bit-fields) lists the fields.

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

A writer does not check the range of a `number`. In an unsigned 64-bit field, a `number` of 2^64 or more writes all bits set. The default reader returns 2^64 for a field with all bits set, so a read and then a write keep that field. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. See [Reporting a rounded value](reading-boxes.md#reporting-a-rounded-value) for the read of that value.

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
