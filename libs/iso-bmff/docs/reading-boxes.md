---
title: Reading Boxes
description: Parse ISO BMFF boxes from a buffer
---

# Reading Boxes

The `readIsoBoxes` function reads boxes from a buffer and returns an array of parsed boxes. By default, the function reads only the box header. To parse the content of a box, provide a reader function for that box type.

> [!NOTE]
> The function parses container boxes automatically, so they do not need a reader function. The `CONTAINERS` constant lists all known container types.

## Using default config

If tree shaking is not a concern, use `defaultReaderConfig()`. It returns a configuration with every available reader:

```typescript
import { defaultReaderConfig, readIsoBoxes } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, defaultReaderConfig());
```

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

## Reading 64-bit fields

The built-in readers return every integer field as a `number`. A `number` holds integers up to 2^53 - 1 exactly. A 64-bit field can exceed that limit. One example is `baseMediaDecodeTime` in a version 1 `tfdt` box with a 10 MHz timescale and a wall-clock origin.

If your code needs the exact value, write a custom reader that calls `readUint64`. The method returns a `bigint`:

```typescript
import { readIsoBoxes, type IsoBoxReadView } from "@svta/cml-iso-bmff";

const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox();
	const baseMediaDecodeTime =
		version === 1 ? view.readUint64() : BigInt(view.readUint(4));
	return { type: "tfdt" as const, version, flags, baseMediaDecodeTime };
};

const buffer = await fetch("https://example.com/segment.m4s").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, {
	readers: {
		tfdt: readTfdt64,
	},
});
```

`IsoBoxWriteView.writeUint64` is the matching method for writing a `bigint`.
