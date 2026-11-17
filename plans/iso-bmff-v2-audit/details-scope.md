# New functions and new box types: details

The audit agents wrote this text. The index is in `findings.md`.

## F436: Gap: the built-in sample entry types are avc1 to avc4, hev1, hvc1, encv, mp4a and enca, and the types that players handle today are missing.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/VisualSampleEntryType.ts:6`, `libs/iso-bmff/src/boxes/AudioSampleEntryType.ts:1`, `libs/iso-bmff/src/readers/defaultReaderConfig.ts:122`, `libs/iso-bmff/src/IsoBoxMap.ts:102`

**Evidence.** `VisualSampleEntryType = 'avc1' | 'avc2' | 'avc3' | 'avc4' | 'hev1' | 'hvc1' | 'encv'` and `AudioSampleEntryType = "mp4a" | "enca"`. The list equals the list of codem-isoboxer (`_boxProcessors['avc1'] = ... ['avc2'] ... ['encv']`, `['mp4a'] = ['enca']`). With defaultReaderConfig(), the probe returned the stpp entry of captions.mp4 and the ac-4 entry of SRMP_AC4.mp4 as header-only boxes (`keys=size/type/view`). hls.js handles avc1 to avc4, hvc1, hev1, dvh1, dvhe, dvav, dva1, dav1, vp09, av01, mp4a, ac-3, ec-3, alac, fLaC, Opus (src/utils/mp4-tools.ts:720 to 890). shaka-player handles avc1, avc3, hev1, hvc1, vvc1, vvi1, the Dolby Vision types, vp09, av01, ac-3, ec-3, ac-4, Opus, fLaC, apac (lib/util/mp4_parser.js, SAMPLE_ENTRY lists), and wvtt and stpp for text (lib/text/mp4_vtt_parser.js:59, lib/text/mp4_ttml_parser.js:44). The package has seven WebVTT boxes (vttC, vttc, vtte, iden, payl, sttg, vlab) and not the wvtt sample entry that contains vttC.

**Proposal of the finder.** Do not add one export for each codec. After the RFC, document one generic pair for visual entries and one for audio entries, and let defaultReaderConfig register them for a list of types that includes av01, vp09, vvc1, dvh1, dvhe, ac-3, ec-3, ac-4, Opus and fLaC. Decide whether avc2 and avc4 keep named exports. Add wvtt and stpp as scope growth. The spec text for wvtt and stpp (14496-30) was not available.

**Proposal after verification.** 1. Do not add a new generic reader pair. It exists: `readVisualSampleEntryBox`, `readAudioSampleEntryBox`, `createVisualSampleEntryReader`, `createAudioSampleEntryReader`. Document them in docs/reading-boxes.md and the README, with the `av01` and `ec-3` example.
2. Fix the reader and writer asymmetry: widen `writeVisualSampleEntryBox<T extends VisualSampleEntryType>` and `writeAudioSampleEntryBox<T extends AudioSampleEntryType>` to `T extends IsoBoxType`, the same constraint as the readers. Widening an input constraint does not break adopters. Document the writer use in docs/writing-boxes.md.
3. Register the generic reader and writer in defaultReaderConfig and defaultWriterConfig for more types, and add the keys to `IsoBoxMap` and `IsoBoxWriterMap`. Before a type goes on the list, confirm in its own specification that the entry is a plain VisualSampleEntry or AudioSampleEntry. Those specifications were not available for this check. Measure the bundle cost of the two default configurations before and after.
4. Keep the avc2 and avc4 named exports. A removal breaks adopters and gains nothing for a tree-shaken bundle.
5. Treat stpp and wvtt as a separate feature request, not as part of this audit. The stpp syntax is in ISO/IEC 14496-12:2015 clause 12.6.3.2 (XMLSubtitleSampleEntry: namespace, schema_location, auxiliary_mime_types). Only the wvtt entry needs ISO/IEC 14496-30, which was not available. Both need new box types and a new reader and writer each, so they are scope growth with their own issue.

**Prior decision.** PR 289 (commit 3102f626e, 1.0.0-alpha.4), libs/iso-bmff/CHANGELOG.md:248 and :257: "Added `createAudioSampleEntryReader` and `createVisualSampleEntryReader` utility functions for custom audio and visual sample entry box types" and "Expanded `AudioSampleEntryBox` and `VisualSampleEntryBox` type parameters to accept any `IsoBoxType`". The design of a short built-in list plus a public generic factory is therefore intentional. No PR, issue or RFC shows a decision to keep av01, vp09, ac-3 and the other types out of the default configurations. CHANGELOG.md:282 (alpha.2) says `writeVisualSampleEntryBox` was removed from the exports, but src/writers/index.ts:80 exports it today.

## F438: Gap: one reader key 'uuid' serves every uuid box, so tfxd, tfrf and PIFF boxes need a hand-written dispatch on the user type.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:398`, `libs/iso-bmff/src/IsoBoxReadView.ts:465`, `libs/iso-bmff/src/ParsedBox.ts:17`

**Evidence.** The view finds a reader with `readers[type] || readers[type.trim()]`, and the type of every such box is 'uuid'. `box.usertype = this.readArray('uint', 1, 16)` stores 16 numbers. dash.js registers one 'uuid' processor and compares `this.usertype` with tfxdUserType, tfrfUserType and sepiffUserType by hand (src/mss/MssFragmentProcessor.js:87 to 113). Probe: a uuid box read with a custom reader returned `usertype` of length 16, and writeIsoBox wrote the 16 bytes again. `box.type === 'uuid'` on the result is a compile error (see the finding on the closed union). The RFC moves the read of the user type into the reader.

**Proposal of the finder.** Scope growth. Allow a readers key of 36 characters in the canonical UUID form, or export `readUuidBox(cursor, readersByUserType)`. Return the user type as `Uint8Array` or as a UUID string, not as `number[]`.

**Proposal after verification.** Drop the 36-character readers key and drop the `usertype` type change (the cursor RFC already removes the field). Nothing here needs the major version. Two actions remain. First, the cursor RFC should state the contract for a `uuid` reader and writer in one sentence each: the reader receives the cursor at the first byte of the user type, and the writer writes the 16 bytes itself. Add 'uuid' to the type story so that `box.type === 'uuid'` compiles without a cast. With that contract, a later helper is additive. Second, if a helper is wanted after version 2.0.0, add one tree-shakeable export in a minor version, for example `readUuidBox(cursor, readers)` where `readers` is keyed by the canonical UUID string, and move c2pa's `matchesUuid` and `UuidParsedBox` to it as the first user. Do not add built-in tfxd, tfrf, or PIFF readers without their spec text.

**Prior decision.** None for the dispatch. Related only: PR 664 (9103e4548, issue 660) kept `usertype` as `number[]` and fixed the header size check. rfc/iso-bmff-cursor-api.md line 199 already removes `usertype` from parsed boxes and moves the read of the 16 bytes into the reader.

## F439: Scope growth: the package has no function for the track facts that every player takes from an init segment.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/README.md:10`, `libs/iso-bmff/docs/reading-boxes.md:1`

**Evidence.** The README names four readers for "the track timescale, codec, or default sample duration", and the guides show no example that joins them. An adopter must walk moov > trak > tkhd, mdia > mdhd, mdia > hdlr, stsd and mvex > trex and join the results on the track ID. hls.js has parseInitSegment, which returns `{ timescale, id, type, stsd, default: { duration, sampleSize, flags } }` for each track (src/utils/mp4-tools.ts:634 to 688). shaka-player has SegmentUtils.getBasicInfoFromMp4 and getDefaultKID (lib/media/segment_utils.js:166 and 803). dash.js has getMediaTimescaleFromMoov (src/streaming/utils/BoxParser.js:228).

**Proposal of the finder.** Possible addition after the RFC: `getIsoTracks(initSegment)` built on seekIsoBox, which returns trackId, handlerType, timescale, the sample entry type, and the trex defaults. At least add the example to the reading guide. Keep the function in its own module, so a bundle without the import does not grow.

**Proposal after verification.** Split the finding in two. (a) Do anytime, no break: add a section "Reading track facts from an init segment" to libs/iso-bmff/docs/reading-boxes.md. The example calls `readIsoBoxes` with the readers `tkhd`, `mdhd`, `hdlr`, `stsd` and `trex`, uses `filterIsoBoxes` for the `trak` boxes, and joins `trex` on `trackId`. Those functions do not change in 2.0.0, so the example survives the cursor RFC. (b) Remove `getIsoTracks` from the 2.0.0 scope. If an adopter asks for it, file an issue and write a separate RFC after the cursor RFC lands. That RFC must settle the returned shape and must not assume `seekIsoBox` alone, because `seekIsoBox` returns only the first box at a path and a multi-track init segment has several `trak` and `trex` boxes.

**Prior decision.** No prior decision found on a track summary function. AGENTS.md:55 states "Minimal API surface: do not add a public export unless it serves a clear use case", and AGENTS.md:71 requires an RFC for public API changes. rfc/iso-bmff-cursor-api.md proposes `seekIsoBox` (lines 23, 166) and proposes no track helper.

## F440: Scope growth: the package has no function that resolves the samples of a fragment from trun, tfhd and trex, and none that decodes sample flags.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/TrackRunBox.ts:6`, `libs/iso-bmff/src/boxes/TrackRunSample.ts:1`, `libs/iso-bmff/src/boxes/SampleDependencyTypeBox.ts:10`

**Evidence.** The TrackRunBox comment says: "These defaults are not set explicitly here, but are left to resolve for the user." Each player has that code. dash.js getSamplesInfo resolves duration and size from trun, then tfhd, adds the moof offset, and sums the fragment duration (src/streaming/utils/BoxParser.js:133 to 226). hls.js parseSampleData and parseSamples do the same with the trex defaults (src/utils/mp4-tools.ts:1222 and 1672). shaka-player repeats the logic in lib/cea/mp4_cea_parser.js:184 to 217 and lib/text/mp4_vtt_parser.js:142 to 184. Sample flags stay a 32-bit number (`sampleFlags?: number`, `defaultSampleFlags?: number`), and sdtp is `sampleDependencyTable: number[]`, a name from codem-isoboxer for the four 2-bit fields of the spec. hls.js builds the flags from named parts: `isLeading`, `dependsOn`, `isDependedOn`, `hasRedundancy`, `isNonSync` (src/remux/mp4-generator.ts:1083).

**Proposal of the finder.** Possible additions: an iterator `iterateIsoSamples(traf, trex?, moofOffset)` that yields `{ dts, duration, size, offset, compositionTimeOffset, flags }`, and a pair `readIsoSampleFlags(flags)` and `writeIsoSampleFlags(parts)`. The fragment duration is the sum of the iterator.

**Proposal after verification.** Keep this out of the 2.0.0 work and file it as two follow-up issues.

(a) Sample flags pair. Add `readIsoSampleFlags(flags: number)` and `writeIsoSampleFlags(parts)` as standalone pure functions, with the field names of clause 8.8.3.1: `isLeading`, `sampleDependsOn`, `sampleIsDependedOn`, `sampleHasRedundancy`, `samplePaddingValue`, `sampleIsNonSyncSample`, `sampleDegradationPriority`. The box fields `sampleFlags`, `firstSampleFlags` and `defaultSampleFlags` stay numbers. This part is small, tree-shakeable, and can ship in any minor version.

(b) Sample resolution. Write an RFC before any code. The RFC must state: the fallback order trun, then tfhd, then trex; `first_sample_flags` for the first sample only; the base offset rules of clause 8.8.7.1 (base_data_offset, default-base-is-moof, end of the data of the preceding traf); a trun without data_offset; a traf without tfdt; number or bigint decode time under the `int64` option; and a measured allocation cost for each sample, with a callback or reused-object form as an alternative to a generator. The moof offset is a caller argument, because the cursor RFC removes `view` from parsed boxes.

The sdtp name `sampleDependencyTable` is a separate rename question (a breaking change) and belongs in its own finding.


## F441: Scope growth: the package has no function that converts a sidx box to segment references with times and byte ranges.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/SegmentIndexBox.ts:11`, `libs/iso-bmff/src/readers/readSidx.ts:19`, `libs/iso-bmff/README.md:11`

**Evidence.** readSidx returns the fields of the box. The three players each convert them to a list of `{ startTime, duration, startByte, endByte }`: hls.js parseSegmentIndex (src/utils/mp4-tools.ts:498 to 575), shaka-player Mp4SegmentIndexParser (lib/dash/mp4_segment_index_parser.js:95 to 150), dash.js SegmentBaseLoader (src/dash/SegmentBaseLoader.js:296 to 314). Each needs the end position of the sidx box as the anchor, which the package does not return after the RFC (see the gap on box position). Each also treats `referenceType === 1` as a special case.

**Proposal of the finder.** Possible addition: `getIsoSegmentReferences(sidx, anchorOffset)`, which returns the list and leaves hierarchical references to the caller. The function is about 20 lines and removes one copy of the logic from each player.

**Proposal after verification.** Keep the item out of the 2.0.0 audit list. File it as a feature issue, and write a short RFC if a player maintainer asks for it. The RFC must settle four points that the proposal skips. (1) The int64 option: `SegmentIndexBox<V>` has `earliestPresentationTime: V` and `firstOffset: V` (libs/iso-bmff/src/boxes/SegmentIndexBox.ts:14 to 15), so the function must be generic over `V extends IsoInt64` and must not mix number and bigint. (2) Time units: return `startTime` and `duration` in ticks of `sidx.timescale`, as dash.js does. A division inside the function loses the exact value that the int64 option exists to keep. (3) Hierarchical references: an entry with `referenceType` 1 still uses bytes and time, so each returned item must include `referenceType`. The function must not drop the entry, throw, or log. (4) The anchor: keep it a caller argument, documented with the two spec cases (first byte after the sidx box, or the start of the media segment for an index in a separate file). The dependency to solve in the 2.0.0 work is the other finding: after the cursor RFC a parsed box has no position or size, so an adopter cannot compute the anchor for a sidx found through `readIsoBoxes`. That gap is the part with a claim on the major version, not this function.


## F442: Scope growth: the package has no function that lists the pssh boxes of a buffer with their complete bytes, and none that builds a pssh box from a system ID, key IDs and data.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readPssh.ts:18`, `libs/iso-bmff/src/writers/writePssh.ts:18`, `libs/iso-bmff/README.md:13`

**Evidence.** EME takes complete pssh boxes as init data, and players select a box by its system ID. hls.js has parseMultiPssh and mp4pssh(systemId, keyIds, data) (src/utils/mp4-tools.ts:2183 and 2114). shaka-player has the Pssh class with `data` (complete boxes) and `systemIds`, plus Pssh.createPssh(data, systemId, keyIds, version) (lib/util/pssh.js:24 and 93). dash.js has parsePSSHList in src/streaming/protection/CommonEncryption.js, which returns the box bytes for each system ID. With the package, an adopter gets the fields of the box as `number[]` and gets the box bytes only through `box.view`, which the RFC removes. To build a box, the adopter must fill `kidCount`, a flat `kid` array and `dataSize` by hand.

**Proposal of the finder.** After the type fix for pssh, writePssh already serves as the builder: `{ type: 'pssh', version, flags, systemId, kids, data }`. Add one small function that returns each pssh box of a buffer as `{ systemId, bytes }` through seekIsoBox, or document the recipe with raw boxes.

**Proposal after verification.** Do not add a pssh list function to iso-bmff. Documentation only: (1) In the iso-bmff README When to use section and in docs/reading-boxes.md, state that `@svta/cml-drm` selects a complete pssh box by system ID for EME (`parsePsshList`, `getPsshForKeySystem`, `getPsshData`). (2) After the cursor RFC lands, add one short recipe to docs/reading-boxes.md for pssh boxes inside `moov` or `moof`: omit the `pssh` reader so each pssh is a raw box `{ type, bytes }`, collect them with `filterIsoBoxes`, and pass the bytes to EME or to `parsePsshList`. `parsePsshList` walks only top-level boxes, so the recipe covers the nested case. (3) The builder is `writePssh` after the pssh type fix (tracked by the separate pssh type finding), with one example in docs/writing-boxes.md. Possible follow-up outside this audit scope: `parsePsshList` in drm has its own hand-written box walker and keeps only the last box for each system ID. A drm issue can decide whether it should use the iso-bmff cursor functions.

**Prior decision.** No explicit decision against the function. The current split is established practice since CML Version 1 (commit 8ac3ef9b9, PR 265): pssh helpers for EME init data live in `@svta/cml-drm` (`parsePsshList`, `getPsshForKeySystem`, `getPsshData`), and the drm README When to use section (PR 557, commit 1a376dc59) assigns that task to drm. The cursor RFC (rfc/iso-bmff-cursor-api.md:87 and :238) already defines the raw box `{ type, bytes }` as the way to get complete box bytes.

## F434: Gap: readIsoBoxes drops a truncated box with no signal and reports no consumed length, while every player parses partial data.

Severity low. Category behavior. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:392`, `libs/iso-bmff/src/IsoBoxReadView.ts:476`, `libs/iso-bmff/docs/reading-boxes.md:99`

**Evidence.** The iterator has `if (error instanceof Error && error.message === 'Truncated box') { break }`. Probe: an ftyp box followed by an mdat header with size 1000 and 4 body bytes returned `["ftyp"]`. The caller cannot tell a complete input from an input that ends inside a box, and cannot learn where to continue. shaka-player has `parse(data, partialOkay, stopOnPartial)` (lib/util/mp4_parser.js:118). dash.js marks the box with `_incomplete` and has findLastTopIsoBoxCompleted for chunked low-latency data (src/streaming/utils/BoxParser.js:80). hls.js clamps the box end to the data end (`Math.min(endbox, end)`, src/utils/mp4-tools.ts:1113), so a moof box before a partial mdat box is still read. The package does read a moof box before a truncated mdat box, and only the mdat box is lost.

**Proposal of the finder.** Scope growth, to decide in the RFC. Return the position of the first byte that was not consumed, through a cursor that the caller passes or a function such as `readIsoBoxesPartial` that returns `{ boxes, end }`. An adopter with chunked data then keeps the tail and calls again.

**Proposal after verification.** Do not add `readIsoBoxesPartial` or a `{ boxes, end }` result. A new export is not needed, and the `readIsoBoxes` signature stays. Add one contract sentence to rfc/iso-bmff-cursor-api.md: after `readChildBoxes(cursor)` stops before a truncated box, `cursor.pos` is the first byte of that box, and `cursor.pos < cursor.end` means the data ended inside a box. An adopter with chunked data then calls `createIsoBoxReadCursor(data, config)`, calls `readChildBoxes(cursor)`, keeps `data.subarray(cursor.pos)`, and calls again with more data. This use costs no bytes for adopters who call `readIsoBoxes`. Add a test that pins the position, and add the pattern to the "Incomplete boxes" section of the reading guide. The same section can document the version 1 form today (`view.readBoxes()` then `view.cursor`), which is not a break. State one limit in the guide: the position does not tell a cut box from a box with a size below its header size, so a caller that waits for more data must set its own limit. The position covers top-level boxes only. A truncated child box inside a complete container stays silent, as issue 650 decided.

**Prior decision.** The stop with no throw is intentional: issue 650 (PR 661, 7d67e217a), issue 663 (PR 662, 6c788e430), issue 660 (PR 664, 9103e4548), the "Incomplete boxes" section of libs/iso-bmff/docs/reading-boxes.md, and the contract line of rfc/iso-bmff-cursor-api.md:198. No prior decision covers a consumed-length signal. Version 1 already exposes the position through the public `IsoBoxReadView.cursor` getter, pinned by test/incompleteBoxHeader.test.ts:299.

## F435: Gap: the package reads no codec configuration box and no other child of a sample entry, so the README claim of a codec from readStsd holds only for the 4CC.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/README.md:10`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:10`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:10`

**Evidence.** README: "Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTfhd`, `readTrun`". `VisualSampleEntryBoxChild = any` and `AudioSampleEntryBoxChild = any`. A grep of src for 'avcC', 'hvcC', 'esds', 'btrt', 'pasp', 'colr', 'clap', 'dOps', 'dac3', 'dec3', 'vpcC', 'av1C', 'dvcC', 'dvvC' returns no line. The probe of test_frag.mp4 shows the children as header-only boxes: `avc1 children=avcC:size/type/view`, `mp4a children=esds:size/type/view`. Players need them for the RFC 6381 codec string and for a generated init segment. hls.js reads avcC, hvcC, vpcC, av1C, dvcC, dvvC, esds (src/utils/mp4-tools.ts:722 to 904) and writes avcC, hvcC, esds, btrt, pasp, dac3 (src/remux/mp4-generator.ts). shaka-player has parseESDS, parseAVCC, parseHVCC, parseDVCC, parseDVVC, parseVPCC, parseAV1C, parseCOLR (lib/util/mp4_box_parsers.js:334 to 632) and writes esds, dac3, dec3, dOps, pasp. The 2015 text of 14496-12 has btrt, pasp, clap and colr. The spec text for avcC, hvcC (14496-15), esds (14496-14), dOps, dac3, dec3, vpcC and av1C was not available.

**Proposal of the finder.** State in the README that readStsd returns the sample entry type and not a codec string. As scope growth, add readers and writers for btrt, pasp and colr from 14496-12 first, then avcC, hvcC and esds. Until then, the raw box of the RFC gives the configuration bytes.

**Proposal after verification.** Split the finding. Part 1, do anytime: change README.md:10 to name the sample entry type, for example "Read the track timescale, the sample entry type (the codec 4CC, such as `avc1`), or the default sample duration", then run the root build and commit skills/. Add one sentence to docs/reading-boxes.md: the package does not parse codec configuration boxes, and the child of a sample entry is a box with no parsed fields (a raw box with `bytes` after the cursor RFC). Part 2, not a 2.0 audit item: file one GitHub issue for the readers and writers, per the README rule "Open an issue for a box that is missing". Start with btrt, pasp, colr, and clap, because 14496-12 defines them. avcC, hvcC, and esds need the text of 14496-15 and 14496-14 first. The only part that the major version affects is the type `VisualSampleEntryBoxChild = any` and `AudioSampleEntryBoxChild = any`: a later change from `any` to a union of box types can break adopter code at compile time, so 2.0 is the time to replace `any` with a box type (the raw box type of the RFC, or a union that includes it). That type change belongs to a separate finding about `any` in the public API.

**Prior decision.** No decision found that makes the gap intentional. README.md:19 states the policy for missing boxes: "Open an issue for a box that is missing." No rfc/ file or CHANGELOG entry mentions avcC, hvcC, or esds.

## F218: The package exports no names for the flag bits, although the writers decide the written fields from `flags`.

Severity low. Category type-design. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/writers/writeTrun.ts:28`, `libs/iso-bmff/src/readers/readTfhd.ts:25`, `libs/iso-bmff/src/readers/readSchm.ts:23`, `libs/iso-bmff/src/readers/readPrsl.ts:25`, `libs/iso-bmff/src/boxes/TrackRunBox.ts:12`

**Evidence.** The flag values exist only as literals inside readers and writers: readTfhd.ts:25-29 `0x01`, `0x02`, `0x08`, `0x10`, `0x20`. readTrun `0x1`, `0x4`, `0x100`, `0x200`, `0x400`, `0x800`. readSchm.ts:23 `0x000001`. readPrsl.ts:25 `0x1000`, `0x2000`, `0x4000`. `grep '^export const' src` finds only CONTAINERS and the six field constants. A caller who builds a trun box must write `flags: 0x000b05` from the specification, and a field set without its flag bit is silently not written (settled rule). AGENTS.md asks for "union and literal types, so autocomplete guides adopters to valid values" and names the const enum pattern.

**Proposal of the finder.** Export one const object for each box with optional fields, in the pattern of CmcdObjectType: `TfhdFlags`, `TrunFlags`, `SchmFlags`, `PrslFlags`, `DataEntryFlags`, with member names from the specification text, for example `TrunFlags.DATA_OFFSET_PRESENT = 0x000001`. Measure the bundle cost of an object against separate constants before the choice. The objects are additive, so they can also ship in a minor version.

**Proposal after verification.** Add flag names only where the specification text gives a name, and cover the full named set of each box: `TfhdFlags` (seven members, including DURATION_IS_EMPTY 0x010000 and DEFAULT_BASE_IS_MOOF 0x020000), `TrunFlags` (six members), and `TkhdFlags` (TRACK_ENABLED, TRACK_IN_MOVIE, TRACK_IN_PREVIEW, TRACK_SIZE_IS_ASPECT_RATIO). For url, one constant for the self-contained flag is enough. Do not add `SchmFlags` from the 2015 text, because the text gives the bit no name. Add `PrslFlags` only after a check against the edition of 14496-12 that defines `prsl`, which was not available here. Export plain const objects (or separate numeric constants if the measurement favors them) with no companion union type, keep `flags: number`, and keep the numeric literals inside the readers and writers so the bundle of an adopter who imports only `readTrun` does not grow. Use the names in the TSDoc of TrackRunBox, TrackFragmentHeaderBox, and TrackHeaderBox and in one writing-boxes.md example. The change can ship in any minor version.

