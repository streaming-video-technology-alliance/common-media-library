---
title: Reading Boxes
description: Read ISO BMFF boxes from a buffer
---

# Reading Boxes

The `readIsoBoxes` function reads boxes from a buffer and returns an array of boxes. To read the fields of a box, provide a reader function for that box type. The result has two kinds of boxes:

- A **box object** has a `type` field and the fields of the box. A reader returns a box object.
- A **raw box** is a box with no reader: `{ boxType, bytes, headerSize }`. `boxType` is the four-character code of the box. `bytes` is the complete box, with its header. The body of the box is `box.bytes.subarray(box.headerSize)`. A raw `uuid` box also has `usertype`.

The bytes of a raw box share memory with the input.

A raw box has no `type` field. A test such as `box.type === "tfdt"` narrows a box to that box type, and never matches a raw box. A box with no reader is a raw box, so add the reader of a box type before you test for that type. The four-character code of any box is `box.type ?? box.boxType`.

> [!NOTE]
> The function reads container boxes automatically, so they do not need a reader function. The `CONTAINERS` constant lists the container box types that the function reads automatically. Each container type also has a named reader, such as `readMoov` and `readMoof`. A container reader in the `readers` map is optional and does not change the result.

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

## Optional fields

A box object from a built-in reader has every key of its type. A field that the flags, the version, or the size of the box excludes is `undefined`. To check for a field, test its value for `undefined`, or test the flags or the version. Do not test the key with `in` or `Object.keys`. The key is always present.

## Reading one box

`seekIsoBox` finds a box by its path and returns a read cursor for that box. The function reads no other box. Pass the cursor to the reader of the box:

```typescript
import { readTfdt, seekIsoBox } from "@svta/cml-iso-bmff";

const cursor = seekIsoBox(buffer, ["moof", "traf", "tfdt"]);
const time = cursor ? readTfdt(cursor).baseMediaDecodeTime : null;
```

The function returns `null` for a missing box and for a truncated box. If your code reads partial data, a `null` result means that the box can be in the next bytes. The third argument takes the `int64` option, as `readIsoBoxes` does.

`seekIsoBox` treats the body of each box in the path as a list of boxes. Some boxes have fields before their child boxes, such as `meta`, `stsd`, and the sample entries. For such a box, move the position of the cursor past the fields, then call `seekIsoBox` again with the cursor. The second call does not move the first cursor:

```typescript
import { seekIsoBox } from "@svta/cml-iso-bmff";

const stsd = seekIsoBox(buffer, ["moov", "trak", "mdia", "minf", "stbl", "stsd"]);

if (stsd) {
	stsd.pos += 8; // version, flags, and entry_count
	const avc1 = seekIsoBox(stsd, ["avc1"]);
	console.log(avc1 && avc1.end - avc1.start);
}
```

## Stepping over boxes

`nextIsoBox` returns the type of the box at the position of a cursor and moves the position past that box. The function reads no field of the box. The bytes from the old position to the new position are the complete box:

```typescript
import { createIsoBoxReadCursor, nextIsoBox } from "@svta/cml-iso-bmff";

const cursor = createIsoBoxReadCursor(buffer);
let start = cursor.pos;
let type = nextIsoBox(cursor);

while (type) {
	console.log(type, cursor.pos - start); // the type and the size of each box
	start = cursor.pos;
	type = nextIsoBox(cursor);
}
```

The function returns `null` at the end of the cursor and before a truncated box. The position then stays at the first byte of that box.

## Extending a built-in reader

A custom reader can call a built-in reader and add fields to the result. In the result of `readIsoBoxes`, the box has the built-in type. The loop tests `box.type`, then casts the box to the result type of the reader.

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

type EmsgWithId3 = ReturnType<typeof readEmsgWithId3>;

for (const box of boxes) {
	if (box.type === "emsg") {
		console.log((box as EmsgWithId3).frames);
	}
}
```

A byte field such as `messageData` is a view over the input data. The field shares memory with that data and is not a copy. To keep the bytes after your code releases or changes the input, call `slice()` on the field.

## Writing a custom reader

The package parses no codec configuration box, such as `avcC`, `hvcC`, or `esds`. The `boxes` field of a sample entry, such as `avc1`, holds such a box as a raw box with its bytes. To read the fields of the box, write a custom reader for its box type.

The `readers` map takes a reader under a key of `IsoBoxMap`. For a box type that the package does not name, add the type to `IsoCustomBoxMap` first. `readIsoBoxes` and the write functions then have that box type.

A reader takes a read cursor and the box type, and returns the box object with its `type` field. A field function reads one field at `cursor.pos` and moves the position past the field, such as `readUint32` or `readFourCc`:

```typescript
import {
	findIsoBox,
	readFourCc,
	readIsoBoxes,
	readUint16,
	readUint32,
	type IsoBoxReadCursor,
	type IsoInt64,
} from "@svta/cml-iso-bmff";

// A box type that the package does not name.
type AbcdBox = { type: "abcd"; brand: string; count: number; flags: number };

// Add the box type to the map of custom box types.
declare module "@svta/cml-iso-bmff" {
	interface IsoCustomBoxMap {
		abcd: AbcdBox;
	}
}

const readAbcd = (cursor: IsoBoxReadCursor<IsoInt64>): AbcdBox => ({
	type: "abcd",
	brand: readFourCc(cursor),
	count: readUint32(cursor),
	flags: readUint16(cursor),
});

const boxes = readIsoBoxes(buffer, { readers: { abcd: readAbcd } });

// The test narrows the box to `AbcdBox`.
console.log(findIsoBox(boxes, (box) => box.type === "abcd")?.brand);
```

The cursor follows these rules:

- `cursor.start` is the first byte of the box header, and `cursor.end` is the first byte after the box. The cursor of a reader starts at the first byte after the header. For a `uuid` box, the cursor starts at the first byte of `usertype`. Read it with `readBytes(cursor, 16)`.
- A read past `cursor.end` throws a `RangeError`, so a reader cannot read the bytes of the next box. A reader can stop before the end of its box.
- A length is an integer of 0 or more. Another length throws a `RangeError`.
- The bytes that remain are `cursor.end - cursor.pos`. To skip bytes, add to `cursor.pos`.
- A reader of a box with child boxes reads them with `readChildBoxes(cursor)`. The readers of the configuration then apply to the child boxes.
- `readIsoBoxes` uses one cursor for every box. A reader must not keep the cursor after it returns. A reader that needs bytes later keeps the result of `readBytes`.
- The declaration of `IsoCustomBoxMap` applies to every file of the program. Two declarations of one box type need the same type.
- A reader under a key returns the box type of that key. The reader can add fields. A reader with another result type is a compile error.

`readIsoBoxes` does not catch an error of a reader. The error reaches the caller.

`readIsoBoxes` finds a reader by the exact type and by the trimmed type. A reader under the key `url` reads the `"url "` box. The box type has a trailing space.

`IsoBoxMap` names the sample entry types of these codecs: `ac-3`, `ac-4`, `av01`, `dav1`, `dva1`, `dvav`, `dvh1`, `dvhe`, `ec-3`, `fLaC`, `Opus`, and `vp09`. The default configuration has no reader for these types. Create a reader with `createAudioSampleEntryReader` or `createVisualSampleEntryReader`, such as `{ "ec-3": createAudioSampleEntryReader("ec-3") }`.

## Incomplete boxes

A box is incomplete when the data ends inside the header or inside the body of the box. A box is also incomplete when its size is below the size of its header. `readIsoBoxes` stops before the first incomplete box and returns the boxes before that box. The function does not throw for an incomplete box.

`readIsoBoxes` returns no position. To continue a read with more data, read with a cursor. After `readChildBoxes` or `nextIsoBox` stops before an incomplete box, the position of the cursor is the first byte of that box. Keep the bytes from that position, add the new bytes, and read again:

```typescript
import { createIsoBoxReadCursor, readChildBoxes } from "@svta/cml-iso-bmff";

const cursor = createIsoBoxReadCursor(buffer);
const boxes = readChildBoxes(cursor);

// The first incomplete box starts at the first byte of `rest`.
const rest = buffer.slice(cursor.pos);
```

The position has two limits:

- The position applies to the boxes of one level. If a child box of a complete box is incomplete, the reader of the parent box stops before the child box. The read then continues after the parent box, and the position does not show the child box.
- The position does not separate an incomplete box from a box with a bad size. A wrong `size` value above the remaining data stops the read at the same position. More data then does not complete the box.

A box with a reader in the configuration and a body shorter than its fields is not an incomplete box. `readIsoBoxes` then throws a `RangeError` and returns no boxes. A box that is deeper than 128 levels also throws a `RangeError`. If the data comes from the network, call `readIsoBoxes` inside a `try` block.

The size of a box includes its header. The header has 8 bytes, or 16 bytes when `size` is 1 and a `largesize` field follows (ISO/IEC 14496-12, clause 4.2). The header of a `uuid` box has 16 more bytes for the `usertype` field. A `size` of 0 is valid and means that the box extends to the end of the data.

The same rule applies to the child boxes of a container and of a sample entry. Some QuickTime files have 4 zero bytes after the last child box of a `udta` box. Other QuickTime files have those bytes at the end of an `avc1` or `hvc1` sample entry. A box header has at least 8 bytes, so the reader stops before those bytes. The box object has the child boxes and no field for those bytes.

A writer builds a container or a sample entry from the child boxes of the box object. A write therefore omits those bytes. The written box is shorter than the source box by those bytes. If the `moov` box precedes the `mdat` box, the chunk offsets of the written file then address other bytes. The `mfraSize` field of an `mfro` box has the same limit. See [Writing a changed `mfra` box](writing-boxes.md#writing-a-changed-mfra-box).

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
| `emsg`                 | `presentationTime`                              |
| `mehd`                 | `fragmentDuration`                              |
| `mvhd`, `mdhd`, `tkhd` | `creationTime`, `modificationTime`, `duration`  |
| `elst`                 | `segmentDuration` and `mediaTime` of each entry |
| `tfhd`                 | `baseDataOffset`                                |
| `co64`                 | each entry of `chunkOffset`                     |

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

// A readers map in a variable works the same way.
const readers = { tfdt: readTfdtWide };
const stored = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers });
```

The result type follows the `int64` option, not the readers map. With `isIsoBoxType("tfdt", box)`, the box has the built-in type with `bigint` fields. To read the `source` field, cast the box to `ReturnType<typeof readTfdtWide<bigint>>`.

TypeScript reads the type of the `int64` function to select the type of the fields. Pass a named function, such as `readInt64AsBigInt`. For a function that you write inside the configuration object, give the `cursor` parameter the type `IsoBoxReadCursor<IsoInt64>`. Without that type, a function after a `readers` map with a generic reader can fail to compile.

The type of the fields also follows a type that your code writes, such as `readIsoBoxes<bigint>(buffer)` or a variable of the type `ParsedIsoBox<bigint>[]`. TypeScript does not check such a type against the `int64` option. Let TypeScript infer the type from the option.

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

If your code needs the exact value of one field only, a custom reader can call `readUint64`. The function returns a `bigint` and needs no option. A reader under the key `tfdt` returns the `tfdt` box type, so the reader adds the exact value as a new field:

```typescript
import {
	readIsoBoxes,
	readUint24,
	readUint32,
	readUint64,
	readUint8,
	type IsoBoxReadCursor,
} from "@svta/cml-iso-bmff";

const readTfdtExact = (cursor: IsoBoxReadCursor) => {
	const version = readUint8(cursor);
	const flags = readUint24(cursor);
	const exactTime =
		version === 1 ? readUint64(cursor) : BigInt(readUint32(cursor));
	return {
		type: "tfdt" as const,
		version,
		flags,
		baseMediaDecodeTime: Number(exactTime),
		exactTime,
	};
};

const boxes = readIsoBoxes(buffer, {
	readers: {
		tfdt: readTfdtExact,
	},
});

type TfdtExact = ReturnType<typeof readTfdtExact>;

for (const box of boxes) {
	if (box.type === "tfdt") {
		console.log((box as TfdtExact).exactTime);
	}
}
```

The built-in writers write a `bigint` field with the exact value. See [Writing 64-bit fields](writing-boxes.md#writing-64-bit-fields).
