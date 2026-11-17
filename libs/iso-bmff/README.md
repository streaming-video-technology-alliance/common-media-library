# @svta/cml-iso-bmff

Read and write ISO Base Media File Format (ISO BMFF) boxes.

Documentation: [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/)

## When to use

- Read the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTrex`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read a 64-bit field, such as a tfdt time at a 10 MHz timescale, exactly or with an overflow report: `readInt64AsBigInt`, `createInt64OverflowReader`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Write or patch boxes, such as inserting emsg or rewriting tfdt, to byte arrays or a ReadableStream: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`, `createIsoBoxReadableStream`, `IsoBoxReadableStream`
- Read or write a container box, such as moov or moof, with an optional named function: `readMoov`, `writeMoov`
- Read or write a box type that the package does not name: `IsoBoxReadView`, `IsoBoxWriteView`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.

## Installation

```bash
npm i @svta/cml-iso-bmff
```

## Quick start

Read the boxes of a media segment, and find the `tfdt` box inside `moof` and `traf`:

```typescript
import { findIsoBox, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/segment.m4s").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });
const tfdt = findIsoBox(boxes, (box) => box.type === "tfdt");

console.log(tfdt?.baseMediaDecodeTime);
```

Write boxes to byte arrays:

```typescript
import { writeFtyp, writeIsoBoxes } from "@svta/cml-iso-bmff";

const byteArrays = writeIsoBoxes(
	[{ type: "ftyp", majorBrand: "isom", minorVersion: 1, compatibleBrands: ["isom"] }],
	{ writers: { ftyp: writeFtyp } },
);
```

## Runtime requirements

Some exports need a runtime API:

| API | Exports | Fallback |
| --- | --- | --- |
| `TextEncoder` | Every writer of a UTF-8 string field, such as `writeHdlr` and `writeEmsg` | None |
| `BigInt` | `readInt64AsBigInt`, `IsoBoxReadView.readUint64`, `IsoBoxWriteView.writeUint64`, and the boxes with `bigint` fields | None, and no check |
| `ReadableStream` | `createIsoBoxReadableStream`, `IsoBoxReadableStream` | None. The constructor throws an error with a clear message |

## Usage

- [Reading boxes](docs/reading-boxes.md) - Read ISO BMFF boxes from a buffer
- [Writing boxes](docs/writing-boxes.md) - Write boxes to byte arrays or streams
- [Utilities](docs/utilities.md) - Traverse boxes and type guards
