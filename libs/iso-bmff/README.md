# @svta/cml-iso-bmff

ISO Base Media File Format (ISOBMFF) parsing functionality.

## Installation

```bash
npm i @svta/cml-iso-bmff
```

## Usage

### Reading boxes

Boxes can be read from a buffer using the `readIsoBoxes` function which returns an array of parsed boxes. By default the function will only read the box header. To parse the box content, a reader function must be provided for that box type.

> [!NOTE]
> Container boxes are automatically parsed and do not need a reader function. All known container types are listed in the `CONTAINERS` constant.

```typescript
import { readFtyp, readIsoBoxes } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer()
);

const boxes = readIsoBoxes(buffer, {
	readers: {
		ftyp: readFtyp,
	},
});
```

### Writing boxes

Boxes can be written to using the `writeIsoBoxes` function. The function takes an array of streamable items and returns a readable stream. Streamable items include:

- Raw box objects (e.g. `{ type: 'ftyp', majorBrand: 'isom', minorVersion: 1, compatibleBrands: ['isom'] }`)
- ArrayBufferViews like `Uint8Array` and `DataView` as well as the box strutures returned by the `readIsoBoxes` function (they adhere to the `ArrayBufferView` interface).

When providing raw box objects, a configuration object must be provided to specify the writers for those box types.

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

const stream = writeIsoBoxes(boxes, {
	writers: {
		ftyp: writeFtyp,
		mdat: writeMdat,
	},
});
```

#### Type safety

When working with raw box objects in TypeScript, cast the objects to a box type to ensure type safety. This can be done in two ways. Either by using a box type from the libray:

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
>
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
