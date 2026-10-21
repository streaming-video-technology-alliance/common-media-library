<!-- libs/iso-bmff/README.md -->
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

<!-- libs/iso-bmff/docs/utilities.md -->
---
title: Utilities
description: Traversing boxes and type guards
---

# Utilities

## Traversing boxes

The `traverseIsoBoxes` function traverses box iterators and returns a generator of boxes. It takes an iterable of boxes and two optional arguments: depth-first traversal and maximum depth. By default, the function traverses depth-first with a maximum depth of infinity. A maximum depth of 0 traverses only the root boxes.

```typescript
import { traverseIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = traverseIsoBoxes(buffer);
```

## Type guards

The library provides type guards that check whether a box is a container box or a full box. These guards narrow the type of a box in TypeScript.

`isContainer` checks whether a box is a container box.

```typescript
import { isContainer } from "@svta/cml-iso-bmff";

const box = { type: "meta", boxes: [] };
const isContainer = isContainer(box);
```

`isFullBox` checks whether a box is a full box.

```typescript
import { isFullBox } from "@svta/cml-iso-bmff";

const box = { type: "meta", version: 1, flags: 0 };
const isFullBox = isFullBox(box);
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
import { defaultWriterConfig, writeIsoBoxes } from "@svta/cml-iso-bmff";

const boxes = [
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
	sourceBuffer.appendBuffer(byteArray.buffer);
	// wait for updateend event
}
```

## Using specific writers

For optimal bundle size with tree shaking, import only the writers you need:

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

const byteArrays = writeIsoBoxes(boxes, {
	writers: {
		ftyp: writeFtyp,
		mdat: writeMdat,
	},
});

for (const byteArray of byteArrays) {
	sourceBuffer.appendBuffer(byteArray.buffer);
	// wait for updateend event
}
```

## Streaming boxes

The `createIsoBoxReadableStream` function writes boxes to a readable stream. It supports both the default config and specific writers:

```typescript
import {
	createIsoBoxReadableStream,
	defaultWriterConfig,
} from "@svta/cml-iso-bmff";

const boxes = [
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

const stream = await webTransport.createBidirectionalStream();
readableStream.pipeTo(transport.writable);
```

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
export function createAudioSampleEntryReader<T extends IsoBoxType>(type: T): (view: IsoBoxReadView) => AudioSampleEntryBox<T>;

// @public
export function createIsoBoxReadableStream(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig): ReadableStream<Uint8Array>;

// @public
export function createVisualSampleEntryReader<T extends IsoBoxType>(type: T): (view: IsoBoxReadView) => VisualSampleEntryBox<T>;

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
export function defaultReaderConfig(): IsoBoxReadViewConfig;

// @public
export function defaultWriterConfig(): IsoBoxWriteViewConfig;

// @public
export type DegradationPriorityBox = FullBox & {
    type: "stdp";
    priority: number[];
};

// @public
export type EditBox = {
    type: "edts";
    boxes: EditBoxChild[];
};

// @public
export type EditBoxChild = EditListBox;

// @public
export type EditListBox = FullBox & {
    type: "elst";
    entryCount: number;
    entries: EditListEntry[];
};

// @public
export type EditListEntry = {
    segmentDuration: number;
    mediaTime: number;
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
export type EventMessageBox = EventMessageBoxV0 | EventMessageBoxV1;

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
export type EventMessageBoxV1 = EventMessageBoxBase & {
    version: 1;
    presentationTime: number;
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
export function isContainer<T extends IsoBox | Box<IsoBox["type"]>>(box: T): box is T & IsoBoxContainer;

// @public
export function isFullBox(box: any): box is FullBox;

// @public
export function isIsoBoxType<T extends keyof IsoBoxMap>(type: T, box: any): box is IsoBoxMap[T];

// @public
export type IsoBox = IsoBoxMap[keyof IsoBoxMap];

// @public
export type IsoBoxContainer = IsoBoxContainerMap[keyof IsoBoxContainerMap];

// @public
export type IsoBoxContainerMap = {
    dinf: DataInformationBox;
    edts: EditBox;
    grpl: GroupsListBox;
    mdia: MediaBox;
    meco: AdditionalMetadataContainerBox;
    mfra: MovieFragmentRandomAccessBox;
    minf: MediaInformationBox;
    moof: MovieFragmentBox;
    moov: MovieBox;
    mvex: MovieExtendsBox;
    schi: SchemeInformationBox;
    sinf: ProtectionSchemeInformationBox;
    stbl: SampleTableBox;
    strk: SubTrackBox;
    traf: TrackFragmentBox;
    trak: TrackBox;
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
export type IsoBoxMap = {
    ardi: AudioRenderingIndicationBox;
    avc1: VisualSampleEntryBox<"avc1">;
    avc2: VisualSampleEntryBox<"avc2">;
    avc3: VisualSampleEntryBox<"avc3">;
    avc4: VisualSampleEntryBox<"avc4">;
    co64: ChunkLargeOffsetBox;
    ctts: CompositionTimeToSampleBox;
    dinf: DataInformationBox;
    dref: DataReferenceBox;
    edts: EditBox;
    elng: ExtendedLanguageBox;
    elst: EditListBox;
    emsg: EventMessageBox;
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
    mdhd: MediaHeaderBox;
    mdia: MediaBox;
    meco: AdditionalMetadataContainerBox;
    mehd: MovieExtendsHeaderBox;
    meta: MetaBox;
    mfhd: MovieFragmentHeaderBox;
    mfra: MovieFragmentRandomAccessBox;
    mfro: MovieFragmentRandomAccessOffsetBox;
    minf: MediaInformationBox;
    moof: MovieFragmentBox;
    moov: MovieBox;
    mp4a: AudioSampleEntryBox<"mp4a">;
    mvex: MovieExtendsBox;
    mvhd: MovieHeaderBox;
    nmhd: NullMediaHeaderBox;
    payl: WebVttCuePayloadBox;
    pitm: PrimaryItemBox;
    prft: ProducerReferenceTimeBox;
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
    sidx: SegmentIndexBox;
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
    tfdt: TrackFragmentBaseMediaDecodeTimeBox;
    tfhd: TrackFragmentHeaderBox;
    tfra: TrackFragmentRandomAccessBox;
    tkhd: TrackHeaderBox;
    traf: TrackFragmentBox;
    trak: TrackBox;
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
    constructor(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig);
}

// @public
export type IsoBoxReader<B = unknown, T extends IsoBoxType = IsoBoxType> = (view: IsoBoxReadView, type: T) => B;

// @public
export type IsoBoxReaderMap = Record<IsoBoxType, IsoBoxReader>;

// @public
export type IsoBoxReaderReturn<T> = { [K in keyof T]: T[K] extends ((...args: never[]) => infer R) ? ParsedBox<R> : never; }[keyof T] | ParsedIsoBox;

// @public
export class IsoBoxReadView {
    [Symbol.iterator](): Generator<ParsedIsoBox>;
    constructor(raw: IsoBoxData, config?: IsoBoxReadViewConfig);
    get buffer(): ArrayBufferLike;
    get byteLength(): number;
    get byteOffset(): number;
    get bytesRemaining(): number;
    get cursor(): number;
    get done(): boolean;
    jump: (size: number) => void;
    readArray: <T extends keyof IsoFieldTypeMap>(type: T, size: number, length: number) => IsoFieldTypeMap[T][];
    readBox: () => ParsedBox;
    readBoxes: <T = IsoBox>(length?: number) => T[];
    readData: (size: number) => Uint8Array;
    readEntries: <T>(length: number, map: () => T) => T[];
    readFullBox: () => FullBox;
    readInt: (size: number) => number;
    readString: (size: number) => string;
    readTemplate: (size: number) => number;
    readUint: (size: number) => number;
    readUtf8: (size?: number) => string;
    slice: (offset: number, size: number) => IsoBoxReadView;
}

// @public
export type IsoBoxReadViewConfig = {
    readers?: IsoBoxReaderMap;
};

// @public
export type IsoBoxStreamable = IsoBox | ParsedIsoBox | ParsedBox<unknown> | ArrayBufferView;

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
    writeUtf8TerminatedString: (value: string) => void;
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
export type IsoTypedParsedBox<T extends keyof IsoBoxMap> = ParsedBox<IsoBoxMap[T]>;

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
export type MediaBox = {
    type: "mdia";
    boxes: MediaBoxChild[];
};

// @public
export type MediaBoxChild = MediaHeaderBox | HandlerReferenceBox | MediaInformationBox;

// @public
export type MediaDataBox = {
    type: "mdat";
    data: Uint8Array;
};

// @public
export type MediaHeaderBox = FullBox & {
    type: "mdhd";
    creationTime: number;
    modificationTime: number;
    timescale: number;
    duration: number;
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
export type MovieBox = {
    type: "moov";
    boxes: MovieBoxChild[];
};

// @public
export type MovieBoxChild = MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox;

// @public
export type MovieExtendsBox = {
    type: "mvex";
    boxes: MovieExtendsBoxChild[];
};

// @public
export type MovieExtendsBoxChild = MovieExtendsHeaderBox | TrackExtendsBox;

// @public
export type MovieExtendsHeaderBox = FullBox & {
    type: "mehd";
    fragmentDuration: number;
};

// @public
export type MovieFragmentBox = {
    type: "moof";
    boxes: MovieFragmentBoxChild[];
};

// @public
export type MovieFragmentBoxChild = MovieFragmentHeaderBox | TrackFragmentBox;

// @public
export type MovieFragmentHeaderBox = FullBox & {
    type: "mfhd";
    sequenceNumber: number;
};

// @public
export type MovieFragmentRandomAccessBox = {
    type: "mfra";
    boxes: MovieFragmentRandomAccessBoxChild[];
};

// @public
export type MovieFragmentRandomAccessBoxChild = TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox;

// @public
export type MovieFragmentRandomAccessOffsetBox = FullBox & {
    type: "mfro";
    mfraSize: number;
};

// @public
export type MovieHeaderBox = FullBox & {
    type: "mvhd";
    creationTime: number;
    modificationTime: number;
    timescale: number;
    duration: number;
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
export type ParsedBox<T = Box> = (T extends IsoBox ? T & Omit<Box, "type"> : T) & {
    view: IsoBoxReadView;
    size: number;
    largesize?: number;
    usertype?: number[];
};

// @public
export type ParsedIsoBox = ParsedBox<IsoBox | Box>;

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
export type ProducerReferenceTimeBox = FullBox & {
    type: "prft";
    referenceTrackId: number;
    ntpTimestampSec: number;
    ntpTimestampFrac: number;
    mediaTime: number;
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
export function readArdi(view: IsoBoxReadView): AudioRenderingIndicationBox;

// @public
export function readAudioSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView): AudioSampleEntryBox<T>;

// @public
export function readAvc1(view: IsoBoxReadView): VisualSampleEntryBox<"avc1">;

// @public
export function readAvc2(view: IsoBoxReadView): VisualSampleEntryBox<"avc2">;

// @public
export function readAvc3(view: IsoBoxReadView): VisualSampleEntryBox<"avc3">;

// @public
export function readAvc4(view: IsoBoxReadView): VisualSampleEntryBox<"avc4">;

// @public
export function readCtts(view: IsoBoxReadView): CompositionTimeToSampleBox;

// @public
export function readDref(view: IsoBoxReadView): DataReferenceBox;

// @public
export function readElng(view: IsoBoxReadView): ExtendedLanguageBox;

// @public
export function readElst(view: IsoBoxReadView): EditListBox;

// @public
export function readEmsg(view: IsoBoxReadView): EventMessageBox;

// @public
export function readEnca(view: IsoBoxReadView): AudioSampleEntryBox<"enca">;

// @public
export function readEncv(view: IsoBoxReadView): VisualSampleEntryBox<"encv">;

// @public
export function readFree(view: IsoBoxReadView): FreeSpaceBox;

// @public
export function readFrma(view: IsoBoxReadView): OriginalFormatBox;

// @public
export function readFtyp(view: IsoBoxReadView): FileTypeBox;

// @public
export function readHdlr(view: IsoBoxReadView): HandlerReferenceBox;

// @public
export function readHev1(view: IsoBoxReadView): VisualSampleEntryBox<"hev1">;

// @public
export function readHvc1(view: IsoBoxReadView): VisualSampleEntryBox<"hvc1">;

// @public
export function readIden(view: IsoBoxReadView): WebVttCueIdBox;

// @public
export function readImda(view: IsoBoxReadView): IdentifiedMediaDataBox;

// @public
export function readIsoBoxes<const R extends IsoBoxReaderMap>(raw: IsoBoxData, config: IsoBoxReadViewConfig & {
    readers: R;
}): IsoBoxReaderReturn<R>[];

// @public (undocumented)
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[];

// @public
export function readKind(view: IsoBoxReadView): TrackKindBox;

// @public
export function readLabl(view: IsoBoxReadView): LabelBox;

// @public
export function readMdat(view: IsoBoxReadView): MediaDataBox;

// @public
export function readMdhd(view: IsoBoxReadView): MediaHeaderBox;

// @public
export function readMehd(view: IsoBoxReadView): MovieExtendsHeaderBox;

// @public
export function readMeta(view: IsoBoxReadView): MetaBox;

// @public
export function readMfhd(view: IsoBoxReadView): MovieFragmentHeaderBox;

// @public
export function readMfro(view: IsoBoxReadView): MovieFragmentRandomAccessOffsetBox;

// @public
export function readMp4a(view: IsoBoxReadView): AudioSampleEntryBox<"mp4a">;

// @public
export function readMvhd(view: IsoBoxReadView): MovieHeaderBox;

// @public
export function readPayl(view: IsoBoxReadView): WebVttCuePayloadBox;

// @public
export function readPrft(view: IsoBoxReadView): ProducerReferenceTimeBox;

// @public
export function readPrsl(view: IsoBoxReadView): PreselectionGroupBox;

// @public
export function readPssh(view: IsoBoxReadView): ProtectionSystemSpecificHeaderBox;

// @public
export function readSchm(view: IsoBoxReadView): SchemeTypeBox;

// @public
export function readSdtp(view: IsoBoxReadView): SampleDependencyTypeBox;

// @public
export function readSidx(view: IsoBoxReadView): SegmentIndexBox;

// @public
export function readSkip(view: IsoBoxReadView): FreeSpaceBox<"skip">;

// @public
export function readSmhd(view: IsoBoxReadView): SoundMediaHeaderBox;

// @public
export function readSsix(view: IsoBoxReadView): SubsegmentIndexBox;

// @public
export function readSthd(view: IsoBoxReadView): SubtitleMediaHeaderBox;

// @public
export function readStsd<E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox>(view: IsoBoxReadView): SampleDescriptionBox<E>;

// @public
export function readStss(view: IsoBoxReadView): SyncSampleBox;

// @public
export function readSttg(view: IsoBoxReadView): WebVttSettingsBox;

// @public
export function readStts(view: IsoBoxReadView): DecodingTimeToSampleBox;

// @public
export function readStyp(view: IsoBoxReadView): SegmentTypeBox;

// @public
export function readSubs(view: IsoBoxReadView): SubsampleInformationBox;

// @public
export function readTenc(view: IsoBoxReadView): TrackEncryptionBox;

// @public
export function readTfdt(view: IsoBoxReadView): TrackFragmentBaseMediaDecodeTimeBox;

// @public
export function readTfhd(view: IsoBoxReadView): TrackFragmentHeaderBox;

// @public
export function readTfra(view: IsoBoxReadView): TrackFragmentRandomAccessBox;

// @public
export function readTkhd(view: IsoBoxReadView): TrackHeaderBox;

// @public
export function readTrex(view: IsoBoxReadView): TrackExtendsBox;

// @public
export function readTrun(view: IsoBoxReadView): TrackRunBox;

// @public
export function readUrl(view: IsoBoxReadView): DataEntryUrlBox;

// @public
export function readUrn(view: IsoBoxReadView): DataEntryUrnBox;

// @public
export function readVisualSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView): VisualSampleEntryBox<T>;

// @public
export function readVlab(view: IsoBoxReadView): WebVttSourceLabelBox;

// @public
export function readVmhd(view: IsoBoxReadView): VideoMediaHeaderBox;

// @public
export function readVttC(view: IsoBoxReadView): WebVttConfigurationBox;

// @public
export function readVtte(_: IsoBoxReadView): WebVttEmptySampleBox;

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
export type SegmentIndexBox = FullBox & {
    type: "sidx";
    referenceId: number;
    timescale: number;
    earliestPresentationTime: number;
    firstOffset: number;
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
export type TrackBox = {
    type: "trak";
    boxes: TrackBoxChild[];
};

// @public
export type TrackBoxChild = TrackHeaderBox | TrackReferenceBox | EditBox | MediaBox | UserDataBox;

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
export type TrackFragmentBaseMediaDecodeTimeBox = FullBox & {
    type: "tfdt";
    baseMediaDecodeTime: number;
};

// @public
export type TrackFragmentBox = {
    type: "traf";
    boxes: TrackFragmentBoxChild[];
};

// @public
export type TrackFragmentBoxChild = TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | SampleAuxiliaryInformationSizesBox | SampleAuxiliaryInformationOffsetsBox | SampleEncryptionBox | SubsampleInformationBox;

// @public
export type TrackFragmentHeaderBox = FullBox & {
    type: "tfhd";
    trackId: number;
    baseDataOffset?: number;
    sampleDescriptionIndex?: number;
    defaultSampleDuration?: number;
    defaultSampleSize?: number;
    defaultSampleFlags?: number;
};

// @public
export type TrackFragmentRandomAccessBox = FullBox & {
    type: "tfra";
    trackId: number;
    reserved: number;
    numberOfEntry: number;
    lengthSizeOfTrafNum: number;
    lengthSizeOfTrunNum: number;
    lengthSizeOfSampleNum: number;
    entries: TrackFragmentRandomAccessEntry[];
};

// @public
export type TrackFragmentRandomAccessEntry = {
    time: number;
    moofOffset: number;
    trafNumber: number;
    trunNumber: number;
    sampleNumber: number;
};

// @public
export type TrackHeaderBox = FullBox & {
    type: "tkhd";
    creationTime: number;
    modificationTime: number;
    trackId: number;
    reserved1: number;
    duration: number;
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
export function writeElst(box: EditListBox): IsoBoxWriteView;

// @public
export function writeEmsg(box: EventMessageBox): IsoBoxWriteView;

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
export function writeIsoBox(box: IsoBoxStreamable, config?: IsoBoxWriteViewConfig): Uint8Array;

// @public
export function writeIsoBoxes(boxes: Iterable<IsoBoxStreamable>, config: IsoBoxWriteViewConfig): Uint8Array[];

// @public
export function writeKind(box: TrackKindBox): IsoBoxWriteView;

// @public
export function writeLabl(box: LabelBox): IsoBoxWriteView;

// @public
export function writeMdat(box: MediaDataBox): IsoBoxWriteView;

// @public
export function writeMdhd(box: MediaHeaderBox): IsoBoxWriteView;

// @public
export function writeMehd(box: MovieExtendsHeaderBox): IsoBoxWriteView;

// @public
export function writeMeta(box: MetaBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeMfhd(box: MovieFragmentHeaderBox): IsoBoxWriteView;

// @public
export function writeMfro(box: MovieFragmentRandomAccessOffsetBox): IsoBoxWriteView;

// @public
export function writeMp4a(box: AudioSampleEntryBox<"mp4a">, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writeMvhd(box: MovieHeaderBox): IsoBoxWriteView;

// @public
export function writePayl(box: WebVttCuePayloadBox): IsoBoxWriteView;

// @public
export function writePrft(box: ProducerReferenceTimeBox): IsoBoxWriteView;

// @public
export function writePrsl(box: PreselectionGroupBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView;

// @public
export function writePssh(box: ProtectionSystemSpecificHeaderBox): IsoBoxWriteView;

// @public
export function writeSchm(box: SchemeTypeBox): IsoBoxWriteView;

// @public
export function writeSdtp(box: SampleDependencyTypeBox): IsoBoxWriteView;

// @public
export function writeSidx(box: SegmentIndexBox): IsoBoxWriteView;

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
export function writeTfdt(box: TrackFragmentBaseMediaDecodeTimeBox): IsoBoxWriteView;

// @public
export function writeTfhd(box: TrackFragmentHeaderBox): IsoBoxWriteView;

// @public
export function writeTfra(box: TrackFragmentRandomAccessBox): IsoBoxWriteView;

// @public
export function writeTkhd(box: TrackHeaderBox): IsoBoxWriteView;

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
