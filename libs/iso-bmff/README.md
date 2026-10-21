# @svta/cml-iso-bmff

ISO Base Media File Format (ISO BMFF) parsing.

## When to use

- Parse the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
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

- [Reading boxes](docs/reading-boxes.md) - Parse ISO BMFF boxes from a buffer
- [Writing boxes](docs/writing-boxes.md) - Write boxes to byte arrays or streams
- [Utilities](docs/utilities.md) - Traverse boxes and type guards
