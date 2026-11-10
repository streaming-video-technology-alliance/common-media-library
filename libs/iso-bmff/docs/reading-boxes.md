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

A box without a reader keeps only its header fields: `type`, `size`, and `view`. A container box also has its child boxes in `boxes`. The result type follows the reader map. With the map above, `box.type === "ftyp"` narrows to `FileTypeBox`, and `box.type === "mvhd"` is a compile error, because no reader parses that box.

Register the reader of every box type that your code narrows to:

```typescript
import { findIsoBox, readIsoBoxes, readMvhd } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/bbb.mp4").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, {
	readers: {
		mvhd: readMvhd,
	},
});

const mvhd = findIsoBox(boxes, (box) => box.type === "mvhd");

if (mvhd) {
	console.log(mvhd.timescale);
}
```

To replace one built-in reader and keep the types of the other built-in boxes, spread the readers of `defaultReaderConfig()` into the map. The section [Reading 64-bit fields](#reading-64-bit-fields) shows an example.

## Extending a built-in reader

A custom reader can call a built-in reader and add fields to the result. The result type of `readIsoBoxes` follows the custom reader, so `box.type === "emsg"` narrows to the return type of that reader.

HLS and DASH streams contain ID3 timed metadata in `emsg` boxes with the scheme `https://aomedia.org/emsg/ID3`. The built-in reader returns `messageData` as bytes. This reader decodes the frames once, when the box is read:

```typescript
import { ID3_SCHEME_ID_URI, getId3Frames, type Id3Frame } from "@svta/cml-id3";
import {
	readEmsg,
	readIsoBoxes,
	type IsoBoxReadView,
} from "@svta/cml-iso-bmff";

const readEmsgWithId3 = (view: IsoBoxReadView) => {
	const emsg = readEmsg(view);
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
	if (box.type === "emsg") {
		console.log(box.frames);
	}
}
```

The view finds a reader by the exact type and by the trimmed type. A reader under the key `url` reads the `"url "` box. The box type has a trailing space. `box.type === "url "` narrows to the return type of that reader.

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

To keep the other built-in readers, spread the readers of `defaultReaderConfig()` and replace the `tfdt` entry. The result type then has the `bigint` field for `tfdt` and the built-in type of every other box:

```typescript
import {
	defaultReaderConfig,
	readIsoBoxes,
	type IsoBoxReadView,
} from "@svta/cml-iso-bmff";

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
	readers: { ...defaultReaderConfig().readers, tfdt: readTfdt64 },
});
```

`IsoBoxWriteView.writeUint64` is the matching method for writing a `bigint`.
