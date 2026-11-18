---
status: accepted
---

# RFC: Box types, names, and errors of ISO BMFF 2.0.0

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-11-17 |
| **Package** | `@svta/cml-iso-bmff` |
| **Breaking change** | Yes. The RFC is part of version 2.0.0. |
| **Depends on** | [Cursor API for ISO BMFF readers and writers](iso-bmff-cursor-api.md) ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)) |
| **Issues** | [#625](https://github.com/streaming-video-technology-alliance/common-media-library/issues/625), [#629](https://github.com/streaming-video-technology-alliance/common-media-library/issues/629), [#652](https://github.com/streaming-video-technology-alliance/common-media-library/issues/652), [#698](https://github.com/streaming-video-technology-alliance/common-media-library/issues/698) |

## Summary

The cursor RFC changes how a reader and a writer access bytes. This RFC changes the box types that those readers return and that those writers take. Version 2.0.0 is the only release that can make these changes, because each change alters a public type, a name, or a result.

The RFC has ten themes. Each theme states one rule:

| Theme | Rule |
|---|---|
| 1. Child boxes | A field named `boxes` always holds child boxes. `stsd` and `dref` use `boxes`. |
| 2. Count fields | The cursor RFC decides. This RFC adds nothing. |
| 3. Byte fields | A run of opaque bytes is a `Uint8Array`. A `pssh` box has one entry for each key ID. |
| 4. Four-character codes | A four-character code is a string. A writer writes 4 bytes or throws. |
| 5. Names | A type name is the class name of the specification. A field name is the specification name in camel case. |
| 6. Types with no reader | A box type is in `IsoBoxMap` only if the package has its reader and its writer. |
| 7. Errors | Built-in error types. No error for control flow. A reader error always reaches the caller. |
| 8. Strings | No size values with a special meaning. A terminated string ends at the first U+0000. |
| 9. Reserved fields | A reserved field is not a box field. A writer writes the value of the specification. |
| 10. Configuration | The configuration argument and its maps are optional for every entry point. |

```ts
import { defaultReaderConfig, findIsoBox, isIsoBoxType, readIsoBoxes } from '@svta/cml-iso-bmff'

export function getDefaultKeyId(init: Uint8Array): Uint8Array | undefined {
	const boxes = readIsoBoxes(init, defaultReaderConfig())
	const tenc = findIsoBox(boxes, (box) => isIsoBoxType('tenc', box))

	return tenc?.defaultKid
}
```

In version 1, `findIsoBox` does not reach `tenc`, because `stsd` keeps its sample entries in `entries`. The key ID is also a `number[]` of 16 numbers.

## Motivation

An audit of the package found 92 defects that only a major version can correct. The cursor RFC takes 28 of them, because they concern its types or its contract. This RFC takes 49. The other 15 defects can be fixed in a minor release, or they concern types that no release contains yet. The pull request of this RFC has the table for each defect.

The defects of this RFC are of four kinds:

1. **A type that does not match the specification.** A key ID list is flat. `compressorName` is 32 numbers. A `tref` child has a shape that no code produces.
2. **Two rules for one thing.** Child boxes are in `boxes` or in `entries`. A four-character code is a string or a number. Bytes are `Uint8Array` or `number[]`.
3. **A writer that writes wrong bytes with no error.** A brand of 3 characters moves every later field. `writeMdhd` writes `enm` for `en-US`. A string with U+0000 moves the next field.
4. **An error path that drops data.** The box iterator finds a truncated box by the text of an error message. A reader that throws an error with that text drops the rest of the parent box.

## Relation to the cursor RFC

This RFC builds on the types of the cursor RFC: the read cursor, the write cursor, the raw box, and the result type of `readIsoBoxes`. This RFC does not change those types.

The cursor RFC owns these subjects. This RFC does not repeat them:

- The result type of `readIsoBoxes`, the child types, and `isIsoBoxType` (section "Result type").
- The order of `writeIsoBoxes` for a box with a `bytes` field (section "Raw boxes in `writeIsoBoxes`").
- The removal of count fields (section "Count fields"). This rule closes issue 625.
- The names of the field functions and the rename of `readVttc` (question 5).

Some themes of this RFC change text of the cursor RFC. [Changes to the cursor RFC](#changes-to-the-cursor-rfc) lists each change.

## Guide-level explanation

### Find a box below a sample entry

`stsd` and `dref` keep their child boxes in `boxes`, as every other box does. The traversal functions therefore reach every box of the tree.

```ts
import { defaultReaderConfig, filterIsoBoxes, readIsoBoxes } from '@svta/cml-iso-bmff'

export function getCodecConfigTypes(init: Uint8Array): string[] {
	const boxes = readIsoBoxes(init, defaultReaderConfig())

	return filterIsoBoxes(boxes, (box) => box.type === 'avcC' || box.type === 'hvcC').map((box) => box.type)
}
```

### Read the key IDs of a `pssh` box

```ts
import { isIsoBoxType, readIsoBoxes, readPssh } from '@svta/cml-iso-bmff'

export function getKeyIds(init: Uint8Array): Uint8Array[] {
	const boxes = readIsoBoxes(init, { readers: { pssh: readPssh } })

	return boxes.flatMap((box) => (isIsoBoxType('pssh', box) ? box.kid : []))
}
```

Each entry of `kid` is a 16-byte view of the input. A caller that keeps a key ID after the input is gone calls `slice()`.

### Write a box with a four-character code

```ts
import { writeIsoBox, writeFrma } from '@svta/cml-iso-bmff'

export const frma = writeIsoBox({ type: 'frma', dataFormat: 'avc1' }, { writers: { frma: writeFrma } })
```

`dataFormat` is a string. In version 1, the field is the number `0x61766331`.

## Reference-level explanation

Each theme has six parts: the state in version 1, an example, the rule, the migration, the cost, and the alternatives.

The costs are bytes after minification and gzip, for two bundles. The bundle "full" has `readIsoBoxes`, `writeIsoBoxes`, `defaultReaderConfig`, and `defaultWriterConfig`. A second bundle has the functions of the theme. [Method of the measurements](#method-of-the-measurements) states the method and its limits.

### Theme 1: child boxes

**Version 1.** `SampleDescriptionBox` and `DataReferenceBox` keep their child boxes in `entries`. Every other box with child boxes uses `boxes`, `meta` and `prsl` included. `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` read only `boxes`. They therefore never reach a sample entry, a `url ` box, a codec configuration box, or a `tenc` box.

**Example.** A read of `hvc1_init.mp4` with `defaultReaderConfig()` finds `stsd`. `findIsoBox` returns `null` for `hvc1`, `hvcC`, and `url `.

**Rule.** A field named `boxes` holds child boxes. A field named `entries` holds records that are not boxes. `SampleDescriptionBox` and `DataReferenceBox` keep their child boxes in `boxes`. The traversal functions do not change.

**Migration.** `stsd.entries` becomes `stsd.boxes`. `dref.entries` becomes `dref.boxes`. The compiler reports each use. `@svta/cml-drm` changes four lines in `ensureEncryptedInit`.

**Cost.** The full bundle gets 5 bytes smaller, because `boxes` is shorter than `entries`. A prototype found `hvc1` and `hvcC` in `hvc1_init.mp4`, and version 1 found neither.

**Alternatives.**

- Keep `entries`, and the traversal functions read `entries` of the two types. mp4box.js and dash.js call these lists `entries`. The specification has no field name. The traversal then needs a list of special types, and rule 1 of "Result type" in the cursor RFC needs a second field. The maintainer chose `boxes` on 2026-11-17.

### Theme 2: count fields

The section "Count fields" of the cursor RFC removes every count field that repeats the length of a list. `stsz`, `saiz`, and `ctts` keep an optional count in the forms with no list. This RFC adds no rule.

Three themes of this RFC change rows of that table:

- Theme 1 changes the list of `stsd` and `dref` from `entries` to `boxes`.
- Theme 3 changes `kid` of `pssh` to one entry for each key ID. The writer writes the length of `kid` as the count. Question 9 of the cursor RFC (a `kid` length that is not a multiple of 16) then no longer applies.
- Theme 5 changes the list of `stss` to `sampleNumber` and the list of `prsl` to `entityId`.

### Theme 3: byte fields

**Version 1.** Opaque bytes have two types. `emsg`, `mdat`, `free`, `imda`, and `senc` use `Uint8Array`. `pssh` (`systemId`, `kid`, `data`), `tenc` (`defaultKid`, `defaultConstantIv`), and `sdtp` use `number[]`. The `kid` field is one flat list with 16 numbers for each key ID. `compressorName` of a visual sample entry is 32 numbers, and the specification defines a counted string. `writeBytes` writes 0 bytes for a `number[]`, with no error.

**Example.** A `pssh` box with two key IDs has `kid` with 32 numbers. The caller splits the list by hand.

**Rule.**

1. A field that the specification defines as opaque bytes is a `Uint8Array`. The reader returns a view of the input with `readBytes`, with no copy.
2. A list of key IDs is a `Uint8Array[]` with one 16-byte entry for each key ID. The name stays `kid`, the name of the specification. A box of version 0 has an empty list.
3. `compressorName` is a `string`. The reader decodes the counted string as UTF-8, the encoding of the other text fields. The writer writes the length byte, at most 31 bytes, and zero bytes to 32. The writer does not cut a character in two.
4. `sampleDependencyTable` of `sdtp` is a `Uint8Array` with one byte for each sample. The TSDoc states the four bit fields of clause 8.6.4.2.
5. A field with a fixed size, such as `systemId` and `defaultKid`, writes that size. The writer writes 0 for each missing byte and ignores extra bytes, as the version 1 writers do for a short `number[]`.
6. `writeBytes(cursor, data)` takes one `ArrayLike<number>` and copies it with `Uint8Array.prototype.set`. A `number[]` then writes its bytes. The list form of version 1 has no use, because a container writes its child boxes into the same buffer.
7. `matrix` of `mvhd` and `tkhd` is a labeled tuple of 9 numbers. `opColor` of `vmhd` is a labeled tuple of 3 numbers. The writers keep the zero padding for a short array.

**Migration.**

- A box literal wraps each byte list in `new Uint8Array(...)`.
- `box.kid` becomes a list of key IDs. Code that split the list by 16 reads the entries.
- A comparison of two key IDs compares bytes, not array identity. A string key in a `Map` uses a hex form of the bytes.
- A caller that keeps a byte field after the input buffer changes calls `slice()`.
- `@svta/cml-drm` accepts `Uint8Array` and `number[]` for `defaultKid`, so its public type does not narrow (issue 698).

**Cost.**

| Part | Full bundle | Bundle of the theme |
|---|---|---|
| Byte fields as `Uint8Array` (rules 1, 2, 4, 6) | +12 B | +27 B |
| `compressorName` as a string (rule 3) | +81 B | +84 B |
| Theme 3 | +93 B | +111 B |

The bundle of the theme has the readers and writers of `pssh`, `tenc`, `sdtp`, and `avc1`. A read of a `pssh` box or a `tenc` box allocates no array of numbers. The prototype read the names "GoPro AVC encoder", "HEVC Coding", and "AVC Coding" from the test fixtures. Question 3 asks whether `compressorName` is worth its cost.

The view keeps the input buffer in memory while the caller keeps the box. That rule is the rule of `readBytes` in the cursor RFC and of `mdat` in version 1.

**Alternatives.**

- A copy for each field. The copy costs one allocation for each field and frees the input. A caller can copy with `slice()`, and a caller cannot remove a copy.
- A hex string for a key ID, as shaka-player and mp4box.js have. A string is easy to compare. The writer then needs a hex decoder, and a reader allocates a string for each key ID.
- A flat `Uint8Array` with 16 bytes for each key ID. The maintainer chose one entry for each key ID on 2026-11-17. hls.js also has one entry for each key ID.

### Theme 4: four-character codes

**Version 1.** A four-character code is a string in `ftyp`, `styp`, and `hdlr`. It is a number in `frma` (`dataFormat`), `schm` (`schemeType`), `saio` and `saiz` (`auxInfoType`), and `sbgp` and `sgpd` (`groupingType`). The writers write `value.length` bytes. A brand of 3 characters moves every later field. A brand of 5 characters throws a `RangeError` in version 1, and the growing buffer of the cursor RFC would write it with no error. `fourCcToUint32` accepts a string of any length. The readers map finds a reader for `url ` under the key `url`, and the writers map does not. The writers map is `Record<string, IsoBoxWriter<any>>`, so a writer under the wrong key compiles.

**Example.** `writeFtyp({ type: 'ftyp', majorBrand: 'mp4', minorVersion: 0, compatibleBrands: [] })` writes `minorVersion` one byte early.

**Rule.**

1. A field whose values are four-character codes is a `string`. `dataFormat`, `schemeType`, `auxInfoType`, and `groupingType` become strings.
2. `readFourCc(cursor)` and `writeFourCc(cursor, value)` read and write 4 bytes. `writeFourCc` throws a `RangeError` for a value that is not 4 characters. The message has the received value. `beginIsoBox` and `beginIsoFullBox` write the box type with the same rule. The range rule of PR 669 covers numbers, and a code is a string.
3. A map key is the exact box type. Both maps also accept the keys `url` and `urn` for `'url '` and `'urn '`, as the readers map of version 1 does.
4. The two maps list the known box types for completion and check the pairing of key and box:

```ts
type IsoBoxReaderMap<V extends IsoInt64 = number> = {
	[K in keyof IsoBoxMap]?: IsoBoxReader<{ type: K }, V>
} & { [type: IsoBoxType]: IsoBoxReader<{ type: IsoBoxType }, V> }

type IsoBoxWriterMap = {
	[K in keyof IsoBoxMap]?: IsoBoxWriter<IsoBoxMap<IsoInt64>[K]>
} & { [type: IsoBoxType]: IsoBoxWriter<never> }
```

A model with TypeScript 6.0.3 compiled these types with the read cursor of the cursor RFC. The model has the 9 cases of the cursor model, and they still pass. A reader or a writer under the wrong key is a compile error. A custom key still compiles.

**Migration.**

- `dataFormat: 0x61766331` becomes `dataFormat: 'avc1'`. The compiler reports each number.
- A hand-built code that is not 4 characters throws. In version 1, the writer wrote a box with wrong fields.
- A custom reader for a known key returns the literal type of its key.
- `@svta/cml-drm` passes `entry.type` as `dataFormat`. Its `schemeType` option accepts a string and a number, so its public type does not narrow (issue 698).

**Cost.** The full bundle gets 32 bytes larger. The bundle with the readers and writers of `frma`, `schm`, `ftyp`, and `hdlr` gets 38 bytes larger. `fourCcToUint32` alone is 135 bytes. An adopter who imports it saves those bytes if the function leaves the package (question 5). The map types change no bytes. The prototype padded and cut a code, and it removed the `url` alias. The throw of rule 2 and the alias of rule 3 were not measured.

**Alternatives.**

- `writeFourCc` pads a short value with U+0020 and cuts a long value, as mp4box.js does. A dropped space, such as `'qt'` for `'qt  '`, then writes the intended code. A typo writes a wrong box with no error.
- One key for each box type. A map with the key `url` then compiles, and its reader is never called.
- Numbers for every code, as codem-isoboxer has for some fields. Every player reads codes as strings.

### Theme 5: names

**Version 1.** The package has no stated rule for names. The audit found eight patterns:

| Subject | Version 1 | Defect |
|---|---|---|
| Box type names | `HandlerReferenceBox`, `DecodingTimeToSampleBox`, `SampleEntryBox` | Seven names use the clause title, not the class name. Three names add `Box` to a class name. |
| Entry type names | `DecodingTimeSample`, `Entity`, `Subsegment` | Four patterns. Some names are too general for a public export. |
| Field names | `channelcount`, `horizresolution`, `maxPDUsize` | Two casing rules |
| List fields | `entries: { sampleNumber }[]` in `stss` | An object with one field for each number |
| `tenc` fields | `defaultIvSize`, `defaultIsEncrypted` | Names of two editions of ISO/IEC 23001-7 |
| Configuration types | `IsoBoxReadViewConfig`, `IsoBoxWriteViewConfig` | Named after classes that the cursor RFC removes |
| Guards | `isContainer`, `isFullBox` | The predicate of `isContainer` excludes 14 types that it accepts. `isFullBox` has no caller. |
| Shared shapes | `TypeBox<T>`, `FreeSpaceBox<T>` | No constraint on `T` |

**Rule.**

1. A box type name is the class name of the specification syntax. The package adds no suffix. `HandlerReferenceBox` becomes `HandlerBox`, and `SampleEntryBox` becomes `SampleEntry`. A function named after a type follows the type.
2. An entry type name is the box type name without `Box`, then the singular of the field name. `DecodingTimeSample` becomes `TimeToSampleEntry`.
3. A field name is the specification name in lower camel case, split at each English word. Acronyms are words: `Id`, `Kid`, `Iv`, `Pdu`. `timescale` stays one word.
4. A list field keeps the specification name, singular or plural as the specification writes it. A loop with no name in the specification gets the plural of its count field: `entry_count` gives `entries`. A list of single numbers is a `number[]`.
5. `tenc` uses the names of ISO/IEC 23001-7:2016 only. Theme 9 removes `defaultIsEncrypted`. `defaultIvSize` becomes `defaultPerSampleIvSize`.
6. The configuration types are `IsoBoxReadConfig` and `IsoBoxWriteConfig`. A function that returns a new object starts with `create`, so `defaultReaderConfig` becomes `createDefaultReaderConfig`.
7. `isFullBox` leaves the package. `isContainer` keeps its name and its run-time result. Its predicate narrows to the boxes with a `boxes` field.
8. `TypeBox` and `FreeSpaceBox` constrain `T` to their two box types.

The table shows every rename. The specification texts were ISO/IEC 14496-12:2015 and 23001-7:2016. The text of ISO/IEC 14496-30 was not available, so the WebVTT names did not change.

| Version 1 | Version 2.0.0 | Rule |
|---|---|---|
| `HandlerReferenceBox` | `HandlerBox` | 1 |
| `DecodingTimeToSampleBox` | `TimeToSampleBox` | 1 |
| `CompositionTimeToSampleBox` | `CompositionOffsetBox` | 1 |
| `ProtectionSchemeInformationBox` | `ProtectionSchemeInfoBox` | 1 |
| `TrackKindBox` | `KindBox` | 1 |
| `SubsampleInformationBox` | `SubSampleInformationBox` | 1 |
| `SubTrackBox` | `SubTrack` | 1 |
| `SampleEntryBox`, `AudioSampleEntryBox`, `VisualSampleEntryBox` | `SampleEntry`, `AudioSampleEntry`, `VisualSampleEntry` | 1 |
| `readAudioSampleEntryBox`, `writeAudioSampleEntryBox` | `readAudioSampleEntry`, `writeAudioSampleEntry` | 1 |
| `readVisualSampleEntryBox`, `writeVisualSampleEntryBox` | `readVisualSampleEntry`, `writeVisualSampleEntry` | 1 |
| `DecodingTimeSample` | `TimeToSampleEntry` | 2 |
| `CompositionTimeToSampleEntry` | `CompositionOffsetEntry` | 2 |
| `SubsampleEntry`, `Subsample` | `SubSampleInformationEntry`, `SubSampleInformationSubsample` | 2 |
| `Subsegment`, `SubsegmentRange` | `SubsegmentIndexSubsegment`, `SubsegmentIndexRange` | 2 |
| `channelcount`, `samplesize`, `samplerate` | `channelCount`, `sampleSize`, `sampleRate` | 3 |
| `horizresolution`, `vertresolution` | `horizResolution`, `vertResolution` | 3 |
| `graphicsmode`, `opcolor` | `graphicsMode`, `opColor` | 3 |
| `maxPDUsize`, `avgPDUsize`, `maxbitrate`, `avgbitrate` | `maxPduSize`, `avgPduSize`, `maxBitrate`, `avgBitrate` | 3 |
| `stss.entries: SyncSample[]` | `stss.sampleNumber: number[]` | 4 |
| `prsl.entities: Entity[]` | `prsl.entityId: number[]` | 4 |
| `defaultIvSize` | `defaultPerSampleIvSize` | 5 |
| `IsoBoxReadViewConfig`, `IsoBoxWriteViewConfig` | `IsoBoxReadConfig`, `IsoBoxWriteConfig` | 6 |
| `defaultReaderConfig`, `defaultWriterConfig` | `createDefaultReaderConfig`, `createDefaultWriterConfig` | 6 |
| `isFullBox` | Removed | 7 |

The rule keeps these names:

- `ItemInfoEntry`, because it is the class name.
- `ntpTimestampSec` and `ntpTimestampFrac` of `prft`. The two fields are the halves of `ntp_timestamp`, and PR 645 decided the split.
- `mfraSize` of `mfro`. The specification name `size` is the name of the box header field.
- The WebVTT types, until someone reads the class names of ISO/IEC 14496-30.

`prsl.entityId` uses the name `entity_id`, which is not confirmed. The 2015 text of ISO/IEC 14496-12 has no `prsl` box.

Theme 6 removes the types of `iloc`, `senc`, and `stsh`, so their entry types need no rename.

**Migration.** The changelog and the migration guide of the cursor RFC have one row for each rename. The compiler reports each old name. A field rename changes the keys of the reader result. Code that reads a field by a string key gets no compile error.

**Cost.** The full bundle gets 6 bytes smaller, and the bundle with the `stss`, `prsl`, `mp4a`, and `vmhd` functions gets 27 bytes smaller. A type rename changes no bytes. A read of a `stss` box with 10,000 entries took 97 µs with a `number[]` and 172 µs with one object for each entry.

**Alternatives.**

- Keep every name. Each rename costs adopters a code change, and no rename fixes a run-time defect. Version 2.0.0 is the only release with a rename at no extra cost, because adopters change their readers and writers in that release anyway.
- The spelling of the specification for field names, as mp4box.js has (`samplerate`, `compressorname`). hls.js and shaka-player split the words (`sampleRate`, `channelCount`). The specification itself mixes `compressorname` and `frame_count`.
- An `Iso` token in every export name. The cmcd package has exports with no token, and the box functions of this package have no token.

### Theme 6: types with no reader

**Version 1.** `IsoBoxMap` has 18 box types that no reader returns and no writer takes. Several of those types differ from the specification. `TrackReferenceTypeBox` declares `type: 'tref'` and `trackIds`, and no code produces that shape. A child of `tref` has only the header fields. Four box types also have a second lowercase export (`co64`, `stz2`, `url`, `urn`). The package exports the field constants `UINT`, `INT`, `TEMPLATE`, `STRING`, `UTF8`, `DATA`, `IsoBoxFields`, and `IsoFieldTypeMap`, and the cursor RFC removes every function that takes them. The stream has two exports: `createIsoBoxReadableStream` and `IsoBoxReadableStream`. The class reads `ReadableStream` once, when the module loads, so a polyfill that a player installs later has no effect.

**Rule.**

1. A box type is in `IsoBoxMap` only if the package exports its reader and its writer. Issue 652 adds the readers and writers of `co64` and `stz2`. The other types leave `IsoBoxMap` and the exports.
2. `TrackReferenceTypeBox` leaves the package. A child of `tref` is a raw box.
3. The lowercase aliases and the field constants leave the package.
4. `createIsoBoxReadableStream` is the only stream export. The function reads `ReadableStream` when it is called.

**Migration.** A type with no reader becomes a type that the adopter declares, with a custom reader. `co64` becomes `ChunkLargeOffsetBox` or `IsoBoxMap['co64']`. `new IsoBoxReadableStream(boxes, config)` becomes `createIsoBoxReadableStream(boxes, config)`.

**Cost.** A bundle with `createIsoBoxReadableStream` gets 27 bytes smaller. The full bundle does not change, because it has no stream. A type removal changes no bytes. A prototype worked with a `ReadableStream` that a test installed after the import, and version 1 threw.

**Alternatives.**

- Implement every type before 2.0.0. The work adds a reader and a writer for each of 16 types, and a reader of `senc` needs the IV size from `tenc` or a sample group. A reader can come in a minor release. A new key in `IsoBoxMap` after 2.0.0 adds a member to the result type, and the cursor RFC builds that type from the map.
- Keep the types for adopters who write their own readers. A type that differs from the specification misleads those adopters.

### Theme 7: errors

**Version 1.** The package throws `Error`, `RangeError`, and `TypeError`, with four message styles. The box iterator catches an error with the message `Truncated box` and stops the read. A custom reader that throws an error with that text drops its box and every later box of the parent, with no error. `readStsd` and `readDref` return fewer entries than `entry_count` with no error, and every other reader with a count throws. Box nesting has no limit, so a deep input ends with a stack overflow of the engine. The stream throws for an error in the first box and rejects a read for an error in a later box.

**Example.** A custom `emsg` reader that throws `new Error('Truncated box')` for a bad message makes `readIsoBoxes` return only the boxes before that `emsg` box.

**Rule.**

1. The package throws two error types. A `RangeError` is a read past `cursor.end` or a `bigint` that does not fit its field. A count above the number of complete child boxes, the nesting limit, and a four-character code that is not 4 characters are also a `RangeError`. An `Error` is a box that cannot be written or a missing `ReadableStream`. The package adds no error class.
2. No error is a signal inside the package. The tree reader checks the box size before it calls a reader, as the cursor RFC states for `nextIsoBox`. A truncated box stops the read with no error, as in version 1 (PR 662). The tree reader does not catch an error of a reader, so that error always reaches the caller.
3. `stsd` and `dref` throw a `RangeError` when the body has fewer complete child boxes than `entry_count`. The message has the box type, the count, and the number of complete boxes. A count below the number of boxes keeps the rule of PR 672.
4. The read throws a `RangeError` for a box that is deeper than 128 levels. The message has the box type and the limit. The write has no limit.
5. The stream writes one box for each read, and an error of any box rejects the read. The stream writes no box before the first read.
6. Two messages keep their text, because a pull request or an accepted RFC decided it. The messages are `No writer found for box type` (PR 673) and the overflow message of the `int64` RFC.

**Migration.**

- A caller that tests `error.message === 'Truncated box'` tests the result of `nextIsoBox` instead. The message no longer exists.
- A malformed `stsd` or `dref` box throws a `RangeError`. In version 1, the read returned fewer entries.
- `createIsoBoxReadableStream` no longer throws for the first box. The error rejects the first read.

**Cost.**

| Part | Full bundle | Bundle of `readIsoBoxes`, `readStsd`, and `readDref` |
|---|---|---|
| Size check before the reader, no catch (rule 2) | -12 B | -11 B |
| Count check of `stsd` and `dref` (rule 3) | +55 B | +58 B |
| Nesting limit (rule 4) | +45 B | +64 B |
| Theme 7 | +97 B | +101 B |

A prototype threw for an `stsd` box with an `entry_count` of 2 and one complete box. A prototype with a limit of 64 levels threw the nesting error at 65 levels. Version 1 ended with a stack overflow at 200,000 levels. With the stream rule, no box was written before the first read, and an error of the first box rejected that read.

**Alternatives.**

- One error class with a code, as shaka-player has. A caller then tests a code and not a type. The class costs 93 bytes more than theme 7 in the full bundle. No caller of version 1 needs a code, because a truncated box is a result and not an error.
- A nesting limit in the configuration. The specification states no limit, and the test fixtures need 8 levels. A fixed number far above real files needs no option.

### Theme 8: strings

**Version 1.** The `size` parameter of `readString`, `readUtf8`, `readData`, and `readBoxes` has four rules. The rules cover -1, 0, other negative values, and a size past the end. `writeString` writes one byte for each character, and the built-in readers decode UTF-8. The writers of terminated strings write a U+0000 that is part of the value, so the next field starts at the wrong byte. `writeMdhd` keeps 5 bits of each character, so `en-US` writes `enm`. A `language` shorter than 3 characters writes 0, and a read returns three grave accents. `location` of `url ` and `urn ` is a required string. `url ` with flag 1 has no location in the specification, and `urn ` has an optional location.

**Example.** `writeHdlr` with the name `'a\0b'` writes the bytes of `a`, a null byte, `b`, and a null byte. A read returns `a`.

**Rule.**

1. A length is a number of bytes. A negative length throws a `RangeError`, as a length past `cursor.end` does. A length of 0 reads nothing. No length value has a special meaning. A reader reads to the end of the box with `cursor.end - cursor.pos`.
2. Text is UTF-8. `readUtf8(cursor, length)` and `writeUtf8(cursor, value)` read and write text with no terminator. `readTerminatedUtf8(cursor)` stops at the first null byte or at `cursor.end`. It throws no error for a box with no null byte (PR 639). `writeTerminatedUtf8(cursor, value)` writes the value up to the first U+0000, then one null byte.
3. A four-character code uses `readFourCc` and `writeFourCc` (theme 4). The one-byte `readString` and `writeString` leave the package.
4. The five WebVTT text readers read to the end of the box. ISO/IEC 14496-30 clause 6.1, as the Unified Streaming validator quotes it, defines `boxstring` as UTF-8 bytes that fill the box with no null terminator. shaka-player and mp4box.js read these boxes the same way. `iden`, `payl`, `sttg`, and `vlab` no longer stop at a null byte (PR 638).
5. `writeMdhd` writes the code of `und` (0x55C4) for a `language` that is not 3 characters, each from U+0060 to U+007F. A value that `readMdhd` returns therefore writes the same bytes.
6. `location` of `url ` and `urn ` is optional. The readers omit the key when no bytes remain. This rule closes issue 629.

**Migration.**

- `view.readUtf8(-1)` becomes `readUtf8(cursor, cursor.end - cursor.pos)`.
- `view.readString(4)` for a code becomes `readFourCc(cursor)`.
- A `language` of 2 characters writes `und`, not 0. The bytes of such a box change.
- A WebVTT box that release 1.0.7 or earlier wrote ends in a null byte. The read of `iden`, `payl`, `sttg`, or `vlab` then returns a trailing U+0000.

**Cost.**

| Part | Full bundle | Bundle of 8 string functions |
|---|---|---|
| Terminated strings end at U+0000 (rule 2) | +22 B | +13 B |
| `und` for a bad `language` (rule 5) | +33 B | +39 B |
| Optional `location` (rule 6) | +34 B | +44 B |
| Theme 8 | +90 B | +94 B |

Rules 1 and 3 change functions of the cursor RFC, which has no code yet. They were not measured. Rule 4 was not measured either, because the prototype measured the opposite rule. A prototype wrote an `emsg` box with the scheme `'a\0b'` and read back the value, the timescale, and the ID. Version 1 read three wrong values from the same box.

**Alternatives.**

- `writeMdhd` throws for a bad `language`. The writers of PR 669 throw no error for a bad value, and `und` is the code of the specification for an unknown language.
- All five WebVTT readers stop at the first null byte, the rule of PR 638. A box from release 1.0.7 or earlier then reads with no trailing U+0000. The rule differs from the specification for text with U+0000.

### Theme 9: reserved fields

**Version 1.** Ten box types have required `reserved` and `pre_defined` fields, and the writers write the value of the box. `AudioSampleEntryBox` keeps `entry_version` in the upper half of `reserved2[0]`. Four box types have a packed field next to the fields decoded from it. The packed fields are `reference` and `sap` of `sidx`, `reserved` of `tfra`, `isGroupLabel` of `labl`, and `defaultIsEncrypted` of `tenc`. Each writer has its own rule for which field it writes.

**Example.** A hand-built `mvhd` box must state `reserved1: 0` and `reserved2: [0, 0]`, and a wrong value writes bytes that the specification forbids.

**Rule.**

1. A field that the specification defines as `reserved` is not a box field. The reader skips it. The writer writes the value of the specification. The rule removes 13 fields. `reserved` of `hdlr` stays as an optional field, because QuickTime files store data there (question 19).
2. `AudioSampleEntry` has `entryVersion`, read from the first 16 bits of the old `reserved2` area. The writer writes `box.entryVersion ?? 0`.
3. A `pre_defined` field stays, as an optional field. The writer writes `box.preDefined ?? 0`.
4. A box has one field for each value. `sidx` keeps the six decoded fields. `tfra` keeps the three length sizes. `labl` keeps `flags`, and its TSDoc states the bit of a group label. `tenc` keeps `defaultIsProtected`, and the writer writes it. The rule of PR 658 for the constant IV does not change.

**Migration.** A box literal drops the `reserved` fields. `box.isGroupLabel` becomes `(box.flags & 0x1) !== 0`. `defaultIsEncrypted: 1` becomes `defaultIsProtected: 1`. `@svta/cml-drm` changes two lines of `ensureEncryptedInit`.

**Cost.** The full bundle gets 65 bytes smaller. The bundle with the readers and writers of `mvhd`, `tkhd`, `hdlr`, `sidx`, `tenc`, `avc1`, and `mp4a` gets 3 bytes smaller.

The rule changes the bytes of one test fixture. The `hdlr` box below `moov/udta/meta` of `time_to_sample.mp4` has the QuickTime manufacturer code `appl` in its `reserved` field. A prototype wrote 0 there, so 4 bytes of the file changed. Question 19 asks whether `reserved` of `hdlr` stays as an optional field.

**Alternatives.**

- Keep the fields as optional fields. A reader still allocates the arrays, and the writer still has two sources.
- Remove the `pre_defined` fields too. A QuickTime file stores data in some of them, such as the component type of `hdlr`. A writer would lose those bytes.

### Theme 10: configuration

**Version 1.** `readIsoBoxes` and `writeIsoBox` take an optional configuration. `writeIsoBoxes`, `createIsoBoxReadableStream`, and the stream class require it. `writers` is required, and `readers` is optional. Issue 298 chose the required form, so that a missing writer is a compile error.

**Rule.** The configuration is the last argument of every entry point, and it is optional. Every field of the configuration is optional. With no `writers`, a write takes only raw boxes and containers. A box with no writer throws, as the cursor RFC states.

**Migration.** No code changes. A call with `{ writers: {} }` still compiles. Version 1 already accepts a missing configuration at run time, so only the types change.

**Cost.** The full bundle gets 11 bytes smaller, because the internal `createWriterConfig` goes away. A prototype wrote every test fixture with no configuration and returned the source bytes.

**Alternatives.** A required configuration everywhere. The cursor RFC moves the writers into the write cursor, and a container writer finds a missing writer at run time. The compile check of issue 298 therefore no longer exists, and a required argument has no gain.

### Build order

The work for both RFCs lands on `feat/iso-bmff-v2` in three phases. Each pull request has one kind of change. The round-trip test of the fixtures and the diff of the API report then show one change at a time.

**Phase 1, before the cursor rewrite.** Themes 1, 5, 6, 9, and 10 change version 1 code. These themes rename or remove public names, or change a few fields. They need no function of the cursor RFC, and the rewrite keeps their result. The rewrite then changes only the cursor code. Theme 9 also removes the reserved fields of about ten readers, so the rewrite has fewer fields to change.

**Phase 2, the cursor rewrite.** The rewrite also builds the parts of this RFC that define the field functions or the contract of the cursor:

- The map types of theme 4, because the variance model of the cursor RFC decides them.
- `readFourCc` and `writeFourCc`, with the write rule of theme 4.
- The string functions of theme 8, rules 1 to 3.
- The rules of theme 7 for the tree reader: the size check before a reader, no catch around a reader, and the nesting limit.

A later change to these parts would change the field functions a second time.

**Phase 3, one box at a time.** These rules change one reader or one writer each. They go into the pull request that moves that box to the cursor:

- Theme 3, because the byte fields use the views of `readBytes`. In version 1 code, the `pssh`, `tenc`, and sample entry code would change twice.
- Rule 1 of theme 4: the string fields of four-character codes.
- Rules 3 and 5 of theme 7: the count check of `stsd` and `dref`, and the stream.
- Rules 4 to 6 of theme 8: the WebVTT strings, the `mdhd` language, and `location`.

Each pull request of every phase also changes `@svta/cml-drm` and `@svta/cml-c2pa` (issue 698). Each pull request also sets the size budget of the package.

Question 1 of the cursor RFC changes this order. If a version 1.1.0 is released first, phase 1 starts after that release, because phase 1 breaks the API of version 1. Question 22 asks about the alternative order.

### Changes to the cursor RFC

| Section of the cursor RFC | Change |
|---|---|
| Count fields | The rows of `stsd` and `dref` name the list `boxes`. The row of `stss` names the list `sampleNumber`, and the row of `prsl` names `entityId`. |
| Count fields | The bullet on `pssh`: `kid` has one entry for each key ID, and the writer writes the length of `kid`. Question 9 no longer applies. |
| Types | `IsoBoxReaderMap` and `IsoBoxWriterMap` have the form of theme 4. |
| Functions | `view.readString(size)` maps to `readFourCc` and `readUtf8`. The table adds `readTerminatedUtf8` and `writeTerminatedUtf8`. |
| Functions | `writeIsoBoxes(boxes, config?)` takes an optional configuration. |
| Functions | `writeBytes` takes one `ArrayLike<number>`. The table adds `readFourCc` and `writeFourCc`. |
| Contract | The tree reader catches no error of a reader. A read deeper than 128 levels throws. |
| Summary | The sentence on the names of the built-in readers and writers names the four sample entry functions of theme 5. |
| Changes to accepted RFCs | The sentence "The exported names ... do not change" names the renames of theme 5. The `int64` RFC gets a dated line for `createDefaultReaderConfig`. |

### Method of the measurements

For each theme, a prototype applied the rule to a copy of the version 1 source at commit 7df125fd5. `vp pack` built each bundle with `--minify` and `@svta/cml-utils` as an external package. `gzip -9` counted the bytes, with no source map comment. Each bundle had one import of `@svta/cml-utils`. The full bundle of version 1 is 33278 bytes, and 8537 bytes after gzip.

Each prototype read and wrote the test fixtures with `defaultReaderConfig()` and `defaultWriterConfig()`. The fixtures that version 1 writes byte for byte also gave the same bytes with each prototype. The one exception is theme 9, as its cost states. No fixture has a `pssh`, `tenc`, `sdtp`, `frma`, or `schm` box, so a test built those boxes by hand.

Limits of the numbers:

- The prototypes change version 1 code, not the code of the cursor RFC. The numbers show the cost of each rule. They are not the size of version 2.0.0.
- The cost of a part and the cost of a theme can differ by a few bytes, because gzip compresses the parts together.
- No type check ran on the prototypes.
- The time of the `stss` read is the median of 3 runs on one machine with Node 24.

## Drawbacks

- **Many renames.** Theme 5 renames 24 exports and 14 fields, and removes 3 exports. Each rename is a line of the migration guide.
- **Views keep the input in memory.** A caller that keeps a key ID keeps the whole segment, unless the caller copies.
- **Some byte changes are silent.** A writer now writes `und` for a bad language and drops the text after U+0000. Version 1 wrote other bytes for the same input with no error.
- **Old WebVTT boxes read differently.** A box that release 1.0.7 or earlier wrote returns a trailing U+0000.
- **`@svta/cml-drm` changes in the same pull requests.** Its options accept both the old and the new types, so its public API does not narrow.

## Prior art

The survey read hls.js (cd338d2fa), shaka-player (2ed47645f), the code of dash.js (2dc34a251), and mp4box.js (d91bce451).

| Subject | hls.js | shaka-player | dash.js | mp4box.js |
|---|---|---|---|---|
| Children of `stsd` | Scans the bytes | A separate callback | `entries` (codem-isoboxer) | `entries` |
| Key IDs of `pssh` | `Uint8Array[]` | Hex strings | Through codem-isoboxer | Hex strings |
| Four-character codes | Strings | Strings | Strings and numbers | Strings, padded or cut to 4 |
| Field names | `sampleRate`, `channelCount` | `sampleRate`, `channelCount` | Spec names | `samplerate`, `channel_count` |
| Truncated box | A size check, no error | Catches the `RangeError`, throws code 3000 | `isComplete` flag | `ERR_NOT_ENOUGH_DATA` |
| End of a string | First U+0000 | First U+0000 | First U+0000 | First U+0000 |
| Reserved fields | Not exposed | Not exposed | Set by hand | Not exposed |
| Options | Positional | Positional | Positional | Optional object, last |

## Unresolved questions

The maintainer decided each question on 2026-11-17. The rules of the themes state the decisions.

**Theme 3: byte fields**

1. **A view or a copy.** Should a byte field be a view of the input or a copy? **Decision:** a view, as `readBytes` of the cursor RFC returns.
2. **Tuples.** Should `matrix` and `opColor` be labeled tuples? A caller that builds the array at run time then needs a type annotation. **Decision:** yes.
3. **`compressorName`.** The string costs 81 bytes in the full bundle, and no surveyed player reads the field. A 32-byte `Uint8Array` costs nothing and follows rule 1. Should the field be a string? **Decision:** yes, because the specification defines a string.

**Theme 4: four-character codes**

4. **A code that is not 4 characters.** Should `writeFourCc` pad and cut, or throw a `RangeError`? **Decision:** throw a `RangeError` with the received value.
5. **`fourCcToUint32`.** No field of version 2.0.0 is a number code. Should the function leave the package? **Decision:** yes. `@svta/cml-drm` then converts a number `schemeType` with its own function.
6. **The trimmed `url` key.** Should the maps accept the trimmed keys `url` and `urn` as an alias? With no alias, a map with the key `url` compiles and has no effect. **Decision:** keep the alias in both maps.

**Theme 5: names**

7. **Type names.** Should a type name be the class name with no suffix (`SampleEntry`)? The alternative adds `Box` to every class name (`ItemInfoEntryBox`). **Decision:** the class name with no suffix.
8. **Field names.** Should field names split the words of the specification name (`sampleRate`)? **Decision:** yes, as hls.js and shaka-player have.
9. **Entry type names.** The rule gives long names such as `SubSampleInformationSubsample`. Should the rule apply with no exception? **Decision:** yes, because a rule with exceptions needs a list.
10. **Default configuration functions.** Should `defaultReaderConfig` and `defaultWriterConfig` become `createDefaultReaderConfig` and `createDefaultWriterConfig`? The accepted `int64` RFC uses the current names. **Decision:** rename both functions with `create`.
11. **Guards.** Should `isFullBox` leave the package, and `isContainer` keep its name and run-time result? **Decision:** yes. The alternative renames both with the `Iso` token.

**Theme 6: types with no reader**

12. **Remove or implement.** Should the 16 types with no reader and no writer leave the package in 2.0.0? Issue 652 implements `co64` and `stz2`. **Decision:** yes.

**Theme 7: errors**

13. **Error class.** Should the package throw built-in error types or one error class with a code? **Decision:** built-in types. The class costs 93 bytes in the full bundle.
14. **Count of `stsd` and `dref`.** Should a count above the number of complete child boxes throw? The check costs 55 bytes. A shorter message is a trim. **Decision:** yes, with a message that has the box type, the count, and the number of boxes.
15. **Nesting limit.** Should the limit be 64 levels, with no option? The fixtures need 8 levels. `@svta/cml-c2pa` uses limits of 20 and 128 for its own formats. **Decision:** 128 levels.
16. **Stream buffer.** Should the stream write no box before the first read? The alternative keeps one box in the buffer and changes only the error path. **Decision:** no buffer.

**Theme 8: strings**

17. **End of a WebVTT string.** Should the five WebVTT text readers read to the end of the box, or stop at the first null byte? The ISO text of ISO/IEC 14496-30 was not read. The Unified Streaming validator quotes clause 6.1. **Decision:** read to the end of the box.
18. **Bad language code.** Should `writeMdhd` write `und` for a bad `language`, or throw? **Decision:** `und`.

**Theme 9: reserved fields**

19. **`reserved` of `hdlr`.** QuickTime files store the manufacturer code there, and one test fixture has `appl`. Should the field stay as an optional field, as `pre_defined` does? **Decision:** yes. Then every fixture keeps its bytes.
20. **`pre_defined` fields.** Should `pre_defined` fields stay as optional fields? **Decision:** yes, for the same reason as question 19.

**Theme 10: configuration**

21. **Optional configuration.** Should every entry point take an optional configuration with optional maps? **Decision:** yes.

**Build order**

22. **Phase 1 first, or the cursor first.** Phase 1 puts five pull requests before the cursor rewrite, which has the highest risk. An alternative order starts with themes 6 and 10, because they only remove names and change types. Themes 1, 5, and 9 then go into the rewrite. That order tests the cursor code earlier, and the review of the rewrite is harder. **Decision:** the three phases of [Build order](#build-order).

## Future possibilities

- Readers and writers for the box types that theme 6 removes, in minor releases.
- A function that reads the sample flags of `trun` and `tfhd` (issue 688).
- Literal types for fields with a closed set of values, such as `referenceType` of `sidx`.

## Final Decision

Accepted on 2026-11-17. The work follows [Build order](#build-order). The cursor RFC ([#682](https://github.com/streaming-video-technology-alliance/common-media-library/pull/682)) was accepted on 2026-11-18. Phase 2 and phase 3 follow that RFC.

Decided on 2026-11-17:

- **Key IDs of `pssh`.** `kid` is a `Uint8Array[]` with one entry for each key ID.
- **Child boxes of `stsd` and `dref`.** The field is `boxes`.
- **Questions 1 to 22.** [Unresolved questions](#unresolved-questions) states each decision.
