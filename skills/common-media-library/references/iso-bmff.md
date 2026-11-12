<!-- libs/iso-bmff/README.md -->
# @svta/cml-iso-bmff

ISO Base Media File Format (ISO BMFF) parsing.

Documentation: [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/)

## When to use

- Parse the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read 64-bit fields, such as a tfdt time at a 10 MHz timescale, with the exact value: `readInt64AsBigInt`, `createInt64OverflowReader`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Write boxes to a ReadableStream: `createIsoBoxReadableStream`, `IsoBoxReadableStream`
- Write or patch boxes, such as inserting emsg or rewriting tfdt: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`
- Read or write a box type that the package does not name: `IsoBoxReadView`, `IsoBoxWriteView`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.

## Installation

```bash
npm i @svta/cml-iso-bmff
```

## Usage

- [Reading boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md) - Parse ISO BMFF boxes from a buffer
- [Writing boxes](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md) - Write boxes to byte arrays or streams
- [Utilities](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/utilities.md) - Traverse boxes and type guards

<!-- libs/iso-bmff/docs/reading-boxes.md -->
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

The types of the result do not change, and the function does not need `BigInt`. The function checks the fields of the table above. It does not check a call of `readUint(8)` in a custom reader. A configuration takes one function for the option. It therefore selects `bigint` fields or the report, not both.

### Custom readers and the option

A custom reader of the type `(view: IsoBoxReadView) => ...` works with no option and with `createInt64OverflowReader`. With `readInt64AsBigInt`, that reader is a compile error, because the view then has `bigint` fields. Use one of two forms:

- A reader that reads no 64-bit field takes `IsoBoxReadView<IsoInt64>`. That type accepts the view of every configuration.
- A reader that follows the option is generic. It reads each 64-bit field with `readWideUint` or `readWideInt`.

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

The built-in writers write a `bigint` field with the exact value. See [Writing 64-bit fields](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/writing-boxes.md#writing-64-bit-fields).

<!-- libs/iso-bmff/docs/utilities.md -->
---
title: Utilities
description: Traversing boxes and type guards
---

# Utilities

## Traversing boxes

The `traverseIsoBoxes` function traverses box iterators and returns a generator of boxes. It takes an iterable of boxes and two optional arguments: depth-first traversal and maximum depth. By default, the function traverses depth-first with a maximum depth of infinity. A maximum depth of 0 traverses only the root boxes.

```typescript
import { readIsoBoxes, traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = readIsoBoxes(buffer);

for (const box of traverseIsoBoxes(boxes)) {
	console.log(box.type);
}
```

## Type guards

The library provides type guards that check whether a box is a container box or a full box. These guards narrow the type of a box in TypeScript.

`isContainer` checks whether a box is a container box.

```typescript
import { isContainer, type IsoBox } from "@svta/cml-iso-bmff";

const box: IsoBox = { type: "meta", version: 0, flags: 0, boxes: [] };
const container = isContainer(box);
```

`isFullBox` checks whether a box is a full box.

```typescript
import { isFullBox } from "@svta/cml-iso-bmff";

const box = { type: "meta", version: 1, flags: 0 };
const fullBox = isFullBox(box);
```

<!-- libs/iso-bmff/docs/writing-boxes.md -->
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
	// wait for updateend event
}
```

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
	// wait for updateend event
}
```

## Streaming boxes

The `createIsoBoxReadableStream` function writes boxes to a readable stream. It supports both the default config and specific writers:

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

The built-in writers take each 64-bit field as a `number` or as a `bigint`. A `number` holds integers up to 2^53 - 1 exactly, and a `bigint` holds the exact value. The guide [Reading 64-bit fields](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/libs/iso-bmff/docs/reading-boxes.md#reading-64-bit-fields) lists the fields.

A box that `readIsoBoxes` reads with `readInt64AsBigInt` has `bigint` fields. The writers write that box with no conversion, and the writer configuration needs no option:

```typescript
import {
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
	writeIsoBox,
	writeTfdt,
} from "@svta/cml-iso-bmff";

const [tfdt] = readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: {
		tfdt: readTfdt,
	},
});

if (tfdt?.type === "tfdt") {
	tfdt.baseMediaDecodeTime += BigInt(90000);

	const bytes = writeIsoBox(tfdt, { writers: { tfdt: writeTfdt } });
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

<!-- libs/iso-bmff/config/cml-iso-bmff.api.md -->
## API Report File for "@svta/cml-iso-bmff"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { ValueOf } from '@svta/cml-utils';

// @public
export type AdditionalMetadataContainerBox = {
    type: "meco";
    boxes: AdditionalMetadataContainerBoxChild[];
};

// @public
export type AdditionalMetadataContainerBoxChild = any;

// @public
export type AudioRenderingIndicationBox = FullBox & {
    type: "ardi";
    audioRenderingIndication: number;
};

// @public
export type AudioSampleEntryBox<T extends IsoBoxType = AudioSampleEntryType> = SampleEntryBox & {
    type: T;
    reserved2: number[];
    channelcount: number;
    samplesize: number;
    preDefined: number;
    reserved3: number;
    samplerate: number;
    boxes: AudioSampleEntryBoxChild[];
};

// @public
export type AudioSampleEntryBoxChild = any;

// @public
export type AudioSampleEntryType = "mp4a" | "enca";

// @public
export type Box<T extends IsoBoxType = never> = {
    type: T;
};

// @public
export type ChunkLargeOffsetBox = FullBox & {
    type: "co64";
    entryCount: number;
    chunkOffset: number[];
};

// @public
export type ChunkOffsetBox = FullBox & {
    type: "stco";
    entryCount: number;
    chunkOffset: number[];
};

// @public (undocumented)
export type co64 = ChunkLargeOffsetBox;

// @public
export type CompactSampleSizeBox = FullBox & {
    type: "stz2";
    fieldSize: number;
    sampleCount: number;
    entrySize: number[];
};

// @public
export type CompositionTimeToSampleBox = FullBox & {
    type: "ctts";
    entryCount: number;
    entries: CompositionTimeToSampleEntry[];
};

// @public
export type CompositionTimeToSampleEntry = {
    sampleCount: number;
    sampleOffset: number;
};

// @public
export const CONTAINERS: string[];

// @public
export function createAudioSampleEntryReader<T extends IsoBoxType>(type: T): (view: IsoBoxReadView<IsoInt64>) => AudioSampleEntryBox<T>;

// @public
export function createInt64OverflowReader(onOverflow: (error: RangeError) => void): IsoInt64Reader;

// @public
export function createIsoBoxReadableStream(boxes: Iterable<IsoBoxStreamable<IsoInt64>>, config: IsoBoxWriteViewConfig): ReadableStream<Uint8Array>;

// @public
export function createVisualSampleEntryReader<T extends IsoBoxType>(type: T): (view: IsoBoxReadView<IsoInt64>) => VisualSampleEntryBox<T>;

// @public
export const DATA: "data";

// @public
export type DataEntryUrlBox = FullBox & {
    type: "url ";
    location: string;
};

// @public
export type DataEntryUrnBox = FullBox & {
    type: "urn ";
    name: string;
    location: string;
};

// @public
export type DataInformationBox = {
    type: "dinf";
    boxes: DataInformationBoxChild[];
};

// @public
export type DataInformationBoxChild = DataReferenceBox;

// @public
export type DataReferenceBox = FullBox & {
    type: "dref";
    entryCount: number;
    entries: (DataEntryUrlBox | DataEntryUrnBox)[];
};

// @public
export type DecodingTimeSample = {
    sampleCount: number;
    sampleDelta: number;
};

// @public
export type DecodingTimeToSampleBox = FullBox & {
    type: "stts";
    entryCount: number;
    entries: DecodingTimeSample[];
};

// @public
export function defaultReaderConfig<V extends IsoInt64 = number>(options?: {
    int64?: IsoInt64Reader<V>;
}): IsoBoxReadViewConfig<V>;

// @public
export function defaultWriterConfig(): IsoBoxWriteViewConfig;

// @public
export type DegradationPriorityBox = FullBox & {
    type: "stdp";
    priority: number[];
};

// @public
export type EditBox<V extends IsoInt64 = number> = {
    type: "edts";
    boxes: EditBoxChild<V>[];
};

// @public
export type EditBoxChild<V extends IsoInt64 = number> = EditListBox<V>;

// @public
export type EditListBox<V extends IsoInt64 = number> = FullBox & {
    type: "elst";
    entryCount: number;
    entries: EditListEntry<V>[];
};

// @public
export type EditListEntry<V extends IsoInt64 = number> = {
    segmentDuration: V;
    mediaTime: V;
    mediaRateInteger: number;
    mediaRateFraction: number;
};

// @public
export type EncryptedSample = {
    initializationVector?: Uint8Array;
    subsampleEncryption?: SubsampleEncryption[];
};

// @public
export type Entity = {
    entityId: number;
};

// @public
export type EventMessageBox<V extends IsoInt64 = number> = EventMessageBoxV0 | EventMessageBoxV1<V>;

// @public
export type EventMessageBoxBase = FullBox & {
    type: "emsg";
    schemeIdUri: string;
    value: string;
    timescale: number;
    eventDuration: number;
    id: number;
    messageData: Uint8Array;
};

// @public
export type EventMessageBoxV0 = EventMessageBoxBase & {
    version: 0;
    presentationTimeDelta: number;
};

// @public
export type EventMessageBoxV1<V extends IsoInt64 = number> = EventMessageBoxBase & {
    version: 1;
    presentationTime: V;
};

// @public
export type ExtendedLanguageBox = FullBox & {
    type: "elng";
    extendedLanguage: string;
};

// @public
export type FileTypeBox = TypeBox<"ftyp">;

// @public
export function filterIsoBoxes<T, S extends T>(boxes: Iterable<T>, callback: (box: T) => box is S, config?: TraverseIsoBoxesConfig): S[];

// @public (undocumented)
export function filterIsoBoxes<T>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T[];

// @public
export function findIsoBox<T, S extends T>(boxes: Iterable<T>, callback: (box: T) => box is S, config?: TraverseIsoBoxesConfig): S | null;

// @public (undocumented)
export function findIsoBox<T>(boxes: Iterable<T>, callback: (box: T) => boolean, config?: TraverseIsoBoxesConfig): T | null;

// @public
export function fourCcToUint32(str: string): number;

// @public
export type FreeSpaceBox<T extends "free" | "skip" = "free"> = {
    type: T;
    data: Uint8Array;
};

// @public
export type FullBox = {
    version: number;
    flags: number;
};

// @public
export type GroupsListBox = {
    type: "grpl";
    boxes: GroupsListBoxChild[];
};

// @public
export type GroupsListBoxChild = any;

// @public
export type HandlerReferenceBox = FullBox & {
    type: "hdlr";
    preDefined: number;
    handlerType: string;
    reserved: number[];
    name: string;
};

// @public
export type HintMediaHeaderBox = FullBox & {
    type: "hmhd";
    maxPDUsize: number;
    avgPDUsize: number;
    maxbitrate: number;
    avgbitrate: number;
};

// @public
export type IdentifiedMediaDataBox = {
    type: "imda";
    imdaIdentifier: number;
    data: Uint8Array;
};

// @public
export const INT: "int";

// @public
export type IpmpInfoBox = FullBox & {
    type: "imif";
    ipmpDescr: any[];
};

// @public
export function isContainer<T extends IsoBox<IsoInt64> | Box<IsoBox["type"]>>(box: T): box is T & IsoBoxContainer<IsoInt64>;

// @public
export function isFullBox(box: any): box is FullBox;

// @public
export function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64>(type: T, box: IsoBox<V> | {
    view: IsoBoxReadView<V>;
}): box is IsoBoxMap<V>[T];

// @public (undocumented)
export function isIsoBoxType<T extends keyof IsoBoxMap>(type: T, box: unknown): box is IsoBoxMap[T];

// @public
export type IsoBox<V extends IsoInt64 = number> = IsoBoxMap<V>[keyof IsoBoxMap<V>];

// @public
export type IsoBoxContainer<V extends IsoInt64 = number> = IsoBoxContainerMap<V>[keyof IsoBoxContainerMap<V>];

// @public
export type IsoBoxContainerMap<V extends IsoInt64 = number> = {
    dinf: DataInformationBox;
    edts: EditBox<V>;
    grpl: GroupsListBox;
    mdia: MediaBox<V>;
    meco: AdditionalMetadataContainerBox;
    mfra: MovieFragmentRandomAccessBox<V>;
    minf: MediaInformationBox;
    moof: MovieFragmentBox<V>;
    moov: MovieBox<V>;
    mvex: MovieExtendsBox<V>;
    schi: SchemeInformationBox;
    sinf: ProtectionSchemeInformationBox;
    stbl: SampleTableBox;
    strk: SubTrackBox;
    traf: TrackFragmentBox<V>;
    trak: TrackBox<V>;
    tref: TrackReferenceBox;
    udta: UserDataBox;
    vttc: WebVttCueBox;
};

// @public
export type IsoBoxData = ArrayBufferLike | ArrayBufferView;

// @public
export const IsoBoxFields: {
    DATA: typeof DATA;
    INT: typeof INT;
    STRING: typeof STRING;
    TEMPLATE: typeof TEMPLATE;
    UINT: typeof UINT;
    UTF8: typeof UTF8;
};

// @public (undocumented)
export type IsoBoxFields = ValueOf<typeof IsoBoxFields>;

// @public
export type IsoBoxMap<V extends IsoInt64 = number> = {
    ardi: AudioRenderingIndicationBox;
    avc1: VisualSampleEntryBox<"avc1">;
    avc2: VisualSampleEntryBox<"avc2">;
    avc3: VisualSampleEntryBox<"avc3">;
    avc4: VisualSampleEntryBox<"avc4">;
    co64: ChunkLargeOffsetBox;
    ctts: CompositionTimeToSampleBox;
    dinf: DataInformationBox;
    dref: DataReferenceBox;
    edts: EditBox<V>;
    elng: ExtendedLanguageBox;
    elst: EditListBox<V>;
    emsg: EventMessageBox<V>;
    enca: AudioSampleEntryBox<"enca">;
    encv: VisualSampleEntryBox<"encv">;
    free: FreeSpaceBox<"free">;
    frma: OriginalFormatBox;
    ftyp: FileTypeBox;
    grpl: GroupsListBox;
    hdlr: HandlerReferenceBox;
    hev1: VisualSampleEntryBox<"hev1">;
    hmhd: HintMediaHeaderBox;
    hvc1: VisualSampleEntryBox<"hvc1">;
    iden: WebVttCueIdBox;
    iinf: ItemInfoBox;
    iloc: ItemLocationBox;
    imda: IdentifiedMediaDataBox;
    imif: IpmpInfoBox;
    infe: ItemInfoEntry;
    ipro: ItemProtectionBox;
    iref: ItemReferenceBox;
    kind: TrackKindBox;
    labl: LabelBox;
    mdat: MediaDataBox;
    mdhd: MediaHeaderBox<V>;
    mdia: MediaBox<V>;
    meco: AdditionalMetadataContainerBox;
    mehd: MovieExtendsHeaderBox<V>;
    meta: MetaBox;
    mfhd: MovieFragmentHeaderBox;
    mfra: MovieFragmentRandomAccessBox<V>;
    mfro: MovieFragmentRandomAccessOffsetBox;
    minf: MediaInformationBox;
    moof: MovieFragmentBox<V>;
    moov: MovieBox<V>;
    mp4a: AudioSampleEntryBox<"mp4a">;
    mvex: MovieExtendsBox<V>;
    mvhd: MovieHeaderBox<V>;
    nmhd: NullMediaHeaderBox;
    payl: WebVttCuePayloadBox;
    pitm: PrimaryItemBox;
    prft: ProducerReferenceTimeBox<V>;
    prsl: PreselectionGroupBox;
    pssh: ProtectionSystemSpecificHeaderBox;
    saio: SampleAuxiliaryInformationOffsetsBox;
    saiz: SampleAuxiliaryInformationSizesBox;
    sbgp: SampleToGroupBox;
    schi: SchemeInformationBox;
    schm: SchemeTypeBox;
    sdtp: SampleDependencyTypeBox;
    senc: SampleEncryptionBox;
    sgpd: SampleGroupDescriptionBox;
    sidx: SegmentIndexBox<V>;
    sinf: ProtectionSchemeInformationBox;
    skip: FreeSpaceBox<"skip">;
    smhd: SoundMediaHeaderBox;
    ssix: SubsegmentIndexBox;
    stbl: SampleTableBox;
    stco: ChunkOffsetBox;
    stdp: DegradationPriorityBox;
    sthd: SubtitleMediaHeaderBox;
    strk: SubTrackBox;
    stsc: SampleToChunkBox;
    stsd: SampleDescriptionBox;
    stsh: ShadowSyncSampleBox;
    stss: SyncSampleBox;
    stsz: SampleSizeBox;
    sttg: WebVttSettingsBox;
    stts: DecodingTimeToSampleBox;
    styp: SegmentTypeBox;
    subs: SubsampleInformationBox;
    stz2: CompactSampleSizeBox;
    tenc: TrackEncryptionBox;
    tfdt: TrackFragmentBaseMediaDecodeTimeBox<V>;
    tfhd: TrackFragmentHeaderBox<V>;
    tfra: TrackFragmentRandomAccessBox<V>;
    tkhd: TrackHeaderBox<V>;
    traf: TrackFragmentBox<V>;
    trak: TrackBox<V>;
    tref: TrackReferenceBox;
    trex: TrackExtendsBox;
    trun: TrackRunBox;
    udta: UserDataBox;
    "url ": DataEntryUrlBox;
    "urn ": DataEntryUrnBox;
    vlab: WebVttSourceLabelBox;
    vmhd: VideoMediaHeaderBox;
    vttc: WebVttCueBox;
    vttC: WebVttConfigurationBox;
    vtte: WebVttEmptySampleBox;
};

// Warning: (ae-forgotten-export) The symbol "ReadableStreamBase" needs to be exported by the entry point index.d.ts
//
// @public
export class IsoBoxReadableStream extends ReadableStreamBase<Uint8Array> {
    constructor(boxes: Iterable<IsoBoxStreamable<IsoInt64>>, config: IsoBoxWriteViewConfig);
}

// @public
export type IsoBoxReader<B = unknown, T extends IsoBoxType = IsoBoxType, V extends IsoInt64 = number> = (view: IsoBoxReadView<V>, type: T) => B;

// @public
export type IsoBoxReaderMap<V extends IsoInt64 = number> = Record<IsoBoxType, IsoBoxReader<unknown, IsoBoxType, V>>;

// @public
export type IsoBoxReaderReturn<T, V extends IsoInt64 = number> = NonNullable<{ [K in keyof T]: NonNullable<T[K]> extends ((...args: never[]) => infer B) ? ParsedBox<[B] extends [{
        type: infer N extends keyof IsoBoxMap;
    }] ? [B] extends [IsoBoxMap<IsoInt64>[N]] ? [IsoBoxMap<IsoInt64>[N]] extends [B] ? IsoBoxMap<V>[N] : B : B : B, V> : never; }[keyof T]> | (NonNullable<{ [K in keyof T]: T[K] extends ((...args: never[]) => unknown) ? K extends "url" | "urn" ? K | `${K} ` : K : never; }[keyof T]> extends (infer R) ? ParsedBox<([string] extends [R] ? IsoBox<V> : Exclude<IsoBox<V>, {
    type: R;
}>) | Box, V> : never);

// @public
export class IsoBoxReadView<V extends IsoInt64 = number> {
    [Symbol.iterator](): Generator<ParsedIsoBox<V>>;
    constructor(raw: IsoBoxData, ...config: [V] extends [bigint] ? [config: IsoBoxReadViewConfig<V>] : [config?: IsoBoxReadViewConfig<V>]);
    get buffer(): ArrayBufferLike;
    get byteLength(): number;
    get byteOffset(): number;
    get bytesRemaining(): number;
    get cursor(): number;
    get done(): boolean;
    jump: (size: number) => void;
    readArray: <T extends keyof IsoFieldTypeMap>(type: T, size: number, length: number) => IsoFieldTypeMap[T][];
    readBox: () => ParsedBox<Box, V>;
    readBoxes: <T = IsoBox<V>>(length?: number) => T[];
    readData: (size: number) => Uint8Array;
    readEntries: <T>(length: number, map: () => T) => T[];
    readFullBox: () => FullBox;
    readInt: (size: number) => number;
    readString: (size: number) => string;
    readTemplate: (size: number) => number;
    readUint: (size: number) => number;
    readUint64: () => bigint;
    readUtf8: (size?: number) => string;
    readWideInt: (size: 4 | 8) => V;
    readWideUint: (size: 4 | 8) => V;
    slice: (offset: number, size: number) => IsoBoxReadView<V>;
}

// @public
export type IsoBoxReadViewConfig<V extends IsoInt64 = number> = {
    readers?: NoInfer<IsoBoxReaderMap<V>>;
} & ([V] extends [bigint] ? {
    int64: IsoInt64Reader<V>;
} : {
    int64?: IsoInt64Reader<V>;
});

// @public
export type IsoBoxStreamable<V extends IsoInt64 = number> = IsoBox<V> | ParsedIsoBox<V> | ParsedBox<unknown, V> | ArrayBufferView;

// @public
export type IsoBoxType = `${string}${string}${string}${string}`;

// @public
export type IsoBoxWriter<B> = (box: B, config: IsoBoxWriteViewConfig) => ArrayBufferView;

// @public
export type IsoBoxWriterMap = Record<string, IsoBoxWriter<any>>;

// @public
export class IsoBoxWriteView {
    constructor(type: string, size: number);
    get buffer(): ArrayBufferLike;
    get byteLength(): number;
    get byteOffset(): number;
    writeArray: <T extends keyof IsoFieldTypeMap>(data: number[], type: T, size: number, length: number) => void;
    writeBoxHeader: (type: string, size: number) => void;
    writeBytes: (data: Uint8Array | Uint8Array[]) => void;
    writeFullBox(version: number, flags: number): void;
    writeInt: (value: number, size: number) => void;
    writeString: (value: string) => void;
    writeTemplate: (value: number, size: number) => void;
    writeTerminatedString: (value: string) => void;
    writeUint: (value: number, size: number) => void;
    writeUint64: (value: bigint) => void;
    writeUtf8TerminatedString: (value: string) => void;
    writeWideInt: (value: number | bigint, size: 4 | 8) => void;
    writeWideUint: (value: number | bigint, size: 4 | 8) => void;
}

// @public
export type IsoBoxWriteViewConfig = {
    writers: IsoBoxWriterMap;
};

// @public
export type IsoFieldTypeMap = {
    [IsoBoxFields.UINT]: number;
    [IsoBoxFields.INT]: number;
    [IsoBoxFields.TEMPLATE]: number;
    [IsoBoxFields.STRING]: string;
    [IsoBoxFields.DATA]: Uint8Array;
    [IsoBoxFields.UTF8]: string;
};

// @public
export type IsoInt64 = number | bigint;

// @public
export type IsoInt64Reader<V extends IsoInt64 = number> = (view: IsoBoxReadView<IsoInt64>, size: 4 | 8, signed: boolean) => V;

// @public
export type IsoTypedParsedBox<T extends keyof IsoBoxMap, V extends IsoInt64 = number> = ParsedBox<IsoBoxMap<V>[T], V>;

// @public
export type ItemExtent = {
    extentIndex?: number;
    extentOffset: number;
    extentLength: number;
};

// @public
export type ItemInfoBox = {
    type: "iinf";
    boxes: ItemInfoBoxChild[];
    entryCount: number;
};

// @public
export type ItemInfoBoxChild = ItemInfoEntry;

// @public
export type ItemInfoEntry = FullBox & {
    type: "infe";
    itemId: number;
    itemProtectionIndex: number;
    itemName: string;
    contentType: string;
    contentEncoding?: string;
    extensionType?: string;
};

// @public
export type ItemLocation = {
    itemId: number;
    constructionMethod?: number;
    dataReferenceIndex: number;
    baseOffset: number;
    extents: ItemExtent[];
};

// @public
export type ItemLocationBox = FullBox & {
    type: "iloc";
    offsetSize: number;
    lengthSize: number;
    baseOffsetSize: number;
    indexSize?: number;
    itemCount: number;
    items: ItemLocation[];
};

// @public
export type ItemProtectionBox = {
    type: "ipro";
    boxes: ItemProtectionBoxChild[];
    protectionCount: number;
};

// @public
export type ItemProtectionBoxChild = ProtectionSchemeInformationBox;

// @public
export type ItemReferenceBox = {
    type: "iref";
    boxes: ItemReferenceBoxChild[];
};

// @public
export type ItemReferenceBoxChild = SingleItemTypeReferenceBox;

// @public
export type LabelBox = FullBox & {
    type: "labl";
    isGroupLabel: boolean;
    labelId: number;
    language: string;
    label: string;
};

// @public
export type MediaBox<V extends IsoInt64 = number> = {
    type: "mdia";
    boxes: MediaBoxChild<V>[];
};

// @public
export type MediaBoxChild<V extends IsoInt64 = number> = MediaHeaderBox<V> | HandlerReferenceBox | MediaInformationBox;

// @public
export type MediaDataBox = {
    type: "mdat";
    data: Uint8Array;
};

// @public
export type MediaHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mdhd";
    creationTime: V;
    modificationTime: V;
    timescale: number;
    duration: V;
    language: string;
    preDefined: number;
};

// @public
export type MediaInformationBox = {
    type: "minf";
    boxes: MediaInformationBoxChild[];
};

// @public
export type MediaInformationBoxChild = VideoMediaHeaderBox | SoundMediaHeaderBox | HintMediaHeaderBox | NullMediaHeaderBox | DataInformationBox | SampleTableBox | SubtitleMediaHeaderBox;

// @public
export type MetaBox = FullBox & {
    type: "meta";
    boxes: MetaBoxChild[];
};

// @public
export type MetaBoxChild = HandlerReferenceBox | PrimaryItemBox | DataInformationBox | ItemLocationBox | ItemProtectionBox | ItemInfoBox | ItemReferenceBox | GroupsListBox;

// @public
export type MovieBox<V extends IsoInt64 = number> = {
    type: "moov";
    boxes: MovieBoxChild<V>[];
};

// @public
export type MovieBoxChild<V extends IsoInt64 = number> = MovieHeaderBox<V> | TrackBox<V> | MovieExtendsBox<V> | UserDataBox;

// @public
export type MovieExtendsBox<V extends IsoInt64 = number> = {
    type: "mvex";
    boxes: MovieExtendsBoxChild<V>[];
};

// @public
export type MovieExtendsBoxChild<V extends IsoInt64 = number> = MovieExtendsHeaderBox<V> | TrackExtendsBox;

// @public
export type MovieExtendsHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mehd";
    fragmentDuration: V;
};

// @public
export type MovieFragmentBox<V extends IsoInt64 = number> = {
    type: "moof";
    boxes: MovieFragmentBoxChild<V>[];
};

// @public
export type MovieFragmentBoxChild<V extends IsoInt64 = number> = MovieFragmentHeaderBox | TrackFragmentBox<V>;

// @public
export type MovieFragmentHeaderBox = FullBox & {
    type: "mfhd";
    sequenceNumber: number;
};

// @public
export type MovieFragmentRandomAccessBox<V extends IsoInt64 = number> = {
    type: "mfra";
    boxes: MovieFragmentRandomAccessBoxChild<V>[];
};

// @public
export type MovieFragmentRandomAccessBoxChild<V extends IsoInt64 = number> = TrackFragmentRandomAccessBox<V> | MovieFragmentRandomAccessOffsetBox;

// @public
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
    type: "mfro";
    mfraSize: number;
};

// @public
export type MovieHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "mvhd";
    creationTime: V;
    modificationTime: V;
    timescale: number;
    duration: V;
    rate: number;
    volume: number;
    reserved1: number;
    reserved2: number[];
    matrix: number[];
    preDefined: number[];
    nextTrackId: number;
};

// @public
export type NullMediaHeaderBox = FullBox & {
    type: "nmhd";
};

// @public
export type OriginalFormatBox = {
    type: "frma";
    dataFormat: number;
};

// @public
export type ParsedBox<T = Box, V extends IsoInt64 = number> = (T extends IsoBox<V> ? T & Omit<Box, "type"> : T) & {
    view: IsoBoxReadView<V>;
    size: number;
    largesize?: number;
    usertype?: number[];
};

// @public
export type ParsedIsoBox<V extends IsoInt64 = number> = ParsedBox<IsoBox<V> | Box, V>;

// @public
export type PreselectionGroupBox = FullBox & {
    type: "prsl";
    groupId: number;
    numEntitiesInGroup: number;
    entities: Entity[];
    preselectionTag?: string;
    selectionPriority?: number;
    interleavingTag?: string;
    boxes: PreselectionGroupBoxChild[];
};

// @public
export type PreselectionGroupBoxChild = any;

// @public
export type PrimaryItemBox = FullBox & {
    type: "pitm";
    itemId: number;
};

// @public
export type ProducerReferenceTimeBox<V extends IsoInt64 = number> = FullBox & {
    type: "prft";
    referenceTrackId: number;
    ntpTimestampSec: number;
    ntpTimestampFrac: number;
    mediaTime: V;
};

// @public
export type ProtectionSchemeInformationBox = {
    type: "sinf";
    boxes: ProtectionSchemeInformationBoxChild[];
};

// @public
export type ProtectionSchemeInformationBoxChild = OriginalFormatBox | IpmpInfoBox | SchemeTypeBox | SchemeInformationBox;

// @public
export type ProtectionSystemSpecificHeaderBox = FullBox & {
    type: "pssh";
    systemId: number[];
    kidCount: number;
    kid: number[];
    dataSize: number;
    data: number[];
};

// @public
export function readArdi(view: IsoBoxReadView<IsoInt64>): AudioRenderingIndicationBox;

// @public
export function readAudioSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView<IsoInt64>): AudioSampleEntryBox<T>;

// @public
export function readAvc1(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"avc1">;

// @public
export function readAvc2(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"avc2">;

// @public
export function readAvc3(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"avc3">;

// @public
export function readAvc4(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"avc4">;

// @public
export function readCtts(view: IsoBoxReadView<IsoInt64>): CompositionTimeToSampleBox;

// @public
export function readDref(view: IsoBoxReadView<IsoInt64>): DataReferenceBox;

// @public
export function readElng(view: IsoBoxReadView<IsoInt64>): ExtendedLanguageBox;

// @public
export function readElst<V extends IsoInt64>(view: IsoBoxReadView<V>): EditListBox<V>;

// @public
export function readEmsg<V extends IsoInt64>(view: IsoBoxReadView<V>): EventMessageBox<V>;

// @public
export function readEnca(view: IsoBoxReadView<IsoInt64>): AudioSampleEntryBox<"enca">;

// @public
export function readEncv(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"encv">;

// @public
export function readFree(view: IsoBoxReadView<IsoInt64>): FreeSpaceBox;

// @public
export function readFrma(view: IsoBoxReadView<IsoInt64>): OriginalFormatBox;

// @public
export function readFtyp(view: IsoBoxReadView<IsoInt64>): FileTypeBox;

// @public
export function readHdlr(view: IsoBoxReadView<IsoInt64>): HandlerReferenceBox;

// @public
export function readHev1(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"hev1">;

// @public
export function readHvc1(view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<"hvc1">;

// @public
export function readIden(view: IsoBoxReadView<IsoInt64>): WebVttCueIdBox;

// @public
export function readImda(view: IsoBoxReadView<IsoInt64>): IdentifiedMediaDataBox;

// @public
export function readInt64AsBigInt(view: IsoBoxReadView<IsoInt64>, size: 4 | 8, signed: boolean): bigint;

// @public
export function readIsoBoxes<const R extends IsoBoxReaderMap<V>, V extends IsoInt64 = number>(raw: IsoBoxData, config: IsoBoxReadViewConfig<V> & {
    readers: R;
}): IsoBoxReaderReturn<R, V>[];

// @public (undocumented)
export function readIsoBoxes<V extends IsoInt64 = number>(raw: IsoBoxData, config?: IsoBoxReadViewConfig<V>): ParsedIsoBox<V>[];

// @public
export function readKind(view: IsoBoxReadView<IsoInt64>): TrackKindBox;

// @public
export function readLabl(view: IsoBoxReadView<IsoInt64>): LabelBox;

// @public
export function readMdat(view: IsoBoxReadView<IsoInt64>): MediaDataBox;

// @public
export function readMdhd<V extends IsoInt64>(view: IsoBoxReadView<V>): MediaHeaderBox<V>;

// @public
export function readMehd<V extends IsoInt64>(view: IsoBoxReadView<V>): MovieExtendsHeaderBox<V>;

// @public
export function readMeta(view: IsoBoxReadView<IsoInt64>): MetaBox;

// @public
export function readMfhd(view: IsoBoxReadView<IsoInt64>): MovieFragmentHeaderBox;

// @public
export function readMfro(view: IsoBoxReadView<IsoInt64>): MovieFragmentRandomAccessOffsetBox;

// @public
export function readMp4a(view: IsoBoxReadView<IsoInt64>): AudioSampleEntryBox<"mp4a">;

// @public
export function readMvhd<V extends IsoInt64>(view: IsoBoxReadView<V>): MovieHeaderBox<V>;

// @public
export function readPayl(view: IsoBoxReadView<IsoInt64>): WebVttCuePayloadBox;

// @public
export function readPrft<V extends IsoInt64>(view: IsoBoxReadView<V>): ProducerReferenceTimeBox<V>;

// @public
export function readPrsl(view: IsoBoxReadView<IsoInt64>): PreselectionGroupBox;

// @public
export function readPssh(view: IsoBoxReadView<IsoInt64>): ProtectionSystemSpecificHeaderBox;

// @public
export function readSchm(view: IsoBoxReadView<IsoInt64>): SchemeTypeBox;

// @public
export function readSdtp(view: IsoBoxReadView<IsoInt64>): SampleDependencyTypeBox;

// @public
export function readSidx<V extends IsoInt64>(view: IsoBoxReadView<V>): SegmentIndexBox<V>;

// @public
export function readSkip(view: IsoBoxReadView<IsoInt64>): FreeSpaceBox<"skip">;

// @public
export function readSmhd(view: IsoBoxReadView<IsoInt64>): SoundMediaHeaderBox;

// @public
export function readSsix(view: IsoBoxReadView<IsoInt64>): SubsegmentIndexBox;

// @public
export function readStco(view: IsoBoxReadView<IsoInt64>): ChunkOffsetBox;

// @public
export function readSthd(view: IsoBoxReadView<IsoInt64>): SubtitleMediaHeaderBox;

// @public
export function readStsc(view: IsoBoxReadView<IsoInt64>): SampleToChunkBox;

// @public
export function readStsd<E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox>(view: IsoBoxReadView<IsoInt64>): SampleDescriptionBox<E>;

// @public
export function readStss(view: IsoBoxReadView<IsoInt64>): SyncSampleBox;

// @public
export function readStsz(view: IsoBoxReadView<IsoInt64>): SampleSizeBox;

// @public
export function readSttg(view: IsoBoxReadView<IsoInt64>): WebVttSettingsBox;

// @public
export function readStts(view: IsoBoxReadView<IsoInt64>): DecodingTimeToSampleBox;

// @public
export function readStyp(view: IsoBoxReadView<IsoInt64>): SegmentTypeBox;

// @public
export function readSubs(view: IsoBoxReadView<IsoInt64>): SubsampleInformationBox;

// @public
export function readTenc(view: IsoBoxReadView<IsoInt64>): TrackEncryptionBox;

// @public
export function readTfdt<V extends IsoInt64>(view: IsoBoxReadView<V>): TrackFragmentBaseMediaDecodeTimeBox<V>;

// @public
export function readTfhd<V extends IsoInt64>(view: IsoBoxReadView<V>): TrackFragmentHeaderBox<V>;

// @public
export function readTfra<V extends IsoInt64>(view: IsoBoxReadView<V>): TrackFragmentRandomAccessBox<V>;

// @public
export function readTkhd<V extends IsoInt64>(view: IsoBoxReadView<V>): TrackHeaderBox<V>;

// @public
export function readTrex(view: IsoBoxReadView<IsoInt64>): TrackExtendsBox;

// @public
export function readTrun(view: IsoBoxReadView<IsoInt64>): TrackRunBox;

// @public
export function readUrl(view: IsoBoxReadView<IsoInt64>): DataEntryUrlBox;

// @public
export function readUrn(view: IsoBoxReadView<IsoInt64>): DataEntryUrnBox;

// @public
export function readVisualSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView<IsoInt64>): VisualSampleEntryBox<T>;

// @public
export function readVlab(view: IsoBoxReadView<IsoInt64>): WebVttSourceLabelBox;

// @public
export function readVmhd(view: IsoBoxReadView<IsoInt64>): VideoMediaHeaderBox;

// @public
export function readVttC(view: IsoBoxReadView<IsoInt64>): WebVttConfigurationBox;

// @public
export function readVtte(_: IsoBoxReadView<IsoInt64>): WebVttEmptySampleBox;

// @public
export type SampleAuxiliaryInformationOffsetsBox = FullBox & {
    type: "saio";
    auxInfoType?: number;
    auxInfoTypeParameter?: number;
    entryCount: number;
    offset: number[];
};

// @public
export type SampleAuxiliaryInformationSizesBox = FullBox & {
    type: "saiz";
    auxInfoType?: number;
    auxInfoTypeParameter?: number;
    defaultSampleInfoSize: number;
    sampleCount: number;
    sampleInfoSize?: number[];
};

// @public
export type SampleDependencyTypeBox = FullBox & {
    type: "sdtp";
    sampleDependencyTable: number[];
};

// @public
export type SampleDescriptionBox<E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox> = FullBox & {
    type: "stsd";
    entryCount: number;
    entries: E[];
};

// @public
export type SampleEncryptionBox = FullBox & {
    type: "senc";
    sampleCount: number;
    samples: EncryptedSample[];
};

// @public
export type SampleEntryBox<T extends IsoBoxType = IsoBoxType, C = any> = {
    type: T;
    reserved1: number[];
    dataReferenceIndex: number;
    boxes: C[];
};

// @public
export type SampleGroupDescriptionBox = FullBox & {
    type: "sgpd";
    groupingType: number;
    defaultLength?: number;
    entryCount: number;
    entries: any[];
};

// @public
export type SampleSizeBox = FullBox & {
    type: "stsz";
    sampleSize: number;
    sampleCount: number;
    entrySize?: number[];
};

// @public
export type SampleTableBox = {
    type: "stbl";
    boxes: SampleTableBoxChild[];
};

// @public
export type SampleTableBoxChild = SampleDescriptionBox | DecodingTimeToSampleBox | CompositionTimeToSampleBox | SampleToChunkBox | SampleSizeBox | ChunkOffsetBox | SyncSampleBox | ShadowSyncSampleBox | DegradationPriorityBox | SampleDependencyTypeBox | SampleToGroupBox | SampleGroupDescriptionBox;

// @public
export type SampleToChunkBox = FullBox & {
    type: "stsc";
    entryCount: number;
    entries: SampleToChunkEntry[];
};

// @public
export type SampleToChunkEntry = {
    firstChunk: number;
    samplesPerChunk: number;
    sampleDescriptionIndex: number;
};

// @public
export type SampleToGroupBox = FullBox & {
    type: "sbgp";
    groupingType: number;
    groupingTypeParameter?: number;
    entryCount: number;
    entries: SampleToGroupEntry[];
};

// @public
export type SampleToGroupEntry = {
    sampleCount: number;
    groupDescriptionIndex: number;
};

// @public
export type SchemeInformationBox = {
    type: "schi";
    boxes: SchemeInformationBoxChild[];
};

// @public
export type SchemeInformationBoxChild = TrackEncryptionBox;

// @public
export type SchemeTypeBox = FullBox & {
    type: "schm";
    schemeType: number;
    schemeVersion: number;
    schemeUri?: string;
};

// @public
export type SegmentIndexBox<V extends IsoInt64 = number> = FullBox & {
    type: "sidx";
    referenceId: number;
    timescale: number;
    earliestPresentationTime: V;
    firstOffset: V;
    reserved: number;
    references: SegmentIndexReference[];
};

// @public
export type SegmentIndexReference = {
    reference: number;
    subsegmentDuration: number;
    sap: number;
    referenceType: number;
    referencedSize: number;
    startsWithSap: number;
    sapType: number;
    sapDeltaTime: number;
};

// @public
export type SegmentTypeBox = TypeBox<"styp">;

// @public
export type ShadowSyncEntry = {
    shadowedSampleNumber: number;
    syncSampleNumber: number;
};

// @public
export type ShadowSyncSampleBox = FullBox & {
    type: "stsh";
    entryCount: number;
    entries: ShadowSyncEntry[];
};

// @public
export type SingleItemTypeReferenceBox = {
    fromItemId: number;
    referenceCount: number;
    toItemId: number[];
};

// @public
export type SoundMediaHeaderBox = FullBox & {
    type: "smhd";
    balance: number;
    reserved: number;
};

// @public
export const STRING: "string";

// @public (undocumented)
export type stz2 = CompactSampleSizeBox;

// @public
export type Subsample = {
    subsampleSize: number;
    subsamplePriority: number;
    discardable: number;
    codecSpecificParameters: number;
};

// @public
export type SubsampleEncryption = {
    bytesOfClearData: number;
    bytesOfProtectedData: number;
};

// @public
export type SubsampleEntry = {
    sampleDelta: number;
    subsampleCount: number;
    subsamples: Subsample[];
};

// @public
export type SubsampleInformationBox = FullBox & {
    type: "subs";
    entryCount: number;
    entries: SubsampleEntry[];
};

// @public
export type Subsegment = {
    rangesCount: number;
    ranges: SubsegmentRange[];
};

// @public
export type SubsegmentIndexBox = FullBox & {
    type: "ssix";
    subsegmentCount: number;
    subsegments: Subsegment[];
};

// @public
export type SubsegmentRange = {
    level: number;
    rangeSize: number;
};

// @public
export type SubtitleMediaHeaderBox = FullBox & {
    type: "sthd";
};

// @public
export type SubTrackBox = {
    type: "strk";
    boxes: SubTrackBoxChild[];
};

// @public
export type SubTrackBoxChild = any;

// @public
export type SyncSample = {
    sampleNumber: number;
};

// @public
export type SyncSampleBox = FullBox & {
    type: "stss";
    entryCount: number;
    entries: SyncSample[];
};

// @public
export const TEMPLATE: "template";

// @public
export type TrackBox<V extends IsoInt64 = number> = {
    type: "trak";
    boxes: TrackBoxChild<V>[];
};

// @public
export type TrackBoxChild<V extends IsoInt64 = number> = TrackHeaderBox<V> | TrackReferenceBox | EditBox<V> | MediaBox<V> | UserDataBox;

// @public
export type TrackEncryptionBox = FullBox & {
    type: "tenc";
    defaultIsEncrypted: number;
    defaultIvSize: number;
    defaultKid: number[];
};

// @public
export type TrackExtendsBox = FullBox & {
    type: "trex";
    trackId: number;
    defaultSampleDescriptionIndex: number;
    defaultSampleDuration: number;
    defaultSampleSize: number;
    defaultSampleFlags: number;
};

// @public
export type TrackFragmentBaseMediaDecodeTimeBox<V extends IsoInt64 = number> = FullBox & {
    type: "tfdt";
    baseMediaDecodeTime: V;
};

// @public
export type TrackFragmentBox<V extends IsoInt64 = number> = {
    type: "traf";
    boxes: TrackFragmentBoxChild<V>[];
};

// @public
export type TrackFragmentBoxChild<V extends IsoInt64 = number> = TrackFragmentHeaderBox<V> | TrackFragmentBaseMediaDecodeTimeBox<V> | TrackRunBox | SampleAuxiliaryInformationSizesBox | SampleAuxiliaryInformationOffsetsBox | SampleEncryptionBox | SubsampleInformationBox;

// @public
export type TrackFragmentHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "tfhd";
    trackId: number;
    baseDataOffset?: V;
    sampleDescriptionIndex?: number;
    defaultSampleDuration?: number;
    defaultSampleSize?: number;
    defaultSampleFlags?: number;
};

// @public
export type TrackFragmentRandomAccessBox<V extends IsoInt64 = number> = FullBox & {
    type: "tfra";
    trackId: number;
    reserved: number;
    numberOfEntry: number;
    lengthSizeOfTrafNum: number;
    lengthSizeOfTrunNum: number;
    lengthSizeOfSampleNum: number;
    entries: TrackFragmentRandomAccessEntry<V>[];
};

// @public
export type TrackFragmentRandomAccessEntry<V extends IsoInt64 = number> = {
    time: V;
    moofOffset: V;
    trafNumber: number;
    trunNumber: number;
    sampleNumber: number;
};

// @public
export type TrackHeaderBox<V extends IsoInt64 = number> = FullBox & {
    type: "tkhd";
    creationTime: V;
    modificationTime: V;
    trackId: number;
    reserved1: number;
    duration: V;
    reserved2: number[];
    layer: number;
    alternateGroup: number;
    volume: number;
    reserved3: number;
    matrix: number[];
    width: number;
    height: number;
};

// @public
export type TrackKindBox = FullBox & {
    type: "kind";
    schemeUri: string;
    value: string;
};

// @public
export type TrackReferenceBox = {
    type: "tref";
    boxes: TrackReferenceBoxChild[];
};

// @public
export type TrackReferenceBoxChild = TrackReferenceTypeBox;

// @public
export type TrackReferenceTypeBox = {
    type: "tref";
    trackIds: number[];
};

// @public
export type TrackRunBox = FullBox & {
    type: "trun";
    sampleCount: number;
    dataOffset?: number;
    firstSampleFlags?: number;
    samples: TrackRunSample[];
};

// @public
export type TrackRunSample = {
    sampleDuration?: number;
    sampleSize?: number;
    sampleFlags?: number;
    sampleCompositionTimeOffset?: number;
};

// @public
export function traverseIsoBoxes<T>(boxes: Iterable<T>, config?: TraverseIsoBoxesConfig): Generator<T>;

// @public
export type TraverseIsoBoxesConfig = {
    depthFirst?: boolean;
    maxDepth?: number;
};

// @public
export type TypeBox<T> = {
    type: T;
    majorBrand: string;
    minorVersion: number;
    compatibleBrands: string[];
};

// @public
export const UINT: "uint";

// @public (undocumented)
export type url = DataEntryUrlBox;

// @public (undocumented)
export type urn = DataEntryUrnBox;

// @public
export type UserDataBox = {
    type: "udta";
    boxes: UserDataBoxChild[];
};

// @public
export type UserDataBoxChild = any;

// @public
export const UTF8: "utf8";

// @public
export type VideoMediaHeaderBox = FullBox & {
    type: "vmhd";
    graphicsmode: number;
    opcolor: number[];
};

// @public
export type VisualSampleEntryBox<T extends IsoBoxType = VisualSampleEntryType> = SampleEntryBox & {
    type: T;
    preDefined1: number;
    reserved2: number;
    preDefined2: number[];
    width: number;
    height: number;
    horizresolution: number;
    vertresolution: number;
    reserved3: number;
    frameCount: number;
    compressorName: number[];
    depth: number;
    preDefined3: number;
    boxes: VisualSampleEntryBoxChild[];
};

// @public
export type VisualSampleEntryBoxChild = any;

// @public
export type VisualSampleEntryType = "avc1" | "avc2" | "avc3" | "avc4" | "hev1" | "hvc1" | "encv";

// @public
export type WebVttConfigurationBox = {
    type: "vttC";
    config: string;
};

// @public
export type WebVttCueBox = {
    type: "vttc";
    boxes: WebVttCueChild[];
};

// @public
export type WebVttCueChild = WebVttCueIdBox | WebVttCuePayloadBox;

// @public
export type WebVttCueIdBox = {
    type: "iden";
    cueId: string;
};

// @public
export type WebVttCuePayloadBox = {
    type: "payl";
    cueText: string;
};

// @public
export type WebVttEmptySampleBox = {
    type: "vtte";
};

// @public
export type WebVttSettingsBox = {
    type: "sttg";
    settings: string;
};

// @public
export type WebVttSourceLabelBox = {
    type: "vlab";
    sourceLabel: string;
};

// @public
export function writeArdi(box: AudioRenderingIndicationBox): IsoBoxWriteView;

// @public
export function writeAudioSampleEntryBox<T extends AudioSampleEntryType = AudioSampleEntryType>(box: AudioSampleEntryBox<T>, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeAvc1(box: VisualSampleEntryBox<"avc1">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeAvc2(box: VisualSampleEntryBox<"avc2">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeAvc3(box: VisualSampleEntryBox<"avc3">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeAvc4(box: VisualSampleEntryBox<"avc4">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeCtts(box: CompositionTimeToSampleBox): IsoBoxWriteView;

// @public
export function writeDref(box: DataReferenceBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeElng(box: ExtendedLanguageBox): IsoBoxWriteView;

// @public
export function writeElst(box: EditListBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeEmsg(box: EventMessageBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeEnca(box: AudioSampleEntryBox<"enca">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeEncv(box: VisualSampleEntryBox<"encv">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeFree(box: FreeSpaceBox<"free">): IsoBoxWriteView;

// @public
export function writeFrma(box: OriginalFormatBox): IsoBoxWriteView;

// @public
export function writeFtyp(box: FileTypeBox): IsoBoxWriteView;

// @public
export function writeHdlr(box: HandlerReferenceBox): IsoBoxWriteView;

// @public
export function writeHev1(box: VisualSampleEntryBox<"hev1">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeHvc1(box: VisualSampleEntryBox<"hvc1">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeIden(box: WebVttCueIdBox): IsoBoxWriteView;

// @public
export function writeImda(box: IdentifiedMediaDataBox): IsoBoxWriteView;

// @public
export function writeIsoBox(box: IsoBoxStreamable<IsoInt64>, config?: IsoBoxWriteViewConfig): Uint8Array<ArrayBuffer>;

// @public
export function writeIsoBoxes(boxes: Iterable<IsoBoxStreamable<IsoInt64>>, config: IsoBoxWriteViewConfig): Uint8Array<ArrayBuffer>[];

// @public
export function writeKind(box: TrackKindBox): IsoBoxWriteView;

// @public
export function writeLabl(box: LabelBox): IsoBoxWriteView;

// @public
export function writeMdat(box: MediaDataBox): IsoBoxWriteView;

// @public
export function writeMdhd(box: MediaHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeMehd(box: MovieExtendsHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeMeta(box: MetaBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeMfhd(box: MovieFragmentHeaderBox): IsoBoxWriteView;

// @public
export function writeMfro(box: MovieFragmentRandomAccessOffsetBox): IsoBoxWriteView;

// @public
export function writeMp4a(box: AudioSampleEntryBox<"mp4a">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeMvhd(box: MovieHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writePayl(box: WebVttCuePayloadBox): IsoBoxWriteView;

// @public
export function writePrft(box: ProducerReferenceTimeBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writePrsl(box: PreselectionGroupBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writePssh(box: ProtectionSystemSpecificHeaderBox): IsoBoxWriteView;

// @public
export function writeSchm(box: SchemeTypeBox): IsoBoxWriteView;

// @public
export function writeSdtp(box: SampleDependencyTypeBox): IsoBoxWriteView;

// @public
export function writeSidx(box: SegmentIndexBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeSkip(box: FreeSpaceBox<"skip">): IsoBoxWriteView;

// @public
export function writeSmhd(box: SoundMediaHeaderBox): IsoBoxWriteView;

// @public
export function writeSsix(box: SubsegmentIndexBox): IsoBoxWriteView;

// @public
export function writeStco(box: ChunkOffsetBox): IsoBoxWriteView;

// @public
export function writeSthd(box: SubtitleMediaHeaderBox): IsoBoxWriteView;

// @public
export function writeStsc(box: SampleToChunkBox): IsoBoxWriteView;

// @public
export function writeStsd(box: SampleDescriptionBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeStss(box: SyncSampleBox): IsoBoxWriteView;

// @public
export function writeStsz(box: SampleSizeBox): IsoBoxWriteView;

// @public
export function writeSttg(box: WebVttSettingsBox): IsoBoxWriteView;

// @public
export function writeStts(box: DecodingTimeToSampleBox): IsoBoxWriteView;

// @public
export function writeStyp(box: SegmentTypeBox): IsoBoxWriteView;

// @public
export function writeSubs(box: SubsampleInformationBox): IsoBoxWriteView;

// @public
export function writeTenc(box: TrackEncryptionBox): IsoBoxWriteView;

// @public
export function writeTfdt(box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTfhd(box: TrackFragmentHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTfra(box: TrackFragmentRandomAccessBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTkhd(box: TrackHeaderBox<IsoInt64>): IsoBoxWriteView;

// @public
export function writeTrex(box: TrackExtendsBox): IsoBoxWriteView;

// @public
export function writeTrun(box: TrackRunBox): IsoBoxWriteView;

// @public
export function writeUrl(box: DataEntryUrlBox): IsoBoxWriteView;

// @public
export function writeUrn(box: DataEntryUrnBox): IsoBoxWriteView;

// @public
export function writeVisualSampleEntryBox<T extends VisualSampleEntryType = VisualSampleEntryType>(box: VisualSampleEntryBox<T>, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeVlab(box: WebVttSourceLabelBox): IsoBoxWriteView;

// @public
export function writeVmhd(box: VideoMediaHeaderBox): IsoBoxWriteView;

// @public
export function writeVttC(box: WebVttConfigurationBox): IsoBoxWriteView;

// @public
export function writeVtte(_: WebVttEmptySampleBox): IsoBoxWriteView;

// (No @packageDocumentation comment for this package)

```
