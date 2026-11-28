# @svta/cml-iso-bmff

Read and write ISO Base Media File Format (ISO BMFF) boxes.

Documentation: [cml.svta.org/packages/iso-bmff](https://cml.svta.org/packages/iso-bmff/)

## When to use

- Read the boxes of an init or media segment, with the content or the position of each box: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`, `iterateChildBoxes`
- Read the track timescale, the sample entry type (such as `avc1`), or the duration and size of each sample from moov and moof: `readMdhd`, `readStsd`, `readTrex`, `readTfhd`, `readTrun`, `resolveTrunSamples`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read a 64-bit field, such as a tfdt time at a 10 MHz timescale, exactly or with an overflow report: `readInt64AsBigInt`, `createInt64OverflowReader`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Write or patch boxes, such as inserting emsg or rewriting tfdt, to a byte array or a ReadableStream: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`, `createIsoBoxReadableStream`
- Read or write a container box, such as moov or moof, with an optional named function: `readMoov`, `writeMoov`
- Read or write a box type that the package does not name: `createIsoBoxReadCursor`, `readUint32`, `readChildBoxes`, `beginIsoBox`, `writeUint32`, `writeChildBoxes`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.

## Installation

```bash
npm i @svta/cml-iso-bmff
```

## Quick start

Read the boxes of a media segment, and find the `tfdt` box inside `moof` and `traf`:

```typescript
import { findIsoBox, isIsoBoxType, readIsoBoxes, readTfdt } from "@svta/cml-iso-bmff";

const buffer = await fetch("https://example.com/segment.m4s").then((r) =>
	r.arrayBuffer(),
);

const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt } });
const tfdt = findIsoBox(boxes, (box) => isIsoBoxType("tfdt", box));

console.log(tfdt?.baseMediaDecodeTime);
```

Write boxes to a byte array:

```typescript
import { writeFtyp, writeIsoBoxes } from "@svta/cml-iso-bmff";

const bytes = writeIsoBoxes(
	[{ type: "ftyp", majorBrand: "isom", minorVersion: 1, compatibleBrands: ["isom"] }],
	{ writers: { ftyp: writeFtyp } },
);
```

## Runtime requirements

Some exports need a runtime API:

| API | Exports | Fallback |
| --- | --- | --- |
| `TextEncoder` | Every writer of a UTF-8 string field, such as `writeHdlr` and `writeEmsg` | None |
| `BigInt` | `readInt64AsBigInt`, `readUint64`, `writeUint64`, and the boxes with `bigint` fields | None, and no check |
| `DataView` methods `getBigUint64`, `setBigUint64`, and `setBigInt64` | `readInt64AsBigInt`, `readUint64`, `writeUint64`, `writeWideUint`, and `writeWideInt` with a `bigint` of 8 bytes | None, and no check |
| `ReadableStream` | `createIsoBoxReadableStream` | None. The function throws an `Error` with the message "ReadableStream is not available in this environment" |

## Usage

- [Reading boxes](docs/reading-boxes.md) - Read ISO BMFF boxes from a buffer
- [Writing boxes](docs/writing-boxes.md) - Write boxes to a byte array or a stream
- [Utilities](docs/utilities.md) - Traverse boxes and type guards
- [Migrating to version 2](docs/migrating-to-v2.md) - Update code from version 1 to version 2.0.0
