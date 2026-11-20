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

A write omits the bytes of a source box that the reader stops before. See [Incomplete boxes](https://cml.svta.org/llms/iso-bmff/docs/reading-boxes.md#incomplete-boxes).

## Using default config

If tree shaking is not a concern, use `defaultWriterConfig()`. It returns a configuration with every available writer except the container writers:

```typescript
import { defaultWriterConfig, writeIsoBoxes, type IsoBoxStreamable } from "@svta/cml-iso-bmff";

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

const byteArrays = writeIsoBoxes(boxes, defaultWriterConfig());

for (const byteArray of byteArrays) {
	sourceBuffer.appendBuffer(byteArray);
	await new Promise((resolve) =>
		sourceBuffer.addEventListener("updateend", resolve, { once: true }),
	);
}
```

Each call of `defaultWriterConfig()` returns a new configuration object. A player can create the configuration once and pass it to every write.

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
	defaultWriterConfig,
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

const readableStream = createIsoBoxReadableStream(boxes, defaultWriterConfig());

const stream = await transport.createBidirectionalStream();
readableStream.pipeTo(stream.writable);
```

## Writing 64-bit fields

The built-in writers take each 64-bit field as a `number` or as a `bigint`. A `number` holds integers up to 2^53 - 1 exactly, and a `bigint` holds the exact value. The guide [Reading 64-bit fields](https://cml.svta.org/llms/iso-bmff/docs/reading-boxes.md#reading-64-bit-fields) lists the fields.

A box that `readIsoBoxes` reads with `readInt64AsBigInt` has `bigint` fields. The writers write that box with no conversion, and the writer configuration needs no option:

```typescript
import {
	findIsoBox,
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
const tfdt = findIsoBox(boxes, (box) => box.type === "tfdt");

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

A writer does not check the range of a `number`. In an unsigned 64-bit field, a `number` of 2^64 or more writes all bits set. The default reader returns 2^64 for a field with all bits set, so a read and then a write keep that field. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. See [Reporting a rounded value](https://cml.svta.org/llms/iso-bmff/docs/reading-boxes.md#reporting-a-rounded-value) for the read of that value.

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
