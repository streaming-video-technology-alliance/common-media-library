---
title: Reading Boxes
description: Parse ISO BMFF boxes from a buffer
---

# Reading Boxes

The `readIsoBoxes` function reads boxes from a buffer and returns an array of parsed boxes. By default, the function reads only the box header. To parse the content of a box, provide a reader function for that box type.

> [!NOTE]
> The function parses container boxes automatically, so they do not need a reader function. The `CONTAINERS` constant lists all known container types. Each container type also has a named reader, such as `readMoov` and `readMoof`. A container reader in the `readers` map is optional and does not change the result.

## Using default config

If tree shaking is not a concern, use `defaultReaderConfig()`. It returns a configuration with every available reader except the container readers:

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

## Extending a built-in reader

A custom reader can call a built-in reader and add fields to the result. The result type of `readIsoBoxes` follows the custom reader. A key in the reader map replaces the built-in type of that box in the result type. `box.type === "emsg"` therefore narrows to the return type of the custom reader.

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

The view finds a reader by the exact type and by the trimmed type. A reader under the key `url` reads the `"url "` box. The box type has a trailing space. The result type then replaces the built-in `"url "` type with the return type of that reader.

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
