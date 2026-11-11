---
status: draft
---

# RFC: Named readers and writers for container boxes

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-11-10 |
| **Package** | `@svta/cml-iso-bmff` |
| **Breaking change** | No |
| **Issue** | [#297](https://github.com/streaming-video-technology-alliance/common-media-library/issues/297) |

## Summary

The package gains one named reader and one named writer for each container box type. `CONTAINERS` lists 19 container box types. The RFC adds 38 functions.

```ts
import {
	readIsoBoxes,
	readMoof,
	readTfdt,
	readTraf,
	writeIsoBoxes,
	writeMoof,
	writeTfdt,
	writeTraf,
} from '@svta/cml-iso-bmff'

export function copySegment(segment: Uint8Array): Uint8Array<ArrayBuffer>[] {
	const boxes = readIsoBoxes(segment, {
		readers: { moof: readMoof, traf: readTraf, tfdt: readTfdt },
	})

	return writeIsoBoxes(boxes, {
		writers: { moof: writeMoof, traf: writeTraf, tfdt: writeTfdt },
	})
}
```

The functions add no behavior. `readIsoBoxes` and `writeIsoBoxes` already read and write a container box that has no map entry. This RFC calls that behavior **automatic container handling**. The RFC keeps automatic container handling, so a map entry for a container box is optional.

The purpose is discovery. An adopter who searches for `writeMoov` finds a function. The TSDoc of that function states that the map entry is optional.

## Motivation

Issue #297 reports the problem. An adopter looked for `writeMoov` and `writeMoof` and found no such functions. The adopter then found automatic container handling in the source of the internal `writeBox` function.

The package names each reader and each writer after the box type, with a capital first letter: `readMfhd`, `writeTfdt`. This RFC calls that pattern the **naming rule**. An adopter expects the naming rule to apply to `moov` and `moof`. The `meta` box also contains child boxes, and the package exports `readMeta` and `writeMeta`.

Both guides describe automatic container handling in a note. A search by function name does not find that note.

## Guide-level explanation

### A map entry

A container reader or a container writer goes in the map under the box type. The example in [Summary](#summary) shows both maps.

The container entries are optional. This function returns the same bytes as `copySegment` in the Summary:

```ts
import { readIsoBoxes, readTfdt, writeIsoBoxes, writeTfdt } from '@svta/cml-iso-bmff'

export function copySegment(segment: Uint8Array): Uint8Array<ArrayBuffer>[] {
	const boxes = readIsoBoxes(segment, { readers: { tfdt: readTfdt } })

	return writeIsoBoxes(boxes, { writers: { tfdt: writeTfdt } })
}
```

### A direct call

An adopter can also call a container writer directly. The second argument contains the writers for the child boxes:

```ts
import assert from 'node:assert'
import { writeMfhd, writeMoof } from '@svta/cml-iso-bmff'

const moof = writeMoof(
	{
		type: 'moof',
		boxes: [{ type: 'mfhd', version: 0, flags: 0, sequenceNumber: 1 }],
	},
	{ writers: { mfhd: writeMfhd } },
)

assert(moof.byteLength === 24)
```

`writeIsoBox` writes the same bytes for the same arguments. A container writer returns an `IsoBoxWriteView`, and `writeIsoBox` returns a `Uint8Array`.

## Reference-level explanation

### Functions

Every container reader has the signature of `readMoov`. Every container writer has the signature of `writeMoov`.

```ts
import type { IsoBoxReadView, IsoBoxWriteView, IsoBoxWriteViewConfig, MovieBox } from '@svta/cml-iso-bmff'

export declare function readMoov(view: IsoBoxReadView): MovieBox
export declare function writeMoov(box: MovieBox, config: IsoBoxWriteViewConfig): IsoBoxWriteView
```

| Box type | Box | Reader | Writer |
|---|---|---|---|
| `dinf` | `DataInformationBox` | `readDinf` | `writeDinf` |
| `edts` | `EditBox` | `readEdts` | `writeEdts` |
| `grpl` | `GroupsListBox` | `readGrpl` | `writeGrpl` |
| `mdia` | `MediaBox` | `readMdia` | `writeMdia` |
| `meco` | `AdditionalMetadataContainerBox` | `readMeco` | `writeMeco` |
| `mfra` | `MovieFragmentRandomAccessBox` | `readMfra` | `writeMfra` |
| `minf` | `MediaInformationBox` | `readMinf` | `writeMinf` |
| `moof` | `MovieFragmentBox` | `readMoof` | `writeMoof` |
| `moov` | `MovieBox` | `readMoov` | `writeMoov` |
| `mvex` | `MovieExtendsBox` | `readMvex` | `writeMvex` |
| `schi` | `SchemeInformationBox` | `readSchi` | `writeSchi` |
| `sinf` | `ProtectionSchemeInformationBox` | `readSinf` | `writeSinf` |
| `stbl` | `SampleTableBox` | `readStbl` | `writeStbl` |
| `strk` | `SubTrackBox` | `readStrk` | `writeStrk` |
| `traf` | `TrackFragmentBox` | `readTraf` | `writeTraf` |
| `trak` | `TrackBox` | `readTrak` | `writeTrak` |
| `tref` | `TrackReferenceBox` | `readTref` | `writeTref` |
| `udta` | `UserDataBox` | `readUdta` | `writeUdta` |
| `vttc` | `WebVttCueBox` | `readVttc` | `writeVttc` |

### Contract

- **Reader.** A container reader returns the `type` and the `boxes` of the container box. The reader reads each child box with the readers of the same configuration.
- **Writer.** A container writer writes the box header and then each child box. The writer writes each child box with the writers in `config`. `config` is a required argument, as for `writeMeta`.
- **Automatic container handling.** The RFC keeps automatic container handling. The result is the same with a map entry and without a map entry.
- **One box type per function.** TypeScript rejects a call of `writeMoov` with a `moof` box.
- **Result type.** The result type of `readIsoBoxes` still narrows a `moov` box to `MovieBox`.
- **Existing exports.** `CONTAINERS` and `isContainer` do not change.
- **Bundle size.** Each function is a function declaration. A bundle that does not import a function does not contain that function.

### The functions for `vttc`

The naming rule gives `readVttc` and `writeVttc` for the `vttc` box. The package already exports `readVttC` and `writeVttC` for the `vttC` box. The RFC follows the naming rule, so `readVttc` and `readVttC` differ only in the case of one letter.

Each function of the package has a file with the name of the function. `readVttc.ts` and `readVttC.ts` are the same file on a file system that ignores case. The default file systems of macOS and Windows ignore case. For that reason, the functions for `vttc` are in `readVttCue.ts` and `writeVttCue.ts`. The file names are not part of the public API.

### Default configurations

`defaultReaderConfig()` and `defaultWriterConfig()` do not gain the container functions. Automatic container handling gives the same result, so the entries add bytes and no behavior. [Drawbacks](#drawbacks) shows the byte cost.

The guides and the TSDoc state that each default configuration contains every reader or every writer. Those statements change to exclude the container functions.

### Documentation and tests

- The TSDoc of each function states that the map entry is optional.
- The note in each guide names the container functions.
- The "When to use" section of the README names `readMoov` and `writeMoov`.
- Each function gets a test.
- A test checks that every box type in `CONTAINERS` has a reader and a writer.

### Results of a trial build

The results of a trial build of the 38 functions match the contract. The trial build is not part of this RFC.

- The 15 fixture files of the package gave the same parsed boxes with and without the container readers.
- The 15 fixture files gave the same written bytes with and without the container writers.
- A direct call of a container writer gave the same bytes as `writeIsoBox`.
- An empty container box of each of the 19 types gave 8 bytes. Both ways of reading gave the same parsed box.
- The fixture files contain 14 of the 19 container box types. The fixture files do not contain `meco`, `schi`, `sinf`, `strk`, or `tref`.

## Drawbacks

- **API surface.** The package gains 38 public exports. The removal of an export is a breaking change.
- **Two equal configurations.** A configuration with container entries and a configuration without container entries give the same result. An adopter can conclude that the map needs a container entry. The TSDoc and the guides must state that the entry is optional.
- **Two names that differ only in case.** `readVttc` and `readVttC` differ in one letter. A map with `readVttC` under the `vttc` key compiles, because the map types accept any function under any key.
- **Size.** Each imported container function adds bytes. The table after this list shows the measured byte cost.

The bundler is `vp pack` with `--minify` and ESM output. `@svta/cml-utils` is external. Each "before" value is the same bundle without the container functions. The base of the trial build is `main` at commit `35c512e61`.

| Bundle | Minified before | Minified change | Gzipped before | Gzipped change |
|---|---|---|---|---|
| `writeIsoBoxes`, `writeMfhd`, and `writeMoof` | 3102 B | +45 B | 1261 B | +12 B |
| `writeIsoBoxes`, `writeMfhd`, and all 19 container writers | 3102 B | +858 B | 1261 B | +174 B |
| `readIsoBoxes`, `readMfhd`, and `readMoof` | 4115 B | +68 B | 1658 B | +20 B |
| `readIsoBoxes`, `readMfhd`, and all 19 container readers | 4115 B | +1295 B | 1658 B | +259 B |
| `writeIsoBoxes` and `defaultWriterConfig()` with the container writers (not proposed) | 17162 B | +741 B | 4538 B | +160 B |
| `readIsoBoxes` and `defaultReaderConfig()` with the container readers (not proposed) | 14301 B | +1197 B | 4355 B | +241 B |

## Rationale and alternatives

### Why named functions

The adopter in issue #297 searched by function name. Only a function with that name appears in that search.

### Rejected alternatives

- **One general pair.** `readContainer` and `writeContainer` add 2 exports. A search for `writeMoov` still finds nothing.
- **Documentation only.** The guides already have the note that [Motivation](#motivation) describes.
- **One shared function under 19 names.** An example is `export { writeContainerBox as writeMoov }`. Each name then accepts every container box type, so a call of `writeMoov` with a `moof` box compiles. The `name` property of each function is also the name of the shared function.
- **Other names for `vttc`.** `readVttCue` and `writeVttCue` differ from `readVttC` by more than case. Those names do not follow the naming rule.
- **Functions for the common box types only.** A later addition of a function is not a breaking change. A search for a missing name, such as `writeSinf`, still finds nothing.
- **Container functions in the default configurations.** The entries complete the list of each default configuration and change no result. [Drawbacks](#drawbacks) shows the byte cost.
- **An optional `config` argument for the writers.** A call of `writeMoov` with one argument then compiles. That call fails at run time for a typed child box, because the call has no writer for the child box.
- **Required map entries.** The package removes automatic container handling, and every container box needs a map entry. That change breaks existing adopter code. An adopter who wants a `tfdt` box must then also list `moof` and `traf`.

## Unresolved questions

None.

## Final Decision

Pending review.
