---
title: Writing Boxes
description: Write boxes to byte arrays or streams
---

# Writing Boxes

The `writeIsoBoxes` function writes boxes. It takes an array of streamable items and returns an array of `Uint8Array`s. Streamable items include:

- Raw box objects, such as `{ type: 'ftyp', majorBrand: 'isom', minorVersion: 1, compatibleBrands: ['isom'] }`
- ArrayBufferViews such as `Uint8Array` and `DataView`, and the box structures that `readIsoBoxes` returns. Those structures implement the `ArrayBufferView` interface.

If you provide raw box objects, also provide a configuration object that names the writers for those box types.

> [!NOTE]
> The function writes container boxes automatically, so they do not need a writer function. The `CONTAINERS` constant lists all known container types.

## Using default config

If tree shaking is not a concern, use `defaultWriterConfig()`. It returns a configuration with every available writer:

```typescript
import { defaultWriterConfig, writeIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = [
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
	sourceBuffer.appendBuffer(byteArray.buffer);
	// wait for updateend event
}
```

## Using specific writers

For optimal bundle size with tree shaking, import only the writers you need:

```typescript
import { writeFtyp, writeIsoBoxes, writeMdat } from "@svta/cml-iso-bmff";

const boxes = [
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
	sourceBuffer.appendBuffer(byteArray.buffer);
	// wait for updateend event
}
```

## Streaming boxes

The `createIsoBoxReadableStream` function writes boxes to a readable stream. It supports both the default config and specific writers:

```typescript
import {
	createIsoBoxReadableStream,
	defaultWriterConfig,
} from "@svta/cml-iso-bmff";

const boxes = [
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

const stream = await webTransport.createBidirectionalStream();
readableStream.pipeTo(transport.writable);
```

## Type safety

In TypeScript, cast raw box objects to a box type for type safety. There are two ways. The first way uses a box type from the library:

```typescript
import type { FileTypeBox } from "@svta/cml-iso-bmff";

const box: FileTypeBox = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```

The second way uses the `as const` operator on the `type` property:

```typescript
const box = {
	type: "ftyp" as const,
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```

You can also get a box type from `IsoBoxMap` with the box's FourCC:

```typescript
import type { IsoBoxMap } from "@svta/cml-iso-bmff";

const box: IsoBoxMap["ftyp"] = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```
