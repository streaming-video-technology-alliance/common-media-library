---
title: Writing Boxes
description: Write boxes to byte arrays or streams
---

# Writing Boxes

Boxes can be written to using the `writeIsoBoxes` function. The function takes an array of streamable items and returns an array of `Uint8Array`s. Streamable items include:

- Raw box objects (e.g. `{ type: 'ftyp', majorBrand: 'isom', minorVersion: 1, compatibleBrands: ['isom'] }`)
- ArrayBufferViews like `Uint8Array` and `DataView` as well as the box structures returned by the `readIsoBoxes` function (they adhere to the `ArrayBufferView` interface).

When providing raw box objects, a configuration object must be provided to specify the writers for those box types.

> [!NOTE]
> Container boxes are automatically written and do not need a writer function. All known container types are listed in the `CONTAINERS` constant.

## Using default config

If tree shaking isn't a concern, use `defaultWriterConfig()` to get a configuration with all available writers pre-configured:

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

Boxes can also be written to a readable stream using the `createIsoBoxReadableStream` function. This also supports both the default config and specific writers approaches:

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

When working with raw box objects in TypeScript, cast the objects to a box type to ensure type safety. This can be done in two ways. Either by using a box type from the library:

```typescript
import type { FileTypeBox } from "@svta/cml-iso-bmff";

const box: FileTypeBox = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```

Or by using the `as const` operator on the `type` property:

```typescript
const box = {
	type: "ftyp" as const,
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```

Box types can also be accessed from `IsoBoxMap` using the box's FourCC:

```typescript
import type { IsoBoxMap } from "@svta/cml-iso-bmff";

const box: IsoBoxMap["ftyp"] = {
	type: "ftyp",
	majorBrand: "isom",
	minorVersion: 1,
	compatibleBrands: ["isom"],
};
```
