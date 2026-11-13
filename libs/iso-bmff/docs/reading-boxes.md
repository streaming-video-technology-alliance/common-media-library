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
	defaultReaderConfig,
	readInt64AsBigInt,
	readIsoBoxes,
} from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(
	buffer,
	defaultReaderConfig({ int64: readInt64AsBigInt }),
);

for (const box of boxes) {
	if (box.type === "sidx") {
		// earliestPresentationTime is a bigint.
		const seconds = box.earliestPresentationTime / BigInt(box.timescale);
		console.log(seconds);
	}
}
```

Pass the option as the argument of `defaultReaderConfig`. The readers of the returned configuration have the types of that option. If you add `readInt64AsBigInt` to the result of `defaultReaderConfig()` afterward, the code does not compile.

The option works the same way with specific readers:

```typescript
import { readInt64AsBigInt, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: {
		tfdt: readTfdt,
	},
});

for (const box of boxes) {
	if (box.type === "tfdt") {
		// baseMediaDecodeTime is a bigint.
		console.log(box.baseMediaDecodeTime);
	}
}
```

Each field has one type for every version of its box. A version 0 `tfdt` box stores `baseMediaDecodeTime` in 32 bits. The reader returns that field as a `bigint` too, so your code does not test `version`. The option also applies to the child boxes of a container.

`readInt64AsBigInt` needs `BigInt` and does not test for it. On a runtime without `BigInt`, the read of a 64-bit field fails with the error of the runtime. If your code supports such a runtime, test `typeof BigInt === "function"` before you pass the function.

`JSON.stringify` throws a `TypeError` for a `bigint`. To serialize a box with `bigint` fields, pass a replacer function that converts each `bigint` to a string.

### Reporting a rounded value

If your code keeps `number` fields, use `createInt64OverflowReader`. The function takes a callback and returns a function for the `int64` option. When a 64-bit value is outside the safe integer range, the callback receives a `RangeError`. If the callback returns, the read continues with the rounded value. If the callback throws, the read stops with that error.

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

The types of the result do not change, and the function does not need `BigInt`. The function checks the fields of the table above. The function does not check a call of `readUint(8)` in a custom reader. A configuration takes one function for the option. The configuration selects `bigint` fields or the report, not both.

### Custom readers and the option

A custom reader of the type `(view: IsoBoxReadView) => ...` works with no option and with `createInt64OverflowReader`. With `readInt64AsBigInt`, that reader is a compile error, because the view then has `bigint` fields. Use one of two forms:

- A reader that reads no 64-bit field takes `IsoBoxReadView<IsoInt64>`. That type accepts the view of every configuration.
- A reader that follows the option is generic. That reader reads each 64-bit field with `readWideUint` or `readWideInt`.

`readWideUint` and `readWideInt` take the size of the field in bytes, 4 or 8. With no option, they return a `number`, as `readUint` and `readInt` do. With the option, they return the result of the `int64` function:

```typescript
import {
	readInt64AsBigInt,
	readIsoBoxes,
	type IsoBoxReadView,
	type IsoInt64,
} from "@svta/cml-iso-bmff";

const readTfdtWide = <V extends IsoInt64>(view: IsoBoxReadView<V>) => {
	const { version, flags } = view.readFullBox();
	const baseMediaDecodeTime = view.readWideUint(version === 1 ? 8 : 4);
	return { type: "tfdt" as const, version, flags, baseMediaDecodeTime };
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

A readers map in a variable gives the same types as an inline map for the built-in readers. TypeScript does not select the type of a generic custom reader in a variable. Without the type argument, the fields of that reader have the type `number | bigint`.

### A function that forwards the option

Your code can have a function that takes a configuration and passes that configuration to `readIsoBoxes`. Give the function a type parameter for the type of the 64-bit fields. The result type then follows the configuration of each call:

```typescript
import {
	defaultReaderConfig,
	readInt64AsBigInt,
	readIsoBoxes,
	type IsoBoxData,
	type IsoBoxReadViewConfig,
	type IsoInt64,
	type ParsedIsoBox,
} from "@svta/cml-iso-bmff";

function readSegment<V extends IsoInt64 = number>(
	data: IsoBoxData,
	config: IsoBoxReadViewConfig<V>,
): ParsedIsoBox<V>[] {
	return readIsoBoxes(data, config);
}

// The 64-bit fields are numbers in this result.
const plain = readSegment(buffer, defaultReaderConfig());

// The 64-bit fields are bigints in this result.
const exact = readSegment(
	buffer,
	defaultReaderConfig({ int64: readInt64AsBigInt }),
);
```

Do not type the parameter as `IsoBoxReadViewConfig<IsoInt64>`. That type does not accept the result of `defaultReaderConfig({ int64: readInt64AsBigInt })`.

### A custom reader for one field

If your code needs the exact value of one field only, a custom reader can call `readUint64`. The method returns a `bigint` and needs no option:

```typescript
import { readIsoBoxes, type IsoBoxReadView } from "@svta/cml-iso-bmff";

const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox();
	const baseMediaDecodeTime =
		version === 1 ? view.readUint64() : BigInt(view.readUint(4));
	return { type: "tfdt" as const, version, flags, baseMediaDecodeTime };
};

const boxes = readIsoBoxes(buffer, {
	readers: {
		tfdt: readTfdt64,
	},
});
```

The built-in writers write a `bigint` field with the exact value. See [Writing 64-bit fields](writing-boxes.md#writing-64-bit-fields).
