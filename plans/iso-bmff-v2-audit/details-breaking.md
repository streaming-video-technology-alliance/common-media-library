# Breaking changes for 2.0.0: details

The audit agents wrote this text. The index is in `findings.md`.

## F152: `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` never visit the child boxes of `stsd` and `dref`, because those two types store child boxes in `entries` and every other type uses `boxes`.

Severity high. Category behavior. Breaking: yes. Fact check: confirmed. Value check: confirmed.

**Why it breaks.** The fix renames a field of two returned box types (`entries` to `boxes`), or changes which boxes the three traversal functions return.

**Files.** `libs/iso-bmff/src/boxes/SampleDescriptionBox.ts:16`, `libs/iso-bmff/src/boxes/DataReferenceBox.ts:13`, `libs/iso-bmff/src/readers/readStsd.ts:28`, `libs/iso-bmff/src/readers/readDref.ts:19`, `libs/iso-bmff/src/traverseIsoBoxes.ts:46`, `libs/iso-bmff/src/writers/writeStsd.ts:26`, `libs/iso-bmff/src/writers/writeDref.ts:23`

**Evidence.** `entries: view.readBoxes<E>(entryCount)` in readStsd, against `if (isContainer(box) && box.boxes)` in traverseIsoBoxes. I ran the source on test/fixtures/hvc1_init.mp4 with `defaultReaderConfig()`: `findIsoBox` finds `stsd` and returns `null` for `hvc1`, `hvcC`, and `url `. `tenc` sits below a sample entry (`sinf` > `schi`), so the same path hides it. `MetaBox`, `PreselectionGroupBox`, and `ItemInfoBox` already keep child boxes in `boxes` after their own fields.

**Proposal of the finder.** Rename `entries` to `boxes` in `SampleDescriptionBox` and `DataReferenceBox`. The rule becomes: a field named `boxes` always holds child boxes, and `entries` always holds plain records. The traversal functions then need no change.


## F237: A writer in the map wins over the source bytes of a box that was read with no reader, so the writer writes zeros or throws.

Severity high. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Version 1 calls the writer for such a box. In 2.0.0 the written bytes change from zeros (or a TypeError) to the source bytes.

**Files.** `libs/iso-bmff/src/utils/writeBox.ts:25`, `libs/iso-bmff/src/utils/writeBox.ts:32`, `rfc/iso-bmff-cursor-api.md:87`

**Evidence.** writeBox.ts: `const writer = config.writers?.[type]` / `if (writer) { view = writer(box as any, config) } else if (CONTAINERS.includes(type)) {...} else if ('view' in box) { view = box.view }`. Read-only run of the source: an `mfhd` box with sequenceNumber 7, read with `readIsoBoxes(bytes)` (no readers) and written with `defaultWriterConfig()`, gives `00 00 00 10 6d 66 68 64 00 00 00 00 00 00 00 00`. A version 1 `tfdt` with 123456 becomes a 16-byte version 0 box with 0. `ftyp` throws `TypeError: Cannot read properties of undefined (reading 'length')`. RFC line 87 says `writeIsoBoxes copies a raw box unchanged` but states no order for a raw box whose type has a writer in the map.

**Proposal of the finder.** 2.0.0 defines the order: a box with a `bytes` field is always copied, and the `writers` map is used only for a box with no `bytes` field. Add this sentence to the Contract section of the RFC. Add a test that reads with no readers and writes with `defaultWriterConfig()`.

**Proposal after verification.** Keep the proposed order and add two rules to the Contract section of rfc/iso-bmff-cursor-api.md. (1) Order of `writeIsoBoxes` for one box: a `bytes` field first (copy), then the writer in the `writers` map, then the container form for a type with automatic container handling, then the error. (2) The field name `bytes` is reserved for the raw box. A reader, built-in or custom, must not return a field with that name. To change a raw box, build a new box object with the fields and no `bytes` field. A field that code adds to a raw box has no effect on the write. Tests: read with no readers and write with `defaultWriterConfig()`, and read with a partial readers map (for example `{ tfdt: readTfdt }`) and write with `defaultWriterConfig()`. Both must return the source bytes. The break for adopters is small: version 1 code that adds fields to an unparsed box and relies on the writer must drop the `bytes` field in 2.0.0. State that case in the migration notes.

**Prior decision.** None found. PR 673 (d395df3ce, issue 651) and CHANGELOG.md:49 define the `view` fallback only for a type with no writer. They do not state that a writer must win over the source bytes of an unparsed box. The writer-first order dates from the first writer commit (d615e5bf0) and is needed in version 1 so that a parsed and modified box is written from its fields.

**Result.** Theme 4. Decided on 2026-11-17 in PR 682 (b6b0c4296): the order of the section "Raw boxes in writeIsoBoxes".

## F190: Twenty-four box types have a required count field that duplicates an array length, and the writers use three different rules for it.

Severity high. Category reader-writer-asymmetry. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The count fields leave the public types and the reader results. A writer writes the array length, so a box whose count and array disagree writes other bytes.

**Files.** `libs/iso-bmff/src/boxes/TrackRunBox.ts:14`, `libs/iso-bmff/src/boxes/DecodingTimeToSampleBox.ts:13`, `libs/iso-bmff/src/boxes/SampleDescriptionBox.ts:15`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:13`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:18`, `libs/iso-bmff/src/boxes/TrackFragmentRandomAccessBox.ts:14`, `libs/iso-bmff/src/boxes/SubsegmentIndexBox.ts:11`, `libs/iso-bmff/src/boxes/Subsegment.ts:9`, `libs/iso-bmff/src/boxes/SubsampleEntry.ts:10`, `libs/iso-bmff/src/boxes/PreselectionGroupBox.ts:24`, `libs/iso-bmff/src/writers/writeTrun.ts:28`, `libs/iso-bmff/src/writers/writeStts.ts:19`, `libs/iso-bmff/src/writers/writeStsd.ts:23`, `libs/iso-bmff/src/writers/writeDref.ts:20`, `libs/iso-bmff/src/writers/writeSidx.ts:49`

**Evidence.** Pattern count plus array, with a reader: stco, ctts, stts, elst, dref, stsd, stsc, stss, subs, ssix, tfra, trun, prsl (`numEntitiesInGroup`), pssh (`kidCount`, `dataSize`). With no reader: co64, stz2, iloc, iinf, ipro, saio, senc, sgpd, sbgp, stsh. Nested entry types: `SubsampleEntry.subsampleCount`, `Subsegment.rangesCount`, `SingleItemTypeReferenceBox.referenceCount`. Lists with no count field: sidx `references`, ftyp and styp `compatibleBrands`, sdtp, stdp, `ItemLocation.extents`, `EncryptedSample.subsampleEncryption`. Rule 1, 12 writers size the buffer from the count and loop over the array: writeTrun.ts:28 `const samplesSize = sampleSize * box.sampleCount` then `for (const sample of box.samples)` (also ctts, elst, pssh, prsl, ssix, stco, stss, subs, stsc, tfra, stts). Rule 2, writeStsd.ts:23 and writeDref.ts:20 use `box.entries.length` and ignore the required `entryCount`. Rule 3, sidx has no count field. Checked with node: stts with `entryCount: 1` and 2 entries throws `RangeError: Offset is outside the bounds of the DataView`. With `entryCount: 3` and 2 entries the writer writes a third entry of zeros. stsd with `entryCount: 99, entries: []` writes a count of 0.

**Proposal of the finder.** Remove every count field that equals an array length. The reader reads the count and returns only the array. The writer writes `array.length`. Keep `sampleCount` in stsz, stz2, and saiz, because the box has no array when the default size is not 0. Decide ctts of version 2 or above separately: the settled rule keeps `entryCount` with an empty `entries` list there. tenc `defaultConstantIvSize` follows the rule of PR 658 and stays.

**Proposal after verification.** Rule for 2.0.0: the list is the only source of a count. Remove the count field from the box type and from the reader result, and each writer writes the list length. This rule closes issue 625.

Changes to the proposal:
- Keep `sampleCount` only in `stsz` and `saiz`. For `stsz` with `sampleSize` 0 and `saiz` with `defaultSampleInfoSize` 0, the writer writes the list length. For the other case the writer writes `sampleCount`. Remove `sampleCount` from `stz2`: its syntax always has the list.
- `pssh`: `kidCount` is `kid.length / 16`, not `kid.length`. Change `kid` to a list with one 16-byte entry for each key ID in the same major, then the writer writes `kid.length`. If `kid` stays flat, the writer writes `kid.length >>> 4`. `dataSize` goes away and the writer writes `data.length`.
- `trun` and `senc`: remove `sampleCount`. `samples` has one entry for each sample, and the entry is an empty object when no per-sample flag is set. The spec describes the same model ("the rows can be empty"). Document this case in the TSDoc of `TrackRunBox`.
- `ctts`: `entryCount` becomes optional and the writer uses it only for version 2 or above (`entryCount ?? 0`). For version 0 and 1 the writer writes `entries.length`.
- `tenc.defaultConstantIvSize` stays (PR 658). Do not apply the removal that F96 and F397 propose.
- Apply the same rule to the nested counts (`subsampleCount`, `rangesCount`, `referenceCount`, `subsegmentCount`, `numberOfEntry`, `numEntitiesInGroup`) and to the type-only boxes (co64, stz2, iloc, iinf, ipro, saio, senc, sgpd, sbgp, stsh), so a later reader or writer starts with the rule.
- Do not use the alternative of F238 (optional count fields that the writers ignore). A field that has no effect is the current defect of `stsd` and `dref`.
- Update libs/drm in the same change: no code change is needed in ensureEncryptedInit.ts, but box literals in tests and docs lose the count fields. Add the migration to the changelog: delete the count fields from box literals, and read `list.length` in place of the count.

**Prior decision.** None for the current state. Issue 625 is open with no decision and lists both rules. Related decisions that limit the proposal: PR 674 / issue 670 (ctts version 2 or above keeps `entryCount` with `entries: []`), PR 658 (tenc `defaultConstantIvSize` stays), PR 657 / issue 649 (`pssh.kid` is a flat list with 16 numbers for each key ID, kept in a minor to avoid a type break).

## F188: The return type of readIsoBoxes has parsed fields for every built-in box type, but a box with no reader in the map has only the header fields at run time.

Severity high. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The element type of the returned array changes. Code that reads a field of a box with no reader stops compiling. That code reads undefined today.

**Files.** `libs/iso-bmff/src/readIsoBoxes.ts:32`, `libs/iso-bmff/src/readIsoBoxes.ts:63`, `libs/iso-bmff/src/IsoBoxReaderReturn.ts:63`, `libs/iso-bmff/src/ParsedIsoBox.ts:11`, `libs/iso-bmff/src/IsoBoxReadView.ts:463`, `libs/iso-bmff/docs/reading-boxes.md:8`

**Evidence.** IsoBoxReaderReturn.ts:63 adds `Exclude<IsoBox<V>, { type: R }>`: every built-in type whose reader the map does NOT have. readIsoBoxes.ts:63 returns `ParsedIsoBox[]` for a call with no config. IsoBoxReadView.ts:463-467 only calls `Object.assign(box, parser(...))` when a reader exists. Checked with tsc: `readIsoBoxes(data, { readers: { tfdt: readTfdt } })` then `if (b.type === 'trun') { const n: number = b.sampleCount }` compiles. Checked with node on test_frag.mp4 and no readers: the tfdt box has the keys `size, type, view` and `baseMediaDecodeTime` is undefined. The guide states the run-time rule: "By default, the function reads only the box header." The RFC keeps the signature ("The signature does not change"), so the raw box `{ type, bytes }` of version 2 gets the same wrong type.

**Proposal of the finder.** Build the result type only from the map: `ReturnType` of each reader in `R`, plus the automatic container types, plus `IsoRawBox`. With no readers the result is `(IsoBoxContainer | IsoRawBox)[]`. `defaultReaderConfig()` returns a config with a literal readers type, so its result stays precise. `isIsoBoxType` has the same defect in version 2 (a raw `mdat` box passes `isIsoBoxType('mdat', box)` and narrows to `MediaDataBox`). Make the guard also test that the value has no `bytes` field, or document that the guard is for parsed boxes only.

**Proposal after verification.** Put the result type in the cursor RFC and replace the line "The signature does not change" (rfc/iso-bmff-cursor-api.md:168).

1. Top level: the union is the return type of each reader in the map, the container types, and `IsoRawBox`. Remove the `Exclude<IsoBox<V>, { type: R }>` member. If the reader keys are not literal (a plain `IsoBoxReadViewConfig`, a computed key), the union is `IsoBox<V> | IsoRawBox`.

2. Nested boxes: add `IsoRawBox` to every child union of the container types (`MovieFragmentBoxChild`, `TrackFragmentBoxChild`, and the others). That type is also true for the writer, because `writeIsoBoxes` copies a raw child. Do not make the 38 container types generic on the reader map. The recursive type costs compile time and makes error messages hard to read.

3. Narrowing: `IsoRawBox.type` is a string, so `box.type === 'tfdt'` gives `TrackFragmentBaseMediaDecodeTimeBox | IsoRawBox`, and a field access is a compile error until the code excludes the raw box. Make `isIsoBoxType(type, box)` return `false` for a value with a `bytes` field, and add a guard `isIsoRawBox(box)` for the raw case (or document `'bytes' in box`). Rewrite the guide examples at docs/reading-boxes.md:79, 134, 157 with the guard. Decide this point in the RFC, because it changes the documented pattern for correct code.

4. `defaultReaderConfig()` may return a type with literal reader keys. The existing helper inside `IsoBoxReaderReturn` (rfc/uint64-reader-config.md:344-358) already maps a generic reader in a variable to the `V` fields. The declaration file grows by about 60 entries.

5. The 18 entries of `IsoBoxMap` with no reader and no writer are a separate finding. Decide them there.

**Prior decision.** No decision states that a box without a reader should keep its full built-in type. The accepted RFC rfc/uint64-reader-config.md:360 ("The default union", PR 614) documents the present state: `ParsedIsoBox` includes every built-in box type, PR 614 excludes only the types that a required reader key replaces, and "When a key is not a literal, every built-in type stays." The test libs/iso-bmff/test/readIsoBoxes.test.ts:87 ("should keep the built-in box types when the reader map has no literal keys") and the TSDoc at libs/iso-bmff/src/IsoBoxReaderReturn.ts:25-26 pin that fallback. These describe the inherited union and do not defend the typed fields of a box that no reader decoded.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## F189: The child types of 12 container boxes are closed lists that omit children the specification allows, so a test for a legal child is a compile error.

Severity high. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The element type of `boxes` widens. An exhaustive switch over the child types needs a default branch.

**Files.** `libs/iso-bmff/src/boxes/MovieBox.ts:12`, `libs/iso-bmff/src/boxes/MovieFragmentBox.ts:10`, `libs/iso-bmff/src/boxes/TrackBox.ts:13`, `libs/iso-bmff/src/boxes/MediaBox.ts:11`, `libs/iso-bmff/src/boxes/TrackFragmentBox.ts:15`, `libs/iso-bmff/src/boxes/SampleTableBox.ts:19`, `libs/iso-bmff/src/boxes/MetaBox.ts:17`, `libs/iso-bmff/src/boxes/SchemeInformationBox.ts:8`, `libs/iso-bmff/src/boxes/WebVttCueBox.ts:9`, `libs/iso-bmff/src/boxes/SampleDescriptionBox.ts:11`, `libs/iso-bmff/src/boxes/DataReferenceBox.ts:13`

**Evidence.** MovieBox.ts:12-16 `MovieBoxChild = MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox`. ISO/IEC 23001-7:2016 8.1.1: pssh `Container: Movie ('moov') or Movie Fragment ('moof')`. ISO/IEC 14496-12:2015 8.11.1: meta `Container: File, Movie Box, Track Box, ... Movie Fragment Box or Track Fragment Box`. tsc reports TS2367 for `child.type === 'pssh'` and for `child.type === 'meta'` on a moov child ("types '"mvex" | "mvhd" | "trak" | "udta"' and '"pssh"' have no overlap"). Other gaps against the 2015 text: MediaBoxChild has no elng (8.4.6, Container mdia). TrackFragmentBoxChild has no sbgp, sgpd (8.9.2, 8.9.3, Container stbl or traf). SampleTableBoxChild has no co64, stz2, subs, saiz, saio. TrackBoxChild has no meta and no senc (23001-7 7.2, Container traf or trak). WebVttCueChild has iden and payl but not sttg, which has a type and a reader in this package (the text of 14496-30 was not available). At run time every container also holds boxes of unknown types. Only udta, grpl, strk, and meco use `IsoBox<V>` (issue 646).

**Proposal of the finder.** Give every container one child type: `IsoBox<V> | IsoRawBox`. Delete the 24 exported `*Child` aliases, or keep each as a deprecated alias of that type. The same type applies to the entries of stsd and dref. The package then has one rule, and a new box type in a later release changes no container type.

**Proposal after verification.** Use one element type for every `boxes` array, and make that type the same type that `readIsoBoxes` returns at the top level. Do not write `IsoBox<V> | IsoRawBox` with the raw type of the RFC as it stands: `IsoRawBox.type` is `IsoBoxType`, so `child.type === 'tfdt'` no longer narrows to the typed box (TS2339 in a scratch check with tsc 6.0.3). Two forms keep the narrowing. (1) `boxes: IsoBox<V>[]`, the rule of PR 659, with the raw box found by `'bytes' in child`. (2) A raw member whose `type` is `never`, as `Box<never>` is in `ParsedIsoBox` today. The cursor RFC must decide the form once, for the top level and for children together, and document `isIsoBoxType` as the guard that works in both forms. Delete the 26 exported `*Child` aliases (not 24) in 2.0.0 with no deprecated copies, including the three `any` aliases and the name `WebVttCueChild`. Keep the `E` parameter of `SampleDescriptionBox` and `readStsd` for a caller that knows the entry type, and change only the default to the open element type. Apply the same default to the entries of `dref`. State in the changelog the three kinds of code that stop compiling: a field read on a child with no type test, an exhaustive switch over child types, and an import of an alias name.


**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## F270: isIsoBoxType narrows a box that has no decoded fields to the complete box type, so typed fields are `undefined` at run time.

Severity high. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The guard would return false (or narrow to a raw box type) for a box that no reader decoded. Code that relies on `true` for such a box changes behavior.

**Files.** `libs/iso-bmff/src/isIsoBoxType.ts:38`, `libs/iso-bmff/src/isIsoBoxType.ts:36`, `libs/iso-bmff/test/int64.types.test.ts:375`, `libs/iso-bmff/test/int64.types.test.ts:270`

**Evidence.** isIsoBoxType.ts:38 checks only `'type' in box && box.type === type`, and the return type is `box is IsoBoxMap[T]`. The test documents the false claim: int64.types.test.ts:375-378 `const base: Box = new IsoBoxReadView(buffer).readBox()` / `if (isIsoBoxType('tfdt', base)) { expectType<Equal<typeof base.baseMediaDecodeTime, number>>(true); assert.strictEqual(base.baseMediaDecodeTime, undefined)`. Lines 270-272 do the same for `readIsoBoxes(buffer)` with no readers: the type is `number`, the value does not exist. In 2.0.0 the RFC raw box `{ type, bytes }` passes the same check.

**Proposal of the finder.** In 2.0.0 make the guard honest for the raw box of the RFC: return `false` when the value is a raw box (`'bytes' in box` with the RFC shape), so `true` means decoded fields exist. Alternative that keeps the runtime: change the return type to `box is IsoBoxMap<V>[T] | IsoRawBox` so the caller must exclude the raw box. Add a dedicated test file for the guard with a raw box case.

**Proposal after verification.** Fix the return type of `readIsoBoxes` first, then the guard. Both changes belong in the cursor RFC, which must drop "isIsoBoxType does not change" at line 191.

1. Return type in 2.0.0: the union holds the return type of each reader in the map, the container types that the automatic handling builds, and `IsoRawBox`. The union does not hold the built-in type of a box that has no reader. `readIsoBoxes(data)` with no readers returns raw boxes and containers only. `box.type === 'tfdt'` then narrows to `TfdtBox | IsoRawBox` at most, and never to fields that do not exist. This change replaces `ParsedIsoBox` and the `Exclude<IsoBox<V>, ...> | Box` arm of `IsoBoxReaderReturn`.

2. Guard: keep the name. Make the first signature generic over the input type, in the form that `isContainer` uses: `isIsoBoxType<T extends keyof IsoBoxMap, B extends { type: string }>(type: T, box: B | null | undefined): box is [Extract<B, { type: T }>] extends [never] ? B & IsoBoxMap[T] : Extract<B, { type: T }>`. `IsoRawBox` has `type: IsoBoxType`, so `Extract` removes it. The runtime check becomes `box.type === type && !('bytes' in box)`, so the predicate is sound for a raw box. The guard is then the short way to exclude the raw box. Keep the `unknown` signature with the same runtime check.

3. Document the rule in the TSDoc and in docs/reading-boxes.md: the guard returns `false` for a raw box, and a custom box type must not use a field named `bytes`. Add a guard test file with a raw box case, a decoded box case, and the `null` and `undefined` cases. Remove the assertion at test/int64.types.test.ts:377.

**Prior decision.** Not a decision for the behavior itself. rfc/uint64-reader-config.md:240 (accepted, PR 613, implemented in PR 645) kept the `unknown` signature and its narrowing to `number` fields to avoid a break in a minor version. The test comment at test/int64.types.test.ts:374 ("as before") records that compatibility choice. The draft rfc/iso-bmff-cursor-api.md:191 says `isIsoBoxType` does not change, but the draft is not accepted. A major version may change both.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## F94: `TrackReferenceTypeBox` declares `type: 'tref'` and `trackIds`, and no reader or writer produces or accepts that shape.

Severity high. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The fix changes the public type `TrackReferenceTypeBox` (and `TrackReferenceBoxChild`). If `readTref` starts to parse its children, the value that `readIsoBoxes` returns for a `tref` box also changes.

**Files.** `libs/iso-bmff/src/boxes/TrackReferenceTypeBox.ts:6`, `libs/iso-bmff/src/boxes/TrackReferenceBox.ts:8`, `libs/iso-bmff/src/readers/readTref.ts:20`, `libs/iso-bmff/src/utils/writeBox.ts:30`, `libs/iso-bmff/test/containerReaders.test.ts:68`

**Evidence.** TrackReferenceTypeBox.ts:6-9: `export type TrackReferenceTypeBox = { type: 'tref'; trackIds: number[] }`. Spec 14496-12:2015 8.3.3.2: `class TrackReferenceTypeBox (unsigned int(32) reference_type) extends Box(reference_type) { unsigned int(32) track_IDs[]; }`. The box type is the reference type (`hint`, `cdsc`, `font`, ...), never `tref`. `grep trackIds src` finds only the type file, so no reader sets the field. readTref.ts:20 is `boxes: view.readBoxes<TrackReferenceBoxChild>()`, a cast. At run time each child is a raw box with `type`, `size`, `view`. `tref.boxes[0].trackIds` has the type `number[]` and the value `undefined`. A hand-built child `{ type: 'tref', trackIds: [1] }` reaches writeBox.ts:30 `CONTAINERS.includes(type)` and then `writeContainerBox`, which reads `box.boxes` (undefined). By reading the code, that call throws a `TypeError`. The container tests place an `mfhd` box inside `tref`, and the container RFC (line 182) states that no fixture contains `tref`, so no test reads a real reference type box.

**Proposal of the finder.** Declare `TrackReferenceTypeBox = { type: IsoBoxType; trackIds: number[] }`, where `type` is the reference type. Make `readTref` read each child as size, type, then `(size - 8) / 4` values of `uint32`, and make `writeTref` write them. The readers map cannot do this by type, because the set of reference types is open. This moves `tref` to the group of `meta` and `stsd` (boxes that parse their own children), so the sentence 'readIsoBoxes returns the same box with this reader and without this reader' no longer holds for `tref`. If that cost is not acceptable, delete `TrackReferenceTypeBox` and type the children as the raw box type of the cursor RFC (`IsoRawBox`).

**Proposal after verification.** Split the fix into a required part and a decision.

Required in 2.0.0 (agrees with every settled decision): remove the wrong shape. Set `TrackReferenceBoxChild` to the raw box type of the cursor RFC (`IsoRawBox`, `{ type, bytes }`), because that is what automatic container handling returns for a child with no reader. Delete `TrackReferenceTypeBox`, or keep it only if a reader produces it. `readTref`, `writeTref`, `CONTAINERS`, and the container contract do not change. Add a `tref` fixture or a hand-built `tref` test with a real `cdsc` child, because no test reads one today.

Decision for the maintainer, only possible in a major because it changes the value that `readIsoBoxes` returns: if the package wants parsed track IDs, parse them by context inside `readTref` and `writeTref`, and remove `tref` from `CONTAINERS` and `IsoBoxContainerMap` (19 container types become 18). `tref` then belongs to the group of `meta` and `stsd`: with `tref: readTref` in the map the result is `{ type: 'tref', boxes: TrackReferenceTypeBox[] }` with `TrackReferenceTypeBox = { type: IsoBoxType; trackIds: number[] }`, and with no map entry `tref` is one raw box. Each child is size, type, then `(size - 8) / 4` values of `uint32`. This keeps the sentence "the result is the same with a map entry and without" true for every type that stays in `CONTAINERS`, and it amends the table of the container RFC. Do not use a factory per reference type in the readers map: the reference type set is open and a code can have another meaning outside `tref`.

If no adopter needs track references now, take only the required part. The hls.js, dash.js, and shaka-player use of `tref` was not checked in this pass.


## F204: IsoBoxMap contains 18 box types that no reader produces and no writer accepts, and several of those types differ from the specification.

Severity medium. Category api-surface. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Exported types and IsoBoxMap keys are removed or changed.

**Files.** `libs/iso-bmff/src/IsoBoxMap.ts:106`, `libs/iso-bmff/src/boxes/ItemInfoBox.ts:15`, `libs/iso-bmff/src/boxes/ItemProtectionBox.ts:15`, `libs/iso-bmff/src/boxes/ItemReferenceBox.ts:15`, `libs/iso-bmff/src/boxes/SingleItemTypeReferenceBox.ts:6`, `libs/iso-bmff/src/boxes/ChunkLargeOffsetBox.ts:11`, `libs/iso-bmff/src/boxes/SampleAuxiliaryInformationOffsetsBox.ts:13`, `libs/iso-bmff/src/boxes/SampleGroupDescriptionBox.ts:13`, `libs/iso-bmff/src/boxes/IpmpInfoBox.ts:10`, `libs/iso-bmff/src/readers/defaultReaderConfig.ts:123`

**Evidence.** Keys with no file in src/readers and src/writers: co64, hmhd, iinf, iloc, imif, infe, ipro, iref, nmhd, pitm, saio, saiz, sbgp, senc, sgpd, stdp, stsh, stz2. They are members of `IsoBox`, so `box.type === 'senc'` narrows to a type with `samples` that the package never fills. Deviations that I checked against ISO/IEC 14496-12:2015: ItemInfoBox, ItemProtectionBox, and ItemReferenceBox have no `version` and `flags`, but the syntax is `extends FullBox('iinf', version, 0)`, `FullBox('ipro', version = 0, 0)`, `FullBox('iref', version, 0)`. SingleItemTypeReferenceBox has no `type`, but the syntax is `extends Box(referenceType)`. `ChunkLargeOffsetBox.chunkOffset: number[]` holds `unsigned int(64) chunk_offset` and saio `offset: number[]` holds `unsigned int(64) offset[]` in version 1, and neither follows the int64 rule (`V`). `SampleGroupDescriptionBox.entries: any[]` and `IpmpInfoBox.ipmpDescr: any[]` have no shape.

**Proposal of the finder.** Remove the 18 types from IsoBoxMap and from the exports in 2.0.0, with their helper types (ItemExtent, ItemLocation, ShadowSyncEntry, SampleToGroupEntry, EncryptedSample, SubsampleEncryption, SingleItemTypeReferenceBox). Add each type again together with its reader and writer, checked against the specification. A type that ships with no reader fixes field names that nobody tested. If a reader for senc, saiz, saio, sbgp, or sgpd is planned for 2.0.0, correct the type in the same change.

**Proposal after verification.** Split the 18 keys in 2.0.0 and apply one rule: a key is in IsoBoxMap and in a child union only when the package exports its reader and its writer.

1. Implement, do not remove: co64 and stz2 (closes issue 652), saio, saiz, sbgp, sgpd, senc. Correct each type in the same change: `ChunkLargeOffsetBox<V>` with `chunkOffset: V[]`, `SampleAuxiliaryInformationOffsetsBox<V>` with `offset: V[]`, and `V` passed through SampleTableBox, MediaInformationBox, MediaBox and TrackFragmentBoxChild. Replace sgpd `entries: any[]` with a typed form (bytes for each entry is the form that needs no table of grouping types) and add `default_sample_description_index` for version 2. Add co64 and stz2 to SampleTableBoxChild. senc needs the IV size from tenc or a seig group, so export a factory in the pattern of createVisualSampleEntryReader and keep senc out of defaultReaderConfig. If the senc factory does not land in 2.0.0, remove senc from the map and from TrackFragmentBoxChild until it does.

2. Remove from IsoBoxMap, from the child unions and from the exports: hmhd, nmhd, stdp, stsh, iloc, iinf, infe, pitm, ipro, iref, imif, with ItemExtent, ItemLocation, ShadowSyncEntry and SingleItemTypeReferenceBox. This removal also removes the FullBox, `type` and `any[]` deviations with no separate fix. Add a type back with its reader and writer when an adopter asks.

3. Add a test that fails when a key of IsoBoxMap has no reader and no writer (or no entry in CONTAINERS). Change the TSDoc word "Comprehensive" on IsoBoxMap.

4. State in rfc/iso-bmff-cursor-api.md that a box type with no reader in the map narrows to IsoRawBox and not to a decoded type.

Cost to measure before the merge: seven more readers and writers increase defaultReaderConfig and defaultWriterConfig. The named functions stay tree-shakeable.

**Prior decision.** None that makes the current state intentional. Open issue 652 (co64 and stz2 have a type and no reader or writer) records the opposite direction: add the readers and writers, with `chunkOffset: V[]` per rfc/uint64-reader-config.md. The types date from the first import (commits 8ac3ef9b9 and d615e5bf0) and were never reviewed after that.

## F198: The readers map has no key check, and a reader under the wrong key silently changes the `type` of the box.

Severity medium. Category behavior. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The result keeps the `type` from the box header where it has the `type` of the reader result today, or the call fails to compile.

**Files.** `libs/iso-bmff/src/IsoBoxReaderMap.ts:10`, `libs/iso-bmff/src/IsoBoxReadView.ts:466`, `libs/iso-bmff/src/IsoBoxReaderReturn.ts:42`

**Evidence.** IsoBoxReadView.ts:466 `Object.assign(box, parser(view as IsoBoxReadView, type))`. Every built-in reader returns a literal `type`, so the assignment overwrites the type that the header has. Checked with node: with `readers: { tfdt: readMfhd }`, the three tfdt boxes of test_frag.mp4 come back with `type: 'mfhd'` and the tree has no tfdt box. Checked with tsc: `readIsoBoxes(data, { readers: { tfdt: readTrun } })` compiles. IsoBoxReaderReturn.ts:42 keys the result on the `type` of the reader result, not on the map key, so the type also reports a trun box.

**Proposal of the finder.** Give the known keys a completion list and a pairing check: `type IsoBoxReaderMap<V> = { [K in keyof IsoBoxMap]?: IsoBoxReader<{ type: K }, V> } & { [type: string]: IsoBoxReader<unknown, V> | undefined }`. A reader for key K must return an object whose `type` is K, which still allows a custom reader that adds fields. At run time, set `type` from the header after the reader result is merged, or let readers omit `type` and let the tree reader set it once.

**Proposal after verification.** Keep the compile-time part and fold it into the cursor RFC, which already redefines `IsoBoxReaderMap<V>` and `IsoBoxReader<B, V>`:

`type IsoBoxReaderMap<V extends IsoInt64 = number> = { [K in keyof IsoBoxMap]?: IsoBoxReader<{ type: K }, V> } & { [type: string]: IsoBoxReader<{ type: string }, V> | undefined }`

Changes against the finding's proposal:
1. Require `{ type: string }` for unknown keys too, not `unknown`. In version 2 the tree reader returns the reader result and no longer merges it onto a header box, so nothing else guarantees that every box has a `type`. The probe variant with this index signature compiled for the same cases.
2. Drop the alternative "let readers omit `type`". Standalone readers after `seekIsoBox` and the writers need `type` on the box.
3. Treat the run-time override (`box.type = headerType` after the reader call) as a separate, optional question for the cursor RFC. It costs one store per box and was not measured. It also makes the static type and the run-time value differ for an unchecked unknown key. The compile check already covers the known keys.
4. State the full break in the changelog: a wrong-key reader fails to compile, a known-key custom reader must return the literal `type` of its key (add `as const` or a return type), a known-key reader with no `type` fails, and `map[key]` is possibly `undefined`. The `url` and `urn` aliases and readers for unknown keys do not change.

**Prior decision.** None for the missing key check. Related intentional rules that the fix must keep: PR 614 (8d0b4b393, CHANGELOG.md:64) and rfc/uint64-reader-config.md:105 make the reader return type the result type, and docs/reading-boxes.md:83 documents the trimmed `url` and `urn` keys as aliases.

## F20: Writers of four-character code fields write value.length bytes, so a brand or handler type that is not 4 characters corrupts the box or throws

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Changes the written bytes, or the thrown error, for a code that is not 4 characters long.

**Files.** `libs/iso-bmff/src/IsoBoxWriteView.ts:226`, `libs/iso-bmff/src/writers/writeFtyp.ts:19`, `libs/iso-bmff/src/writers/writeFtyp.ts:23`, `libs/iso-bmff/src/writers/writeFtyp.ts:27`, `libs/iso-bmff/src/writers/writeStyp.ts:23`, `libs/iso-bmff/src/writers/writeStyp.ts:27`, `libs/iso-bmff/src/writers/writeHdlr.ts:33`

**Evidence.** `writeString` loops `for (let c = 0, len = value.length; c < len; c++)` with no length rule. writeFtyp sizes each brand as 4 bytes (`box.compatibleBrands.length * 4`) and then calls `writer.writeString(brand)`. A probe shows: `majorBrand: 'mp4'` writes `109,112,52,0,0,0,1,...`, so minor_version moves one byte and no error occurs. `compatibleBrands: ['isom5']` throws `RangeError: Offset is outside the bounds of the DataView`. `handlerType: 'vid'` in writeHdlr moves every later field by one byte. The types are plain `string` (`majorBrand: string`, `compatibleBrands: string[]`, `handlerType: string`). The cursor RFC grows the buffer, so the 5-character case would stop throwing and would also write a corrupt box.

**Proposal of the finder.** Add one field function that writes exactly 4 bytes for a code (pad a short value with spaces, cut a long value), and use it for majorBrand, compatibleBrands, handlerType, and the box type. As an alternative, throw a RangeError that names the field and the received value. Type the fields with the four-character type of the package instead of `string`.

**Proposal after verification.** Take the F247 form, not pad and cut. Add one field function to the cursor API, for example `writeFourCc(cursor, value)`. The function writes 4 bytes and throws a `RangeError` when `value.length` is not 4. The message names the function, the expected length, and the received value, as the `bigint` range checks do. Use the function for `majorBrand`, `compatibleBrands`, `handlerType`, and for the box type in `beginIsoBox` and `beginIsoFullBox`. Add one line to the Contract section of rfc/iso-bmff-cursor-api.md, because the growing buffer removes the `RangeError` that version 1 throws for a long code. Drop the type change: `IsoBoxType` accepts every string, so the change adds no compile-time check. Whether `IsoBoxType` should be a real constraint is a separate finding. Do not add a check to the fields `dataFormat`, `schemeType`, `groupingType`, and `auxInfoType`: they are `number` and always write 4 bytes.


## F224: The size parameter of readString, readUtf8, readData and readBoxes has four different rules for -1, 0, other negative values, and a size past the end.

Severity medium. Category behavior. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The fix replaces the sentinel values with separate functions and changes the result for a size past the end.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:191`, `libs/iso-bmff/src/IsoBoxReadView.ts:203`, `libs/iso-bmff/src/IsoBoxReadView.ts:304`, `libs/iso-bmff/src/IsoBoxReadView.ts:414`, `libs/iso-bmff/src/readers/readVttC.ts:17`, `libs/iso-bmff/src/readers/readPayl.ts:17`, `libs/iso-bmff/test/readString.test.ts:94`, `libs/iso-bmff/test/readUtf8.test.ts:144`, `libs/iso-bmff/test/readData.test.ts:29`

**Evidence.** `if (size === -1) { length = getTerminatedStringLength(...) } else if (type === UTF8) { cursor = length = limitSize(size, this.bytesRemaining) }`, and `readUtf8 = (size: number = Infinity)`. Tests and a probe show: a size past the end throws a RangeError in readString, but readUtf8 and readData return fewer bytes. -1 means a null-terminated string in readString and readUtf8, and the rest of the view in readData and readBoxes. `readString(-2)` returns '' and moves the view 2 bytes backward (cursor 4 to 2). `readUtf8(-2)` and `readData(-2)` read to the end. Only readUtf8 has a default size. That default returns the null byte in the string: 'WEBVTT\u0000' has length 7. readVttC is the only caller of the default (`config: view.readUtf8()`). readPayl, readIden, readSttg and readVlab read the same kind of field with `readUtf8(-1)`. I did not read ISO/IEC 14496-30, so I report only the difference between the readers. `readData(-1)` throws `RangeError: Invalid typed array length` when the view is past the end of its buffer, and returns an empty array when the buffer is larger. The RFC maps the methods to `readString`, `readUtf8` and `readBytes` and does not define these rules.

**Proposal of the finder.** No sentinel values in the cursor API. Export `readString(cursor, length)` and `readUtf8(cursor, length)` for a fixed length, and `readTerminatedString(cursor)` and `readTerminatedUtf8(cursor)` for a null-terminated string. `readBytes(cursor, length)` takes a length. A caller reads to the end with `cursor.end - cursor.pos`. Every function throws a RangeError for a negative length and for a length past `cursor.end`. The write names then match: `writeTerminatedString`, `writeUtf8TerminatedString`. Use one function for the four WebVTT string boxes and for vttC.

**Proposal after verification.** Add these rules to the cursor RFC, which already states the RangeError for a read past `cursor.end`:

- No sentinel values and no default length. `readString(cursor, length)` reads one character for each byte (four-character codes). `readUtf8(cursor, length)` reads a fixed number of bytes. `readBytes(cursor, length)` returns a view of `length` bytes. A caller reads the rest of the box with `cursor.end - cursor.pos`.
- A negative length throws a RangeError, the same as a length past `cursor.end`. A length of 0 reads nothing.
- One terminated function only: `readTerminatedUtf8(cursor)`. The function stops at the first null byte or at `cursor.end`, and does not throw when the box has no null byte (rule of PR 639). Do not export a terminated function with one byte for each character: no built-in reader or writer uses one, and ISO/IEC 14496-12 defines strings as UTF-8.
- Write names with the same word order: `writeString`, `writeUtf8`, `writeTerminatedUtf8`, `writeBytes`. Drop `writeTerminatedString` and rename `writeUtf8TerminatedString`.
- `readChildBoxes(cursor)` takes no count sentinel. If a count is needed, it is an optional positive number.
- WebVTT boxes: the difference is intentional (PR 638). If the five readers become one rule, use `readTerminatedUtf8` for all five, vttC included. That rule keeps the read of boxes that release 1.0.7 or earlier wrote with a null byte. A null byte is not valid WebVTT text, so the rule drops no valid content. A read to the end of the box for all five is the literal `boxstring` rule (as the Unified Streaming validator documentation cites ISO/IEC 14496-30, which I did not read), and it returns a trailing null byte from those old boxes. This choice needs the maintainer's decision. It is separate from the sentinel fix.

**Prior decision.** PR 638 / issue 636 (commit 327cb7e6e, CHANGELOG.md:71): the readers readIden, readPayl, readSttg, readVlab keep `readUtf8(-1)` on purpose, so a box that an earlier release wrote with a null byte reads as the same string. PR 639 / issue 635 (222abb169): a terminated read with no null byte stops at the end of the view. PR 642 (a47293b79) and PR 644 (af0e23eb0): readUtf8 and readData limit the size to the view and read no bytes for 0, a deliberate rule for version 1. PR 672 / issue 666: readBoxes(0) reads no boxes. Issue 668 closed as not planned: a RangeError from a wrong position goes to the caller. rfc/iso-bmff-cursor-api.md (draft), Contract: a field function that reads past `cursor.end` throws a RangeError.

## G447: The writers of null-terminated strings write a U+0000 character inside the value, so the next field of the box starts at the wrong byte.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The written bytes change for a string that contains U+0000.

**Files.** `libs/iso-bmff/src/writers/writeKind.ts:15`, `libs/iso-bmff/src/writers/writeEmsg.ts:23`, `libs/iso-bmff/src/writers/writeHdlr.ts:18`, `libs/iso-bmff/src/writers/writeUrn.ts:17`, `libs/iso-bmff/src/writers/writeLabl.ts:15`, `libs/iso-bmff/src/writers/writeElng.ts:17`, `libs/iso-bmff/src/writers/writeSchm.ts:19`, `libs/iso-bmff/src/writers/writePrsl.ts:25`, `libs/iso-bmff/src/writers/writeUrl.ts:19`

**Evidence.** `const schemeUriBytes = encodeText(box.schemeUri)` then `writer.writeUint(0, 1)`, with no check of the value. Run: `{type:'kind',schemeUri:'a\0b',value:'v'}` writes `000000126b696e6400000000610062007600`. A read returns schemeUri 'a' and value 'b'. Expected value: 'v'. `{type:'emsg',version:0,schemeIdUri:'a\0b',value:'v',timescale:1,presentationTimeDelta:2,eventDuration:3,id:4,messageData:[9]}` reads back as value 'b', timescale 1979711488, presentationTimeDelta 65536, id 196608, messageData 00 04 09. The same pattern is in the nine files of this finding.

**Proposal of the finder.** The terminated string function of the cursor RFC writes the value up to the first U+0000. A reader returns that part today, so the result of a read does not change and the next field keeps its position. Document the rule in the TSDoc of the function.

**Proposal after verification.** Add the rule to the cursor RFC, because the RFC does not name a terminated string function today (rfc/iso-bmff-cursor-api.md:185 and :190). Proposal: name one write function for a null-terminated UTF-8 string in the field function table, and add one contract line: "The function writes the value up to the first U+0000, then one null byte." Implement the rule with `value.indexOf('\0')` before the encode step, so the function encodes no bytes that it drops. If a one-byte-per-character terminated function stays in the API, give it the same rule. State the rule in the TSDoc of the function. Do not throw for such a value: the number writers do not throw for a value outside the field range either. Do not patch the nine version 1 writers separately, because the RFC replaces their string code. Severity is low to medium: only a string from the caller with U+0000 reaches the defect. The fix is a bug fix, not a breaking change, with the precedent of PR 412 for issue 411.


## G448: A `number[]` in a field of the type `Uint8Array` writes zero bytes with no error.

Severity medium. Category behavior. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The parameter type of writeBytes changes, and the written bytes change for an array of numbers.

**Files.** `libs/iso-bmff/src/IsoBoxWriteView.ts:268`, `libs/iso-bmff/src/writers/writeMdat.ts:21`, `libs/iso-bmff/src/writers/writeFree.ts:21`, `libs/iso-bmff/src/writers/writeSkip.ts:21`, `libs/iso-bmff/src/writers/writeImda.ts:21`, `libs/iso-bmff/src/writers/writeEmsg.ts:66`

**Evidence.** `if (!Array.isArray(data)) { data = [data] }` then `for (const bytes of data) { ... uint8View.set(bytes, this.cursor); this.cursor += bytes.length }`. A `number[]` passes the `Array.isArray` test, so each number is used as a byte array. Run: `writeIsoBox({type:'mdat',data:[1,2,3]}, defaultWriterConfig())` returns `0000000b6d646174000000`. Expected body: 010203. The emsg box with `messageData:[1,2,3]` also ends with 000000. TypeScript rejects the call, but JavaScript adopters such as dash.js get no error. The pssh and tenc boxes take `number[]` for byte fields, so the mistake is likely. A `Uint8Array` in a `number[]` field (pssh data) writes the correct bytes.

**Proposal of the finder.** Remove the list form of the byte write function. The function then copies its argument with `Uint8Array.prototype.set`, which accepts `ArrayLike<number>`, and a `number[]` writes its bytes. Type the parameter as `Uint8Array | ArrayLike<number>`.

**Proposal after verification.** Do not treat this as a separate change to IsoBoxWriteView. Add one line to the cursor API RFC: the field function is `writeBytes(cursor: IsoBoxWriteCursor, data: ArrayLike<number>): void`, it takes one value, and it copies with `cursor.bytes.set(data, cursor.pos)`. The type `Uint8Array | ArrayLike<number>` in the proposal is redundant, because a `Uint8Array` is an `ArrayLike<number>`. The list form needs no replacement, because the RFC writes child boxes into the same buffer. Keep the box field types (`MediaDataBox.data`, `FreeSpaceBox.data`, `EventMessageBox.messageData`) as `Uint8Array`, so TypeScript still rejects a `number[]` there. The wider parameter also lets `writePssh` and `writeTenc` write their byte fields with `writeBytes` instead of a per-byte loop, which is a small performance gain. The difference between `number[]` and `Uint8Array` byte fields in pssh and tenc is a separate finding.

**Prior decision.** PR 288 (commit 69489be50, task/iso-bmff-alpha.3) added the `Uint8Array[]` form on purpose, for the child box bytes that `writeChildBoxes` returns. No prior decision covers a `number[]` argument.

## G449: writeMdhd packs each character of `language` with `& 0x1f`, so a value such as `en-US` writes another language code with no error.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The written bytes change for a language value that is not three letters from a to z.

**Files.** `libs/iso-bmff/src/writers/writeMdhd.ts:41`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:25`

**Evidence.** `box.language.length >= 3 ? (((box.language.charCodeAt(0) - 0x60) & 0x1f) << 10) | ...`. The type is `language: string`. Run: language 'en-US' writes 0x15cd, and a read returns 'enm'. Language 'e1g' reads back as 'eqg'. Language 'ENG' reads back as 'eng'. The writer uses only the first three characters and accepts every character. The elng box of the same track takes a BCP 47 tag, so an adopter can pass that tag here by mistake. The known finding for a value under 3 characters does not cover these inputs.

**Proposal of the finder.** Write the code of `und` (0x55c4) for every value that does not match `/^[a-z]{3}$/`. This rule also replaces the 0 that the writer writes for a short value. State the rule in the TSDoc of `MediaHeaderBox.language`.

**Proposal after verification.** Write the code of `und` (0x55c4) when `language` is not exactly three characters with each character code from 0x60 to 0x7f. That range is exactly what readMdhd returns, so every value from the reader still round-trips byte for byte (the GoPro fixture keeps its 0x0000) and no field is added. 'en-US', 'e1g', 'ENG', a short value, and a value longer than three characters all write `und`. Use three char code compares, not a regex: `language.length === 3` and `((c0 - 0x60) | (c1 - 0x60) | (c2 - 0x60)) >>> 5 === 0`. Fix the comment at writeMdhd.ts:45 and the TSDoc of `MediaHeaderBox.language`: the field is the ISO 639-2/T code as three lower-case letters, the writer writes `und` for a value it cannot pack, and a BCP 47 tag belongs in `elng`. Add a writeMdhd test, since none exists. Two points need the maintainer's choice. First, a strict a-to-z rule is closer to the spec but changes the bytes of files with packed value 0 on a rewrite. Second, a thrown error is the alternative to the silent `und`, but number fields in this package are not range-checked, so `und` is the consistent choice.


## G450: readMeta reads a QuickTime `meta` box, which has no version and flags, as a box with no children and with the size of the first child in `flags`.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The returned fields change for a `meta` box in the QuickTime form.

**Files.** `libs/iso-bmff/src/readers/readMeta.ts:17`, `libs/iso-bmff/docs/reading-boxes.md:93`

**Evidence.** `...view.readFullBox(), boxes: view.readBoxes<MetaBoxChild<V>>()`. Input, a `meta` box with `hdlr` and `keys` children and no FullBox header: `000000396d6574610000002168646c7200000000000000006d64746100000000000000000000000000000000106b6579730000000000000000`. readIsoBoxes with defaultReaderConfig returns `{type:'meta',version:0,flags:33,boxes:[]}` and no error. The view has 45 bytes that the reader did not read. writeIsoBox returns `0000000c6d65746100000021`, so 45 bytes are lost. mp4dump of Bento4 reads the same bytes as `[meta] size=8+49` with both children. The form breaks ISO/IEC 14496-12, which defines `meta` as a FullBox. The guide already describes other QuickTime inputs at line 93.

**Proposal of the finder.** In readMeta, test the 4 bytes at offset 4 of the body. If they are `hdlr`, read the child boxes from offset 0 and return version 0 and flags 0. Add one sentence to the QuickTime paragraph of docs/reading-boxes.md that the writer writes the ISO form. If the project rejects this input, document that limit in the same paragraph.

**Proposal after verification.** Keep the proposal with three changes.

1. Classify it as a fix that can ship in any version, not as a change that needs the major version. The value changes only for an input that now returns wrong data.
2. Guard the test. Apply it only when the body has at least 8 bytes, so an empty ISO `meta` box (12 bytes) does not throw. Test that the 4 bytes at body offset 4 are `hdlr`. In the ISO form those bytes are the size of the first child, and the value 0x68646c72 (about 1.75 GB) cannot be a complete child in practice. When the test matches, read the child boxes from body offset 0 and return `version: 0, flags: 0`. Add no field for the form.
3. In docs/reading-boxes.md, extend the QuickTime paragraph with one sentence: `writeMeta` writes the ISO form, so the written box is 4 bytes longer than the source box. The existing sentence about chunk offsets at line 95 then covers the effect. Add a test with the bytes of the finding, and a test that an ISO `meta` box still reads the same.

If the cursor RFC lands first, put the same test in the new `meta` reader. The RFC open question 3 (`seekIsoBox` and the offsets of `meta`) must then account for both forms or state that it handles the ISO form only.

**Prior decision.** None for the current state. Related precedent in favor: issue 650 and PR 661 (7d67e217a) made the reader accept QuickTime inputs and kept the writer on the ISO form (libs/iso-bmff/CHANGELOG.md:81-83, docs/reading-boxes.md:93-95). Issue 647 (closed as not planned) forbids a field that keeps non-conformant bytes, and the proposal adds no such field.

## G455: Box nesting has no limit, so read, write, the stream and depth-first traversal end with an engine stack overflow, and the write limit is below the read limit.

Severity medium. Category behavior. Breaking: yes. Fact check: partly. Value check: partly. Merged duplicates: G451.

**Why it breaks.** A fix changes a thrown error: `RangeError: Maximum call stack size exceeded` becomes a documented package error. With a fixed limit (for example 64), input nested deeper than the limit and shallower than the engine stack throws where it returns today. A finite default `maxDepth` for traversal changes the yielded boxes for deeper trees.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:421`, `libs/iso-bmff/src/IsoBoxReadView.ts:471`, `libs/iso-bmff/src/utils/writeBox.ts:31`, `libs/iso-bmff/src/utils/writeContainerBox.ts:26`, `libs/iso-bmff/src/utils/writeChildBoxes.ts:20`, `libs/iso-bmff/src/utils/writeBoxes.ts:20`, `libs/iso-bmff/src/traverseIsoBoxes.ts:50`, `libs/iso-bmff/src/findIsoBox.ts:40`, `libs/iso-bmff/src/filterIsoBoxes.ts:43`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:48`, `rfc/iso-bmff-cursor-api.md:198`

**Evidence.** Cause, read: the iterator calls `view.readBoxes()` (IsoBoxReadView.ts:471) or a reader (`parser(view ...)`, :466), and `readBoxes` runs `for (const box of this)` (:421). A captured stack shows 3 frames for each level: `[Symbol.iterator]`, `Generator.next`, `readBoxes`. Cause, write: `writeBox` -> `writeContainerBox` (:26 `writeChildBoxes(box.boxes ...)`) -> `writeChildBoxes` (:20) -> `writeBoxes` (:20 `Array.from(boxes, box => writeBox(box, config))`), 6 frames for each level. Cause, traversal: `yield* traverseIsoBoxes(next, { depthFirst, maxDepth: maxDepth - 1 })` (:50), 2 frames for each level.

Measured, Node 24.22.3 arm64, default stack, one fresh process for each row, call from module top level. Largest depth that works:
- readIsoBoxes, nested `moov` (8 bytes each): 2343. Depth 2344 is 18,752 bytes of input and throws `RangeError: Maximum call stack size exceeded`. Same limit with no config and with the bigint option.
- readIsoBoxes, nested `meta`: 1757. Nested `stsd`: 1562. Nested `avc1`: 1538.
- readIsoBoxes with `--stack-size=200`: 402. From a caller that is 6000 frames deep: 1238. The limit depends on the engine and on the caller.
- writeIsoBoxes and writeIsoBox: 1171. `new IsoBoxReadableStream`: 1073 (the error is thrown from the constructor).
- traverseIsoBoxes depth-first, findIsoBox, filterIsoBoxes: 3438. Breadth-first has no limit (300,000 levels work).

Read and write disagree: `readIsoBoxes` returns a tree of 1500 nested `moov` boxes, and `writeIsoBoxes` of that result throws the stack overflow.

A box graph that contains itself (`self.boxes.push(self)`, and a `moov`/`trak` pair that contain each other): writeIsoBox, writeIsoBoxes and the stream throw the same stack overflow after 0.9 ms. Depth-first traversal and findIsoBox throw it after 345 ms. Breadth-first traversal does not end: 5,000,000 boxes yielded and the loop still runs.

The error has the same type as the `RangeError` for a box that is too short for its fields, and its message is engine text. A box of an unknown type is not entered: 100,000 nested `zzzz` boxes return in 0.3 ms. The fixtures have at most 8 levels. The cursor RFC states no nesting limit (no match for depth, nest, recurs or stack in rfc/iso-bmff-cursor-api.md).

**Proposal of the finder.** Keep a depth counter in the read cursor and in the write path. When the depth exceeds a fixed constant (suggestion: 64, the fixtures need 8), throw the documented package error with the box type and the depth. The write message also says that the box graph may contain itself. Implement depth-first traversal with an explicit stack and no recursion (a trial loop walks 200,000 levels in 13 ms). Give `maxDepth` the same finite default, so that both orders end for a graph that contains itself. State the limit in the reading guide, the writing guide and the RFC contract.

**Proposal after verification.** Split the finding into three parts.

1. Read limit, do in 2.0 with the cursor rewrite: keep a depth counter in the read cursor (one integer compare per container box, no allocation). Above a fixed constant, throw `RangeError` with a package message that names the box type and the limit, in the style of c2pa (`CBOR nesting deeper than 128 levels`). Use 128 or 64, not an option: the fixtures need 8 and the spec states no limit, so the constant only has to be far above real files and far below the engine stack. Add one line to the Contract list of rfc/iso-bmff-cursor-api.md and to docs/reading-boxes.md. This is the only breaking part, and only for input nested deeper than the constant.

2. Depth-first traversal with an explicit stack, do anytime: not breaking, same boxes in the same order. It also removes the nested `yield*` delegation, which costs one generator hop per level for every yielded box, and it lets the breadth-first `queue.shift()` go. `findIsoBox` and `filterIsoBoxes` inherit the fix.

3. Do not do: no depth counter in the write path and no finite default for `maxDepth`. A box graph that contains itself is the caller's defect, and the engine `RangeError` already reaches the caller. Keep `maxDepth` at `Infinity`. If wanted, add one sentence to docs/writing-boxes.md that a box must not contain itself. With the read limit in place, every tree that `readIsoBoxes` returns is far below the write stack limit, so read and write no longer disagree.

**Prior decision.** No prior decision on box nesting in iso-bmff (no commit, changelog entry, RFC text, or issue). Related only: issue 668 closed as not planned (a RangeError from bad input that already reaches the caller got no fix), and c2pa PRs 508 and 510, which bound nesting for untrusted input (MAX_NESTING_DEPTH = 128 in libs/c2pa/src/cbor/readCborItem.ts:21, MAX_JUMBF_NESTING_DEPTH = 20 in libs/c2pa/src/readC2paManifest.ts:19).

## G504: The result of a UTF-8 string read depends on whether the runtime has `TextDecoder`: the fallback of `decodeText` keeps the byte order mark, returns different characters for malformed bytes, and throws a `RangeError` for one malformed sequence.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Only on a runtime without `TextDecoder`: the returned string for a byte order mark or for malformed bytes changes, and one `RangeError` no longer occurs. Runtimes with `TextDecoder` see no change.

**Files.** `libs/iso-bmff/src/utils/readUtf8String.ts:15`, `libs/utils/src/decodeText.ts:60`, `libs/utils/src/decodeText.ts:86`, `libs/utils/src/decodeText.ts:112`, `libs/utils/src/decodeText.ts:154`

**Evidence.** readUtf8String.ts:15 calls `decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 })`. In the fallback, an invalid sequence runs `byteOffset++` under the comment `// Invalid sequence, skip`, but line 154 `str += String.fromCodePoint(char)` still appends the lead byte. The 4-byte branch accepts lead bytes 240 to 244 with no range check on the result. Run of `readPayl` with and without the `TextDecoder` global: BOM + "hi" gives "hi" and "﻿hi". Bytes C3 61 give "�a" and "Ãa". Bytes E0 80 80 give three U+FFFD and "\u0000". Bytes ED A0 80 give three U+FFFD and a lone surrogate U+D800. Bytes F4 90 80 80 give four U+FFFD and `THROW RangeError: Invalid code point 1114112`. That `RangeError` is not a `Truncated box` error, so `readIsoBoxes` throws and returns no boxes. The utils tests run the fallback only with well-formed input (libs/utils/test/decoderTest.ts).

**Proposal of the finder.** Use one UTF-8 decoder with one defined result on every runtime: `TextDecoder` when present, and a UTF-8-only fallback that returns U+FFFD for malformed input and never throws. Put the function in cml-utils as a UTF-8-only export (for example `decodeUtf8(bytes: Uint8Array): string`) and import it in the `readUtf8` field function of 2.0.0. Decide the byte order mark rule once and apply it in both paths. Add an `*.environment.test.ts` in iso-bmff that deletes `TextDecoder` and reads the malformed inputs above.

**Proposal after verification.** Fix the fallback of `decodeText` in `@svta/cml-utils` in place. Do not add a `decodeUtf8` export, and do not tie the fix to iso-bmff 2.0.0. In the UTF-8 fallback: (1) remove a leading EF BB BF also when the caller passes `encoding: UTF_8`, as `TextDecoder` does and as the test without `encoding` already expects. Apply the same rule to FF FE and FE FF for the matching UTF-16 encoding. (2) Append U+FFFD for an invalid lead byte, an invalid continuation byte, a truncated sequence, an overlong form (E0 with a second byte below A0, F0 with a second byte below 90), a surrogate (ED with a second byte above 9F), and a value above U+10FFFF (F4 with a second byte above 8F). Never append the raw lead byte, and never throw. Add the malformed inputs to libs/utils/test/decodeText.test.ts inside `decoderTest`, so both modes must return the same string. One read test in iso-bmff (a `payl` box with F4 90 80 80, in an `*.environment.test.ts` file that removes `TextDecoder`) is enough there. Release the fix as a utils patch with a changelog entry under Fixed. iso-bmff 1.x receives it through the `*` peer range. Separate documentation fix: libs/utils/src/encodeText.ts:2-3 states that `encodeText` "also supports environments without `TextEncoder`", but line 14 is `return new TextEncoder().encode(data)`. Correct that sentence. If the 2.0.0 `readUtf8` field function wants a smaller bundle through a UTF-8-only decoder, measure the bytes first and decide that as its own item.

**Prior decision.** Issue 244 (closed) and PR 246 (commit 80c272e64) chose `TextDecoder` by default with a fallback for platforms without it, so the existence of the fallback is intentional. Nothing shows that the different output of the fallback is intentional: the TSDoc of `decodeText` promises the behavior of `TextDecoder.decode`, and libs/utils/test/decodeText.test.ts:43-48 expects the byte order mark to be removed in both modes. PR 643 and libs/iso-bmff/CHANGELOG.md:121 record that the UTF-8 writers need `TextEncoder` and that `encodeText` has no fallback.

## G507: `IsoBoxReadableStream` fixes its base class when the module is first evaluated, so a `ReadableStream` polyfill that the player installs later is never used, and the public class extends a symbol that the package does not export.

Severity medium. Category behavior. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The proposal removes the exported class `IsoBoxReadableStream`. Code that calls `new IsoBoxReadableStream(...)` or tests `instanceof IsoBoxReadableStream` changes to `createIsoBoxReadableStream(...)`. The error for a missing `ReadableStream` changes from `Error` with a package message to the `ReferenceError` of the runtime, unless the function keeps an explicit test.

**Files.** `libs/iso-bmff/src/IsoBoxReadableStream.ts:13`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:28`, `libs/iso-bmff/config/cml-iso-bmff.api.md:479`, `libs/iso-bmff/test/IsoBoxReadableStream.environment.test.ts:8`, `.claude/rules/code-quality.md:12`

**Evidence.** IsoBoxReadableStream.ts:13-21: `const ReadableStreamBase: typeof ReadableStream = /* @__PURE__ */ (() => typeof ReadableStream === 'undefined' ? (class { constructor() { throw new Error('ReadableStream is not available in this environment') } } ...) : ReadableStream)()`. The function runs on import, which the rule file forbids: "No side effects at module scope (no code that executes on import)". Run: delete `globalThis.ReadableStream`, import the package, restore the global (as a player does when it installs polyfills in an init function), then call `createIsoBoxReadableStream([bytes], defaultWriterConfig())`. Result: `Error: ReadableStream is not available in this environment` although `typeof ReadableStream` is `function`. The API report line 479 has `Warning: (ae-forgotten-export) The symbol "ReadableStreamBase" needs to be exported by the entry point index.d.ts`, and line 482 shows `export class IsoBoxReadableStream extends ReadableStreamBase<Uint8Array>`, so the docs do not say that the class is a `ReadableStream`. A rolldown bundle of `readIsoBoxes` did not keep the statement, so the tree-shaking comment in the file holds for that bundler.

**Proposal of the finder.** Keep one export, `createIsoBoxReadableStream`, and build the stream inside the function with `new ReadableStream({ pull })`. The function reads the global at call time, so a late polyfill works. The module then has no code at module scope, no replacement class, and no unexported base symbol in the type declarations. The return type stays `ReadableStream<...>`. Change the environment test to delete the global, import, restore the global, and expect a working stream.

**Proposal after verification.** Remove the exported class `IsoBoxReadableStream` and keep `createIsoBoxReadableStream` as the only export. Inside the function, keep the test `if (typeof ReadableStream === 'undefined') throw new Error('ReadableStream is not available in this environment')`, then return `new ReadableStream<Uint8Array>({ start: pull, pull })`. Do not use `globalThis`. The explicit test is required, not optional: it keeps the error that issue 382 promised and reads the global at call time, so a late polyfill works. Keep two environment tests: one with the global absent at call time (expects the descriptive error, and a successful import), one with the global deleted before import and restored before the call (expects a working stream). Also update README.md:14 (remove `IsoBoxReadableStream` from the entry points), the TSDoc of `IsoBoxWriteViewConfig` ("Configuration for the IsoBoxReadableStream"), the `@returns` text of `createIsoBoxReadableStream`, and add a changelog migration note: replace `new IsoBoxReadableStream(boxes, config)` with `createIsoBoxReadableStream(boxes, config)`, and `instanceof IsoBoxReadableStream` has no replacement. Severity is low to medium: the late polyfill case needs a polyfill that installs after module evaluation. `WebVttTransformStream` has the same pattern and needs a separate decision for the next webvtt major version.

**Prior decision.** PR 383 (commit 5b1f124c0, "fix: guard module-scope reads of web platform globals", fixes issue 382) chose the guarded `ReadableStreamBase` on purpose. Its description rejects the lazy factory only because it is an API change, so the decision does not block a major version. The same PR sets two requirements that the fix must keep: a descriptive error when `ReadableStream` is absent, and a `typeof` test with no `globalThis`. CHANGELOG.md:157 records the change.

## G521: A reader in the map for a box inside `stsd`, `dref` or `meta` is never called unless the map also has the reader of every enclosing box, and the README bullet for `readTenc` and `readSchm` does not say so.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The documentation fix is not breaking. Automatic reading of stsd, dref, meta and sample entries changes the returned value: those boxes get `entries` or `boxes` where they had header fields only.

**Files.** `libs/iso-bmff/README.md:13`, `libs/iso-bmff/docs/reading-boxes.md:10`, `libs/iso-bmff/src/IsoBoxReadView.ts:463`, `libs/iso-bmff/src/IsoBoxReadView.ts:470`, `libs/iso-bmff/src/readers/readStsd.ts:28`, `libs/iso-bmff/src/utils/CONTAINERS.ts:6`

**Evidence.** README L13: "Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`". reading-boxes.md L10: "The function parses container boxes automatically, so they do not need a reader function."

IsoBoxReadView.ts L470 reads children only for a container: `if (isContainer(box) && !box.boxes) { box.boxes = view.readBoxes() }`. `stsd`, `dref`, `meta` and the sample entries are not in CONTAINERS. Their children are read only inside their own readers (readStsd.ts L28 `entries: view.readBoxes<E>(entryCount)`).

Script examples/b/readme-encryption.ts builds an init segment with `stsd > encv > sinf > (frma, schm, schi > tenc)` and a pssh box (mp4dump confirms the structure). Output:
`A readers {pssh, tenc, schm}: reader calls = pssh | found: pssh:1 schm:0 tenc:0`
`B + stsd: reader calls = pssh`
`C + stsd + encv: reader calls = schm,tenc,pssh`

The same holds for a custom reader. examples/b/task6.ts on hvc1_init.mp4 with a `btrt` reader: `A: reader calls 0` (map has btrt only), `B: reader calls 0` (btrt and stsd), `C: reader calls 1` (btrt, stsd and hvc1). examples/b/meta.ts on time_to_sample.mp4: `readers {hdlr}: reader calls 2`, `readers {hdlr, meta}: reader calls 3`, `readers {'url '}: reader calls 0`, `readers {'url ', dref}: reader calls 2`. No case gives an error or a warning.

**Proposal of the finder.** Choose one rule for 2.0 and state it in the guide. Option A: `readIsoBoxes` also descends into `stsd`, `dref`, `meta` and the built-in sample entry types when the map has a reader for none of them, the same as for a container. Then `readers: { tenc: readTenc }` works. The cursor RFC already asks this question for `seekIsoBox` (open question 3). Option B: keep the behavior and document it. Add to the guide note and to the README bullet that a box inside `stsd` needs `readStsd` and the reader of its sample entry type, for example `readers: { stsd: readStsd, encv: readEncv, enca: readEnca, tenc: readTenc, schm: readSchm }`. Fix the README bullet in both cases.

**Proposal after verification.** Do Option B now, in any release, because it breaks nothing. In docs/reading-boxes.md, extend the note: a box below `stsd`, `dref`, `meta`, or a sample entry is read only if the map has the reader of each of those enclosing boxes, and the function reports no error for a reader that it never calls. Add one example for encryption: `readers: { stsd: readStsd, encv: readEncv, enca: readEnca, schm: readSchm, tenc: readTenc }`. Change README.md:13 to name the required readers, for example "Read pssh and encryption boxes: `readPssh`, and `readTenc` or `readSchm` together with `readStsd`, `readEncv`, `readEnca`". Do not decide Option A in this audit. Move it into unresolved question 3 of rfc/iso-bmff-cursor-api.md, so `readIsoBoxes` and `seekIsoBox` get one rule. State the constraints there: the core must not import `readStsd`, `readMeta`, `readDref`, or the sample entry readers. The result of a box must have one shape with and without its reader. Sample entry types outside the built-in list cannot be descended. Measure the size cost of the offset table before a decision. If automatic descent is accepted, it changes returned values and belongs in 2.0.0.

**Prior decision.** No decision covers the reader case directly. Nearest records: rfc/iso-bmff-container-readers-writers.md (accepted 2026-11-12, PR 622 and PR 654) keeps automatic container handling and leaves `CONTAINERS` unchanged. PR 673 (issue 651) limits the container form on a write to the `CONTAINERS` types and documents `meta` and the sample entries as non-containers. rfc/iso-bmff-cursor-api.md unresolved question 3 leaves the `meta` and `stsd` offsets question open for `seekIsoBox`.

## F202: Readers set 12 absent optional fields to an explicit `undefined`, while the types declare them optional and other readers omit the key.

Severity medium. Category consistency. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The key set of the returned objects changes, which `in`, `Object.keys`, and strict equality checks observe.

**Files.** `libs/iso-bmff/src/readers/readTfhd.ts:25`, `libs/iso-bmff/src/readers/readTrun.ts:18`, `libs/iso-bmff/src/readers/readTrun.ts:30`, `libs/iso-bmff/src/readers/readSchm.ts:23`, `libs/iso-bmff/src/readers/readPrsl.ts:25`, `libs/iso-bmff/src/readers/readStsz.ts:33`, `libs/iso-bmff/src/readers/readTenc.ts:36`, `libs/iso-bmff/src/boxes/TrackFragmentHeaderBox.ts:14`

**Evidence.** readTfhd.ts:25 `baseDataOffset: flags & 0x01 ? view.readWideUint(8) : undefined` (5 fields). readPrsl (3 fields), readSchm (1), readStsz (1), and readTrun (`dataOffset`, `firstSampleFlags`) do the same. The types say `baseDataOffset?: V`. In the same file, readTrun.ts:30 starts each sample as `{}` and adds only the fields that the flags declare, and readTenc.ts:36 assigns the optional fields in an `if`. Checked with node on test_frag.mp4: `'baseDataOffset' in tfhd` is true with the value undefined for flags 0x20020, and the trun box has the keys `dataOffset` and `firstSampleFlags` while its samples have only the present keys. The reader results do not compile under `exactOptionalPropertyTypes` as written, and `assert.deepStrictEqual` against a hand-built box fails.

**Proposal of the finder.** Use one rule in every reader: a field that the flags or the version do not declare has no key. The optional `?:` types then describe the result exactly, and a hand-built box equals a parsed box. If a stable object shape matters more for a hot box such as trun samples, choose the other rule everywhere (`field: T | undefined`, key always present) and state it in the guide. Do not keep both.

**Proposal after verification.** Use the stable-shape rule, not the omit rule. In 2.0.0 every reader returns one object literal with every key of its box type in syntax order, and a scalar field that the flags or the version exclude has the value `undefined`. Only two places change: the trun samples (readTrun.ts:30-43) and readTenc (the four fields set at readTenc.ts:35-43). tfhd, schm, prsl, stsz and the trun box already follow the rule. Declare the fields as `field?: T | undefined`, so the type states what the reader returns under `exactOptionalPropertyTypes`, and an adopter who builds a box can still omit the field or pass `undefined`. State the rule once in the reading guide, with the note that `in` and `Object.keys` do not show presence and that the flags and the version do. Do not make pssh `kid` or url `location` optional. Treat stsz `entrySize` (`[]` versus `undefined`) as a separate optional decision, because PR 621 chose `undefined` on purpose.

**Prior decision.** None for the key rule. Both forms come from 8ac3ef9b9 (CML Version 1, #265). PR 621 (e01b41b3a) states on purpose that `readStsz` returns `entrySize` as `undefined` when `sampleSize` is not 0, which matters only for the F86 sub-proposal. PR 674 (ctts version 2: `entries: []`) and PR 676 (emsg unknown versions keep the known fields with empty values) show that absent lists stay as required fields with empty values.

## F272: isIsoBoxType takes the tested value as the second argument, and every other type guard in CML takes it first.

Severity medium. Category consistency. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The argument order of a public function changes.

**Files.** `libs/iso-bmff/src/isIsoBoxType.ts:19`, `libs/iso-bmff/src/utils/isContainer.ts:24`, `libs/iso-bmff/src/utils/isFullBox.ts:12`, `libs/id3/config/cml-id3.api.md:45`, `libs/cmcd/config/cml-cmcd.api.md:673`, `libs/utils/config/cml-utils.api.md:98`

**Evidence.** isIsoBoxType.ts:19-21 `isIsoBoxType<T ...>(type: T, box: ...)`. In the same package: `isContainer(box)`, `isFullBox(box)`. Other packages: `isId3TimestampFrame(frame: Id3Frame): frame is ...`, `isCmcdV1Data(data: CmcdData): data is CmcdV1Data`, `isArrayBufferLike(value: unknown): value is ArrayBufferLike`. The platform guards (`Array.isArray(value)`) and the predicate parameter of findIsoBox (`(box: T) => box is S`) also put the value first.

**Proposal of the finder.** Change to `isIsoBoxType(box, type)` in 2.0.0. Document the migration in the changelog: swap the two arguments.

**Proposal after verification.** Swap to `isIsoBoxType(box, type)` in 2.0.0, with three changes to the proposal.

1. The changelog migration note must say more than "swap the two arguments". An old-order call fails at compile time only when the box is typed or `unknown`. A JavaScript caller, or a TypeScript caller with an `any` box, gets `false` with no error. State that in the note. Do not add a run-time check that accepts both orders: it costs bytes on every call and keeps the inconsistency.

2. Make the swap in the same change that already rewrites the first signature. That signature accepts `{ view: IsoBoxReadView<V> }` (isIsoBoxType.ts:21), and the cursor RFC removes both the `view` field and the class. Adopters then see one signature change, not two.

3. Amend rfc/iso-bmff-cursor-api.md:191, which says `isIsoBoxType` does not change. With the swap and the removed `view` arm, that sentence is false.

Also correct the rationale: the reason is "the subject is the first parameter of every CML check and of the `findIsoBox` predicate", not "every other type guard takes it first", because no other guard has two parameters.

If the maintainers want no silent failure at all, the alternative is a new name with the new order (old import fails loudly). I do not recommend that: the name is correct, and a rename costs more than the argument swap.


## F281: findIsoBox returns `null` for no match, while the platform function with the same shape and several CML lookup functions return `undefined`.

Severity medium. Category consistency. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The returned value for no match changes from null to undefined. Strict comparisons with `null` change behavior.

**Files.** `libs/iso-bmff/src/findIsoBox.ts:25`, `libs/iso-bmff/src/findIsoBox.ts:46`, `libs/id3/config/cml-id3.api.md:30`, `libs/error-codes/config/cml-error-codes.api.md:10`, `libs/drm/config/cml-drm.api.md:80`, `libs/c2pa/src/utils.ts:134`, `rfc/iso-bmff-cursor-api.md:162`

**Evidence.** findIsoBox.ts:25 `): S | null` and line 46 `return null`. The function mirrors `Array.prototype.find` (same predicate overloads), which returns `undefined`. CML has no single rule: `getId3Timestamp(...): number | undefined`, `getSvtaErrorCategory(...): SvtaErrorCategory | undefined`, `parseByteRangeString(...): ByteRangeObject | undefined` return undefined, and the drm package returns null (`findCencContentProtection(...): ContentProtection | null`). `libs/utils` has no lookup function, so it gives no rule. Inside the family, c2pa wraps iso-bmff boxes with `findC2paUuidBox(...): UuidParsedBox | undefined`. The RFC adds `seekIsoBox` with `null` (line 162) and its own first example converts the result to `undefined` (`return cursor ? ... : undefined`).

**Proposal of the finder.** Decide once for 2.0.0 and apply it to `findIsoBox` and `seekIsoBox`. Recommended: `undefined`, to match `Array.prototype.find`, optional chaining results and default parameters. `isIsoBoxType` already accepts both values. Changelog migration: replace `=== null` with `=== undefined` or a truthiness test.

**Proposal after verification.** Lower the severity to low and treat it as a taste decision for the maintainer, recorded as one more unresolved question in rfc/iso-bmff-cursor-api.md ("Value for no match: `null` or `undefined` for `findIsoBox` and `seekIsoBox`"). The hard requirement is only that the two functions return the same value, which the draft already meets with `null` at zero migration cost. If the maintainer picks `undefined`, justify it with the reasons that hold: `Array.prototype.find` parity, assignability to optional parameters and properties, and agreement with the optional fields of the box types (iso-bmff has no other `null` return). Drop the optional-chaining argument and the claim that the RFC example gets simpler. Then change both functions in 2.0.0 together: findIsoBox.ts:25, :34, :39, :46 and the TSDoc at :14, RFC lines 166, 191 and 196, and the asserts in test/findIsoBox.test.ts. The changelog migration must recommend a form that works in both versions: a truthiness test or `== null`, not `=== undefined`. Do not ship the change for only one of the two functions, and do not extend it to drm or cmaf-ham in this work.

**Prior decision.** None that chooses null on purpose. Related: rfc/uint64-reader-config.md:240 (accepted, PR 613/645, issue 611) made `isIsoBoxType` accept `null` and `undefined` so the `findIsoBox` result narrows. The draft rfc/iso-bmff-cursor-api.md:191 says `findIsoBox` does not change and lines 166/196 give `seekIsoBox` a `null` return, but that RFC is status draft (8ce63c212).

## F400: Four-character-code fields are a `string` in three boxes and a `number` in the others.

Severity medium. Category consistency. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The public type and the returned value of `dataFormat`, `schemeType`, `auxInfoType`, and `groupingType` change from `number` to `string`. `fourCcToUint32` loses its purpose.

**Files.** `libs/iso-bmff/src/boxes/TypeBox.ts:8`, `libs/iso-bmff/src/boxes/HandlerReferenceBox.ts:11`, `libs/iso-bmff/src/boxes/OriginalFormatBox.ts:8`, `libs/iso-bmff/src/boxes/SchemeTypeBox.ts:10`, `libs/iso-bmff/src/boxes/SampleAuxiliaryInformationOffsetsBox.ts:10`, `libs/iso-bmff/src/boxes/SampleAuxiliaryInformationSizesBox.ts:10`, `libs/iso-bmff/src/boxes/SampleToGroupBox.ts:11`, `libs/iso-bmff/src/boxes/SampleGroupDescriptionBox.ts:10`, `libs/iso-bmff/src/readers/readFrma.ts:17`, `libs/iso-bmff/src/readers/readSchm.ts:21`, `libs/iso-bmff/src/readers/readHdlr.ts:20`, `libs/iso-bmff/src/readers/readFtyp.ts:17`, `libs/iso-bmff/src/utils/fourCcToUint32.ts:13`, `libs/iso-bmff/src/IsoBoxWriteView.ts:226`, `libs/iso-bmff/test/writers/writeSchm.test.ts:20`, `libs/drm/src/ensureEncryptedInit.ts:118`

**Evidence.** String: `majorBrand: string`, `compatibleBrands: string[]` (`view.readString(4)`), `handlerType: string` (`view.readString(4)`), and the box `type`. Number: `dataFormat: number` (`view.readUint(4)`), `schemeType: number` (`view.readUint(4)`), `auxInfoType?: number` (saio, saiz), `groupingType: number` (sbgp, sgpd). The spec gives all of them the same syntax, `unsigned int(32)`: `unsigned int(32) major_brand;`, `unsigned int(32) handler_type;`, `unsigned int(32) data_format = codingname;`, `unsigned int(32) scheme_type; // 4CC identifying the scheme`. Adopters pay for the difference: the test writes `schemeType: 0x63656e63, // cenc`, and the drm package has `schemeType = 1667591779` and `dataFormat: fourCcToUint32(entry.type)`. The package exports `fourCcToUint32` and no inverse function. On the write side, `writeString` writes `value.length` bytes with no check, so a brand or handler type that is not 4 characters shifts every field after it.

**Proposal of the finder.** One rule: a field that the spec describes as a four-character code is a `string` of 4 characters. Change `dataFormat`, `schemeType`, `auxInfoType`, and `groupingType` to `string`. In the cursor API, add one field function pair for the code, such as `readFourCc` and `writeFourCc`, and make the writer always write exactly 4 bytes. Remove `fourCcToUint32` from the public API, or keep it with an inverse function if adopters still compare integers.

**Proposal after verification.** Rule for 2.0.0: a 32-bit field whose values are registered four-character codes is a `string` of 4 characters. This wording covers `groupingType` and `auxInfoType`, which the spec calls "an integer that identifies the type".

1. `OriginalFormatBox.dataFormat` and `SchemeTypeBox.schemeType` become `string`. This part changes read values and write input, and has the clear gain.
2. `groupingType` (sbgp, sgpd) and `auxInfoType` (saio, saiz) become `string` in the type declarations only. The package has no reader or writer for these boxes, so the change costs nothing now and fixes the form before a reader exists. State in the TSDoc that the spec declares an integer and that the string holds the 4 bytes.
3. Add one field function pair in the cursor API, `readFourCc(cursor)` and `writeFourCc(cursor, value)`. Use the pair for the box type, the ftyp and styp brands, `handlerType`, `dataFormat`, and `schemeType`. `readFourCc` makes one `String.fromCharCode(b0, b1, b2, b3)` call. `writeFourCc` always writes exactly 4 bytes and never throws: it truncates a longer value and fills a shorter or missing value with a fixed byte. The maintainers choose the fill byte (0x20 matches registered codes such as 'url ' and 'rap ').
4. Remove `fourCcToUint32` from the public API. No source file of iso-bmff calls it, and the only caller (drm) no longer needs it. Do not add an inverse function.
5. Update @svta/cml-drm in the same release: `ensureEncryptedInit` passes `entry.type` as `dataFormat` directly. Either change `EnsureEncryptedInitOptions.schemeType` to `string` with the default `'cenc'` (a breaking change for drm, so drm needs a major version too), or keep the number option and convert inside drm. The first option is consistent, the second avoids a drm break. This needs a decision.
6. The changelog gives the migration: replace `schemeType === 0x63656e63` with `schemeType === 'cenc'`, and replace `fourCcToUint32(x)` with `x`.


## F409: String fields use four decode rules, and the WebVTT text boxes do not agree on where the string ends.

Severity medium. Category consistency. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** `readVttC` returns a different string for a box with a null byte, or the four other readers do, depending on the rule chosen.

**Files.** `libs/iso-bmff/src/readers/readVttC.ts:17`, `libs/iso-bmff/src/readers/readIden.ts:17`, `libs/iso-bmff/src/readers/readPayl.ts:17`, `libs/iso-bmff/src/readers/readSttg.ts:17`, `libs/iso-bmff/src/readers/readVlab.ts:17`, `libs/iso-bmff/src/readers/readFtyp.ts:17`, `libs/iso-bmff/src/readers/readHdlr.ts:22`, `libs/iso-bmff/src/readers/readVisualSampleEntryBox.ts:39`, `libs/iso-bmff/src/writers/writeVttC.ts:22`, `libs/iso-bmff/src/writers/writeIden.ts:22`

**Evidence.** Table. (1) Null-terminated UTF-8, `readUtf8(-1)`, writer adds a 0 byte: hdlr `name`, elng, emsg `schemeIdUri` and `value`, kind, labl, prsl tags, schm `schemeUri`, url, urn. This group is consistent. (2) Box string with no terminator. The five writers agree: `writer.writeBytes(configBytes)` with no 0 byte. The readers do not: `config: view.readUtf8()` in vttC reads to the end of the box and keeps a null byte inside the string, and `cueId: view.readUtf8(-1)` in iden, payl, sttg, and vlab stops at the first null byte. (3) One character for each byte, `readString(4)`: the four-character codes. (4) Not decoded: `compressorName: readArray(UINT, 1, 32)`. The spec text of ISO/IEC 14496-30 was not available, so I state only the difference between the five readers.

**Proposal of the finder.** One function for a box string, used by all five WebVTT readers. Pick one rule: read to the end of the box (the literal rule), or stop at the first null byte (the tolerant rule of issue 636). Apply the same rule to vttC. In the cursor API, name the three string forms: a terminated UTF-8 string, a box string, and a four-character code.

**Proposal after verification.** Do not apply the literal rule (read to the end of the box) to `iden`, `payl`, `sttg`, `vlab`. Every published release up to 1.0.7 writes a null byte in those boxes, and PR 638 keeps the tolerant read for that reason. Keep the tolerant read in 2.0.0.

Better proposal, in three parts:
1. Optional: change `readVttC` to the same tolerant read, so all five WebVTT string boxes share one rule. The returned value changes only for a `vttC` box that contains a null byte, which a conformant writer does not produce. This change is not a break for adopters and can ship in any version.
2. Documentation: state the rule in the TSDoc of the five readers. The string is the box body with no terminator, and the reader stops at a null byte to accept boxes from 1.x writers. Today only the changelog states the rule.
3. Input for rfc/iso-bmff-cursor-api.md: do not carry the magic size values of `readUtf8` (`-1` for terminated, no size for the end of the box) into the cursor API. Define separate field functions, for example a terminated UTF-8 read and a UTF-8 read of a byte count, and let the five WebVTT readers call one shared box string function. Separate functions also keep the null scan out of bundles that do not read terminated strings. The four-character code read stays `readString` with 4 bytes.

Confirm the `boxstring` definition in ISO/IEC 14496-30 before any change. The text was not available, and the only source is the Unified Streaming validator documentation.

**Prior decision.** PR 638 (commit 327cb7e6e, "fix(iso-bmff): write WebVTT box strings with no null byte", fixes issue 636). The PR keeps `readUtf8(-1)` in `readIden`, `readPayl`, `readSttg`, `readVlab` on purpose, so a box that an earlier release wrote with a null byte still reads as the same string. CHANGELOG.md:71 records the rule. No decision covers `readVttC`.

## F222: The box iterator finds a truncated box by the text of an error message, so an error from a custom reader can silently drop a box and every box after it.

Severity medium. Category errors. Breaking: yes. Fact check: confirmed. Value check: confirmed.

**Why it breaks.** An error with the message 'Truncated box' from a custom reader would reach the caller in place of a shorter result.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:392`, `libs/iso-bmff/src/IsoBoxReadView.ts:466`, `libs/iso-bmff/src/IsoBoxReadView.ts:476`

**Evidence.** `throw new Error('Truncated box')` at line 392. The loop wraps the reader call in the same try block: `Object.assign(box, parser(view as IsoBoxReadView, type))`, then `if (error instanceof Error && error.message === 'Truncated box') { break }`. Probe: boxes free, cust, free, free with the reader `cust: view => ({ type: 'cust', child: view.readBox() })` and a child that declares 100 bytes. readIsoBoxes returns only the first free box and does not throw. A reader that throws `new Error('Truncated box')` gives the same result. The private `truncated` flag is a second mechanism for the same stop, and it makes `done` true while bytes remain.

**Proposal of the finder.** In the cursor API, compare the header size and the box size with `cursor.end` before the read of a box, and stop the loop with no exception. Do not use an exception or its message for control flow. An error from a reader, built-in or custom, always reaches the caller.

**Proposal after verification.** The `Object.assign(box, parser(...))` line is 465, not 466. The break is narrow: only a custom reader that throws an Error with the message `Truncated box`, or that calls `view.readBox()` on a truncated child, sees an error in place of a shorter result. The documented `Truncated box` error of `readBox` (TSDoc lines 359-360, changelog) disappears with the class in the cursor RFC, so the RFC Contract section should state the rule: size check before the reader runs, no catch around a reader.

**Prior decision.** The stop rule is intentional: PR 661 (issue 650), PR 662 (issue 663, open decision "Stop or throw" resolved as stop), and PR 664 (issue 660). The proposal keeps that rule. No decision covers the match on the message text. That code dates from CML version 1 (commits d615e5bf0 and 8ac3ef9b9).

## F229: The thrown errors of the package use three error types and four message styles.

Severity medium. Category errors. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The fix changes the error type or the message of thrown errors.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:392`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:18`, `libs/iso-bmff/src/createInt64OverflowReader.ts:27`, `libs/iso-bmff/src/IsoBoxWriteView.ts:121`, `libs/iso-bmff/src/IsoBoxWriteView.ts:185`, `libs/iso-bmff/src/IsoBoxWriteView.ts:209`, `libs/iso-bmff/src/utils/writeBox.ts:37`, `libs/iso-bmff/src/utils/writeBox.ts:46`

**Evidence.** Every throw in src: (1) `Error('Truncated box')`, with no type, offset or size. (2) `Error('ReadableStream is not available in this environment')`. (3) `RangeError('64-bit value is outside the safe integer range')`, where the missing value is a settled decision. (4) `RangeError(`writeUint64: value must be in the range 0 to 2^64 - 1, received ${value}`)`. (5) `RangeError(`writeWideUint: value must be in the range 0 to 2^32 - 1, received ${value}`)`. (6) `RangeError(`writeWideInt: value must fit in ${size} bytes, received ${value}`)`. (7) `Error(`No writer found for box type: ${type}`)`. (8) `Error('Invalid box')`, for a value of the wrong shape, with no received value. The read path also passes native errors to the caller: `RangeError: Offset is outside the bounds of the DataView` and `RangeError: Invalid typed array length`. Only (4), (5) and (6) follow the AGENTS.md rule of parameter name, expected values and received value. No code throws a TypeError.

**Proposal of the finder.** Define one rule for version 2 and state it in the RFC. RangeError: a value or a read outside its range. TypeError: an argument of the wrong shape, such as (8). Error: a missing platform feature. Every message has the form `<function>: <parameter> must <expected>, received <value>`, as (4) to (6) already have. Example for (8): `writeIsoBox: box must have a writer, a boxes field, or a bytes field, received type '${type}'`. Example for a read past the end: `readUint32: 4 bytes needed at offset ${pos}, ${end - pos} remain`.

**Proposal after verification.** Do not open a separate change. Add a short "Errors" part to the Contract section of rfc/iso-bmff-cursor-api.md with these rules:

1. Two error types only, as in the other packages: `RangeError` for a read past `cursor.end` and for a `bigint` that does not fit its field, `Error` for the rest (a box that cannot be written, a missing `ReadableStream`). No `TypeError`: the gain is small and no package uses it.
2. One shared function, outside the field functions, throws the read limit error with one message that has the bytes needed, the position and the limit. The message has no function name, because the stack shows it. Measure the bytes with the size check before the RFC states the text.
3. A truncated box is a return value in version 2, not a thrown error. The box header function returns `null` (or the loop tests the size), so `readIsoBoxes` and `seekIsoBox` stop with no Error allocation and no comparison of a message string. The `Truncated box` message then no longer exists.
4. The single write throw of line 201 keeps the `No writer found for box type: ${type}` text of PR 673 and covers the old `Invalid box` case.
5. The `bigint` checks keep the current form `<function>: value must ..., received ${value}`. Add no range check for `number` values. The overflow message of `createInt64OverflowReader` stays as decided.
6. The box type prefix from a try block in the write dispatch is optional. Decide it with a measurement.

**Prior decision.** rfc/uint64-reader-config.md (accepted, merged as 9bc54be04, lines 426-427 and 463): message bytes are measured, the overflow message has no value, and no custom TypeError for a missing BigInt. PRs 661, 662, 664 (CHANGELOG.md lines 83, 86, 88): `readBox` throws `Error` with the message `Truncated box` on purpose. PR 673 for issue 651 (CHANGELOG.md line 49): the `No writer found for box type` message is intentional and documented. Issue 668, closed as not planned: a native RangeError that reaches the caller of a custom reader is accepted. rfc/iso-bmff-cursor-api.md lines 195 and 201 already state the RangeError rule for reads and the single throw for a box that cannot be written.

## G457: `readStsd` and `readDref` return fewer entries than `entry_count` with no error, while every other count-driven reader throws when the box ends before the count.

Severity medium. Category errors. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A fix changes a returned value into a thrown error for an `stsd` or `dref` box whose `entry_count` exceeds the child boxes that the body holds.

**Files.** `libs/iso-bmff/src/readers/readStsd.ts:28`, `libs/iso-bmff/src/readers/readDref.ts:19`, `libs/iso-bmff/src/IsoBoxReadView.ts:414`, `libs/iso-bmff/src/readers/readStts.ts:17`, `libs/iso-bmff/src/writers/writeStsd.ts:23`, `libs/iso-bmff/src/writers/writeDref.ts:20`

**Evidence.** `entries: view.readBoxes<E>(entryCount)` (readStsd.ts:28) and `view.readBoxes<DataEntryUrlBox | DataEntryUrnBox>(entryCount)` (readDref.ts:19). `readBoxes` stops at the end of the view or before a bad child size and reports nothing.

Measured with defaultReaderConfig:
- `stsd`, entry_count 0xFFFFFFFF, no entry: returns `{entryCount: 4294967295, entries: []}`.
- `stsd`, entry_count 2, one entry with a size above the bytes that remain: returns `entries: []`.
- `dref`, entry_count 0xFFFFFFFF, one `url ` box: returns `entryCount: 4294967295` and 1 entry.
- The same damage in stts, ctts (version 0), stsc, stco, stss, stsz, elst, sidx, ssix, subs, tfra, pssh (kid count and data size), prsl, trun (with a per-sample flag) and tenc (constant IV size): `RangeError: Offset is outside the bounds of the DataView`.

In the byte-change matrix (367,642 cases, one changed byte in the first 4 KB of each fixture), 824 cases return an `stsd` or `dref` box whose `entryCount` differs from `entries.length`, with no error. A write of that result changes the bytes, because the writers write the array length: `const entryCount = box.entries.length` (writeStsd.ts:23, writeDref.ts:20). The damage is then no longer visible in the output.

**Proposal of the finder.** After the child boxes are read, compare the number of boxes with `entry_count`. If the body holds fewer boxes, throw the same error as a field read past the end of the box (the RFC states `RangeError` for that case). Keep the rule of the Unreleased changelog for a count below the number of boxes (the reader returns `entry_count` entries). State the rule once in the reading guide for all count fields.

**Proposal after verification.** Keep the goal (a `stsd` or `dref` box with fewer child boxes than `entry_count` throws) and change three points.

1. The error must not have the message `Truncated box`. The box iterator catches exactly that message and stops (libs/iso-bmff/src/IsoBoxReadView.ts:476). A reader that throws it makes the parent drop the `stsd` box and every sibling after it, with no error. A plain reuse of `readBox` in a loop has this defect in version 1.

2. Do not copy the engine message `Offset is outside the bounds of the DataView`. Throw a `RangeError` with an actionable message, as AGENTS.md requires: the box type, the `entry_count` value, and the number of boxes read. Measure the bundle cost of the string. If the cost is not acceptable, implement the reader in the cursor API as a loop of `entry_count` single-box reads, so the bounds check of the field functions throws with no added code.

3. Document the rule in the "Incomplete boxes" section of the reading guide, not only as a general count rule. That section states that the reader stops before an incomplete child box of a container and of a sample entry and does not throw. The guide must state that the entries of `stsd` and `dref` are counted fields: a count above the number of complete boxes throws, and 4 zero bytes after the last counted entry are still ignored. Add tests for both cases, and add the rule to the Contract list of rfc/iso-bmff-cursor-api.md.

The rule for a count below the number of boxes (the reader returns `entry_count` entries, PR 672) does not change.

**Prior decision.** No decision covers a count above the number of child boxes. Related decisions: docs/reading-boxes.md:87-93 (issues 650 and 663) states that a read stops before an incomplete child box of a container or a sample entry and does not throw. CHANGELOG.md:62 (issue 666) settles only an `entry_count` of 0. Issue 668 is closed as not planned, with the reasoning that a `RangeError` from bad input already goes to the caller. Issue 625 (open) covers the writer side: writers use the list length, not the count field.

## G488: The RFC contract keeps two different results for malformed input and names an error type for only one of four failures.

Severity medium. Category errors. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** One rule for a truncated or short box changes a thrown error or a returned value for malformed input.

**Files.** `rfc/iso-bmff-cursor-api.md:195`, `rfc/iso-bmff-cursor-api.md:196`, `rfc/iso-bmff-cursor-api.md:198`, `rfc/iso-bmff-cursor-api.md:201`, `libs/iso-bmff/src/IsoBoxReadView.ts:392`, `libs/iso-bmff/src/IsoBoxReadView.ts:476`, `libs/iso-bmff/src/utils/writeBox.ts:37`, `libs/iso-bmff/src/utils/writeBox.ts:46`

**Evidence.** Line 198: "`readIsoBoxes` stops before a truncated box, as in version 1." Line 195: "A field function that reads past `cursor.end` throws a `RangeError`." A box with a valid size and a body too short for its fields therefore throws from `readIsoBoxes` and returns no box, while a box with a size past the end of the data ends the read with no signal. `seekIsoBox` adds a third result, `null`. The audit of version 1 already reports this split, and the RFC writes it into the contract. Line 201 says "`writeIsoBoxes` throws" with no error type. Version 1 throws a plain `Error` with two message styles: `No writer found for box type: ${type}` and `'Invalid box'`. The read side finds a truncated box by a message comparison: `error.message === 'Truncated box'`. The RFC does not say how the new tree reader finds that case. No section of the RFC names the error type for a `bigint` out of range, for a box above the 32-bit size, or for a missing `endIsoBox`.

**Proposal of the finder.** Add an Errors table to the Reference section: the condition, the error type, and the message pattern with the parameter name, the expected value and the received value. Choose one rule for input that ends early, in the header or in the body, and apply the rule to `readIsoBoxes`, `seekIsoBox` and the field functions.

**Proposal after verification.** Keep the two rules and do not unify them. Add a short Errors table to the Contract section of rfc/iso-bmff-cursor-api.md that states each rule once:
1. Incomplete box (data ends inside the header or the body, or size below the header size): `readIsoBoxes` and `readChildBoxes` stop before the box, `seekIsoBox` returns `null`. No error. The tree reader checks the header against `cursor.end` before it reads the box, so no exception and no message comparison exist.
2. A field function reads past `cursor.end`: `RangeError`, message with the function name, the bytes needed, and the bytes that remain. The error goes to the caller of `readIsoBoxes`, as in version 1 (PR 658, issue 668).
3. A `bigint` that does not fit the field: `RangeError`, by reference to rfc/uint64-reader-config.md.
4. `writeIsoBoxes` for a box with no writer, no `boxes`, and no `bytes`: name the type (keep `Error`, or `TypeError`) and one message form with the box type. The second message `Invalid box` goes away with the `IsoBoxStreamable` union.
5. A box above 2^32 - 1 bytes: state whether `endIsoBox` writes a `largesize` header or throws a `RangeError`. Version 1 writes `largesize`.
6. A missing `endIsoBox`: state that the size field stays 0. No runtime check.
Only items 4 and 5 can change behavior. Items 1 to 3 and 6 are RFC text only.

**Prior decision.** Issues 650, 663, 660 (PRs 661, 662, 664): `readIsoBoxes` stops before an incomplete box and does not throw. docs/reading-boxes.md "Incomplete boxes" documents the rule. PR 658 (`tenc`): a reader throws a `RangeError` when a counted field leaves the box, same as `readPssh`. Issue 668 closed as not planned: a field read past the end already sends the error to the caller. rfc/uint64-reader-config.md:260: `RangeError` for a `bigint` that does not fit.

## F171: `SampleEntryBox`, `AudioSampleEntryBox`, and `VisualSampleEntryBox` add a `Box` suffix that the spec does not have, while `ItemInfoEntry` keeps the spec name.

Severity medium. Category naming. Breaking: yes. Fact check: confirmed. Value check: confirmed.

**Why it breaks.** Three public type names and four public function names change.

**Files.** `libs/iso-bmff/src/boxes/SampleEntryBox.ts:8`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:17`, `libs/iso-bmff/src/boxes/ItemInfoEntry.ts:8`, `libs/iso-bmff/src/readers/readAudioSampleEntryBox.ts:17`, `libs/iso-bmff/src/writers/writeAudioSampleEntryBox.ts:21`

**Evidence.** Spec: `abstract class SampleEntry (unsigned int(32) format)`, `class AudioSampleEntry(codingname) extends SampleEntry (codingname)`, `class VisualSampleEntry(codingname)`, `class ItemInfoEntry`. Package: `SampleEntryBox`, `AudioSampleEntryBox`, `VisualSampleEntryBox`, but `ItemInfoEntry`. The four functions `read/writeAudioSampleEntryBox` and `read/writeVisualSampleEntryBox` are the only `read`/`write` functions named after a type and not a box code.

**Proposal of the finder.** Rename to `SampleEntry`, `AudioSampleEntry`, `VisualSampleEntry`, with `readAudioSampleEntry`, `writeAudioSampleEntry`, `readVisualSampleEntry`, `writeVisualSampleEntry`. The child aliases follow, if they stay.

**Proposal after verification.** Keep the proposal and add three points. (1) State the rule in the docs: a type name is the spec class name. That rule explains `ItemInfoEntry` and prevents the opposite fix (`ItemInfoEntryBox`). (2) Rename or remove `AudioSampleEntryBoxChild` and `VisualSampleEntryBoxChild` (both are `any`) in the same change, and update `@svta/cml-drm` (libs/drm/src/ensureEncryptedInit.ts). (3) Note the cost: `SampleEntry` then sits beside the record types `SampleToChunkEntry`, `SampleToGroupEntry`, and `SubsampleEntry`, which are not boxes. The TSDoc of the three types should say that each is a box.

**Prior decision.** No decision found that fixes these names. libs/iso-bmff/CHANGELOG.md:248 added `createAudioSampleEntryReader` and `createVisualSampleEntryReader` without the `Box` suffix, and lines 212 and 257 mention `SampleEntryBox`, `AudioSampleEntryBox` and `VisualSampleEntryBox` with no naming rationale. Neither rfc/iso-bmff-cursor-api.md nor rfc/iso-bmff-container-readers-writers.md mentions these names.

## F174: The names of the entry and record types follow at least four patterns, and several are too generic for a public name.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Up to twelve public type names change.

**Files.** `libs/iso-bmff/src/boxes/DecodingTimeSample.ts:6`, `libs/iso-bmff/src/boxes/SyncSample.ts:6`, `libs/iso-bmff/src/boxes/Entity.ts:6`, `libs/iso-bmff/src/boxes/Subsample.ts:6`, `libs/iso-bmff/src/boxes/EncryptedSample.ts:8`, `libs/iso-bmff/src/boxes/ItemLocation.ts:8`, `libs/iso-bmff/config/cml-iso-bmff.api.md:1266`

**Evidence.** `<Box>Entry`: `CompositionTimeToSampleEntry`, `SampleToChunkEntry`, `SampleToGroupEntry`, `EditListEntry`, `TrackFragmentRandomAccessEntry`. Shortened: `DecodingTimeSample` (entry of `DecodingTimeToSampleBox`), `ShadowSyncEntry`, `SyncSample`, `SubsampleEntry`. No box name: `Entity` ("Entity" is the whole TSDoc), `Subsample`, `Subsegment`, `SubsegmentRange`, `ItemLocation`, `ItemExtent`, `EncryptedSample`, `SubsampleEncryption`. id3 and cmcd keep the package token in every type name.

**Proposal of the finder.** One rule: box name without `Box`, then the role. `DecodingTimeToSampleEntry`, `SyncSampleEntry`, `ShadowSyncSampleEntry`, `SubsampleInformationEntry`, `SubsampleInformationSubsample`, `SubsegmentIndexSubsegment`, `SubsegmentIndexRange`, `PreselectionGroupEntity`, `ItemLocationItem`, `ItemLocationExtent`, `SampleEncryptionSample`, `SampleEncryptionSubsample`.

**Proposal after verification.** Keep the rule, state it mechanically, and drop two renames.

1. Rule: the element type of an array field is the box name without `Box`, then the singular of the field name. `TrackRunSample` (`trun.samples`) and `SegmentIndexReference` (`sidx.references`) already follow the rule and do not change.

2. Do not rename `SyncSample` and `Entity`. Decide the flat-array finding (F142, F407) first. Performance is priority one, and `stss` with `sampleNumber: number[]` and `prsl` with `entityId: number[]` remove one object for each value and remove both types. Use `SyncSampleEntry` and `PreselectionGroupEntity` only if the object shape stays.

3. Renames that stand: `DecodingTimeSample` to `DecodingTimeToSampleEntry` (the clearest gain, it matches `CompositionTimeToSampleEntry`), `SubsampleEntry` to `SubsampleInformationEntry`, `Subsample` to `SubsampleInformationSubsample`, `Subsegment` to `SubsegmentIndexSubsegment`, `SubsegmentRange` to `SubsegmentIndexRange`, `ItemLocation` to `ItemLocationItem`, `ItemExtent` to `ItemLocationExtent`, `EncryptedSample` to `SampleEncryptionSample`, `SubsampleEncryption` to `SampleEncryptionSubsample`. `ShadowSyncEntry` to `ShadowSyncSampleEntry` is the weakest one and exists only for the rule. Avoid `ItemLocationEntry`, because `ItemInfoEntry` is a box type in this package (api.md:611).

4. Migration: the types are type-only exports, so a deprecated alias costs zero bytes. Either remove the old names in 2.0.0 with a rename table in the changelog, or add the new names now with `@deprecated` aliases and remove the aliases in 2.0.0. Also replace the one-word TSDoc summaries ("Entity", "Sub sample") with a sentence that names the box.


## F178: `ParsedBox`, `ParsedIsoBox`, and `IsoTypedParsedBox` are three names for one idea with three prefix orders, and they lose their purpose when `view` and `size` leave a parsed box.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Three public type names go away, and `IsoBoxReaderReturn` changes.

**Files.** `libs/iso-bmff/src/ParsedBox.ts:11`, `libs/iso-bmff/src/ParsedIsoBox.ts:11`, `libs/iso-bmff/src/IsoTypedParsedBox.ts:10`, `libs/iso-bmff/src/IsoBoxReaderReturn.ts:35`

**Evidence.** TSDoc: "A Parsed Box Type", "Parsed Box Type", "Typed Parsed Box Type". `ParsedBox` only adds `view`, `size`, `largesize`, `usertype`, which the RFC removes. `IsoTypedParsedBox<T>` then equals `IsoBoxMap[T]`, and no file outside its own uses it. The RFC text does not say what happens to the three names.

**Proposal of the finder.** Remove all three in 2.0.0. `readIsoBoxes` returns `IsoBox<V> | IsoRawBox`. Rename `IsoBoxReaderReturn` to a noun for what it is, such as `IsoBoxOf<R, V>` (the box union for a readers map), and drop its `ParsedBox` wrapper.

**Proposal after verification.** In 2.0.0, remove `ParsedBox` and `IsoTypedParsedBox`. The replacement for `IsoTypedParsedBox<T, V>` is `IsoBoxMap<V>[T]`. Keep exactly one exported name for the element of the default `readIsoBoxes` result. Keep `ParsedIsoBox<V>` as that name, so that adopter annotations such as `ParsedIsoBox[]` (c2pa `readC2paManifest`) still compile, or choose a new name under open question 5 "Names" of rfc/iso-bmff-cursor-api.md. Do not define the element as `IsoBox<V> | IsoRawBox` with `IsoRawBox.type: IsoBoxType`: that union does not narrow on `box.type === 'tfdt'`. The member for a box with no reader must keep `type: never` in the result union, as `Box` does today, or `IsoRawBox` needs a type parameter with a `never` default. The cursor RFC must state the element type of `readIsoBoxes` for each case: reader results, container types, and the raw member. In `IsoBoxReaderReturn`, drop only the `ParsedBox` wrapper. Keep the replaced-type exclusion, the `url`/`urn` alias, the `any` case, and the inline `V` swap. The rename of `IsoBoxReaderReturn` is optional and belongs to the same RFC question.

**Prior decision.** None for the three names. For `IsoBoxReaderReturn`: PR 614 (8d0b4b393, issue 611) added the exclusion of replaced box types and the `url`/`urn` alias on purpose. rfc/uint64-reader-config.md (accepted, amended 2026-11-12 to match PR 645) records at line 472 that the `V` swap helper type is inline, so the package declares no `IsoBoxOfMode` type.

## F280: The config types are named after the view classes that the RFC removes, and the TSDoc of the write config names a third class.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Two public type names change.

**Files.** `libs/iso-bmff/src/IsoBoxWriteViewConfig.ts:4`, `libs/iso-bmff/src/IsoBoxWriteViewConfig.ts:8`, `libs/iso-bmff/src/IsoBoxReadViewConfig.ts:14`, `libs/iso-bmff/src/readIsoBoxes.ts:20`, `libs/iso-bmff/CHANGELOG.md:281`

**Evidence.** `IsoBoxReadViewConfig` and `IsoBoxWriteViewConfig` are the config types of `readIsoBoxes`, `writeIsoBoxes` and `createIsoBoxReadableStream`. The RFC removes `IsoBoxReadView` and `IsoBoxWriteView` but does not name the config types. IsoBoxWriteViewConfig.ts:4 still says "Configuration for the IsoBoxReadableStream." (CHANGELOG.md:281: "Renamed `IsoBoxReadableStreamConfig` to `IsoBoxWriteViewConfig`"). readIsoBoxes.ts:20 says "The configuration for the IsoView", a name that does not exist. For context: the API reports of 12 other packages name such types `*Options` (cmcd 6, abr 2, sfv 2, utils 1 and others), and iso-bmff has 3 `*Config` types and no `*Options` type.

**Proposal of the finder.** Rename to `IsoBoxReadConfig` and `IsoBoxWriteConfig` in 2.0.0, which matches `defaultReaderConfig`, `defaultWriterConfig` and `TraverseIsoBoxesConfig`. Fix both TSDoc sentences. A move to `*Options` for all three types is the alternative if the package should follow the other packages.

**Proposal after verification.** Split the finding in two.

1. Do anytime, not breaking: fix the TSDoc. IsoBoxWriteViewConfig.ts:4 becomes "The configuration of `writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream`." Replace "IsoView" in readIsoBoxes.ts:20, :38, :57 (and IsoBoxReadView.ts:71, :76, :147, :150 while the class exists).

2. Do in 2.0.0: rename to `IsoBoxReadConfig<V>` and `IsoBoxWriteConfig`, and add both names to the Types section of rfc/iso-bmff-cursor-api.md, with `capacity` on the write config. Do not use `IsoBoxReaderConfig`, because `IsoBoxReader` is the function type of one box. Keep `defaultReaderConfig` and `defaultWriterConfig`, because they describe the maps of readers and writers that they fill. Keep the word `Config` and do not move to `*Options`. Rename the parameter `options` of `defaultReaderConfig` only if the package wants one word per signature. That change has no effect on adopters.

The rename is a compile-time break only. A deprecated type alias (`export type IsoBoxReadViewConfig<V extends IsoInt64 = number> = IsoBoxReadConfig<V>`) costs zero bundle bytes. It is an option if the maintainers want a softer migration, but 2.0.0 already changes `IsoBoxWriter` and removes the classes, so a clean rename with a changelog migration line is enough.

**Prior decision.** PR 283 (a4f84a560, 1.0.0-alpha.2, CHANGELOG.md:281) chose `IsoBoxWriteViewConfig` on purpose to pair with `IsoBoxReadViewConfig`, both named after the view classes. PR 301 (a31419299) added `defaultReaderConfig` and `defaultWriterConfig`. Neither decision survives the removal of the view classes in rfc/iso-bmff-cursor-api.md, and no RFC or issue fixes the two type names.

## F332: Several exports have generic names with no ISO prefix, against the pattern of the other packages

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Renames public functions, constants, and types.

**Files.** `libs/iso-bmff/src/utils/CONTAINERS.ts:6`, `libs/iso-bmff/src/utils/isContainer.ts:24`, `libs/iso-bmff/src/utils/isFullBox.ts:12`, `libs/iso-bmff/src/readers/defaultReaderConfig.ts:84`, `libs/iso-bmff/src/writers/defaultWriterConfig.ts:74`, `libs/iso-bmff/src/ParsedBox.ts:11`, `libs/iso-bmff/src/ParsedIsoBox.ts:11`, `libs/iso-bmff/src/IsoTypedParsedBox.ts:10`, `libs/iso-bmff/src/boxes/Box.ts:8`, `libs/iso-bmff/src/TraverseIsoBoxesConfig.ts:6`

**Evidence.** Prefixed: `readIsoBoxes`, `findIsoBox`, `isIsoBoxType`, `IsoBoxReaderMap`, `IsoInt64`. Not prefixed: `CONTAINERS`, `isContainer`, `isFullBox`, `defaultReaderConfig`, `defaultWriterConfig`, `fourCcToUint32`, `Box`, `FullBox`, `ParsedBox`. Three orders of the same words exist for one concept: `ParsedBox` ("A Parsed Box Type"), `ParsedIsoBox` ("Parsed Box Type"), `IsoTypedParsedBox` ("Typed Parsed Box Type"). Other packages prefix every export, for example `ID3_SCHEME_ID_URI` and `getId3Frames` in cml-id3. A player that imports `isContainer` or `CONTAINERS` next to DASH or HLS code gets a name with no domain.

**Proposal of the finder.** 2.0.0 names: `ISO_BOX_CONTAINERS`, `isIsoBoxContainer`, `isIsoFullBox`, `defaultIsoBoxReaderConfig`, `defaultIsoBoxWriterConfig`, `IsoBoxBase` and `IsoFullBox` for `Box` and `FullBox`. The cursor RFC removes `view` and `size` from parsed boxes, so `ParsedBox<T>` equals `T`. Remove `ParsedBox` and `IsoTypedParsedBox`, and keep one result type (`ParsedIsoBox` or a new `IsoBoxTree` element type). State the removal in the RFC, which does not mention the three types.

**Proposal after verification.** Rename three names in 2.0.0: `isContainer` to `isIsoBoxContainer` (the guard narrows to the existing type `IsoBoxContainer`), `isFullBox` to `isIsoFullBox` (matches `beginIsoFullBox` of the cursor RFC), and `CONTAINERS` to `ISO_BOX_CONTAINER_TYPES` (the values are box type strings). Pick one constant name, the group proposes two. Keep `Box` and `FullBox`: they are the class names of ISO/IEC 14496-12 clause 4.2, and the package names every box type after its spec class. Fix the TSDoc of `FullBox` instead, which is a pair of fields with no `type`. Remove `ParsedBox` and `IsoTypedParsedBox` as a consequence of the cursor RFC: with no `view` and `size`, `ParsedBox<T>` equals `T`, and `IsoTypedParsedBox<T, V>` equals `IsoBoxMap<V>[T]`. Keep one result type for `readIsoBoxes`. `ParsedIsoBox<V>` can stay as that name with the new definition `IsoBox<V> | IsoRawBox`, so c2pa and other adopters keep their import. Decide the names of `defaultReaderConfig` and `defaultWriterConfig` inside the cursor RFC, because the RFC replaces their return types `IsoBoxReadViewConfig` and `IsoBoxWriteViewConfig`. `defaultIsoBoxReaderConfig` and `defaultIsoBoxWriterConfig` are acceptable. Add all of these to the migration table of rfc/iso-bmff-cursor-api.md, which names none of them today. Leave `fourCcToUint32` as it is: the name states its domain. The six field constants (`UTF8`, `STRING`, `DATA`, and the others) belong to the dead-export finding, not to a rename.

**Prior decision.** rfc/iso-bmff-container-readers-writers.md:151 states "**Existing exports.** `CONTAINERS` and `isContainer` do not change." That line is a no-break promise for a minor version, not a decision that the names are intended. rfc/uint64-reader-config.md:224 lists `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox` as types that gain the `V` parameter, and :242 keeps `isContainer`, again inside a minor version. No decision found that blocks a rename in a major version.

## F405: The package uses the name "template" for fixed-point values, the RFC keeps the name, and no helper reads a signed fixed-point value.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Public names change: `readTemplate`, `writeTemplate`, `TEMPLATE`, and the `readTemplate16` and `readTemplate32` names that the RFC proposes.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:278`, `libs/iso-bmff/src/IsoBoxWriteView.ts:310`, `libs/iso-bmff/src/IsoBoxFields.ts:22`, `libs/iso-bmff/src/utils/readTemplate.ts:3`, `libs/iso-bmff/src/readers/readMvhd.ts:32`, `libs/iso-bmff/src/readers/readTkhd.ts:34`, `libs/iso-bmff/src/readers/readSmhd.ts:18`, `libs/iso-bmff/src/readers/readTkhd.ts:40`, `libs/iso-bmff/src/readers/readAudioSampleEntryBox.ts:32`, `rfc/iso-bmff-cursor-api.md:163`

**Evidence.** ISO/IEC 14496-12:2015 clause 6.2.2 defines the word: "Fields shown as \"template\" in the box descriptions are optional in the specifications that use this specification". The word marks a field with a default value. Fixed-point is a separate definition in the same clause. Many template fields are plain integers that the package reads with `readUint` or `readInt`: `template int(16) layer = 0;`, `template unsigned int(16) graphicsmode = 0;`, `template unsigned int(16) frame_count = 1;`. The package uses the word for fixed-point: "Reads an unsigned fixed-point value" on `readTemplate`, and `TEMPLATE = 'template'` is "The fixed-point field type". The RFC table keeps it: `view.readTemplate(size)` becomes `readTemplate16`, `readTemplate32`. The helper is unsigned only, so four readers divide by hand: `rate: readInt(4) / 65536`, `volume: readInt(2) / 256` (mvhd), `volume: view.readInt(2) / 256` (tkhd), `balance: view.readInt(2) / 256` (smhd), plus the matrix `.map`. The unsigned fields use the helper: `width: view.readTemplate(4)`, `samplerate: readTemplate(4)`. The write side has one method for both signs.

**Proposal of the finder.** In the RFC, name the field functions after what they do: `readFixed16` (8.8) and `readFixed32` (16.16) for signed values, `readUfixed16` and `readUfixed32` for unsigned values, and the same four with the `write` prefix. Use them in mvhd, tkhd, smhd, and the sample entries so that no reader divides by hand. State in the RFC that `IsoBoxFields`, the six field constants, and `IsoFieldTypeMap` go away with `readArray`.

**Proposal after verification.** Rename in the cursor RFC before 2.0.0 exports the names, with three read functions and no more: signed 8.8 (`volume`, `balance`), signed 16.16 (`rate`), and unsigned 16.16 (`width`, `height`, `horizresolution`, `vertresolution`, `samplerate`). Do not add an unsigned 8.8 function, because no box uses one. Put the format in the name, for example `readFixed8_8`, `readFixed16_16`, `readUfixed16_16`, because `readFixed32` can mean 16.16 or 2.30 in `mvhd` and `tkhd`. If the RFC prefers the bit-width suffix of `readUint16`, then `readFixed16`, `readFixed32`, `readUfixed32` is the fallback, with the format stated in the TSDoc. The write side follows the RFC rule of one `write` function for each read function. The stored bytes are the same for both signs, so the signed and unsigned 16.16 writers can share one body. Keep the matrix expression inline in the four mvhd and tkhd functions unless a new measurement in the cursor build shows a helper is smaller (PR 620 measured the helper as 6 to 17 B larger). State in the RFC that `IsoBoxFields`, the six field constants (`UINT`, `INT`, `TEMPLATE`, `STRING`, `DATA`, `UTF8`), and `IsoFieldTypeMap` leave the public API with `readArray` and `writeArray`. Remove the word "template" from the TSDoc of the fixed-point functions.

**Prior decision.** PR 620 (commit a13db9ace, merged 2026-11-10) kept `readTemplate` unsigned on purpose ("readTemplate stays unsigned, because width, height, the resolutions, and samplerate are unsigned") and chose the hand division in readMvhd, readTkhd, and readSmhd. The same PR measured an inline 2.30 matrix expression as smaller than a shared helper. That decision covers the sign split in version 1 only. No decision covers the name `template`: it came from codem-isoboxer in 8ac3ef9b9 (#265), and RFC question 5 of rfc/iso-bmff-cursor-api.md leaves the field function names open.

## F406: Field names follow two casing rules: camelCase on word boundaries in most boxes, and the unbroken lowercase of the spec in six boxes.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Public field names of the sample entries, vmhd, and hmhd change.

**Files.** `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:20`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:21`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:24`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:24`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:25`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:28`, `libs/iso-bmff/src/boxes/VideoMediaHeaderBox.ts:10`, `libs/iso-bmff/src/boxes/HintMediaHeaderBox.ts:10`, `libs/iso-bmff/src/boxes/SampleSizeBox.ts:11`, `libs/iso-bmff/src/boxes/ProducerReferenceTimeBox.ts:12`, `libs/iso-bmff/src/boxes/EditListEntry.ts:12`, `libs/iso-bmff/src/boxes/Subsegment.ts:9`

**Evidence.** Lowercase runs copied from the spec: `channelcount`, `samplesize`, `samplerate` (audio sample entry), `horizresolution`, `vertresolution` (visual sample entry), `graphicsmode`, `opcolor` (vmhd), `maxPDUsize`, `avgPDUsize`, `maxbitrate`, `avgbitrate` (hmhd). The same type breaks its own rule: the spec has `string[32] compressorname;` and the package has `compressorName`. The same words are camelCase elsewhere: `sampleSize` and `sampleCount` (stsz, trun), `frameCount`, `timescale` aside. So an adopter writes `entry.samplesize` in one box and `box.sampleSize` in another. Acronyms are lower camel everywhere (`trackId`, `schemeUri`, `defaultKid`, `defaultIvSize`, `sapType`) except `maxPDUsize` and `avgPDUsize`. Abbreviations differ too: `ntpTimestampSec`, `ntpTimestampFrac` against `mediaRateFraction`. One count name differs from the spec for no reason: `rangesCount` for `range_count`.

**Proposal of the finder.** One rule: the spec name, split on English word boundaries, in lower camel case, with acronyms as words. Rename to `channelCount`, `sampleSize`, `sampleRate`, `horizResolution`, `vertResolution`, `graphicsMode`, `opColor`, `maxPduSize`, `avgPduSize`, `maxBitrate`, `avgBitrate`, and `rangeCount`. List the renames in one changelog table.

**Proposal after verification.** Keep the proposed rule and renames: `channelCount`, `sampleSize`, `sampleRate`, `horizResolution`, `vertResolution`, `graphicsMode`, `opColor`, `maxPduSize`, `avgPduSize`, `maxBitrate`, `avgBitrate`, and keep `compressorName`. Reject the alternative from F46, F181, and F351 (rename `compressorName` to `compressorname`): it makes one more name unreadable and keeps the spec's own inconsistency. Three adjustments. (1) The affected types are four plus `Subsegment`, not six. (2) `rangesCount` to `rangeCount` only matters if the count field survives the major version. If another finding removes count fields that duplicate an array length, drop this rename and remove the field instead. (3) Write the rule once in the README, with the exceptions stated: a field name is the spec name in lower camel case, split at each English word, acronyms as words (`Id`, `Kid`, `Iv`, `Uri`, `Pdu`), and `timescale` stays one word. `ntpTimestampSec` and `ntpTimestampFrac` are not a casing problem: the spec has one 64-bit `ntp_timestamp`, so treat that split as a separate finding under the int64 rules. Put all renames in one changelog table with old and new names as the migration guide.

**Prior decision.** None found. The names come from the first import (commit 8ac3ef9b9, "feat: CML Version 1 (#265)") and the first writers commit (d615e5bf0). No RFC, README, or guide states a field name rule. CHANGELOG.md:72 mentions `horizresolution`, `vertresolution`, and `samplerate` only as a list of fixed-point fields.

## F411: `readVttc` and `readVttC` (and the two writers) differ only by the case of one letter, and their files have other names.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The public names `readVttc` and `writeVttc` change.

**Files.** `libs/iso-bmff/src/readers/readVttCue.ts:17`, `libs/iso-bmff/src/readers/readVttC.ts:14`, `libs/iso-bmff/src/writers/writeVttCue.ts:19`, `libs/iso-bmff/src/writers/writeVttC.ts:14`, `libs/iso-bmff/src/boxes/WebVttCueBox.ts:9`

**Evidence.** `export function readVttc(view): WebVttCueBox` is in the file readVttCue.ts, and `export function readVttC(view): WebVttConfigurationBox` is in readVttC.ts. The rule "read plus the four-character code" gives two names that a case-insensitive file system, a documentation URL, and a reader of the code cannot separate. These are the only two reader files whose name is not the name of the export. The child union of the same box also breaks the alias rule: `WebVttCueChild`, where the other 25 are `<TypeName>Child` (`WebVttCueBoxChild` by the rule).

**Proposal of the finder.** In version 2.0.0, rename the cue pair to the names that the files already have: `readVttCue` and `writeVttCue`. Keep `readVttC` and `writeVttC`. State the exception in the README: the name comes from the code except where two codes differ only by case. Rename `WebVttCueChild` to `WebVttCueBoxChild` if the aliases stay.

**Proposal after verification.** Split the finding in two parts.

1. Rename `readVttc` to `readVttCue` and `writeVttc` to `writeVttCue`. Keep `readVttC` and `writeVttC`. This part is not a break against the published version 1.0.7, because the cue pair exists only under `[Unreleased]`. The rename must land before any release publishes the two names. If a 1.x release ships first, the rename becomes a break and needs the major version. The rename reverses a rejected alternative of the accepted RFC 622, so the maintainer must decide it, and the RFC needs an amendment: the `vttc` row of the table (line 140), the section at lines 154-158, the two drawbacks at lines 188-189, and the rejected alternative at line 214. Also update CHANGELOG.md lines 22-23, the name derivation in test/containerReaders.test.ts:100 and the same code in containerWriters.test.ts, and rename test/readers/readVttc.test.ts. Do not rename `readVttC` or `writeVttC` to `readVttConfig`.

2. Rename `WebVttCueChild` to `WebVttCueBoxChild`. This part breaks adopters, because the alias is published since 1.0.0. Do it in 2.0.0 only if the child aliases stay public, and list the old and new name in the migration notes.

**Prior decision.** RFC "Named readers and writers for container boxes" (rfc/iso-bmff-container-readers-writers.md, accepted, PR 622 merged as 5c2b17919, implemented in PR 654 as 75f5d7b64, issue 297). Line 214 rejects `readVttCue` and `writeVttCue` because the names do not follow the naming rule. Lines 188-189 accept the case-only pair and the `readVttC-1` page names as drawbacks. Lines 156-158 explain the file names `readVttCue.ts` and `writeVttCue.ts`.

## F88: `Subsegment.rangesCount` is the only count field with a plural stem, and it differs from the spec name `range_count`.

Severity medium. Category naming. Breaking: yes. Fact check: confirmed. Value check: confirmed.

**Why it breaks.** A public field name of `Subsegment` and of the `readSsix` result changes.

**Files.** `libs/iso-bmff/src/boxes/Subsegment.ts:9`, `libs/iso-bmff/src/readers/readSsix.ts:18`, `libs/iso-bmff/src/writers/writeSsix.ts:23`, `libs/iso-bmff/test/readers/readSsix.test.ts:13`

**Evidence.** Subsegment.ts:9 `rangesCount: number`. The spec syntax (14496-12:2015, 8.16.4.2) is `unsigned int(32) range_count;`. Every other count field in src/boxes uses a singular stem: `subsegmentCount` in the same box (SubsegmentIndexBox.ts:11), `entryCount`, `sampleCount`, `subsampleCount`, `kidCount`, `referenceCount`, `itemCount`, `protectionCount`.

**Proposal of the finder.** Rename the field to `rangeCount`. If the count fields are removed (first finding), remove this field instead and skip the rename.


## G513: List fields follow two naming rules: a list of numbers keeps the singular spec name, a list of records gets a plural name, and three lists follow neither rule.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Each rename changes a public field name of a box type, the object that the reader returns, and the object that the writer accepts.

**Files.** `libs/iso-bmff/src/boxes/ChunkOffsetBox.ts:12`, `libs/iso-bmff/src/boxes/ChunkLargeOffsetBox.ts:11`, `libs/iso-bmff/src/boxes/SampleSizeBox.ts:12`, `libs/iso-bmff/src/boxes/CompactSampleSizeBox.ts:12`, `libs/iso-bmff/src/boxes/DegradationPriorityBox.ts:10`, `libs/iso-bmff/src/boxes/SampleAuxiliaryInformationOffsetsBox.ts:13`, `libs/iso-bmff/src/boxes/SampleAuxiliaryInformationSizesBox.ts:14`, `libs/iso-bmff/src/boxes/SingleItemTypeReferenceBox.ts:9`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:16`, `libs/iso-bmff/src/boxes/EncryptedSample.ts:10`, `libs/iso-bmff/src/boxes/IpmpInfoBox.ts:10`, `libs/iso-bmff/src/boxes/SyncSampleBox.ts:12`, `libs/iso-bmff/src/boxes/PreselectionGroupBox.ts:27`, `libs/iso-bmff/src/boxes/DecodingTimeToSampleBox.ts:16`, `libs/iso-bmff/src/boxes/CompositionTimeToSampleBox.ts:12`, `libs/iso-bmff/src/boxes/SampleToChunkBox.ts:12`, `libs/iso-bmff/src/boxes/ShadowSyncSampleBox.ts:12`, `libs/iso-bmff/src/boxes/EditListBox.ts:13`, `libs/iso-bmff/src/boxes/DataReferenceBox.ts:13`, `libs/iso-bmff/src/boxes/SampleDescriptionBox.ts:16`, `libs/iso-bmff/src/boxes/SampleToGroupBox.ts:14`, `libs/iso-bmff/src/boxes/SampleGroupDescriptionBox.ts:13`, `libs/iso-bmff/src/boxes/SubsampleInformationBox.ts:12`, `libs/iso-bmff/src/boxes/TrackFragmentRandomAccessBox.ts:18`, `libs/iso-bmff/src/boxes/SegmentIndexBox.ts:17`, `libs/iso-bmff/src/boxes/SubsegmentIndexBox.ts:12`, `libs/iso-bmff/src/boxes/Subsegment.ts:10`, `libs/iso-bmff/src/boxes/SubsampleEntry.ts:11`, `libs/iso-bmff/src/boxes/TrackRunBox.ts:17`, `libs/iso-bmff/src/boxes/SampleEncryptionBox.ts:12`, `libs/iso-bmff/src/boxes/ItemLocationBox.ts:16`, `libs/iso-bmff/src/boxes/ItemLocation.ts:13`, `libs/iso-bmff/src/boxes/TypeBox.ts:10`

**Evidence.** Answer to question 3. Singular name for an array: stco and co64 `chunkOffset: number[]`, stsz and stz2 `entrySize`, stdp `priority: number[]`, saio `offset: number[]`, saiz `sampleInfoSize?: number[]`, iref child `toItemId: number[]`, pssh `kid: number[]`, senc sample `subsampleEncryption?: SubsampleEncryption[]`, imif `ipmpDescr: any[]`. So `box.offset`, `box.priority` and `box.kid` read as one value. Plural name: `entries` in 12 types (stts, ctts, stsc, stss, stsh, elst, dref, stsd, sbgp, sgpd, subs, tfra) and a specific plural in sidx `references`, ssix `subsegments` and `ranges`, subs `subsamples`, trun and senc `samples`, prsl `entities`, iloc `items` and `extents`, ftyp and styp `compatibleBrands`, `trackIds`. The record lists follow one hidden rule, the plural of the stem of the count field: `entry_count` and `number_of_entry` give `entries`, `reference_count` gives `references`, `sample_count` gives `samples`. The number lists copy the spec element name, which is singular in the loop syntax (`unsigned int(32) chunk_offset;`) and plural only where the spec writes an array (`compatible_brands[]`, `track_IDs[]`). Exceptions: stss and prsl hold one number per element but use the record rule (`entries`, `entities`). senc uses `subsampleEncryption`, where the count is `subsample_count` and subs uses `subsamples` for the same stem. `entries` holds three kinds of content: records (10 types), child boxes (dref, stsd) and `any[]` (sgpd). co64, stz2, stdp, saio, saiz, the iref child, senc, imif, stsh, sbgp, sgpd and iloc have no built-in reader.

**Proposal of the finder.** State one rule in the README and apply it. Every array field has a plural name. A record list uses the plural of the stem of the count field, as it does today. A number list uses the plural of the spec element name: `chunkOffsets`, `entrySizes`, `priorities`, `offsets`, `sampleInfoSizes`, `toItemIds`, `kids`. If stss and prsl become plain arrays (already reported), name them `sampleNumbers` and `entityIds`. Rename senc `subsampleEncryption` to `subsamples`. Fixed-length values such as `matrix` and `opcolor` are one value with components and keep the singular name. Each rename is a break. Give the old and new names in one migration table.

**Proposal after verification.** Keep the spec names and fix only the fields that break the existing rule.

1. State the rule in the README (not breaking, do anytime): a field that the spec names keeps the spec name in camelCase, singular or plural as the spec writes it (`chunkOffset`, `entrySize`, `offset`, `sampleInfoSize`, `priority`, `toItemId`, `compatibleBrands`, `trackIds`). A loop that the spec does not name gets the plural of the stem of its count field (`entry_count` gives `entries`, `sample_count` gives `samples`, `reference_count` gives `references`).

2. Rename senc `EncryptedSample.subsampleEncryption` to `subsamples` (breaking, major only). The count field is `subsample_count` in 23001-7 line 516, and `subs` already uses `subsamples` for the same stem. Consider the type name `SubsampleEncryption` in the same change.

3. stss and prsl: if the separate finding turns them into number lists, apply rule 1 and name them after the spec element. The 2015 text gives `sample_number` for stss (line 2830), so `sampleNumber: number[]`. The prsl syntax is not in the 2015 edition, so I did not check the element name for `entities`.

4. Do not rename `kid` to `kids`. The field is a flat byte list of `kidCount * 16` numbers. Handle it with the pssh shape finding (a list of 16-byte key IDs), and choose the name there.

5. Do not apply a "every array is plural" rule. Byte-valued arrays such as `data`, `systemId`, `defaultKid` and `defaultConstantIv` are one value.

If the maintainers still prefer plural names for number lists, the major version is the only chance, and the rule must then exempt byte-valued arrays and `kid`. That choice is taste, and it costs the direct match with the spec text.


## F374: The syntax level of the published JavaScript is not declared, and the configuration states a level that the output does not have.

Severity medium. Category package-config. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A higher syntax level breaks adopters who do not transpile dependencies. A lower or equal level is not breaking.

**Files.** `tsconfig.json:42`, `vite.config.ts:12`, `libs/iso-bmff/package.json:44`, `libs/iso-bmff/dist/index.js:32`

**Evidence.** Root tsconfig.json has `"target": "ES2019"`. The pack block in vite.config.ts has only `fixedExtension: false` and no target. The built file has ES2020 syntax: `return { writers: config?.writers ?? {} };` (dist/index.js:32). Class fields are lowered to constructor assignments (`this.writeUint = (value, size) => {`, dist/index.js:128). The root README states the TypeScript minimum (5.7) and no JavaScript level. The dist folder is stale, but the syntax level does not depend on the source changes. I did not verify how the pack tool selects the level. It may read `engines.node` (`">=20"`).

**Proposal of the finder.** Decide the syntax level for 2.0.0, set it as an explicit `pack.target` in vite.config.ts, make the tsconfig target agree, and state the level in the README next to the TypeScript minimum. Decide `engines.node` in the same step, because Node 20 is past its end of life and the field may select the output level. This is a decision for all packages.

**Proposal after verification.** Treat this as a repo-wide build fix that does not wait for the major and does not break adopters:

1. Set `pack.target: 'es2021'` in vite.config.ts. This level matches the PR 514 promise and the dash.js check. The iso-bmff output has only ES2020 syntax (`??`, `?.`), so the bytes stay the same or nearly the same. Confirm with a dist diff after the change.
2. Keep the tsconfig `target` at ES2019 and do not "make it agree" by raising it. That value controls the class field emit, and ES2022 there would produce native class fields. If the mismatch is confusing, add one comment line that says the pack target decides the output syntax.
3. State the level in the root README next to the TypeScript minimum: "The published JavaScript is ES2021 syntax."
4. Add a parse check of every dist/index.js at ecmaVersion 2021 to the root `npm test`, so the statement stays true. PR 514 used acorn for a manual check of the same kind.
5. Decide `engines.node` separately. After step 1 the field no longer selects the output level, so a bump to a supported Node line is an independent change (it is the only part with a claim to a major, and only for adopters with engine-strict).
6. Correct the two sentences in rfc/uint64-reader-config.md (lines 166 and 434) that say the package targets ES2019, or scope them to "the tsconfig target".

Do not lower the output to ES2019 as part of this item. That is a separate open decision with a measured size cost, and no known adopter needs it (hls.js transpiles, dash.js checks ES2021). A level above ES2021 would be the only breaking variant, and I see no gain that justifies it.

**Prior decision.** No decision chose the current state. It is a side effect of PR 265 (8ac3ef9b9, build moved from tsc ES2019 to a bundler that reads engines.node). PR 514 (merged 2026-10-08, "fix(cmcd): ship an ES2021 build without module-scope side effects") is the nearest decision: the cmcd changelog promises that dist/index.js parses as ES2021, because dash.js checks its bundles with es-check es2021. Issue 237 ("Audit codebase for ES features") closed as completed without a stated level. The accepted RFC rfc/uint64-reader-config.md (PR 613) states "The package targets ES2019" at lines 166 and 434, which the output does not meet. A proposal to lower the output to ES2019 was investigated earlier (size cost measured at about +1.3% to +12% min+gzip per package) and has no maintainer decision yet.

## F199: Byte fields are `number[]` in pssh, tenc, and the sample entries, but `Uint8Array` in emsg, mdat, free, imda, and senc.

Severity medium. Category performance. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The public field types and the values that the readers return change from `number[]` to `Uint8Array`, and `kid` changes shape.

**Files.** `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:10`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:16`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:19`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:22`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:57`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:28`, `libs/iso-bmff/src/boxes/SampleEntryBox.ts:10`, `libs/iso-bmff/src/readers/readPssh.ts:33`, `libs/iso-bmff/src/readers/readPssh.ts:29`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:18`

**Evidence.** ProtectionSystemSpecificHeaderBox.ts: `systemId: number[]`, `kid: number[]` (documented as "one after the other ... `kidCount * 16` numbers"), `data: number[]`. readPssh.ts:33 `const data = readArray(UINT, 1, dataSize)` pushes one array element for each byte of the system data. TrackEncryptionBox.ts: `defaultKid: number[]`, `defaultConstantIv?: number[]`. VisualSampleEntryBox.ts:28 `compressorName: number[]`, where the specification has `string[32] compressorname` (12.1.3.2). Against that: EventMessageBox.ts:18 `messageData: Uint8Array`, MediaDataBox, FreeSpaceBox, IdentifiedMediaDataBox `data: Uint8Array`, EncryptedSample `initializationVector?: Uint8Array`. Checked with node: `pssh.data.constructor.name` is `Array`. A caller must copy `data` into a `Uint8Array` before a protection system parser or an EME call can use it.

**Proposal of the finder.** Use `Uint8Array` for every opaque byte field: `systemId`, `data`, `defaultKid`, `defaultConstantIv`. The reader returns a view over the input (`readBytes` in the RFC), so the read allocates no element array. Change `kid: number[]` to `kids: Uint8Array[]` with one 16-byte view for each key ID. Change `compressorName` to `string` (the reader decodes the length byte and the text, and the writer pads to 32 bytes). The writers accept `Uint8Array`, and may also accept `ArrayLike<number>` to ease migration.

**Proposal after verification.** Keep the core: `systemId: Uint8Array`, `data: Uint8Array`, `kids: Uint8Array[]` (one 16-byte view for each key ID, empty for version 0), `defaultKid: Uint8Array`, `defaultConstantIv?: Uint8Array`. The readers return views over the input with `readBytes`. Type the fields as `Uint8Array`, per the AGENTS.md rule for a view over the input.

Change these five points:

1. Do not add `ArrayLike<number>` to the field types. One box type is the reader result and the writer input. A wider type makes every consumer of a reader result handle two forms. `Uint8Array.prototype.set` already accepts a plain array at run time, so JavaScript callers lose nothing.

2. State the writer rule for fixed sizes. The writer writes exactly 16 bytes for `systemId`, each key ID, and `defaultKid`. A short value gets zero bytes, and a long value is cut. This rule keeps the settled decision that a writer does not throw, and the padding rule of PR 658. One `set` call with no `subarray(0, 16)` would move the next fields for a long value.

3. Do not remove or rederive `kidCount`, `dataSize`, and `defaultConstantIvSize` inside this finding. Issue 625 (open) owns the count rule. Decide both in the same major version, because `kids.length` and `kidCount` can differ.

4. Decide `compressorName` as a separate finding. A `string` matches `string[32] compressorname` and the settled rule about bytes that break the spec. The decision needs three rules that the proposal does not state: the text encoding (the 2015 text says only "displayable data"), a count byte above 31, and how the writer cuts a long name. The change also adds a string function to every visual sample entry reader.

5. Add the cost to the plan. `@svta/cml-drm` has the public option `EnsureEncryptedInitOptions.defaultKid: number[]` (libs/drm/src/ensureEncryptedInit.ts:94 and 119, libs/drm/config/cml-drm.api.md:64) and passes the value to the `tenc` writer. The drm package must change or convert the value. Also document that each view field keeps the input buffer in memory and shows later changes of the input, as the TSDoc of `readData` states today.

Leave `reserved1: number[]` (SampleEntryBox.ts:10) and `sdtp.sampleDependencyTable` out of this rule. `reserved1` is a reserved field, and `sdtp` holds one packed entry for each sample. Neither is an opaque byte string.

**Prior decision.** None that makes the current state intentional. PR 657 (commit 83716b139, issue 649) states: "The kid field stays a number[] with 16 numbers for each key ID, so the type ProtectionSystemSpecificHeaderBox does not change." The commit kept the type to avoid a break in a minor version. The same commit leaves the `kidCount` question to issue 625 (open). PR 658 (commit 60ae65d0f, issue 648) set the rule that `writeTenc` writes a 0 for each byte that `defaultConstantIv` does not have. That rule must stay.

## F298: readTrun builds each sample with conditional property writes and tests the flags for every sample, and writeTrun loads `box.flags` four times for every sample

Severity medium. Category performance. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** With fixed keys, `'sampleDuration' in sample` and a deep equality check give a different result. The hoisting alone is not a breaking change.

**Files.** `libs/iso-bmff/src/readers/readTrun.ts:29`, `libs/iso-bmff/src/readers/readTrun.ts:30`, `libs/iso-bmff/src/readers/readTrun.ts:32`, `libs/iso-bmff/src/readers/readTrun.ts:42`, `libs/iso-bmff/src/writers/writeTrun.ts:45`, `libs/iso-bmff/src/writers/writeTrun.ts:46`, `libs/iso-bmff/src/boxes/TrackRunSample.ts:6`

**Evidence.** readTrun: `view.readEntries<TrackRunSample>(sampleCount, () => { const sample: TrackRunSample = {}` then `if (flags & 0x100) { sample.sampleDuration = view.readUint(4) }` for four flags, and `version === 0 ? view.readUint(4) : view.readInt(4)` inside the closure. Each sample starts as an empty object and gains up to four properties, so each flag combination is a different object shape. writeTrun: `for (const sample of box.samples) { if (box.flags & 0x100) {` with four such tests. The trun box is in every media segment, and the trial of the RFC shows that the moof read still allocates 10483 B for 120 samples.

**Proposal of the finder.** Rule for 2.0.0: a reader computes every test on the flags and the version once, before the loop, and creates each entry with one object literal that has every key of the entry type in a fixed order. An absent field has the value `undefined`. For trun: `const hasDuration = (flags & 0x100) !== 0` and three more constants, then `samples[i] = { sampleDuration: hasDuration ? readUint32(cursor) : undefined, ... }` into an array created with the sample count. writeTrun uses the same four constants. Option to measure before a decision: one column for each field (`sampleDurations?: Uint32Array`), as mp4box.js does. That option allocates at most four arrays for a run and no sample objects, and it changes the public type.

**Proposal after verification.** Split the proposal into two parts.

Part 1, not breaking, do anytime (or with the cursor rewrite): in readTrun, compute the four flag tests and the sign test once before the loop, replace the `readEntries` closure with an inline loop, and assign into `new Array(sampleCount)` by index. In writeTrun, read `box.flags` once into four constants. Measured gain: 22% to 45% of the reader time and 14% of the heap, with the same sample objects as today.

Part 2, breaking, do in 2.0.0: create each sample with one literal that has the four keys in a fixed order, with `undefined` for an absent field. Assign it with `samples[i] = { ... }`. Do not write `samples.push({ ... })`: that form measured two times slower. Measured gain over part 1: 12% to 14% of the reader time and no heap. The second gain is consistency: readTfhd, readPrsl, readSchm and the box level of readTrun already return fixed keys with `undefined`. State the rule in the changelog as "a reader returns every key of the type, an absent field is `undefined`".

Keep `TrackRunSample` as it is (`sampleDuration?: number`, four optional keys). A required `number | undefined` key would force an adopter who writes a box to name all four keys.

For the array with the count: a corrupt `sample_count` is not a memory risk in V8 (`new Array(0xffffffff)` allocates 464 B, `new Array(90000)` allocates 720 KB before the read fails). A check of the count against the bytes that remain before the allocation is still cheap and gives the `Truncated box` error early.

Columns (`sampleDurations?: Uint32Array`): do not adopt on this evidence. The benchmark shows no time gain with a consumer loop, the form leaves the row syntax of clause 8.8.8.2, and the composition offset needs `Uint32Array | Int32Array`. The heap gain (about 90%) is real. Measure the option again in the real cursor build if heap per segment becomes a target.

Drop the claim that fixed keys reduce the 10483 B of the RFC trial. Only the array created with the count reduces it.


## F177: The readers map finds a reader by the trimmed type (`url`), the writers map does not, and the two maps have different key types.

Severity medium. Category reader-writer-asymmetry. Breaking: yes. Fact check: confirmed. Value check: confirmed.

**Why it breaks.** A readers map with the key `url` or `urn` no longer reads the box.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:463`, `libs/iso-bmff/src/utils/writeBox.ts:25`, `libs/iso-bmff/src/IsoBoxReaderReturn.ts:57`, `libs/iso-bmff/src/IsoBoxWriterMap.ts:8`, `libs/iso-bmff/docs/reading-boxes.md:85`

**Evidence.** Reader: `readers[type] || readers[type.trim()]`. Writer: `config.writers?.[type]`. Run: `{ readers: { url: readUrl } }` reads the box, and `{ writers: { url: writeUrl } }` throws "No writer found for box type: url ". `IsoBoxReaderReturn` has a branch only for this rule: ``K extends 'url' | 'urn' ? K | `${K} ` : K``. Keys: `Record<IsoBoxType, ...>` for readers, `Record<string, ...>` for writers. Neither offers a known key in autocomplete.

**Proposal of the finder.** Use the exact four-character code as the only key in both maps: `'url '`. Remove the trimmed lookup and the `url`/`urn` branch of `IsoBoxReaderReturn`. Give both maps the same key type, with the keys of `IsoBoxMap` as optional known keys so that an editor suggests them.

**Prior decision.** No decision to keep the alias. PR 614 (merged 2026-11-10, commit 8d0b4b393) added the `'url' | 'urn'` branch to IsoBoxReaderReturn, the paragraph at docs/reading-boxes.md:85, and the test at test/readIsoBoxes.test.ts:137. That PR made the type match runtime behavior that already existed, in a minor version that could not break adopters. It is the same case as the readVttc names: kept to avoid a break, open for a major version.

## F201: Four box types have a raw field next to the fields decoded from it, and each writer has a different rule for which one it writes.

Severity medium. Category reader-writer-asymmetry. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Fields leave the public types and the reader results, and `defaultIsProtected` becomes the field that writeTenc writes.

**Files.** `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:7`, `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:9`, `libs/iso-bmff/src/writers/writeSidx.ts:49`, `libs/iso-bmff/src/boxes/TrackFragmentRandomAccessBox.ts:13`, `libs/iso-bmff/src/writers/writeTfra.ts:44`, `libs/iso-bmff/src/boxes/LabelBox.ts:10`, `libs/iso-bmff/src/readers/readLabl.ts:21`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:16`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:28`

**Evidence.** sidx: SegmentIndexReference requires `reference` and `sap` (the raw 32-bit words) and also `referenceType`, `referencedSize`, `startsWithSap`, `sapType`, `sapDeltaTime`. writeSidx packs the decoded fields and never reads `ref.reference` or `ref.sap`. Checked with node: a reference with `reference: 0xffffffff, sap: 0xffffffff, referencedSize: 5` writes `00 00 00 05 ... 00 00 00 00`. tfra: `reserved` is required, and writeTfra.ts:44-46 builds the word from the three `lengthSizeOf*` fields and ignores it. labl: `isGroupLabel: boolean` is required (readLabl.ts:21 `(flags & 0x1) !== 0`), and writeLabl writes only `box.flags`, so a change of `isGroupLabel` has no effect. tenc: the TSDoc states "`writeTenc` does not write the field. To change the protection state, change `defaultIsEncrypted`", so the raw 3-byte field wins for the protection state while the decoded pattern fields win over the raw bits. 23001-7:2016 8.2.2 has no `default_IsEncrypted` field of 24 bits. The syntax is a reserved byte, the pattern byte, then `default_isProtected`.

**Proposal of the finder.** Keep only the decoded fields. Remove `reference` and `sap` from SegmentIndexReference, `reserved` from tfra, and `isGroupLabel` from LabelBox (the flags are the rule for writers). For tenc, remove `defaultIsEncrypted` and make `defaultIsProtected` required and written, which the major version allows. Type the 1-bit fields as `0 | 1` (`referenceType`, `startsWithSap`, `defaultIsProtected`) so the three representations (number, boolean, raw word) become one.

**Proposal after verification.** Keep the proposal with these changes.

1. sidx: remove `reference` and `sap` from `SegmentIndexReference`. Keep the six spec fields. `0 | 1` for `referenceType` and `startsWithSap` is optional. The fields are `bit(1)`, so the type is accurate, but it needs a cast in readSidx and a narrowing step for adopters who pass a `number`.

2. tfra: remove `reserved` from `TrackFragmentRandomAccessBox`. readTfra keeps the word in a local variable. Handle this field together with the general finding on reserved fields (sidx, hdlr, mvhd, tkhd, smhd, sample entries), so the package has one rule.

3. labl: remove `isGroupLabel`. Document in the TSDoc of `LabelBox` that bit 0x1 of `flags` marks a group label. Keep the hedge that the spec text of `labl` was not read.

4. tenc: remove `defaultIsEncrypted`. Make `defaultIsProtected: number` required and written. Do not type it as `0 | 1`: the field has 8 bits and the values 0x02 to 0xFF are reserved, so a reader can return them. Rule of writeTenc in 2.0.0: write 0 for the first reserved byte. For version 0, write 0 for the second byte. For version 1 or above, write `((defaultCryptByteBlock ?? 0) << 4) | (defaultSkipByteBlock ?? 0)`. Then write `defaultIsProtected`. The writer does not throw for a missing pattern field. Non-zero reserved bits of a source box are not kept, which agrees with the settled rule. Update libs/drm/src/ensureEncryptedInit.ts:172 to `defaultIsProtected: 1` in the same release. The written bytes of that function do not change. The changelog needs the migration: `defaultIsEncrypted & 0xff` becomes `defaultIsProtected`.

**Prior decision.** tenc only: PR 658 (commit 60ae65d0f, fixes issue 648) kept `defaultIsEncrypted` as the written field and added `defaultIsProtected` as a read-only optional field. The stated purpose was no break in a minor version, not a preference for the raw field. No prior decision for sidx (`reference`, `sap`), tfra (`reserved`), or labl (`isGroupLabel`). Those fields date from the first port (8ac3ef9b9, PR 265).

## F246: The write view has three string methods with two encodings, the built-in writers use none of the two terminated methods, and the method with the short name writes Latin-1 that the built-in readers decode as UTF-8.

Severity medium. Category reader-writer-asymmetry. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Method names change and the one-byte methods are removed. The RFC already replaces these methods with field functions.

**Files.** `libs/iso-bmff/src/IsoBoxWriteView.ts:226`, `libs/iso-bmff/src/IsoBoxWriteView.ts:242`, `libs/iso-bmff/src/IsoBoxWriteView.ts:255`, `libs/iso-bmff/src/IsoBoxReadView.ts:267`, `libs/iso-bmff/src/IsoBoxReadView.ts:304`, `libs/iso-bmff/src/writers/writeKind.ts:27`

**Evidence.** `writeString` and `writeTerminatedString` write `value.charCodeAt(c)` in one byte. `writeUtf8TerminatedString` encodes UTF-8. No method writes UTF-8 with no terminator. A search of `src` finds no caller of `writeTerminatedString` or `writeUtf8TerminatedString` outside the class. The writers call `writer.writeBytes(schemeUriBytes)` and `writer.writeUint(0, 1)`. Every terminated string in the built-in readers is `view.readUtf8(-1)`. No reader calls `readString(-1)`. Read-only run of the source: `writeTerminatedString('é')` writes `e9 00`, and `readUtf8(-1)` returns U+FFFD. `writeString('€uro')` writes `ac 75 72 6f`. A string with a null character splits the field: `writeKind` with `schemeUri: 'a\0b'`, `value: 'v'` reads back as `schemeUri: 'a'`, `value: 'b'`. The read side uses `readString(size)` and `readUtf8(size)` with the size -1 for a terminated string, so the names of the two sides do not match.

**Proposal of the finder.** 2.0.0 has one encoding for text, UTF-8, and the same names on both sides: `readUtf8(cursor, length)` and `writeUtf8(cursor, value)` for a string with no terminator, `readUtf8Terminated(cursor)` and `writeUtf8Terminated(cursor, value)` for a null-terminated string. Remove the size -1 from the read side. Remove the one-byte `writeString` and `writeTerminatedString`. Four-character codes use `readFourCc` and `writeFourCc`. State in the documentation that the writer does not check for a null character inside a value.

**Proposal after verification.** Correct the statement: the built-in pairs agree, because `writeString` and `readString(4)` are used only for four-character codes (hdlr handlerType, ftyp and styp brands). The trap is for custom writers only.

Corrected proposal, as an amendment to row 185 and line 191 of rfc/iso-bmff-cursor-api.md:
1. `readUtf8(cursor, length)` and `writeUtf8(cursor, value)` for text with no terminator. `length` is required. A reader that needs the rest of the box passes `cursor.end - cursor.pos` (readVttC). A length past `cursor.end` throws, as the RFC contract states.
2. `readUtf8Terminated(cursor)` and `writeUtf8Terminated(cursor, value)`. The size -1 is removed. `readUtf8Terminated` keeps the rule of issue 635: with no null byte, the function stops at `cursor.end` and does not throw. Without this exception the RFC contract would make `hdlr` boxes with no terminator throw (issue 647).
3. `readFourCc(cursor)` and `writeFourCc(cursor, value)` replace `readString(4)` and `writeString`. Both keep one byte for each character, with no length parameter. No generic one-byte string function is exported. A custom reader with another fixed-size field uses `readBytes`.
4. `writeString`, `writeTerminatedString` and `writeUtf8TerminatedString` have no successor with those names. The built-in writers call `writeUtf8Terminated`, because the growing buffer removes the need for the byte length that caused PR 633.
5. The TSDoc of the two write functions states that the writer does not check for a null character in the value. No throw, in line with the settled writer rules.
Out of scope for this finding, but related: `schm.schemeType` and `frma.dataFormat` are numbers from `readUint(4)` (readSchm.ts, readFrma.ts), while brands and `handlerType` are strings. A `readFourCc` name makes that difference visible, so decide it in the same RFC pass.

**Prior decision.** No decision keeps the current state. Issue 631 and PRs 637 (aecfdfa19) and 643 (6b2a23c36) moved every built-in text field to UTF-8 and left `writeTerminatedString` and `readString(-1)` in place only as public v1 methods. PR 633 (b6cedb096, issue 632) is the reason the writers call `encodeText` and `writeBytes`: one encode for the v1 size code. Two read rules are settled and must survive the rename: a terminated read with no null byte stops at the end of the box (issue 635, PRs 639 and 642), and issue 647 (`hdlr` name with no null byte) is closed as not planned.

## F408: The sample entry readers take any box type and the sample entry writers take only the built-in types, and the reader parameters are in the reverse order of `IsoBoxReader`.

Severity medium. Category reader-writer-asymmetry. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The signature of `readAudioSampleEntryBox` and `readVisualSampleEntryBox` changes, the writer type parameter widens, and the two `create*Reader` functions may go.

**Files.** `libs/iso-bmff/src/readers/readAudioSampleEntryBox.ts:17`, `libs/iso-bmff/src/readers/readVisualSampleEntryBox.ts:20`, `libs/iso-bmff/src/readers/createAudioSampleEntryReader.ts:29`, `libs/iso-bmff/src/readers/createVisualSampleEntryReader.ts:29`, `libs/iso-bmff/src/writers/writeAudioSampleEntryBox.ts:21`, `libs/iso-bmff/src/writers/writeVisualSampleEntryBox.ts:21`, `libs/iso-bmff/src/IsoBoxReader.ts:16`, `libs/iso-bmff/src/IsoBoxReadView.ts:466`, `rfc/iso-bmff-cursor-api.md:147`

**Evidence.** Reader: `readAudioSampleEntryBox<T extends IsoBoxType>(type: T, view: IsoBoxReadView<IsoInt64>)`. The doc of `createAudioSampleEntryReader` shows `'ac-3': createAudioSampleEntryReader('ac-3')`. Writer: `writeAudioSampleEntryBox<T extends AudioSampleEntryType = AudioSampleEntryType>(box: AudioSampleEntryBox<T>, ...)` with `AudioSampleEntryType = 'mp4a' | 'enca'`. A box that the package reads as `AudioSampleEntryBox<'ac-3'>` is a compile error for the only writer that can write it. The visual pair has the same difference. Parameter order: the reader contract is `(view: IsoBoxReadView<V>, type: T) => B`, and the view calls `parser(view as IsoBoxReadView, type)`. The two sample entry functions take `(type, view)`. That order is the only reason for the two factories and for the nine wrappers (`readMp4a`, `readEnca`, `readAvc1` to `readAvc4`, `readHev1`, `readHvc1`, `readEncv`). The RFC removes the `type` argument from `IsoBoxReader` (`(cursor: IsoBoxReadCursor<V>) => B`), so this family needs a decision before the rewrite.

**Proposal of the finder.** Widen both writers to `T extends IsoBoxType`. In the cursor API, keep a way for a reader to know the type of the box it reads (a `type` field on the read cursor, or the second argument of today), and give the two generic readers the reader signature. Then `readers: { 'ac-3': readAudioSampleEntry }` works with no factory, and the two `create*Reader` functions can go.

**Proposal after verification.** Split the finding in two.

1. Writers, not breaking, do anytime: declare `writeAudioSampleEntryBox<T extends IsoBoxType = AudioSampleEntryType>` and `writeVisualSampleEntryBox<T extends IsoBoxType = VisualSampleEntryType>`. Keep the defaults so explicit uses of today still compile. Add a test that writes a box from `createVisualSampleEntryReader('av01')`.

2. Readers, decide in the cursor RFC before the rewrite. Removing the factories alone loses the literal box type in the result of `readIsoBoxes` (`AudioSampleEntryBox<string>`), so pick one of these:
   a. Keep `type` as the second argument of the 2.0.0 reader type, as PR 290 intended: `(cursor, type) => B`. Give the generic readers that signature. Make `IsoBoxReaderReturn` replace a non-literal `type` of a reader result with the map key. Then `readers: { 'ac-3': readAudioSampleEntryBox }` keeps the literal type, and the two factories can go. Verify the key replacement against the full `IsoBoxReaderReturn` and the int64 type tests first. A `type` field on the read cursor is the weaker form: a direct call after `seekIsoBox` would depend on hidden cursor state.
   b. If the RFC keeps `(cursor) => B`, keep the two factories as the only public generic read form and remove `readAudioSampleEntryBox` and `readVisualSampleEntryBox` from the public API.
   Option a is better for adopters: the read map and the write map get the same form, and two exports go. Option b has no typing risk. The nine named readers and nine named writers stay in both options.

**Prior decision.** No decision makes the current state intentional as a whole. Related history: PR 289 (3102f626e, alpha.4) added the two factories with "Improved type inference for reader return types". Commit 546d554fa (alpha.6) fixed their type inference. PR 290 (d429da2d2, alpha.8) added the `type` argument to `IsoBoxReader` on purpose. rfc/uint64-reader-config.md:246 keeps the factories in the reader contract. The writer limit (69489be50, alpha.3) predates the reader widening and has no recorded decision.

## G511: `isGroupLabel` of `labl` is the only `boolean` field of the package and the only field decoded from `flags`, and `writeLabl` ignores it.

Severity medium. Category reader-writer-asymmetry. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The fix removes a public field of `LabelBox` or changes its type. Code that reads `box.isGroupLabel` or builds a `LabelBox` literal with the field stops compiling.

**Files.** `libs/iso-bmff/src/boxes/LabelBox.ts:10`, `libs/iso-bmff/src/readers/readLabl.ts:21`, `libs/iso-bmff/src/writers/writeLabl.ts:26`, `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:10`, `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:12`, `libs/iso-bmff/src/readers/readSidx.ts:38`, `libs/iso-bmff/src/readers/readSidx.ts:40`, `libs/iso-bmff/src/boxes/Subsample.ts:9`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:29`, `libs/iso-bmff/test/writers/writeLabl.test.ts:10`, `libs/iso-bmff/test/readers/readLabl.test.ts:30`

**Evidence.** Answer to question 1. `grep boolean src/boxes` has one hit: LabelBox.ts:10 `isGroupLabel: boolean`. readLabl.ts:21 `isGroupLabel: (flags & 0x1) !== 0`. writeLabl.ts:26 writes `writer.writeFullBox(box.version, box.flags)` and never reads `box.isGroupLabel`, so `{ ...box, isGroupLabel: true }` with `flags: 0` writes a label that is not a group label. No test uses `isGroupLabel: true` (writeLabl.test.ts lines 10, 34, 54, 71 and readLabl.test.ts lines 30, 34 all use `false`). Every other one-bit or flag-like value is a `number`: sidx `referenceType: (reference >> 31) & 0x00000001` and `startsWithSap: (sap >> 31) & 0x00000001` (spec `bit(1)`), subs `discardable: view.readUint(1)` (spec `unsigned int(8)`, values 0 and 1 described, so it is not a one-bit field), tenc `defaultIsProtected?: number` (spec `unsigned int(8)`, 0 and 1 defined, 0x02 to 0xFF reserved). No other reader makes a field from a flag bit: tfhd, trun, schm, prsl and url use `flags` only to decide which fields exist, and tkhd (track_enabled), senc and the sample entries have no such field. emsg and the sample entries have no one-bit field. The `labl` box is not in the supplied 2015 text, so I could not compare the name with the spec.

**Proposal of the finder.** Remove `isGroupLabel` from `LabelBox`. The value is `flags & 0x1`, and the settled rule says that the writer follows `flags`. Export the bit as a named flag constant together with the other flag names (already reported as missing). State one rule in the docs: the package never converts an integer field to `boolean`. Type the two one-bit syntax fields of sidx as `0 | 1` (see the finding about closed value sets).

**Proposal after verification.** Remove `isGroupLabel` from `LabelBox` and from `readLabl` in 2.0.0. Keep `writeLabl` as it is: the writer follows `flags`. State the bit in the TSDoc of `LabelBox` ("bit 0x000001 of `flags` marks a group label") and give the migration in the changelog: replace `box.isGroupLabel` with `(box.flags & 0x1) !== 0`. Add one test that reads and writes a `labl` box with `flags: 1`. Add a named flag constant only if the separate finding about flag names is accepted for every box (tfhd, trun, schm, prsl, url). Do not add a single constant for `labl`. Handle the `0 | 1` type of sidx `referenceType` and `startsWithSap` in its own finding. Drop the proposed docs rule about `boolean`. If a rule is wanted, put it in `.claude/rules/code-quality.md` for contributors, not in the adopter docs. Verify the meaning of bit 0x1 against ISO/IEC 14496-12 clause 8.10.5 of a current edition before the TSDoc text is final, because the 2015 text does not contain the box.

**Prior decision.** None found. `git log` for LabelBox.ts and readLabl.ts shows no commit about `isGroupLabel` (the field dates from the initial writers and version 1 commits), CHANGELOG.md has no entry for it, and rfc/iso-bmff-cursor-api.md does not mention it. The settled rule "a writer follows the flags and the version of the box" explains why `writeLabl` ignores the field, so the writer behavior follows a decision, but the redundant field itself has no recorded decision.

## F250: `TrackEncryptionBox` has three overlapping forms of the same bits, `writeTenc` writes one of the new fields and ignores another, and the writer writes a constant IV that the syntax does not allow.

Severity medium. Category spec-compliance. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** `defaultIsEncrypted` is removed, `defaultIsProtected` becomes required, and `defaultIvSize` is renamed. A box with a constant IV and a condition that is false is written with no constant IV.

**Files.** `libs/iso-bmff/src/writers/writeTenc.ts:41`, `libs/iso-bmff/src/writers/writeTenc.ts:50`, `libs/iso-bmff/src/readers/readTenc.ts:24`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:11`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:24`, `libs/iso-bmff/test/writers/writeTenc.test.ts:182`

**Evidence.** The type has `defaultIsEncrypted` (`The 3 bytes that precede default_Per_Sample_IV_Size`), and also `defaultIsProtected`, `defaultCryptByteBlock`, and `defaultSkipByteBlock`, which are parts of those 3 bytes. Writer: `(defaultIsEncrypted & 0xff00ff) | (((box.defaultCryptByteBlock ?? defaultIsEncrypted >> 12) & 0xf) << 12) | ...`. The pattern fields replace the old bits. `defaultIsProtected` does not: the type says `writeTenc does not write the field`, and a test is named `should write the lowest byte of defaultIsEncrypted and not defaultIsProtected`. The constant IV: `if (defaultConstantIvSize !== undefined) { writer.writeUint(defaultConstantIvSize, 1) ...`. ISO/IEC 23001-7:2016 clause 8.2.2 has `if (default_isProtected ==1 && default_Per_Sample_IV_Size == 0) { unsigned int(8) default_constant_IV_size; ...`. Read-only run of the source: a box with `defaultIsEncrypted: 1`, `defaultIvSize: 8`, `defaultConstantIv: [1, 2]` writes 35 bytes, and `readTenc` returns no `defaultConstantIv`. The optional fields were added in a minor version to avoid a break.

**Proposal of the finder.** 2.0.0 uses the fields of clause 8.2.2 only: `defaultIsProtected: number`, `defaultPerSampleIvSize: number`, `defaultKid`, `defaultCryptByteBlock?` and `defaultSkipByteBlock?` (written for version 1 or above, 0 if missing), `defaultConstantIv?`. Remove `defaultIsEncrypted` and `defaultConstantIvSize`. The writer writes the constant IV only when `defaultIsProtected` is 1 and `defaultPerSampleIvSize` is 0, as the other writers follow the control fields of the box. The changelog gives the mapping from `defaultIsEncrypted`. This proposal replaces the rule of PR 658 that kept `defaultIsEncrypted` for compatibility. It needs a decision.

**Proposal after verification.** Keep the core of the proposal: remove `defaultIsEncrypted`, make `defaultIsProtected: number` required and written, rename `defaultIvSize` to `defaultPerSampleIvSize`, keep `defaultCryptByteBlock?` and `defaultSkipByteBlock?` (written for version 1 or above, 0 if missing), and write the constant IV if and only if `defaultIsProtected === 1` and `defaultPerSampleIvSize === 0`. The writer writes 0 for the reserved bytes.

Change three points:

1. Do not remove `defaultConstantIvSize` in this finding. The package keeps size and count fields next to their arrays, for example `dataSize` and `kidCount` in libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:13-18 and `entryCount` in many boxes. The duplicate reports disagree on this field (F349 keeps it, F250, F161, and F424 remove it). Decide the field with the package-wide rule for count fields. Until that decision, keep the rule of PR 658: the field is optional, and the size is the length of `defaultConstantIv` with no field. Under the condition, a box with neither field writes a size byte of 0.

2. Release order decides the migration text. `package.json` has version 1.0.7, and the `tenc` entries of PR 658 are under `[Unreleased]` (libs/iso-bmff/CHANGELOG.md:24-27, 90). If 2.0.0 is the next release, remove those entries and write one 2.0.0 entry. The migration is then: `defaultIsEncrypted` becomes `defaultIsProtected` (the lowest byte), the pattern bits of a version 1 box become `defaultCryptByteBlock` and `defaultSkipByteBlock`, and `defaultIvSize` becomes `defaultPerSampleIvSize`. If a 1.1.0 release comes first (open question 1 of rfc/iso-bmff-cursor-api.md), adopters get two changes of the `tenc` type.

3. Change the one caller in the same PR: libs/drm/src/ensureEncryptedInit.ts:172-173 builds the box with `defaultIsEncrypted: 1` and `defaultIvSize: 8`. The written bytes of that box do not change.

`readTenc` keeps the `!view.done` check at readTenc.ts:40, so a protected box of 32 bytes still reads with no throw.

**Prior decision.** PR 658 (commit 60ae65d0f, fixes issue 648) chose the current state on purpose, for compatibility in a minor version. Its description says: "The writer writes the constant IV for any protection state and any `defaultIvSize`", "The writer does not write `defaultIsProtected`", and "A box that code builds today still compiles and writes the same bytes". Issue 648 left the 24-bit `defaultIsEncrypted` as it was because a change of its value "changes behavior". No RFC covers `tenc`. The decision does not bind a major version, but the maintainer must confirm that 2.0.0 replaces the rules of PR 658.

## F276: CONTAINERS omits container boxes of ISO/IEC 14496-12 while the guides say that the constant lists all known container types.

Severity medium. Category spec-compliance. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A box of an added type gains a `boxes` field in the parsed result, and each new type needs a box type, a named reader and a named writer.

**Files.** `libs/iso-bmff/src/utils/CONTAINERS.ts:7`, `libs/iso-bmff/docs/reading-boxes.md:11`, `libs/iso-bmff/docs/writing-boxes.md:16`

**Evidence.** CONTAINERS.ts:7-25 lists dinf, edts, grpl, mdia, meco, mfra, minf, moof, moov, mvex, schi, sinf, stbl, strk, traf, trak, tref, udta, vttc. The 2015 text defines more boxes that hold only boxes: `class SubTrackDefinition extends Box('strd') { }` (spec text line 6245, the child of `strk`, which is in the list), `class RestrictedSchemeInfoBox(fmt) extends Box('rinf')` with the same three children as `sinf` (line 6358), `class TrackGroupBox('trgr') { }` (line 2111), `class LoudnessBox extends Box('ludt')` (line 9922). docs/reading-boxes.md:11: "The `CONTAINERS` constant lists all known container types." The spec text for `grpl` and `vttc` was not available in the 2015 edition, so I did not check those two.

**Proposal of the finder.** Add `strd`, `rinf`, `trgr` and `ludt` to the list with box types and named readers and writers, as the container RFC requires for each container type. If the list stays as it is, change the guide sentence to "lists the container types that the package handles automatically".

**Proposal after verification.** Split the finding into two parts.

1. Guide sentence (not breaking, do anytime): in docs/reading-boxes.md:11 and docs/writing-boxes.md:16 replace "lists all known container types" with "lists the container box types that the function handles automatically". The sentence stays wrong after any additions, because the 2015 text also has `paen`, `cinf`, `hnti` and `hinf`.

2. List membership (do in the major): add `rinf`, `strd`, `trgr` and `ludt`, each with a box type, a child type, a named reader and a named writer, and an `IsoBoxMap` entry: `RestrictedSchemeInformationBox` with `readRinf`/`writeRinf`, `SubTrackDefinitionBox` with `readStrd`/`writeStrd`, `TrackGroupBox` with `readTrgr`/`writeTrgr`, `LoudnessBox` with `readLudt`/`writeLudt`. `rinf` and `trgr` have the clearest use (restricted sample entries, track groups). `strd` completes `strk`, which is already listed. Do not add `paen`, `cinf`, `hnti` and `hinf`: file delivery and hint tracks have no use case in a web player, and AGENTS.md asks for no public export without a clear use case. State that criterion in the TSDoc of `CONTAINERS`. Do the additions in 2.0, because under the cursor RFC a later addition changes a parsed box from `{ type, bytes }` to `{ type, boxes }`.

**Prior decision.** rfc/iso-bmff-container-readers-writers.md:17 and :151 fix the list at 19 types and state "`CONTAINERS` and `isContainer` do not change". That RFC records the size of the list. It does not state that the omission of strd, rinf, trgr or ludt is intentional, and no changelog entry or RFC text names those four types.

## F9: The package cannot express `AudioSampleEntryV1`: `entry_version` is hidden in the high half of `reserved2[0]`, there is no `srat` box, and a sample rate above 65535 writes a wrong value without an error.

Severity medium. Category spec-compliance. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A new `entryVersion` field replaces part of `reserved2` in the parsed result and in the type. A range rule for `samplerate` changes the written bytes or throws.

**Files.** `libs/iso-bmff/src/readers/readAudioSampleEntryBox.ts:27`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:19`, `libs/iso-bmff/src/writers/writeAudioSampleEntryBox.ts:58`, `libs/iso-bmff/src/IsoBoxWriteView.ts:310`

**Evidence.** readAudioSampleEntryBox.ts:27 `reserved2: readArray(UINT, 4, 2)`. Spec 12.2.3.2: `class AudioSampleEntryV1 ... { unsigned int(16) entry_version; // must be 1 ... const unsigned int(16)[3] reserved = 0; ... template unsigned int(32) samplerate = 1<<16; // optional boxes follow SamplingRateBox();`. So an adopter finds the entry version only with `reserved2[0] >>> 16`. `grep -i srat src` returns nothing. writeAudioSampleEntryBox.ts:58 `writer.writeTemplate(box.samplerate, 4)` and IsoBoxWriteView.ts:312 `Math.round(value * Math.pow(2, shift))` then `writeUint`. Probe with node: `samplerate: 96000` writes `77000000`, which reads back as 30464. The spec route for such a rate is `AudioSampleEntryV1` with a `srat` box.

**Proposal of the finder.** Add `entryVersion: number` (0 for `AudioSampleEntry`, 1 for `AudioSampleEntryV1`) when the reserved fields leave the type. Without that field, a read and a write of a V1 entry loses the version. Add a reader and a writer for `srat` (`SamplingRateBox`, one `unsigned int(32) sampling_rate`). Decide one rule for a fixed-point value that does not fit: saturate, as `writeUint` does for 64 bits, or document the wrap.

**Proposal after verification.** Split the finding into three items with different worth.

1. `entryVersion` (breaking, do-in-major, only together with the removal of the reserved fields). If `reserved1`, `reserved2`, and `reserved3` leave `AudioSampleEntryBox`, add `entryVersion: number` in the same change. The reader reads `unsigned int(16) entry_version` and skips 6 bytes. The writer writes `box.entryVersion ?? 0` and 6 zero bytes. Without the field, that removal silently changes a V1 entry to a V0 entry on a write, and `stsd` keeps version 1. If the reserved fields stay, the current state loses nothing, and the field is only a discoverability gain (optional).

2. `srat` reader and writer (not breaking, do-anytime, low priority). Add `readSrat`, `writeSrat`, and `SamplingRateBox` with `version`, `flags`, and `samplingRate`, per the syntax at 12.2.3.2. The change is additive. Today the `srat` child of a V1 entry is a raw box with `view` bytes, so an adopter cannot get the actual rate without a custom reader. Note for the cursor RFC: once `view` leaves parsed boxes, a V1 entry needs this writer (or the RFC rule for unknown boxes) to keep the `srat` child on a write.

3. Range rule (do not add one). Drop the "saturate or document the wrap" choice. The rule is already documented: a writer does not check the range of a `number`. Do not clamp in `writeTemplate`. Instead add one TSDoc sentence on `AudioSampleEntryBox.samplerate`: the field holds a 16.16 value, so the largest rate is 65535, and a higher rate needs `entryVersion` 1 with a `srat` box (12.2.3.1). That documentation change does not break adopters and can ship at any time.

**Prior decision.** Part 3 only: docs/writing-boxes.md:173 "A writer does not check the range of a `number`", added by PR 669 (issue 653, commit 67bd8d7af). The maintainer chose the 64-bit saturation as a special case and kept the `number` path without a range check. No prior decision found for `entry_version` or `srat`.

## G473: The `kid` field of the pssh box is one flat `number[]` with 16 numbers for each key ID, and the specification defines a list of 16-byte key IDs.

Severity medium. Category spec-compliance. Breaking: yes. Fact check: partly. Value check: partly. Merged duplicates: G514, G523.

**Why it breaks.** The proposal renames a public field and changes its type and the type of two other fields.

**Files.** `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:15`, `libs/iso-bmff/src/readers/readPssh.ts:29`, `libs/iso-bmff/src/writers/writePssh.ts:37`, `libs/drm/src/cenc/getPsshData.ts:20`

**Evidence.** The type: "The bytes of the key IDs, one after the other. Each key ID has 16 bytes, so the list has `kidCount * 16` numbers." and `kid: number[]` (ProtectionSystemSpecificHeaderBox.ts:15-16). The reader: `kid = readArray(UINT, 1, kidCount * 16)` (readPssh.ts:29). The writer: `writer.writeArray(box.kid, UINT, 1, kidSize)` (writePssh.ts:37). ISO/IEC 23001-7:2016 clause 8.1.1 (spec text lines 676-694): `unsigned int(32) KID_count; { unsigned int(8)[16] KID; } [KID_count];`. An adopter who wants the second key ID must slice numbers 16 to 31. The field name is singular for a list. drm does not use the reader. It skips the list by hand: `dataOffset += 4 + 16 * kidCount` (getPsshData.ts:20-21), and it returns buffers that EME accepts, which `number[]` is not.

**Proposal of the finder.** 2.0 shape: `systemId: Uint8Array` (16 bytes), `kids: Uint8Array[]` (one 16-byte view for each key ID, empty for version 0), `data: Uint8Array`. Remove `kidCount` and `dataSize`, in line with the known finding on count fields. `getPsshData` in drm can then return `readPssh(...).data`.

**Proposal after verification.** Change the opaque byte fields of both Common Encryption boxes in 2.0, as one rule: a field that the spec defines as `unsigned int(8)[n]` opaque bytes is a `Uint8Array` view over the source.

- `ProtectionSystemSpecificHeaderBox`: `systemId: Uint8Array` (16 bytes), `kids: Uint8Array[]` (one 16-byte view for each key ID, `[]` for a version 0 box and for `KID_count` 0), `data: Uint8Array`.
- `TrackEncryptionBox`: `defaultKid: Uint8Array` and `defaultConstantIv?: Uint8Array`, in the same change.
- `writePssh` writes the key ID list only when `version > 0` (unchanged rule) and takes the sizes from `kids.length` and `data.byteLength`. Remove `kidCount` and `dataSize` only as part of the package-wide rule of issue 625. Do not decide the count rule for pssh alone.
- Decide the plural name (`kids` or `kid`) with the package-wide naming rule for lists. Most lists use the singular spec name today (`chunkOffset`, `entrySize`, `offset`).
- drm: `ensureEncryptedInit` has the public option `defaultKid: number[]`. Either convert it inside drm with `Uint8Array.from`, or widen the option to accept a `Uint8Array`. State the choice in the drm changelog.
- Do not rewrite `getPsshData` on top of `readPssh`. It takes a complete box as `ArrayBufferLike`, returns a copy as `ArrayBufferLike`, and has no import. The rewrite changes a public return type of drm and adds reader code to its bundle.
- Record the migration in the changelog: `Array.from(box.data)` gives the old value, and `new Uint8Array(numbers)` converts an old input for the writer.

**Prior decision.** PR 657 (fix for issue 649, merged 2026-11-13, commit 83716b139) kept `kid` as one flat `number[]` on purpose: "The type `ProtectionSystemSpecificHeaderBox` does not change, so the change does not break the public API." CHANGELOG.md:89 documents that layout. The reason was to avoid a break in a minor version, so the decision does not bind a major version. The same PR left `kidCount` as the source of the count and referred the question to issue 625, which is open with no rule chosen.

## F120: `location` is a required string in `DataEntryUrlBox` and `DataEntryUrnBox`, and the spec forbids it in one case and makes it optional in the other.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The field type changes from `string` to `string | undefined`, the readers omit the field when the box has no string, and `writeUrn` writes one byte less for a box with no `location`.

**Files.** `libs/iso-bmff/src/boxes/DataEntryUrlBox.ts:10`, `libs/iso-bmff/src/boxes/DataEntryUrnBox.ts:11`, `libs/iso-bmff/src/readers/readUrl.ts:18`, `libs/iso-bmff/src/writers/writeUrn.ts:18`, `libs/iso-bmff/src/writers/writeUrn.ts:31`, `libs/iso-bmff/test/writers/writeUrl.test.ts:21`

**Evidence.** Spec 8.7.2.1: `If the flag is set indicating that the data is in the same file as this box, then no string (not even an empty one) shall be supplied`. Spec 8.7.2.3: `Location is a URL, and is required in a URL entry and optional in a URN entry`. DataEntryUrlBox.ts:10 `location: string`, so the most common box needs a value that the writer drops: writeUrl.test.ts:21 `writeUrl({ type: 'url ', version: 0, flags: 1, location: '' })`. readUrl.ts:18 returns `''` for the absent string, so a caller cannot tell an absent string from an empty string. writeUrn.ts:18 and :31-32 always write `location` and its null byte, so a `urn ` box with a name only grows by one byte after a read and a write.

**Proposal of the finder.** Declare `location?: string` in both types. `readUrl` and `readUrn` omit `location` when no bytes remain. `writeUrl` keeps the flag rule and writes no string for an undefined `location`. `writeUrn` writes `location` only when it is defined.

**Proposal after verification.** Declare `location?: string` in `DataEntryUrlBox` and `DataEntryUrnBox`. Keep `name: string` required.

`url ` follows the flag, as `schm` does:
- `readUrl`: `location: flags & 0x000001 ? undefined : view.readUtf8(-1)`. Do not use the remaining-bytes rule here.
- `writeUrl`: keep the flag rule of PR 626. With the flag not set, write `encodeText(box.location ?? '')` and the null byte. Do not write a box with no string in that case, because clause 8.7.2.3 requires location in a URL entry. `writeSchm` already uses this rule for `schemeUri`.

`urn ` has no flag for `location`, so presence follows the bytes:
- `readUrn`: return `location: undefined` when no bytes remain after `name`.
- `writeUrn`: write `location` and its null byte only when `location` is defined.

Use one form for an absent optional field across the package. `readSchm` returns the key with the value `undefined`, so either follow that form or change both readers together.

Resolve the flag case of issue 629 in the same change: decide whether `writeUrn` writes no string when flag 0x000001 is set. The settled rule "the flags decide which fields a writer writes" supports that behavior. Update readUrl.test.ts:46-52, the `['', '']` round-trip cases in writeUrn.test.ts, and add a changelog migration note: code that reads `location` must handle `undefined`.

**Prior decision.** No decision makes `location: string` intentional. PR 626 (issue 623, merged 2026-11-11) kept the type only because a minor version allowed no public type change. PR 626 also settled that `writeUrl` omits `location` when flag 0x000001 is set and throws no error, and the proposal keeps that rule. Issue 629 (open) already reports the `writeUrn` half and lists the optional type as an option. The fix should close issue 629.

## F173: Three exported child aliases and five other public positions are `any`, while four containers with the same open content use `IsoBox<V>`.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Code that relies on `any` for a child or an entry needs a type test or a cast.

**Files.** `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:10`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:10`, `libs/iso-bmff/src/boxes/PreselectionGroupBox.ts:10`, `libs/iso-bmff/src/boxes/SampleEntryBox.ts:8`, `libs/iso-bmff/src/boxes/IpmpInfoBox.ts:10`, `libs/iso-bmff/src/boxes/SampleGroupDescriptionBox.ts:13`, `libs/iso-bmff/src/IsoBoxWriterMap.ts:8`

**Evidence.** `export type AudioSampleEntryBoxChild = any`, `export type VisualSampleEntryBoxChild = any`, `export type PreselectionGroupBoxChild = any` with "TODO: Find documentation on what children are allowed", `SampleEntryBox<T, C = any>`, `ipmpDescr: any[]`, `entries: any[]`, `Record<string, IsoBoxWriter<any>>`. `UserDataBoxChild` and three others are `IsoBox<V>`. Open issue 584 tracks the lint rule.

**Proposal of the finder.** Type the children as `IsoBox<V>` plus the raw box, and the undecoded entries as `Uint8Array` or `unknown`. Remove the three aliases with the other `*Child` aliases.

**Proposal after verification.** Do the fix in 2.0.0 together with the cursor RFC, with these changes to the proposal:

1. Children: use one element type for open content, `IsoBox<V> | IsoRawBox` (the same item type that the version 2 `writeIsoBoxes` accepts). Do not use `IsoBox<V>` alone: `avcC`, `hvcC`, `esds`, `btrt`, and `pasp` have no entry in `IsoBoxMap`, so they are raw boxes. Apply the same element type to `udta`, `grpl`, `strk`, and `meco`, so the seven open containers agree.
2. Sample entries: `SampleEntryBox<T extends IsoBoxType = IsoBoxType, V extends IsoInt64 = number> = { type: T; reserved1: number[]; dataReferenceIndex: number; boxes: (IsoBox<V> | IsoRawBox)[] }`. Remove the parameter `C`. `VisualSampleEntryBox<T, V>` and `AudioSampleEntryBox<T, V>` become `SampleEntryBox<T, V> & { ... }` with no second `type` and `boxes`. `PreselectionGroupBox<V>` gets the same `boxes` type, and the TODO comment goes. Pass `V` through `IsoBoxMap<V>` and `SampleDescriptionBox`. Remove the three `as IsoBox[]` casts in the writers.
3. Update the `writeStsd` example (test/writers/writeStsd.test.ts:22-28): the `esds` child becomes a raw box `{ type: 'esds', bytes }`. Add the migration to the changelog: test `child.type` before a field read, and wrap bare bytes in a raw box.
4. `sgpd` and `imif`: use `unknown[]`, not `Uint8Array`. The package has no reader or writer for either box, so no shape exists to name. Removal of the two types is a separate finding.
5. `IsoBoxWriterMap`: `Record<string, IsoBoxWriter<never>>`, with the cast kept inside `writeBox`. `unknown` rejects every typed writer. `isFullBox(box: any)` becomes `isFullBox(box: unknown)`, which accepts the same values and is not a break (the same change as `isIsoBoxType` in the changelog).
6. Leave the removal of the `*Child` aliases to the finding that covers all of them. Then close issue 584 for this package by enabling the lint rule.

**Prior decision.** No decision keeps `any` on purpose. PR 659 (merged as 1337aaed4, fixes issue 646) deferred the three aliases in its section "Not in this PR": their boxes are not in `IsoBoxContainer`, and the documented `writeStsd` example passes raw bytes as a child, which `IsoBox` rejects. That reason was to avoid a compile break in a minor version. Open issue 584 plans the removal of every public `any` and the `typescript/no-explicit-any` rule.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## F193: isContainer returns true for 14 box types that its type predicate excludes, and the package has three different definitions of a container.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The narrowed type of the guard changes, or the guard returns false for boxes that it accepts today.

**Files.** `libs/iso-bmff/src/utils/isContainer.ts:24`, `libs/iso-bmff/src/utils/isContainer.ts:29`, `libs/iso-bmff/src/IsoBoxContainerMap.ts:27`, `libs/iso-bmff/src/utils/CONTAINERS.ts:6`, `libs/iso-bmff/src/utils/writeBox.ts:30`, `libs/iso-bmff/docs/utilities.md:31`, `libs/iso-bmff/docs/writing-boxes.md:18`

**Evidence.** isContainer.ts:29 `return 'boxes' in box || CONTAINERS.includes(box.type)`. The predicate at lines 26-28 narrows to `Extract<T, IsoBoxContainer<IsoInt64>>` (19 types). tsc lists the IsoBoxMap types with `boxes` that are not in IsoBoxContainerMap: mp4a, enca, avc1, avc2, avc3, avc4, encv, hev1, hvc1, iinf, ipro, iref, meta, prsl. Checked with node: `isContainer(meta)` is true and `CONTAINERS.includes('meta')` is false. Checked with tsc: after `isContainer(meta)` on a `MetaBox`, the value has the type `never`. On an `IsoBox`, the narrowed union has no 'meta'. The utilities guide uses exactly this case: `const box: IsoBox = { type: "meta", ... }; const container = isContainer(box)`. The writing guide uses the other definition: "The function does not write a box of another type as a container, even if the box has a `boxes` field. Examples are `meta`".

**Proposal of the finder.** Use one definition. Option A: a container is a box whose body is only child boxes (the 19 types). `isContainer` then tests only `CONTAINERS` and returns false for meta. Add a second guard `hasChildBoxes(box): box is T & { boxes: (IsoBox<V> | IsoRawBox)[] }` for traversal. Option B: the predicate becomes `box is Extract<T, { boxes: unknown[] }>` and the documentation calls the 19 types "plain containers". Option A matches the writer.

**Proposal after verification.** Keep one public guard, and give it the meaning that adopters need for traversal: "the box has child boxes". Do not ship a second guard for the 19 types. `CONTAINERS.includes(box.type)` already covers that case, and only the reader and the writer need it.

1. Run time: `'boxes' in box` only. Remove the `CONTAINERS.includes` branch. The predicate then never promises a `boxes` array that does not exist (the `{ type: 'moov' }` case), and `traverseIsoBoxes` no longer imports the 19-string list.
2. Type: `box is Extract<T, { boxes: unknown[] }>` with the current fallback. First give the children of the sample entries and of `prsl` a box type (`IsoBox<V>` plus the raw box of the cursor RFC). Without that step, `box.boxes[n]` becomes `any` again and reverses PR 659 (measured with tsc).
3. Name: do not keep the name `isContainer` with a changed run-time result. Either keep the name with the current run-time result and state the rule in the TSDoc, or rename the guard to a name that states the test (for example `hasChildBoxes`) and remove `isContainer`. A rename gives adopters a compile error with a migration note. A changed result under the old name gives them a silent traversal change.
4. Documentation: use "container box type" only for the 19 types in `CONTAINERS` (clause 3.1.3 of ISO/IEC 14496-12). Change the example in docs/utilities.md:31 if the guard keeps the 19-type predicate until the major version. This documentation fix does not break adopters and can ship at any time.
5. Cursor RFC: rfc/iso-bmff-cursor-api.md:200-201 says a container is "written through its `boxes` field" and that the writer throws for a box with "no writer, no `boxes` field, and no `bytes` field". State there that the automatic form applies only to a type in `CONTAINERS`. Otherwise a `meta` box or a sample entry that code builds may lose its fields again (issue 651).

**Prior decision.** PR 673 (d395df3ce, fixes issue 651): "isContainer does not change. traverseIsoBoxes needs its boxes branch to reach the children of meta and of the sample entries." The run-time `'boxes' in box` rule is intentional. PR 659 (1337aaed4, fixes issue 646) chose the `Extract<T, IsoBoxContainer<IsoInt64>>` predicate on purpose to remove `any` children. The mismatch between the two is not a decision. rfc/iso-bmff-container-readers-writers.md:151 states only that `CONTAINERS` and `isContainer` do not change in that RFC.

## F194: The default `never` of `Box<T>` makes an unknown box impossible to write as a value and makes a test for an unknown type a compile error.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** `Box` with no argument changes from `{ type: never }` to a type with a string `type`. Narrowing by `box.type` then needs the raw box rule of the proposal.

**Files.** `libs/iso-bmff/src/boxes/Box.ts:8`, `libs/iso-bmff/src/ParsedIsoBox.ts:11`, `libs/iso-bmff/src/ParsedBox.ts:11`, `libs/iso-bmff/src/utils/isContainer.ts:24`

**Evidence.** Box.ts:8 `export type Box<T extends IsoBoxType = never> = { type: T }`. No box type in src/boxes uses `Box<...>` as its base (grep finds zero uses). Its only use is the member for unknown boxes in `ParsedBox<IsoBox<V> | Box, V>`. Checked with tsc: `const b: Box = { type: 'abcd' }` fails with "Type 'string' is not assignable to type 'never'". On a result of readIsoBoxes, `if (box.type === 'uuid')` and `if (box.type === 'avcC')` fail with TS2367 ("have no overlap"), although both boxes occur in files. `writeIsoBox({ type: 'cust', foo: 1 }, { writers: { cust: writeCust } })` fails with "Type '"cust"' is not assignable to type '"udta"'". The doc comment calls the type "Base Box Type", but the specification base class has a real type (`class Box (unsigned int(32) boxtype, ...)`).

**Proposal of the finder.** Change the default to `IsoBoxType`: `Box<T extends IsoBoxType = IsoBoxType>`. Represent an unknown box with the RFC type `IsoRawBox`, which has the field `bytes`. Document the narrowing rule for the result union: test `'bytes' in box` first, or use `isIsoBoxType`. If narrowing by `box.type` alone must keep working, give `IsoRawBox` a `type` of `Exclude<IsoBoxType, keyof IsoBoxMap>` in the result type only when the map has the reader for that type.

**Proposal after verification.** Do not change the default to `IsoBoxType`, and do not put a member with a `string` type in the result union without a rule. Split the fix in two parts.

Part 1, in any version, not breaking: add a third signature to `isIsoBoxType`: `isIsoBoxType<T extends string>(type: T, box: unknown): box is Box<T>`. `isIsoBoxType('uuid', box)` then compiles and the closed union keeps its narrowing. The cost: a wrong literal such as 'tfdd' no longer fails at compile time in the guard. Add one sentence to docs/reading-boxes.md that a type outside `IsoBoxMap` needs the guard.

Part 2, in version 2.0.0, breaking: add the result type of `readIsoBoxes` to rfc/iso-bmff-cursor-api.md as an unresolved question, because `IsoRawBox` at line 159 has a `string` type. The two options are: (a) keep the closed union of literal types and type the raw box per known key, with the guard of part 1 for other types, or (b) return `IsoBox<V> | IsoRawBox` and document `'bytes' in box` as the first test, which costs every existing `box.type === 'tfdt'` narrowing. Option (a) keeps the documented narrowing. In both options remove the public name `Box`, or remove its default so that `Box` without an argument does not compile, and correct the "Base Box Type" comment. The fallback `Exclude<IsoBoxType, keyof IsoBoxMap>` is not an option, because the result is `string`.

**Prior decision.** PR 289 (commit 3102f626e, "feat: improved type inference for reader return types") introduced `Box<T extends IsoBoxType = never>` to replace `type: ''` and the comment "TODO: This is a hack to get type discrimination to work". PR 614 (commit 8d0b4b393, issue 611, CHANGELOG.md line 64) and rfc/iso-bmff-container-readers-writers.md:150 confirm that the result of `readIsoBoxes` narrows by `box.type`. PR 659 (commit 1337aaed4) uses `Box<IsoBox['type']>` in libs/iso-bmff/src/utils/isContainer.ts:24. No decision says that a comparison with an unknown type must be a compile error.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## F197: IsoBoxWriterMap is `Record<string, IsoBoxWriter<any>>`, so a writer under the wrong key compiles and writeBox needs an `any` cast.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: confirmed.

**Why it breaks.** A map that pairs a built-in box type with a writer for another box becomes a compile error.

**Files.** `libs/iso-bmff/src/IsoBoxWriterMap.ts:8`, `libs/iso-bmff/src/utils/writeBox.ts:28`, `libs/iso-bmff/src/IsoBoxReaderMap.ts:10`

**Evidence.** IsoBoxWriterMap.ts:8 `export type IsoBoxWriterMap = Record<string, IsoBoxWriter<any>>`. writeBox.ts:28-29 `// TODO: Find a better way to do this without casting to any` and `view = writer(box as any, config)`. Checked with tsc: `const w: IsoBoxWriterMap = { tfdt: writeTrun, trun: writeTfdt }` compiles. The readers map avoids `any` with `IsoBoxReader<unknown, ...>` (IsoBoxReaderMap.ts:12), and readIsoBoxes has a typed overload for it. The writers side has neither.

**Proposal of the finder.** `export type IsoBoxWriterMap = { [K in keyof IsoBoxMap]?: IsoBoxWriter<IsoBoxMap<IsoInt64>[K]> } & { [type: string]: IsoBoxWriter<never> | undefined }`. A writer parameter is contravariant, so `IsoBoxWriter<never>` accepts every custom writer with no `any`. Checked with tsc: `{ tfdt: writeTfdt, trun: writeTrun, cust: writeCust }` compiles and `{ tfdt: writeTrun }` fails with a clear message. The call in writeBox becomes `writer(box as never, config)`.

**Proposal after verification.** The break is at compile time only. No written bytes and no thrown errors change. The fix breaks four adopter patterns, not one. I checked each with tsc 6.0.3:
1. A writer for another box under a built-in key, as the finding states.
2. An adopter writer under a built-in key that takes a stricter box type, for example `{ mdat: (box: MediaDataBox & { extra: number }) => ... }`. TS2322.
3. An adopter writer for a box with 64-bit fields that takes the default `number` instantiation, for example `{ tfdt: (box: TrackFragmentBaseMediaDecodeTimeBox) => ... }`. TS2322, because the proposal uses `IsoBoxMap<IsoInt64>[K]` and `bigint` is not assignable to `number`. This case affects every box of IsoBoxMap that takes `V`.
4. A call of a writer that the adopter reads from the map by an unknown key, for example `map['cust'](box, config)`. The value is now `IsoBoxWriter<never> | undefined`, so the call fails with TS2722 and TS2345.
A variable typed with the old `Record<string, IsoBoxWriter<any>>` stays assignable to the new type. The changelog needs migration text for cases 2 to 4. The proposal must also follow the writer signature of the cursor RFC: `writer(cursor, box as never)`.

**Prior decision.** Commit ca7cfb42b "fix: loosen box writer map types" (2026-01-11, direct to main, no PR, no changelog entry) chose `Record<string, IsoBoxWriter<any>>` on purpose so that custom box types (`dvh1`, `test` in test/api.test.ts) are accepted. It shows that open custom keys are intentional. It does not show a decision against typed known keys, and the proposal keeps custom keys open.

## F200: Ten box types have required reserved and pre_defined fields, and the writers write whatever value the box has.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** 21 fields leave the public types and the reader results. A box with a non-zero reserved value writes zeros.

**Files.** `libs/iso-bmff/src/boxes/MovieHeaderBox.ts:17`, `libs/iso-bmff/src/boxes/MovieHeaderBox.ts:25`, `libs/iso-bmff/src/boxes/TrackHeaderBox.ts:14`, `libs/iso-bmff/src/boxes/HandlerReferenceBox.ts:10`, `libs/iso-bmff/src/boxes/HandlerReferenceBox.ts:12`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:28`, `libs/iso-bmff/src/boxes/SoundMediaHeaderBox.ts:15`, `libs/iso-bmff/src/boxes/SegmentIndexBox.ts:16`, `libs/iso-bmff/src/boxes/SampleEntryBox.ts:10`, `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:19`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:19`, `libs/iso-bmff/src/writers/writeMvhd.ts:56`, `libs/iso-bmff/src/writers/writeHdlr.ts:32`, `libs/iso-bmff/src/writers/writeSidx.ts:48`

**Evidence.** 21 fields in 10 types: mvhd `reserved1`, `reserved2`, `preDefined`. tkhd `reserved1`, `reserved2`, `reserved3`. hdlr `preDefined`, `reserved`. mdhd `preDefined`. smhd `reserved`. sidx `reserved`. tfra `reserved`. SampleEntryBox `reserved1`. VisualSampleEntryBox `preDefined1`, `reserved2`, `preDefined2`, `reserved3`, `preDefined3`. AudioSampleEntryBox `reserved2`, `preDefined`, `reserved3`. All are required, so code that builds an mvhd box must write `reserved1: 0, reserved2: [0, 0], preDefined: [0, 0, 0, 0, 0, 0]`. The specification fixes the values, for example 8.4.3.2 `unsigned int(32) pre_defined = 0;` and `const unsigned int(32)[3] reserved = 0;`. writeMvhd.ts:56 `writer.writeUint(box.reserved1, 2)` and writeHdlr.ts:32 `writer.writeUint(box.preDefined, 4)` write the caller value. writeSidx.ts:48 `box.reserved ?? 0` treats a required field as optional. The only use of these fields is to keep bytes that differ from the specification, which the settled rule on such fields excludes.

**Proposal of the finder.** Remove the 21 fields from the types and from the reader results. Each writer writes the value that the specification fixes (0, or -1 for the last pre_defined of a visual sample entry). State the consequence in the changelog: a QuickTime hdlr box with a component type in `pre_defined` writes 0 there. If Casey wants those bytes, the raw box path of the RFC keeps them (omit the reader).

**Proposal after verification.** Apply one rule in 2.0.0, in three parts.

1. Remove the 14 `reserved*` fields: mvhd `reserved1`, `reserved2`. tkhd `reserved1`, `reserved2`, `reserved3`. hdlr `reserved`. smhd `reserved`. sidx `reserved`. tfra `reserved`. SampleEntryBox `reserved1`. VisualSampleEntryBox `reserved2`, `reserved3`. AudioSampleEntryBox `reserved2`, `reserved3`. The reader skips the bytes with no allocation. The writer writes 0.

2. Before the removal of `AudioSampleEntryBox.reserved2`, add `entryVersion?: number` (default 0). The reader reads the first 16 bits of that area as `entryVersion` and skips the other 48 bits. The writer writes `box.entryVersion ?? 0`. This keeps AudioSampleEntryV1 of clause 12.2.3.2 correct.

3. Keep the 7 `preDefined*` fields and make them optional: mvhd `preDefined`, hdlr `preDefined`, mdhd `preDefined`, VisualSampleEntryBox `preDefined1`, `preDefined2`, `preDefined3`, AudioSampleEntryBox `preDefined`. The reader still returns them. The writer uses the default of the spec for an absent field: 0, and -1 for `preDefined3` (`box.preDefined3 ?? -1`, which also fixes the wrong 0 at writeVisualSampleEntryBox.ts:74). Add one TSDoc line that cites clause 6.2.2.

Changelog and test: state that a box with a non-zero reserved value writes zeros. Add one EXCEPTIONS line to test/fixtureRoundTrip.test.ts for the hdlr box of `time_to_sample.mp4` (`appl` in the first reserved word). The GoPro hdlr and mp4a boxes keep their bytes because `preDefined` stays.

If Casey prefers the full removal of all 21 fields, the cost is a deviation from the copy rule of clause 6.2.2 and four more changed boxes in the GoPro fixture. Part 2 is required in both cases.

**Prior decision.** None shows that the current state is intentional. Issue 647 (closed as not planned, 2026-11-13) supports the removal of the `reserved*` fields: a writer that follows the spec has no defect, and the package adds no field that only keeps the bytes of a box that breaks the spec. That rule does not cover the `pre_defined` fields, because clause 6.2.2 of ISO/IEC 14496-12:2015 permits a non-default value and requires a copy.

## F253: A container cannot hold a child given as bytes without a cast, although the writer accepts such a child.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The child type of each container gains the raw box type, so code that reads `boxes` must narrow a child before it reads a field.

**Files.** `libs/iso-bmff/test/writeIsoBoxes.test.ts:283`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:291`, `libs/iso-bmff/src/utils/writeContainerBox.ts:26`, `libs/iso-bmff/src/utils/writeBox.ts:41`

**Evidence.** The tests need casts: `traf.boxes.push(new Uint8Array(FREE) as never)` and `const box = { type: 'udta', boxes: [new Uint8Array(FREE)] } as IsoBoxStreamable`. The writer supports the case: `writeChildBoxes(box.boxes as IsoBox<IsoInt64>[], config)` calls `writeBox` for each child, and `writeBox` has `if ('buffer' in box) { view = box }`. A reader also returns a child with no reader as a box with only `type` and source bytes, which the typed child unions do not describe. A common task is the insertion of an encoded `pssh` or `emsg` box into a parsed `moov` or `moof` box.

**Proposal of the finder.** In 2.0.0 the child type of every container and of `meta`, `stsd`, `dref`, `prsl`, and the sample entries includes `IsoRawBox` (`{ type, bytes }`). `readIsoBoxes` returns that type for a child with no reader, and `writeIsoBoxes` copies it. A bare `ArrayBufferView` is not a valid child or top-level item. A caller wraps bytes as `{ type, bytes }`.

**Proposal after verification.** Do not file this as a separate change. Add one type rule to rfc/iso-bmff-cursor-api.md, because the RFC already has `IsoRawBox`, the read rule, the write rule, and the throw rule.

The rule: the element type of `boxes` (and of `entries` for `stsd` and `dref`) is the parsed child union plus `IsoRawBox`. The same rule replaces the three `any` child types that PR 659 left: `AudioSampleEntryBoxChild`, `VisualSampleEntryBoxChild`, and `PreselectionGroupBoxChild`.

The RFC must also state the cost and the answer to it. A test of `child.type` alone no longer narrows to the parsed box, because `IsoRawBox.type` is the wide `IsoBoxType`. Every field read on a child then needs a second test. Two changes keep that cost low:
1. `isIsoBoxType(type, box)` also returns false for a box with a `bytes` field, so one call narrows to the parsed type. Today the guard tests only `box.type === type` (libs/iso-bmff/src/isIsoBoxType.ts), which would be wrong for a raw box of the same type.
2. The reading guide shows the two forms: `isIsoBoxType('tfdt', child)` and `child.type === 'tfdt' && !('bytes' in child)`.

The return type of `readIsoBoxes` needs the same decision at the top level. The RFC keeps the signature, and version 1 uses `Box<never>` for the box with no reader. A raw box type with `type: never` cannot be built by a caller, so that method does not serve the write case.

The breaking reason of the finding is too weak. The real break is: a test of `type` no longer narrows a child, and a bare `ArrayBufferView` is rejected as a child and as a top-level item.

**Prior decision.** No decision rejects the proposal. PR 659 (commit 1337aaed4, issue 646) knew the cast and documented it in libs/iso-bmff/CHANGELOG.md:48 as the migration for a `Uint8Array` child of `udta`, `grpl`, `strk`, or `meco`. That PR was a type fix inside version 1. Its description leaves `AudioSampleEntryBoxChild`, `VisualSampleEntryBoxChild`, and `PreselectionGroupBoxChild` as `any` because raw bytes children exist. The current state is known and documented, but the maintainers did not choose it as a design goal. The draft RFC rfc/iso-bmff-cursor-api.md (lines 87, 159, 201) already defines `IsoRawBox`, the read rule, and the write rule.

## F26: Boxes that share one shape use three different type patterns, and TypeBox is an unconstrained generic with a vague name

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Renames or constrains the public type `TypeBox` and changes the default of `FreeSpaceBox`.

**Files.** `libs/iso-bmff/src/boxes/TypeBox.ts:2`, `libs/iso-bmff/src/boxes/TypeBox.ts:6`, `libs/iso-bmff/src/boxes/FileTypeBox.ts:8`, `libs/iso-bmff/src/boxes/SegmentTypeBox.ts:8`, `libs/iso-bmff/src/boxes/FreeSpaceBox.ts:6`, `libs/iso-bmff/src/readers/readFree.ts:14`, `libs/iso-bmff/src/IsoBoxMap.ts:115`

**Evidence.** ftyp and styp: `export type TypeBox<T> = {` with the doc `Utility TypeBox`, plus the aliases `FileTypeBox = TypeBox<'ftyp'>` and `SegmentTypeBox = TypeBox<'styp'>`. `T` has no constraint, so `TypeBox<number>` compiles. free and skip: one generic with a default, `FreeSpaceBox<T extends 'free' | 'skip' = 'free'>`, so the bare name `FreeSpaceBox` means only `free` (`readFree(...): FreeSpaceBox`). encv: `VisualSampleEntryBox<'encv'>` with no alias. An adopter cannot predict the type name of a box from the name of its sibling.

**Proposal of the finder.** Use one pattern: a constrained generic with no default, and the map entry as the way to name one variant. Constrain `TypeBox<T extends 'ftyp' | 'styp'>` and give it a spec name. Later editions of 14496-12 reportedly name this class `GeneralTypeBox`. The 2015 text does not contain that name, so confirm it before the rename. Remove the `= 'free'` default from FreeSpaceBox, or add the aliases for both variants.

**Proposal after verification.** Use the pattern the package already has in VisualSampleEntryBox and AudioSampleEntryBox: a constrained generic whose default is the union of all variants, with IsoBoxMap naming one variant.

1. `FreeSpaceBox<T extends 'free' | 'skip' = 'free' | 'skip'>`. Change `readFree` to return `FreeSpaceBox<'free'>`. The bare name then matches the spec class, which covers both types. Do not remove the default.
2. `TypeBox<T extends 'ftyp' | 'styp' = 'ftyp' | 'styp'>`. Keep the aliases `FileTypeBox` and `SegmentTypeBox`, because they are the spec names. Replace the TSDoc `Utility TypeBox` with one sentence that says the type is the shared shape of ftyp (4.3) and styp (8.16.2).
3. Rename to `GeneralTypeBox` only if a later edition of 14496-12 is read and shows that class name. The 2015 text does not contain it. Without that confirmation, keep `TypeBox`.
4. Drop the encv part of the finding. encv already follows the target pattern.

Severity is low, not medium: no adopter-facing doc or example uses `TypeBox`, and the FreeSpaceBox default only affects code that passes a bare `FreeSpaceBox` value to `writeFree`.


## F282: The generic `T` of traverseIsoBoxes, findIsoBox and filterIsoBoxes has no constraint, and the yielded type is wrong when `T` is narrower than the tree.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Calls with an iterable of values that are not boxes stop compiling. The yielded type may widen.

**Files.** `libs/iso-bmff/src/traverseIsoBoxes.ts:18`, `libs/iso-bmff/src/traverseIsoBoxes.ts:45`, `libs/iso-bmff/src/findIsoBox.ts:21`, `libs/iso-bmff/src/filterIsoBoxes.ts:22`

**Evidence.** traverseIsoBoxes.ts:18-21 `export function* traverseIsoBoxes<T>(boxes: Iterable<T>, ...): Generator<T>`. Lines 45-47 cast instead of typing: `const box = child as Box` and `const next = box.boxes as T[]`. Result 1: `traverseIsoBoxes(new Uint8Array(segment))` compiles, because a `Uint8Array` is an `Iterable<number>`. At run time `'boxes' in 1` throws `TypeError: Cannot use 'in' operator to search for 'boxes' in 1` (checked with node). An adopter who passes the segment bytes in place of the parsed boxes gets this error. Result 2: `traverseIsoBoxes(moovBoxes as MovieBox[])` has the type `Generator<MovieBox>` and yields `trak`, `mvhd` and every descendant.

**Proposal of the finder.** Constrain the three functions: `T extends { type: string }` (or `Box<IsoBoxType>`), so byte arrays and strings do not compile. Type the yield as the box union of the tree: `Generator<T | IsoBoxDescendant<T>>`, or document in TSDoc that `T` must be the union of all box types in the tree and add a type test for the `MovieBox[]` case.

**Proposal after verification.** Keep `Generator<T>` and the two overloads. Do not add a descendant type, and do not adopt the fixed `IsoBox<V> | IsoRawBox` signature of F206.

1. Constrain the three functions with `T extends object`, not `{ type: string }`. A byte array or a string then fails at compile time. Every `readIsoBoxes` result still compiles, including a custom reader with no `type` field. The change costs no run time and no bundle bytes.
2. State the contract in the TSDoc of the three functions and in docs/utilities.md: `T` is the type of every box in the tree, so pass the list from `readIsoBoxes`. For the child list of a typed container, pass the type argument: `findIsoBox<IsoBox>(moov.boxes, ...)`.
3. Add type tests for `moov.boxes`: the boolean callback case, the `isIsoBoxType` case that has the type `null` today, and the explicit `<IsoBox>` case. Run these tests again after the cursor RFC changes the box types, because `ParsedBox` goes away.
4. Correct docs/utilities.md:10. The function takes one config object with `depthFirst` and `maxDepth`. This item is documentation only and can ship at any time.
5. Add one line to rfc/iso-bmff-cursor-api.md:191 for the new constraint, because that line states that the functions do not change.

**Prior decision.** Commit 5c32a7cf9 (1.0.0-alpha.5, "fix: broken type inference in iso-bmff utilities functions", CHANGELOG.md:241) removed `T extends ParsedIsoBox` and the casts, so the union from the readers map reaches the callback. PR 290 (d429da2d2, CHANGELOG.md:211) added the type guard overloads on top of that. rfc/iso-bmff-cursor-api.md:191 states that `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` do not change. rfc/uint64-reader-config.md:240 depends on the narrowing of the `findIsoBox` result. No decision covers a looser constraint or the typed child lists.

## F4: `compressorName` is a `number[]` of 32 raw bytes, but the spec defines a counted string.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The type of a public field changes from `number[]` to `string`, and the parsed value changes.

**Files.** `libs/iso-bmff/src/boxes/VisualSampleEntryBox.ts:28`, `libs/iso-bmff/src/readers/readVisualSampleEntryBox.ts:39`, `libs/iso-bmff/src/writers/writeVisualSampleEntryBox.ts:72`, `libs/iso-bmff/test/readers/readAvc1.test.ts:36`

**Evidence.** VisualSampleEntryBox.ts:28 `compressorName: number[]`. readVisualSampleEntryBox.ts:39 `compressorName: readArray(UINT, 1, 32)`. The test must compare 32 numbers and explains them in a comment: readAvc1.test.ts:43 `// length + 'GoPro AVC encoder'`. Spec 12.1.3.3: "Compressorname is a name, for informative purposes. It is formatted in a fixed 32-byte field, with the first byte set to the number of bytes to be displayed, followed by that number of bytes of displayable data, and then padding". An adopter who writes a box must build the length byte and the padding by hand.

**Proposal of the finder.** Type the field as `string`. The reader takes the first byte as the length (at most 31), decodes that many bytes, and skips the padding. The writer writes the length byte, at most 31 bytes of the string, and zero padding to 32 bytes. An empty string writes 32 zero bytes, which the spec allows ("The field may be set to 0").

**Proposal after verification.** Type the field as `compressorName: string` on `VisualSampleEntryBox` (all visual sample entry types share the type). State the encoding as UTF-8, the same rule as `hdlr`, `url `, `schm`, and `emsg` (issue 631, PR 643). A name with only ASCII characters reads and writes the same bytes with either encoding.

Reader: read the count byte, limit the count to 31, decode that many bytes, then jump over the rest of the 32 bytes. A count of 0 returns '' with no decoder call.

Writer: encode the string, keep at most 31 bytes, and remove an incomplete multi-byte sequence at the cut. Write the count of the kept bytes, the bytes, and zero padding to 32 bytes. An empty or missing string writes 32 zero bytes, so the writer does not throw for a missing field.

Changelog: state that the reader returns only the displayable name. State that a box with a count above 31, with no count byte, or with padding that is not 0 does not write back the same 32 bytes. Give the migration: replace the array of 32 numbers with the name string.

Separately, at any time: correct the citation in VisualSampleEntryBox.ts:13 to ISO/IEC 14496-12, 12.1.3.

Open question for the maintainer: UTF-8 adds the `TextEncoder` requirement to the visual sample entry writers (the same cost that CHANGELOG.md:121 records for `writeHdlr`). The alternative is one byte for each character with `readString` and `writeString`, which needs no encoder and gives wrong text for a name that is not ASCII. Measure the bundle cost of both before the choice.


## F53: The child types of the container readers claim a fully read box for a child that no reader read.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The element type of `boxes` changes for MovieBox, MovieFragmentBox, MovieExtendsBox, MediaInformationBox, MovieFragmentRandomAccessBox, and MetaBox. Code that reads a child field with no check needs a check.

**Files.** `libs/iso-bmff/src/readers/readMoov.ts:23`, `libs/iso-bmff/src/readers/readMoof.ts:23`, `libs/iso-bmff/src/readers/readMvex.ts:23`, `libs/iso-bmff/src/readers/readMinf.ts:20`, `libs/iso-bmff/src/readers/readMfra.ts:28`, `libs/iso-bmff/src/readers/readMeta.ts:18`, `libs/iso-bmff/src/IsoBoxReadView.ts:414`

**Evidence.** readMoov.ts:23 `boxes: view.readBoxes<MovieBoxChild<V>>()`. IsoBoxReadView.ts:414-423 `readBoxes = <T = IsoBox<V>>(...)` with `result.push(box as T)`: the type argument is an unchecked cast. A scratch type check against src compiled this with no error: `readIsoBoxes(data, { readers: { moov: readMoov } })`, then `if (child.type === 'mvhd') { const t: number = child.timescale }`. No mvhd reader is in the map, so `timescale` is `undefined` at run time. The RFC states that a box with no reader becomes a raw box `{ type, bytes }`, but the RFC does not change the child unions, so the same gap stays in version 2. The top-level result of the overload with no readers map has the same property, so this finding is package-wide. I report it once here for the six containers in scope.

**Proposal of the finder.** In version 2, give every container child the element type `<listed child> | IsoRawBox` (the raw box type of the RFC). A check such as `'bytes' in child` then separates a read child from a raw child. A stronger option: derive the child types from the readers map `R`, as `IsoBoxReaderReturn` does for the top level. State the chosen rule in the RFC, because the RFC currently defines the raw box only for the top level.

**Proposal after verification.** Decide the rule once in rfc/iso-bmff-cursor-api.md, for the whole package, not for six containers:

1. Every `boxes` element type and the element type of the `readIsoBoxes` result include `IsoRawBox`. This covers all 19 container types, `meta`, and the top-level result with or without a readers map. No built-in box type has a `bytes` field today, so `'bytes' in box` is a safe test.
2. `isIsoBoxType(type, box)` returns `false` for a raw box (one added `'bytes' in box` test). The function is then the one-call sound guard: `if (isIsoBoxType('mvhd', child)) child.timescale`. Document it as the recommended test. `box.type === 'mvhd' && !('bytes' in box)` is the inline form.
3. Drop the "derive the child types from the readers map R" option. `IsoBoxReaderReturn` does not do that today, also not for the top level. A recursive type over every container with an `R` parameter raises the type-check cost and the length of error messages. The box types are also writer inputs, and a writer input has no `R`.
4. State in the RFC that a writer accepts a raw child in a container, because the same union is the writer input type.

Cost to state in the RFC: code that reads a field after `box.type === 'xxxx'` alone no longer compiles, also when the reader is in the map. The migration is the guard of item 2.

**Prior decision.** No decision covers the unread case. Related context only: the TSDoc of IsoBoxReaderReturn (libs/iso-bmff/src/IsoBoxReaderReturn.ts:7-13) states that the union keeps every built-in box type so that `box.type === 'xxxx'` narrows, and the changelog entry for issue 646 (libs/iso-bmff/CHANGELOG.md:91-92) gave container children a box type with the advice "Test `child.type` before you read a field of a child". Both show that narrowing on `type` to the full box type is the intended convenience. Neither states that the gap for a box with no reader is accepted.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## F72: SampleDependencyTypeBox returns the packed bytes as number[] under a name that is not in the spec, with no documentation of the bits.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The type of the field changes (and its name, if the decoded form is chosen), and the reader returns a different value.

**Files.** `libs/iso-bmff/src/boxes/SampleDependencyTypeBox.ts:10`, `libs/iso-bmff/src/readers/readSdtp.ts:19`, `libs/iso-bmff/src/writers/writeSdtp.ts:24`, `libs/iso-bmff/src/readers/readSidx.ts:38`

**Evidence.** Type: `sampleDependencyTable: number[]`, no TSDoc. Spec 8.6.4.2 has four 2-bit fields for each sample: `is_leading`, `sample_depends_on`, `sample_is_depended_on`, `sample_has_redundancy`. The name `sampleDependencyTable` is not a spec name. readSdtp.ts:19 `view.readArray(UINT, 1, view.bytesRemaining)` reads one byte per call into a number array, and the adopter must know the bit layout to use a value. Other readers decode packed bits into named fields, for example readSidx.ts:38-42 (`referenceType`, `sapType`).

**Proposal of the finder.** Preferred for performance: keep one byte for each sample as a `Uint8Array` view over the input, and document the four bit fields in the TSDoc of the field. Alternative for developer experience: `entries: { isLeading, sampleDependsOn, sampleIsDependedOn, sampleHasRedundancy }[]`, at the cost of one object for each sample. Choose one form and state it in the changelog.

**Proposal after verification.** Choose the `Uint8Array` form and drop the decoded alternative. Keep the name `sampleDependencyTable`, because the spec has no name for the packed byte and calls the list "the table". Type the field as `sampleDependencyTable: Uint8Array`, one byte for each sample, as a view over the input (the same contract as `mdat.data`). Add TSDoc that states the bit layout of clause 8.6.4.2: bits 7-6 `is_leading`, bits 5-4 `sample_depends_on`, bits 3-2 `sample_is_depended_on`, bits 1-0 `sample_has_redundancy`. The reader uses the bytes function of the cursor RFC (`readBytes`), and the writer writes the array with one bytes call. Add no helper export for the bit fields. Apply the change as one package rule in 2.0.0, "a run of bytes is a `Uint8Array`", together with the other `number[]` byte fields (pssh `systemId`, `kid`, `data`, tenc `defaultKid`, `defaultConstantIv`, sample entry `reserved1`, `compressorName`), so that sdtp does not become a third convention. Changelog migration: a caller that passes `number[]` to `writeSdtp` wraps the value with `new Uint8Array(values)`. Add a unit test for readSdtp and writeSdtp, because no test covers the box today.


## F85: The default entry type of `SampleDescriptionBox` claims fields that many entries do not have, `readStsd` has a type parameter that only casts, and `writeStsd` rejects the type that `readStsd` returns.

Severity medium. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The public signatures of `readStsd` and `writeStsd` and the default type argument of `SampleDescriptionBox` change. Code that reads `entries[0].dataReferenceIndex` without a type test needs a test or a cast.

**Files.** `libs/iso-bmff/src/boxes/SampleDescriptionBox.ts:12`, `libs/iso-bmff/src/readers/readStsd.ts:17`, `libs/iso-bmff/src/writers/writeStsd.ts:17`, `libs/iso-bmff/test/readers/readStsd.test.ts:26`

**Evidence.** SampleDescriptionBox.ts:12 `E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox`. readStsd.ts:17 `readStsd<E extends SampleEntryBox = AudioSampleEntryBox | VisualSampleEntryBox>(view)` uses `E` only in the return type, so `E` is an unchecked cast (`view.readBoxes<E>(entryCount)`, :28). The package's own test casts an entry of another type to a visual entry: readStsd.test.ts:26-27 `(boxes[2].entries[0] as VisualSampleEntryBox<VisualSampleEntryType>).type, 'fdsc'`. The fixture `captions.mp4` has an `stpp` entry. Scratch type check: `stsd.entries[0].type === 'stpp'` fails with TS2367, and `stsd.entries[0].dataReferenceIndex` has the type `number` although an entry with no reader has only `type`, `size`, and `view`. writeStsd.ts:17 `box: SampleDescriptionBox` is not generic: `writeStsd(custom as SampleDescriptionBox<SampleEntryBox<'wvtt'>>, {})` fails with TS2345.

**Proposal of the finder.** Remove the type parameter from `readStsd`. Type the entries as the union that the reader can return: the sample entry types of `IsoBoxMap` plus a base type with only `type` for an entry with no reader. This is the same rule as the `IsoBox<V>` children of `udta`. Make `writeStsd` accept `SampleDescriptionBox<E>` for every `E extends SampleEntryBox`.

**Proposal after verification.** Split the finding into three changes.

1. `readStsd`: remove the type parameter (breaking: a call with a type argument fails with TS2558). In the cursor RFC, give `readChildBoxes(cursor)` no return type parameter that the caller chooses. This follows rfc/uint64-reader-config.md:425.

2. `SampleDescriptionBox<E>`: keep the parameter on the type for hand-built boxes and for entries from the two reader factories. Change the default to the built-in sample entry types plus the one member that version 2.0.0 uses for a box with no reader. The cursor RFC defines that member as `IsoRawBox = { type: IsoBoxType; bytes: Uint8Array }` (rfc/iso-bmff-cursor-api.md:159). Do not add a second base type with only `type`. Loosen the constraint from `E extends SampleEntryBox` to a type that `IsoRawBox` satisfies, for example `E extends { type: IsoBoxType }`. Document the narrowing: `entry.type === 'avc1'` alone does not narrow, because the raw member can have any type. `!('bytes' in entry) && entry.type === 'avc1'` narrows (checked with tsc), and so does `isIsoBoxType('avc1', entry)`. The cursor RFC should state one rule for the member of an unknown box and apply the rule to the tree, to `udta`, and to `stsd`. The RFC does not state that rule today.

3. `writeStsd`: no generic function is needed. Widen the parameter to the constraint, today `SampleDescriptionBox<SampleEntryBox>`. `SampleDescriptionBox` with the default argument stays assignable, so this part does not break adopters and can ship in a 1.x release. In 2.0.0 the parameter becomes `SampleDescriptionBox<{ type: IsoBoxType }>` or the equivalent, so a raw entry from a read is accepted on a write.

**Prior decision.** None found for the type parameter or the default. The git history of readStsd.ts and SampleDescriptionBox.ts shows no decision commit (the generic dates from the writers work, d615e5bf0 and a4f84a560). Related precedent, not a decision for stsd: issue 646 (PR 659) typed the children of `udta`, `grpl`, `strk`, and `meco` as `IsoBox<V>` (CHANGELOG.md:44-48, :91). That change did not include `stsd` entries.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## G468: A readers map with the exported type IsoBoxReaderMap makes every box of the readIsoBoxes result lose `type`, so drm builds its map through a second variable.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The fix changes the public types `IsoBoxReader`, `IsoBoxReaderMap` or `IsoBoxReaderReturn`. Code that fails to compile today then compiles. A custom reader typed to return a value with no `type` field can stop compiling.

**Files.** `libs/iso-bmff/src/IsoBoxReaderReturn.ts:38`, `libs/iso-bmff/src/ParsedBox.ts:11`, `libs/iso-bmff/src/IsoBoxReaderMap.ts:10`, `libs/iso-bmff/src/IsoBoxReader.ts:13`, `libs/drm/src/ensureEncryptedInit.ts:37`, `libs/drm/src/ensureEncryptedInit.ts:47`, `rfc/iso-bmff-cursor-api.md:157`

**Evidence.** `IsoBoxReaderMap` is `Record<IsoBoxType, IsoBoxReader<unknown, IsoBoxType, V>>` (IsoBoxReaderMap.ts:10-13). `IsoBoxReaderReturn` maps each reader to `ParsedBox<B, V>` with the inferred `B` (IsoBoxReaderReturn.ts:38-50). For `B = unknown`, `ParsedBox` is only `{ view; size; largesize?; usertype? }` (ParsedBox.ts:11-18). A type check of `const readers: IsoBoxReaderMap = { stsd: readStsd }` and `readIsoBoxes(bytes, { readers })[0].type` against the source gave: "TS2339: Property 'type' does not exist on type 'IsoBoxReaderReturn<IsoBoxReaderMap, number>'". drm avoids the error with an alias: `const map = { stsd: readStsd }`, `const dynamic: IsoBoxReaderMap = map`, `audioTypes.forEach(type => (dynamic[type] = createAudioSampleEntryReader(type)))`, `return map` (ensureEncryptedInit.ts:38-44). The static type of the map then has 1 reader and the run-time map has 17. The writers map uses the same alias (lines 48-59). The RFC keeps the cause: `type IsoBoxReader<B = unknown, V ...>` (RFC line 157).

**Proposal of the finder.** Constrain the reader result in 2.0: `type IsoBoxReader<B extends { type: IsoBoxType } = { type: IsoBoxType }, V extends IsoInt64 = number>`. In `IsoBoxReaderReturn`, return the plain union (`IsoBox<V>` or a raw box) when `string extends keyof T`. Add a type test with a map of the type `IsoBoxReaderMap`. drm can then build the map with a plain loop and delete the alias.

**Proposal after verification.** Fix `IsoBoxReaderReturn` only, and ship it in any version. In the first mapped type, return `never` when the reader result is `unknown`, and keep the existing `any` branch first: `0 extends 1 & B ? ParsedBox<B, V> : unknown extends B ? never : ParsedBox<...existing chain..., V>`. I checked this form with tsc against the source:
- A map of the type `IsoBoxReaderMap` gives exactly `ParsedIsoBox<V>`, and `box.type === 'stsd'` narrows to `entries`.
- A custom reader under a computed key keeps its return type.
- A custom `stsd` reader under a literal key still excludes the built-in `stsd` type.
- A reader of the type `any` still compiles.

The change does not break adopters. The only affected result type is the one where `.type` does not compile today, and the new type is narrower.

Add a type test next to libs/iso-bmff/test/int64.types.test.ts:1089 that reads `box.type` and narrows a box from a map of the type `IsoBoxReaderMap`. Then drm can declare `const map: IsoBoxReaderMap = { stsd: readStsd }` and `const map: IsoBoxWriterMap = { ... }`, fill both with a plain loop, and delete both aliases.

Carry the same rule into the 2.0 types of the cursor RFC, because `unknown` absorbs the union when `ParsedBox` no longer adds `view` and `size`.

The constraint `IsoBoxReader<B extends { type: IsoBoxType } = { type: IsoBoxType }>` is a separate, optional 2.0 item. It is the only breaking part. It matches the RFC rule that a parsed box has `type` and its fields. If the maintainers adopt it, `IsoBoxReaderReturn` must also drop a result whose `type` is not a literal (`string extends B['type']`), or the default result blocks narrowing.

**Prior decision.** No decision states that the missing `type` is intentional. rfc/uint64-reader-config.md:246 and test/int64.types.test.ts:1089-1093 record only that an `IsoBoxReaderMap` takes a factory reader by assignment, as drm does. The alias in drm came from PR 585 (facd7ba42) as the replacement for an `as any` cast.

**Result.** Theme 3. Decided on 2026-11-17 in PR 682 (b6b0c4296): the rules of the section "Result type".

## G512: No field with a closed set of values has a literal type, and `writeSidx` masks a value outside the set without an error.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A literal union narrows the type of a public field. Writer input that passes a computed `number` for `sapType`, `referenceType` or `startsWithSap` stops compiling without a narrowing step.

**Files.** `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:10`, `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:12`, `libs/iso-bmff/src/boxes/SegmentIndexReference.ts:13`, `libs/iso-bmff/src/writers/writeSidx.ts:53`, `libs/iso-bmff/src/writers/writeSidx.ts:61`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:19`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:29`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:51`, `libs/iso-bmff/src/boxes/Subsample.ts:9`, `libs/iso-bmff/src/boxes/AudioRenderingIndicationBox.ts:10`, `libs/iso-bmff/src/boxes/HandlerReferenceBox.ts:11`, `libs/iso-bmff/src/boxes/VideoMediaHeaderBox.ts:10`, `libs/iso-bmff/src/boxes/ItemLocationBox.ts:11`, `libs/iso-bmff/src/boxes/ItemLocation.ts:10`, `libs/iso-bmff/src/boxes/CompactSampleSizeBox.ts:10`

**Evidence.** Answer to question 2. Outside `type` and the emsg `version`, every field is `number` or `string`. The fields fall into three groups. Group A, the bit width equals the value set: sidx `referenceType: number` (spec `bit (1) reference_type`), `startsWithSap: number` (`bit(1) starts_with_SAP`), `sapType: number` (`unsigned int(3) SAP_type`). writeSidx.ts:53 `((ref.referenceType & 0x1) << 31)` and line 61 `((ref.sapType & 0x7) << 28)` mask the input, so `sapType: 8` writes 0 with no error. Group B, the set is smaller than the field: tenc `defaultIsProtected` (8 bits, 0 and 1, 0x02 to 0xFF reserved), tenc `defaultIvSize` (8 bits, values 0, 8, 16), tenc `defaultConstantIvSize` (8 or 16), subs `discardable` (8 bits, 0 and 1), ardi `audioRenderingIndication` (reader reads 8 bits, spec text not available), and in types with no reader iloc `offsetSize`, `lengthSize`, `baseOffsetSize`, `indexSize` (4 bits, set {0, 4, 8}), `constructionMethod` (4 bits, 0 to 2), stz2 `fieldSize` (8 bits, 4, 8 or 16). Group C, open sets: hdlr `handlerType: string` (spec: "or a value from a derived specification, or registration"), vmhd `graphicsmode: number` (spec: "enumerated set, which may be extended by derived specifications"), and the 4CC fields `schemeType` and `dataFormat`.

**Proposal of the finder.** Group A: use an exact union, `referenceType: 0 | 1`, `startsWithSap: 0 | 1`, `sapType: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7`, and the same for the three 2-bit tfra length fields (`0 | 1 | 2 | 3`). Cost: one type assertion in the reader and a narrowing step for adopters who compute the value. Benefit: the reader cannot return a value outside the union, so no throw is needed, a `switch` is exhaustive, and the writer rejects a bad value at compile time and no longer needs the mask. Group B: keep `number`. A union is false for a box that breaks the spec, because the reader must not throw. Add TSDoc that lists the defined values. An open union such as `0 | 8 | 16 | (number & {})` gives completion only and looks closed, so I do not recommend it. Group C: keep `string` and `number`. A union is wrong for a registry. If completion is wanted for `handlerType`, export one alias of the known handler types joined with `(string & {})`. Each type change is a break.

**Proposal after verification.** Split the finding into two changes.

Change 1, type only, a compile break, so only in the major version: `referenceType: 0 | 1`, `startsWithSap: 0 | 1`, `sapType: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7`, and `0 | 1 | 2 | 3` for `lengthSizeOfTrafNum`, `lengthSizeOfTrunNum`, `lengthSizeOfSampleNum`. Describe each union as the bit range of the field, not as the set of defined values. Add TSDoc to `sapType` that 0 to 6 are defined (0 is unknown, 1 to 6 are the Annex I types) and 7 is reserved. Add TSDoc to the tfra fields that the value is the byte length minus one. Document the migration: annotate the object as `SegmentIndexReference` or use `as const`. This change is optional. The gain is small, and the six type assertions in the readers and the widening problem for writer input are the cost.

Change 2, run-time, any release: keep the masks in `writeSidx`. Do not add a throw, because every other integer field truncates through DataView with no error. Add `& 0x3` to the three length fields in `writeTfra` (line 45, and the sizes at lines 25-27 and 53-55), so that the writer treats a bad value the same way as `writeSidx`. This changes written bytes only for input outside the 2-bit range.

Group B and Group C: keep `number` and `string` and add TSDoc with the defined values, as the finding states. No alias with `(string & {})` for `handlerType` unless an adopter asks for it.

**Prior decision.** None that makes `number` intentional. Two records support the change: AGENTS.md, Developer Experience ("Use union and literal types, so autocomplete guides adopters to valid values", "Incorrect usage should fail at compile time"), and the emsg precedent of PR 676, where `EventMessageBoxUnrecognizedVersionNumber` (boxes/EventMessageBox.ts:50) is an exact literal union of the 8-bit range. CHANGELOG.md and rfc/*.md have no entry on `sapType`, `referenceType` or `startsWithSap`.

## G522: A custom reader that returns only fields, with no `type`, works at run time but removes `type` from the whole result type, so `box.type` is a compile error for every box.

Severity medium. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The public type IsoBoxReaderReturn changes. Code that compiles today keeps its types when each reader returns a `type` equal to its map key.

**Files.** `libs/iso-bmff/src/IsoBoxReaderReturn.ts:38`, `libs/iso-bmff/src/IsoBoxReadView.ts:466`, `libs/iso-bmff/docs/reading-boxes.md:211`

**Evidence.** At run time the box type comes from the header (IsoBoxReadView.ts L374 `box = { size, type }`), and the reader result is merged in (L466 `Object.assign(box, parser(view, type))`). Script examples/t/notype-run.ts with a reader that returns `{ bufferSizeDB, maxBitrate, avgBitrate }` prints `[{"size":20,"type":"btrt","bufferSizeDB":1,"maxBitrate":2,"avgBitrate":3}]`.

IsoBoxReaderReturn.ts L38-L49 takes the box type from the return value `B` of the reader and ignores the map key `K`: `NonNullable<T[K]> extends (...args: never[]) => infer B ? ParsedBox<...B...>`. tsc 6.0.3 on examples/t/notype.ts, with `readers: { btrt: readBtrt, tfdt: readTfdt }`:
`error TS2339: Property 'type' does not exist on type 'IsoBoxReaderReturn<{ readonly btrt: ...; readonly tfdt: ... }, number>'` at `if (box.type === 'tfdt')`, and the same error in the `findIsoBox` callback. One reader without `type` breaks narrowing for the built-in `tfdt` box too. The message does not name the cause.

No guide sentence states that a custom reader must return `type`. The guide examples only show it (`return { type: "tfdt" as const, ...` at L211 and L274). The requirement also repeats the map key in every custom reader, which is the source of the known wrong-key trap.

**Proposal of the finder.** Derive the box type from the map key. In IsoBoxReaderReturn use `ParsedBox<Omit<B, 'type'> & { type: K extends 'url' | 'urn' ? `${K} ` : K }, V>` for a reader whose result has no built-in type. At run time assign `type` from the header after the merge, so a reader cannot change it. A custom reader then returns fields only. Update the guide examples to drop `type: "tfdt" as const`, or keep it as optional.

**Proposal after verification.** Make the rule uniform and put it in the contract of the cursor RFC: `readIsoBoxes` sets `type` from the box header on every parsed box, after the reader returns. A `type` in the reader result is optional and the header value replaces it.

Types: for a literal key `K`, the union member has `type: K` (`'url '` or `'urn '` for the keys `url` and `urn`). Keep `B` unchanged when `B` already has `type: K`, so the built-in readers keep their readable types and the int64 equality check still works. Otherwise use a distributive form: `B extends unknown ? Omit<B, 'type'> & { type: K } : never`. For a non-literal key keep today's behavior (the result `B` as returned, every built-in type stays).

Docs: state the rule in one sentence in reading-boxes.md and in the TSDoc of `IsoBoxReaderReturn`. Drop `type: "tfdt" as const` from the custom reader examples, or keep one example and say the field is optional. State that a direct call of a custom reader (the `seekIsoBox` path of the RFC) returns only what the reader returns. Add type tests for the three cases: no `type`, `type: string`, and a built-in reader under another key.

The type-only half (add `type: K` when `B` has no `type`) breaks no adopter and could ship in 1.x. The run-time half changes the returned `type` when a reader returns a value that differs from the header, so the complete fix belongs in 2.0.0.

**Prior decision.** None found that makes the required `type` intentional. rfc/uint64-reader-config.md L105 states only that "the result type keeps whatever the reader returns". rfc/iso-bmff-cursor-api.md L89-L111 shows a custom reader that returns `type: 'mfhd'`, and its Contract says "A parsed box has only `type` and its fields", which keeps the current convention without stating a rule.

**Result.** Theme 3. Not chosen on 2026-11-17: a reader returns `type` (PR 682 (b6b0c4296)).

## F232: Several exports have no purpose after the cursor RFC, and six of them are generic constant names.

Severity low. Category api-surface. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The fix removes or renames public exports.

**Files.** `libs/iso-bmff/src/IsoBoxFields.ts:8`, `libs/iso-bmff/src/IsoFieldTypeMap.ts:8`, `libs/iso-bmff/src/ParsedBox.ts:11`, `libs/iso-bmff/src/ParsedIsoBox.ts:11`, `libs/iso-bmff/src/IsoTypedParsedBox.ts:10`, `libs/iso-bmff/src/IsoBoxReadViewConfig.ts:14`, `libs/iso-bmff/src/IsoBoxReadView.ts:168`, `libs/iso-bmff/src/index.ts:29`

**Evidence.** The package root exports `UTF8`, `UINT`, `TEMPLATE`, `STRING`, `INT`, `DATA`, the object `IsoBoxFields` and the type `IsoFieldTypeMap`. Their only use is the `type` argument of `readArray` and `writeArray`. The RFC replaces both methods with a loop and does not list these exports. `writeArray` accepts every key of IsoFieldTypeMap but handles three: `type === UINT ? this.writeUint : type === TEMPLATE ? this.writeTemplate : this.writeInt`, so 'string', 'utf8' and 'data' are written as integers. `ParsedBox` exists to add `view`, `size`, `largesize` and `usertype`, which the RFC removes. Its other branch, `T & Omit<Box, 'type'>`, adds nothing. `ParsedIsoBox` and `IsoTypedParsedBox` are then other names for `IsoBox` and `IsoBoxMap[T]`. The name `IsoBoxReadViewConfig` refers to a class that the RFC removes. The comment `// TODO: Change all sizes from bits to bytes` is out of date, because the sizes are bytes.

**Proposal of the finder.** Add these removals to the RFC: `IsoBoxFields`, the six constants, `IsoFieldTypeMap`, `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox`. Rename `IsoBoxReadViewConfig` to `IsoBoxReadConfig` and `IsoBoxWriteViewConfig` to `IsoBoxWriteConfig`. List each removal with its replacement in the changelog.

**Proposal after verification.** Add these points to rfc/iso-bmff-cursor-api.md:

1. Remove `UTF8`, `UINT`, `TEMPLATE`, `STRING`, `INT`, `DATA`, `IsoBoxFields` (value and type), and `IsoFieldTypeMap`. They have no replacement. A custom reader uses a loop with a field function.
2. Remove `ParsedBox<T>` (replacement: `T`) and `IsoTypedParsedBox<T, V>` (replacement: `IsoBoxMap<V>[T]`).
3. Do not remove `ParsedIsoBox` with `IsoBox` as its replacement. The RFC must name the element type of the `readIsoBoxes` result, which is `IsoBox<V> | IsoRawBox`. The lowest-cost choice keeps the name `ParsedIsoBox<V>` with that definition, because c2pa and the reading guide use the name. If the RFC gives one name to the type that replaces `IsoBoxStreamable` and that name also covers the read result, remove `ParsedIsoBox` and list that name as the replacement. In both cases `IsoBoxReaderReturn` no longer wraps its members in `ParsedBox`.
4. Rename `IsoBoxReadViewConfig` to `IsoBoxReadConfig` and `IsoBoxWriteViewConfig` to `IsoBoxWriteConfig`. Do not use `IsoBoxReaderConfig` or `IsoBoxWriterConfig`, because `IsoBoxReader` and `IsoBoxWriter` are the types of one box function. State in the RFC which functions take each type (`seekIsoBox`, `createIsoBoxReadCursor`, `readIsoBoxes`, `defaultReaderConfig`, and `createIsoBoxWriteCursor` with `capacity`, `writeIsoBoxes`, `writeIsoBox`, `defaultWriterConfig`). Update the migration note of rfc/uint64-reader-config.md and docs/reading-boxes.md.
5. List each removal and rename with its replacement in the changelog.

Two parts do not need the major version. The TSDoc of `IsoBoxWriteViewConfig` can change to "Configuration for the box writers" at any time. The stale TODO and the loose `writeArray` type disappear with the view classes, so they need no separate fix.

**Prior decision.** No decision keeps these exports after the view classes go. Three records show why the exports exist today. Commit be13e9510 ("fix: add missing value exports") and the changelog entry of 1.0.0-alpha.6 ("Added `IsoBoxFields` constant for all ISO BMFF field types") made the constants public so that a custom reader can call `readArray`. The changelog entry of 1.0.0-alpha.2 renamed `IsoBoxReadableStreamConfig` to `IsoBoxWriteViewConfig`, which is the source of the stale TSDoc. The accepted RFC rfc/uint64-reader-config.md (lines 187, 224-225, 386) names `IsoBoxReadViewConfig`, `ParsedBox`, `ParsedIsoBox`, and `IsoTypedParsedBox`, and its migration note uses `Required<Pick<IsoBoxReadViewConfig, 'readers'>>`. A rename must update that note and docs/reading-boxes.md:239-261. The draft rfc/iso-bmff-cursor-api.md:168 says of `readIsoBoxes` that "The signature does not change", which may imply that the type names stay. The RFC is a draft, so that sentence is not a decision.

## F268: `writeBytes` takes one array or a list of arrays, and `writeArray` accepts field types that it cannot write.

Severity low. Category api-surface. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The list form of `writeBytes` and the method `writeArray` are removed. The RFC already replaces the class that holds them.

**Files.** `libs/iso-bmff/src/IsoBoxWriteView.ts:268`, `libs/iso-bmff/src/IsoBoxWriteView.ts:288`, `libs/iso-bmff/src/IsoBoxWriteView.ts:294`, `libs/iso-bmff/src/IsoBoxWriteView.ts:298`, `rfc/iso-bmff-cursor-api.md:191`

**Evidence.** `writeBytes = (data: Uint8Array | Uint8Array[]): void => { if (!Array.isArray(data)) { data = [data] }`. The list form exists for the result of `writeChildBoxes`, which the single buffer of the RFC removes. `writeArray = <T extends keyof IsoFieldTypeMap>(data: number[], type: T, size: number, length: number)` accepts `'string'`, `'utf8'`, and `'data'`, and then selects `type === UINT ? this.writeUint : type === TEMPLATE ? this.writeTemplate : this.writeInt`. Read-only run of the source: `writeArray([1, 2], 'string', 1, 3)` writes `01 02 00`. `data[i] ?? 0` fills a short array, and a long array is cut with no error. `data: number[]` rejects a typed array and a read-only array. The RFC says `The write cursor has the same field functions with the write prefix` and replaces `readArray` with a loop in the reader.

**Proposal of the finder.** State in the RFC that 2.0.0 has no `writeArray` and that `writeBytes(cursor, bytes: Uint8Array)` takes one array. A writer uses a loop for a list of numbers, as a reader does.

**Proposal after verification.** Do not treat this as a separate change. Treat it as a clarification of the RFC. Add a write table to rfc/iso-bmff-cursor-api.md next to the read table at line 180, with these rows: `writer.writeArray(...)` becomes a loop in the writer. `writer.writeBytes(data)` becomes `writeBytes(cursor, bytes: Uint8Array)` with one array and no list form. Child boxes are written into the same cursor, so no list of arrays exists. State in the Contract section that a loop for a fixed-length field writes exactly the count of the spec and writes 0 for a missing value (`box.systemId[i] ?? 0`). That sentence keeps the bytes of version 1 and the settled rule that a writer does not throw for a missing field. Drop the points about `number[]` rejecting typed arrays and about the cut of a long array as defects: the first disappears with the method, and the second is the intended behavior since PR 283. The loop over byte lists that are typed `number[]` (`pssh` `data`, `kid`, `systemId`, `tenc` `defaultKid`) should reserve the capacity one time before the loop, so the growable cursor does not check the buffer size for each byte.

**Prior decision.** No decision keeps `writeArray` or the list form of `writeBytes`. One decision covers the fill behavior: PR 283 (commit a4f84a560, CHANGELOG.md:280, 1.0.0-alpha.2) made `length` required, so `writeArray` writes exactly `length` values and fills a short array with 0. PR 288 (commit 69489be50) added the list form of `writeBytes` for the result of `writeChildBoxes`. rfc/iso-bmff-cursor-api.md:189-191 already implies the removal of `writeArray`.

## F333: createIsoBoxReadableStream and IsoBoxReadableStream are two exports for one feature, and the chunk type is not Uint8Array<ArrayBuffer>

Severity low. Category api-surface. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Removing one of the two exports breaks its callers. The narrower chunk type is not breaking.

**Files.** `libs/iso-bmff/src/createIsoBoxReadableStream.ts:19`, `libs/iso-bmff/src/createIsoBoxReadableStream.ts:22`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:28`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:18`, `libs/iso-bmff/README.md:14`

**Evidence.** `return new IsoBoxReadableStream(boxes, config)` is the whole factory. The README lists both names for one task. The factory returns `ReadableStream<Uint8Array>` and the class extends `ReadableStreamBase<Uint8Array>`. The chunks come from `writeIsoBox`, which returns `Uint8Array<ArrayBuffer>`. AGENTS.md: "A function that allocates its result returns `Uint8Array<ArrayBuffer>`". A chunk therefore needs a cast for `SourceBuffer.appendBuffer` under TypeScript 6, which the changelog entry for `writeIsoBox` set out to avoid. Neither TSDoc has `@throws` for `new Error('ReadableStream is not available in this environment')`.

**Proposal of the finder.** Keep `createIsoBoxReadableStream` and remove the class export (a factory hides the guarded base class and matches the factory rule for public components). Return `ReadableStream<Uint8Array<ArrayBuffer>>`. Add `@throws Error if the runtime has no ReadableStream.` Add one sentence to the guide: the stream writes one box for each pull, so a generator of boxes is written on demand.

**Proposal after verification.** Split the finding into two parts.

Part 1, breaking, for 2.0.0: export only `createIsoBoxReadableStream`. Build the stream inside the function body with `new ReadableStream<Uint8Array<ArrayBuffer>>({ start: pull, pull })`. Delete IsoBoxReadableStream.ts, the module-scope `ReadableStreamBase` statement, and IsoBoxReadableStream.environment.test.ts. Keep the error that PR 383 documented: one `typeof ReadableStream === 'undefined'` check inside the function throws `new Error('ReadableStream is not available in this environment')`. Move the environment test to the factory. Remove `IsoBoxReadableStream` from README.md:14, and regenerate the skill and the API report. Add a migration line to the changelog: replace `new IsoBoxReadableStream(boxes, config)` with `createIsoBoxReadableStream(boxes, config)`. Fix the TSDoc line "@returns A new IsoBoxReadableStream".

Part 2, not breaking, possible in any version: return `ReadableStream<Uint8Array<ArrayBuffer>>`, and add `@throws Error if the runtime has no ReadableStream.`

Guide sentence, corrected: "The stream writes the first box when the stream is created. The stream writes each next box when the consumer reads a chunk, so a generator of boxes runs on demand." This statement holds because the stream uses the default queuing strategy (high water mark 1).

Do not cite a factory rule as the reason. The repo has no written rule, and `WebVttTransformStream` in the webvtt package stays a class. The reasons are the duplicate export, the module-scope statement, and the API report warning.

**Prior decision.** None for the two exports. PR 383 (commit 5b1f124c0, issue 382, changelog line 157) decided only the guard and the descriptive error "ReadableStream is not available in this environment" for runtimes without Web Streams. That PR kept the class because a removal was a break in a minor version.

## G454: fourCcToUint32 returns a number for a string that is not four one-byte characters, and the package has no function for the reverse direction.

Severity low. Category api-surface. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A fix adds a thrown error or removes the export.

**Files.** `libs/iso-bmff/src/utils/fourCcToUint32.ts:13`, `libs/iso-bmff/src/readers/readFrma.ts:1`, `libs/iso-bmff/src/readers/readSchm.ts:1`

**Evidence.** `((str.charCodeAt(0) << 24) | (str.charCodeAt(1) << 16) | (str.charCodeAt(2) << 8) | str.charCodeAt(3)) >>> 0`. Run: 'ab' returns 0x61620000, '' returns 0, 'avc1x' returns 0x61766331 (the value of 'avc1'), and 'mŁab' returns 0x6d416162, where the high byte of the second character is lost. The TSDoc says `A 4-character FourCC string` and names no error. readFrma and readSchm return `dataFormat` and `schemeType` as numbers, so an adopter needs the reverse conversion to compare or print them, and no export does that.

**Proposal of the finder.** If the four-character-code fields become strings (a known finding), remove fourCcToUint32 from the public API. If the fields stay numbers, throw a RangeError for a string that is not four characters from U+0000 to U+00FF, and add `uint32ToFourCc(value: number): string`.

**Proposal after verification.** Decide this finding together with the string-field finding, not alone. Preferred fix in 2.0.0: `OriginalFormatBox.dataFormat` and `SchemeTypeBox.schemeType` become strings read with the same 4-byte string read as `handlerType` and `majorBrand`, and written with the same string write. Then remove `fourCcToUint32` from the public API only if `groupingType` and `auxInfoType` also become strings. In the same release, change libs/drm/src/ensureEncryptedInit.ts: pass `entry.type` directly at line 156, and change the option `schemeType` to a string with default 'cenc' (a breaking change in @svta/cml-drm, lines 87 and 118). Replace the probe import in the two environment tests.

If `groupingType` and `auxInfoType` stay numbers (the spec calls them integers), keep `fourCcToUint32` and add `uint32ToFourCc(value: number): string`. That part is additive and can ship in any release. The RangeError for a bad input is optional: a `str.length !== 4` check plus a code unit check above 0xFF costs a few bytes and changes behavior only for input that already gives a wrong number. Standing alone, without the string-field change, this finding is low value.


## F230: readUint, readInt and readTemplate return NaN for a size that they do not support, and the view still moves.

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A call with an unsupported size becomes a compile error or a thrown error in place of NaN.

**Files.** `libs/iso-bmff/src/utils/readUint.ts:4`, `libs/iso-bmff/src/utils/readInt.ts:2`, `libs/iso-bmff/src/IsoBoxReadView.ts:210`, `libs/iso-bmff/src/IsoBoxReadView.ts:224`, `libs/iso-bmff/src/IsoBoxWriteView.ts:136`

**Evidence.** `let value: number = NaN` and `let result = NaN`, with cases for 1, 2, 3, 4, 8 in readUint and 1, 2, 4, 8 in readInt. The parameter type is `size: number`. Probe: `readUint(5)` returns NaN and moves 5 bytes. `readUint(-1)` returns NaN and moves 1 byte backward. `readInt(3)` returns NaN, while `readUint(3)` works. `readArray('int', 3, 2)` returns [NaN, NaN]. `readArray` with an unknown field type returns [-1, -1] from `default: result = -1`. writeInt has no case for 3 either, and it writes nothing but moves the cursor. The per-size functions of the RFC remove the NaN case. The RFC lists readUint24 and no readInt24.

**Proposal of the finder.** Keep the per-size functions of the RFC and add no generic `size: number` form. State in the RFC that a signed 24-bit function is left out on purpose, in both directions. Do not copy the `-1` result for an unknown field type or the move for an unsupported size.

**Proposal after verification.** Keep the per-size functions of the RFC and add no public function with a `size: number` parameter. Do not patch version 1 with a throw or a narrower `size` type (issue 668 ruling, and a literal union breaks `lengthSizeOfTrafNum + 1` callers at compile time). Add three statements to rfc/iso-bmff-cursor-api.md. (1) A field with a computed byte count selects a per-size function. `readTfra` and `writeTfra` select the three functions once before the entry loop, for example from a local array `[readUint8, readUint16, readUint24, readUint32]` indexed by the 2-bit length field, which cannot go out of range. `readSubs` selects between `readUint16` and `readUint32` with the version. A custom reader of a box such as `iloc` or `stz2` does the same. (2) The package has no signed 24-bit function in either direction, because the spec has no signed 24-bit field. (3) The read loop that replaces `readArray` has no fallback value for an unknown field type, and no field function moves the cursor without a read or a write.


## F231: Eight or more zero bytes after the last box become a box with the type of four null characters, but one to seven bytes are dropped.

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The returned boxes and the written bytes change for input with zero bytes after the last box.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:383`, `libs/iso-bmff/test/readIsoBoxes.test.ts:42`, `libs/iso-bmff/docs/reading-boxes.md:91`, `libs/iso-bmff/docs/reading-boxes.md:93`

**Evidence.** `} else if (size === 0) { actualSize = bytesRemaining }`. The test `should exit if garbage is zero` expects one box of size 0 for 1500 zero bytes. Probe: a moov box with a free child and 8 zero bytes returns the children `free` and `\u0000\u0000\u0000\u0000`. The same box with 4 zero bytes returns only `free`. The guide documents the 4-byte case as bytes that a write omits. With the raw box of the RFC, a write would keep 8 zero bytes and drop 4. The guide also says a size of 0 `means that the box extends to the end of the data`. For a child box, the code stops at the end of the parent. The specification says: `if size is 0, then this box is the last one in the file, and its contents extend to the end of the file`. A raw copy of a size 0 box is only valid as the last box.

**Proposal of the finder.** Choose one rule for bytes after the last box and state it in the RFC contract. A possible rule: the read stops before a header whose four type bytes are zero, the same as for fewer than 8 bytes. This rule is a reader tolerance and is not in the specification. For size 0, document that a child box extends to the end of its parent. When writeIsoBoxes copies a raw box with size 0, write the real size into the header.

**Proposal after verification.** Keep the reader as it is. Do not add a rule for a type of four zero bytes. Make three documentation changes, none of which breaks adopters:
1. docs/reading-boxes.md:91: state that a `size` of 0 extends the box to the end of the data, and to the end of the parent box for a child box. Add that 8 or more zero bytes after the last box are therefore one box with size 0 and a type of four null characters, and that a write keeps those bytes.
2. rfc/iso-bmff-cursor-api.md, section Contract: state the same two rules next to "`readIsoBoxes` stops before a truncated box". Bytes that cannot form a header (1 to 7) are not in the result and a write omits them. A header with size 0 becomes a raw box (or a typed box whose writer computes the real size) that covers the bytes to the end of the enclosing box.
3. Same section and docs/writing-boxes.md: state that `writeIsoBoxes` copies a raw box with size 0 unchanged, so that box must stay the last box of the output. Record the header rewrite as an open question of the RFC and not as a requirement. If the maintainers want it, limit it to boxes below 2^32 bytes and write the 4 size bytes in the output array, so the raw input stays untouched.

**Prior decision.** PR 662 (commit 6c788e430, issue 663) states "A `size` of 0 stays valid" and adds the tests `should read a last box with the size 0 to the end of the data` and `should read a last box with the size 0 and no body` (libs/iso-bmff/test/incompleteBoxHeader.test.ts:208, :222). PR 661 (commit 7d67e217a, issue 650) chose to stop before fewer than 8 bytes, to record no field for those bytes, and to let a write omit them. The test `should exit if garbage is zero` (libs/iso-bmff/test/readIsoBoxes.test.ts:42) pins one box of size 0 for 1500 zero bytes since the first version of the readers. No decision covers the wording of the guide for a child box with size 0.

## F257: `writeMdhd` writes 0 for a `language` shorter than 3 characters, and the comment says the result is `und`, but a read of that box returns three grave accents.

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The written bytes for a missing or short `language` change from `00 00` to `55 c4`.

**Files.** `libs/iso-bmff/src/writers/writeMdhd.ts:40`, `libs/iso-bmff/src/writers/writeMdhd.ts:45`, `libs/iso-bmff/src/readers/readMdhd.ts:25`

**Evidence.** `const lang = box.language.length >= 3 ? (((box.language.charCodeAt(0) - 0x60) & 0x1f) << 10) | ... : 0 // Default to "und" (undefined) if invalid`. The packed value of `und` is 0x55C4, not 0. Read-only run of the source: `language: ''` reads back as three characters U+0060. `language: 'ENG'` reads back as `eng`, because the mask keeps 5 bits. A missing `language` throws a `TypeError` at `box.language.length`.

**Proposal of the finder.** 2.0.0 writes the code `und` (0x55C4) for a `language` that is missing or is not 3 characters. `und` is the ISO 639-2 code for an undetermined language. Correct the comment. Document that the writer keeps the low 5 bits of each character.

**Proposal after verification.** Change the test from `length >= 3` to exactly 3 characters, and write 0x55C4 (`und`) for every other case, a missing `language` included (`box.language?.length === 3`). The exact test also fixes the `'en-US'` case, which writes `enm` today.

Keep the 5-bit mask with no character validation. A box with the stored value 0 reads as three U+0060 characters, and that string must still write 0, so a read and then a write keep the bytes of the box.

Replace the comment with a correct one, or delete it. `und` means undetermined, not undefined.

Change the field doc in MediaHeaderBox.ts:24 to "The ISO 639-2/T language code: three lowercase letters". State the `und` default and the 5-bit rule in the TSDoc of `writeMdhd`.

Add writer tests for `''`, `'en'`, `'en-US'`, `'und'`, and the three U+0060 characters.

Do not wait for 2.0.0. The change is a `fix:` with a changelog entry.


## F259: `writeIsoBox` returns a view of the input memory for a box given as bytes, but its return type marks an allocated result, and it rejects an `ArrayBuffer` that the read side accepts.

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The result for an `ArrayBufferView` input becomes a copy. Code that depends on shared memory changes.

**Files.** `libs/iso-bmff/src/utils/writeBox.ts:41`, `libs/iso-bmff/src/utils/writeBox.ts:51`, `libs/iso-bmff/src/utils/writeBox.ts:55`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:228`, `libs/iso-bmff/src/IsoBoxData.ts:6`, `libs/iso-bmff/src/IsoBoxStreamable.ts:15`

**Evidence.** `if (isSharedArrayBuffer(buffer)) { return new Uint8Array(buffer, byteOffset, byteLength).slice() }` / `return new Uint8Array(buffer, byteOffset, byteLength)`. The test `should not copy a box given as a view over an ArrayBuffer` asserts `equal(result.buffer, plain.buffer)`. The same applies to the `view` of a parsed box. The return type is `Uint8Array<ArrayBuffer>`. AGENTS.md reserves that type for a function that allocates its result. A change of the result then changes the source segment. Input types: the read side takes `IsoBoxData = ArrayBufferLike | ArrayBufferView`, the write side takes `ArrayBufferView` only. Read-only run of the source: `writeIsoBox(arrayBuffer)` throws `Error: Invalid box`.

**Proposal of the finder.** 2.0.0 states that the result of `writeIsoBox` and `writeIsoBoxes` never shares memory with an input. The single output buffer of the RFC gives this result, so the `SharedArrayBuffer` branch goes. Bytes enter the write side in one form only, the raw box `{ type, bytes }`. If bare bytes stay valid input, accept `ArrayBufferLike` too, as the read side does.

**Proposal after verification.** Do not handle this finding as a separate code change. Add two sentences to the Contract section of rfc/iso-bmff-cursor-api.md. (1) "The result of `writeIsoBox` and `writeIsoBoxes` never shares memory with an input." Limit the sentence to these two functions, because the Future possibilities section keeps a `ReadableStream` writer without a copy. (2) State the input forms: a box with a writer, a box with a `boxes` field, or a raw box `{ type, bytes }`. A bare `ArrayBufferView` is not valid input in 2.0.0, and the call throws the error of RFC line 201. Do not add `ArrayBufferLike` to the write side. The implementation then deletes `isSharedArrayBuffer` and both tests at test/writeIsoBoxes.test.ts:217 and :228, and replaces them with one test that the result buffer differs from the input buffer. The changelog needs a migration line: wrap bare bytes as `{ type, bytes }`, or concatenate them outside the call. docs/writing-boxes.md:11 and :208 need the same update.

**Prior decision.** PR 583 (commit 27316b9b4, "chore: move the type check to tsgolint and upgrade to TypeScript 6"): the commit added the copy for a `SharedArrayBuffer`, the `Uint8Array<ArrayBuffer>` return type, and the test `should not copy a box given as a view over an ArrayBuffer` (libs/iso-bmff/test/writeIsoBoxes.test.ts:228). CHANGELOG.md:111 records the change. The zero-copy result for a plain `ArrayBuffer` is therefore intentional in version 1. rfc/iso-bmff-cursor-api.md lines 87, 173-174, and 203 already replace that behavior with one copied output buffer.

## F28: readFtyp and readStyp compute a fractional brand count when the body length is not a multiple of 4

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A malformed ftyp or styp box would return the complete brands instead of a RangeError.

**Files.** `libs/iso-bmff/src/readers/readFtyp.ts:19`, `libs/iso-bmff/src/readers/readFtyp.ts:20`, `libs/iso-bmff/src/readers/readStyp.ts:17`

**Evidence.** `const length = view.bytesRemaining / size` then `view.readArray(STRING, size, length)`. The loop in readArray is `for (let i = 0; i < length; i++)`, so a length of 1.5 reads two brands. A probe with an ftyp box that has 6 bytes after minor_version throws `RangeError: Offset is outside the bounds of the DataView` from readIsoBoxes. The syntax says `compatible_brands[]; // to end of the box`, which gives no rule for a partial brand. The error has no box type and no field name.

**Proposal of the finder.** Decide the behavior on purpose. Either use the integer count (`bytesRemaining >> 2`) and ignore 1 to 3 trailing bytes, or keep the throw and make it the documented RangeError of the cursor contract. Add a test for the chosen behavior.

**Proposal after verification.** Do not track this as a separate breaking item. Fold it into the cursor rewrite of readFtyp, which replaces readArray with a loop. Write the loop with an integer count, `(cursor.end - cursor.pos) >>> 2`, so 1 to 3 trailing bytes are ignored. That choice matches how the package treats trailing bytes elsewhere: fixed-field readers ignore extra bytes after the last field, and issue 650 made readIsoBoxes tolerate 1 to 7 bytes after the last child box. It also keeps a segment readable when its styp has stray bytes, which players that skip styp already play. The cost is zero bytes and zero runtime. A body shorter than 8 bytes still throws the contract RangeError in the major_brand or minor_version read, which is consistent with the "throw inside a required field" rule. Add one test for a partial brand in ftyp and one in styp, and one changelog line. If the maintainer prefers the throw, a `while (cursor.pos < cursor.end)` loop gives it for free under the RFC contract. Either way the fix can also ship in 1.x as a one-line change (`Math.floor` or `>>> 2`) with a fix entry.

**Prior decision.** None for the fractional count itself (it dates from the initial import 8ac3ef9b9, PR 265). Related precedents: issue 668 closed as not planned (a RangeError for bad input that reaches the caller is acceptable), issue 650 and PR 644 (trailing bytes that cannot form a complete unit are tolerated, shipped as fixes in a minor version), and rfc/iso-bmff-cursor-api.md line 195 (a read past cursor.end throws a RangeError by contract).

## G458: `writeBox` finds a writer with a plain property read, so a box type that is a name on `Object.prototype` returns empty bytes or throws a `TypeError` in place of `No writer found for box type`.

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A fix changes a returned value (an empty `Uint8Array`) and two `TypeError` cases into the documented `Error` for these type strings. No valid four-character type changes.

**Files.** `libs/iso-bmff/src/utils/writeBox.ts:25`, `libs/iso-bmff/src/utils/writeBox.ts:29`, `libs/iso-bmff/src/utils/writeBox.ts:49`, `libs/iso-bmff/src/utils/createWriterConfig.ts:7`

**Evidence.** `const writer = config.writers?.[type]` (writeBox.ts:25), then `view = writer(box as any, config)` (:29). The default map is a plain object: `writers: config?.writers ?? {}` (createWriterConfig.ts:7).

Measured, the same with defaultWriterConfig() and with no config:
- `writeIsoBox({ type: 'constructor' })` returns a `Uint8Array` of length 0, no error. `Object(box)` returns the box, and `const { buffer, byteOffset, byteLength } = view` (:49) gives three `undefined` values.
- `{ type: 'toString' }`: returns a `Uint8Array` of length 0.
- `{ type: 'valueOf' }` and `{ type: 'hasOwnProperty' }`: `TypeError: Cannot convert undefined or null to object`.
- `{ type: '__proto__' }`: `TypeError: writer is not a function`.
- `{ type: 'zzzz' }`: `Error: No writer found for box type: zzzz`.

The read side is not affected: `readers[type] || readers[type.trim()]` (IsoBoxReadView.ts:463) only sees types of 4 characters or fewer, and `Object.prototype` has no property name that short (checked at run time).

**Proposal of the finder.** Look up the writer with `Object.hasOwn(writers, type)` before the call, or build the internal map with a null prototype. As an alternative, reject a `type` that is not 4 characters with the documented error, which also covers the known finding on four-character fields. Add one test for `constructor` and `__proto__`.

**Proposal after verification.** Not a breaking change: only type strings that are not valid box types change, from empty bytes or a `TypeError` to the documented `Error: No writer found for box type`. Drop the null-prototype option, because adopters pass their own plain-object `writers` map and a copy on each call costs an allocation. Drop the length check from this finding and leave it to the finding on four-character fields. Corrected proposal: in the write dispatch of version 2.0.0 (the code that replaces `writeBox` under the cursor RFC), guard the lookup with `Object.hasOwn(writers, type)`, for example `const writer = writers !== undefined && Object.hasOwn(writers, type) ? writers[type] : undefined`. `dist` already ships ES2022, so `Object.hasOwn` needs no polyfill. Add one test for `constructor` and one for `__proto__` that expect `No writer found for box type`. If the length check of the other finding lands, this guard is redundant except for nothing (every `Object.prototype` name is longer than 4 characters), so do only one of the two.


## F214: Only emsg has a literal type for `version`. The other 55 full box types use `number`, and the emsg helper type exposes an internal type parameter.

Severity low. Category consistency. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A narrower `version` type on more boxes rejects hand-built boxes with other versions at compile time.

**Files.** `libs/iso-bmff/src/boxes/FullBox.ts:7`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:50`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:65`, `libs/iso-bmff/src/boxes/SegmentIndexBox.ts:11`

**Evidence.** FullBox.ts:7 `version: number`. tsc reports that emsg is the only IsoBoxMap member whose `version` is not `number`. sidx, prft, ctts, tfdt, mvhd, tkhd, mdhd, elst, mehd, tfra, pssh, subs, and tenc also change their layout by version, and the settled rule is that a writer follows the version. `const sidx: SegmentIndexBox = { ..., version: 7, ... }` compiles. EventMessageBox.ts:50 `EventMessageBoxUnrecognizedVersionNumber<A extends number[] = [0, 1]>` builds a tuple of 256 elements by recursion, and its TSDoc says "Do not set this parameter."

**Proposal of the finder.** Keep `version: number` as the general rule, because a reader returns the value of the file. Move the range type into one internal helper and export `EventMessageBoxUnrecognizedVersionNumber` with no parameter. Reuse the same helper if another box gets a version union later. Do not add literal versions to other boxes unless the reader also returns a distinct shape for each version, as emsg does.

**Proposal after verification.** Remove the type parameter before the release that first publishes the type. The change then breaks no adopter. Keep the exported name and the values 2 to 255:

type ByteValue<A extends number[] = []> = A['length'] extends 256 ? A[number] : ByteValue<[...A, A['length']]>
export type EventMessageBoxUnrecognizedVersionNumber = Exclude<ByteValue, 0 | 1>

`ByteValue` stays out of the entry point. The API report then shows a second `ae-forgotten-export` warning next to the one for `ReadableStreamBase`. If the maintainers want no new warning, write the union of 2 to 255 as literal numbers in the exported type. The type test at libs/iso-bmff/test/int64.types.test.ts:846-851 passes with both forms. Do not add literal versions to other boxes, and keep `FullBox.version: number`.

**Prior decision.** PR 676 (commit 755330372, "fix(iso-bmff): follow the emsg syntax for version 2 or above", fixes issue 667) chose the literal 2 to 255 `version` for `EventMessageBoxUnrecognizedVersion` on purpose, so that `version === 0` and `version === 1` still narrow `EventMessageBox`. No decision covers the exposed type parameter `A`. That parameter is a detail of the implementation, not a choice.

## F215: With the `bigint` option, an emsg box of an unrecognized version has `presentationTime` as a `number`, which differs from the documented rule that each field has one type for every version.

Severity low. Category consistency. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The field type of `EventMessageBoxUnrecognizedVersion.presentationTime` and the returned value change for callers of the `bigint` option.

**Files.** `libs/iso-bmff/src/boxes/EventMessageBox.ts:67`, `libs/iso-bmff/src/readers/readEmsg.ts:70`, `libs/iso-bmff/docs/reading-boxes.md:164`

**Evidence.** EventMessageBox.ts:63-68 `EventMessageBoxUnrecognizedVersion = EventMessageBoxBase & { version: ...; presentationTimeDelta: number; presentationTime: number }` has no `V`, while `EventMessageBoxV1<V>` has `presentationTime: V`. readEmsg.ts:70 `presentationTime: 0`. The guide states at reading-boxes.md:164: "Each field has one type for every version of its box." With `readInt64AsBigInt`, `presentationTime` is a `bigint` for version 1 and the number 0 for version 2 or above.

**Proposal of the finder.** Either give the type the parameter (`EventMessageBoxUnrecognizedVersion<V>` with `presentationTime: V`, and the reader gets the zero through the `int64` function), or add one sentence on this exception to the table section of the reading guide. The decision to keep the known fields with empty values does not change.

**Proposal after verification.** Do not add a type parameter to `EventMessageBoxUnrecognizedVersion` and do not change `readEmsg`. Keep `presentationTime: number` and the literal 0. Fix the documentation only: after the sentence at libs/iso-bmff/docs/reading-boxes.md:164, add one sentence, for example: "One exception exists. An `emsg` box of a version other than 0 or 1 has no `presentationTime` field in the syntax, so the reader returns the number 0." Optionally add the same fact to the TSDoc of `EventMessageBoxUnrecognizedVersion` (EventMessageBox.ts:55-63), which now says only "the numbers are 0". This fix is not breaking and does not need the major version.

**Prior decision.** PR 676 (commit 755330372, "fix(iso-bmff): follow the emsg syntax for version 2 or above", fixes issue 667). The PR description states: "With the `bigint` mode of the `int64` option, `presentationTime` in that branch has the type `bigint | number`. The reader cannot create a zero of the type of the `int64` option, because the option is a function that reads bytes." Type test 20b in libs/iso-bmff/test/int64.types.test.ts:827-832 asserts this type.

## F415: Four box types have a second lowercase export, one box type file is dead, and one duplicate entry type exists.

Severity low. Category dead-code. Breaking: yes. Fact check: confirmed. Value check: confirmed.

**Why it breaks.** The exported types `co64`, `stz2`, `url`, and `urn` are removed.

**Files.** `libs/iso-bmff/src/boxes/ChunkLargeOffsetBox.ts:17`, `libs/iso-bmff/src/boxes/CompactSampleSizeBox.ts:18`, `libs/iso-bmff/src/boxes/DataEntryUrlBox.ts:16`, `libs/iso-bmff/src/boxes/DataEntryUrnBox.ts:17`, `libs/iso-bmff/src/boxes/CompTimeToSampleEntry.ts:6`, `libs/iso-bmff/config/cml-iso-bmff.api.md:62`

**Evidence.** `export type co64 = ChunkLargeOffsetBox`, `export type stz2 = CompactSampleSizeBox`, `export type url = DataEntryUrlBox`, `export type urn = DataEntryUrnBox`. Each has only `@public` as its doc. No other box of the 100 in `IsoBoxMap` has such an alias, and a search of src, test, docs, and the README finds no use. The API report lists all four. `CompTimeToSampleEntry.ts` declares the same shape as `CompositionTimeToSampleEntry`, `boxes/index.ts` does not export the file, and no file imports it.

**Proposal of the finder.** Delete the four aliases and the file `CompTimeToSampleEntry.ts`. An adopter who wants a type by its code uses `IsoBoxMap['co64']`, which the writing guide already documents.

**Proposal after verification.** Split the work. Delete src/boxes/CompTimeToSampleEntry.ts at any time: no index exports the file, so the deletion is not a breaking change and needs no migration note. Remove the aliases `co64`, `stz2`, `url`, `urn` in 2.0.0 with a changelog migration line: use `ChunkLargeOffsetBox`, `CompactSampleSizeBox`, `DataEntryUrlBox`, `DataEntryUrnBox`, or `IsoBoxMap['co64']`, `IsoBoxMap['stz2']`, `IsoBoxMap['url ']`, `IsoBoxMap['urn ']` (the keys of `url ` and `urn ` have a trailing space).


## F285: An invalid `maxDepth` makes the traversal yield nothing, so findIsoBox reports "not found" for a configuration error.

Severity low. Category errors. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A call with a negative or NaN `maxDepth` throws where it returned an empty result.

**Files.** `libs/iso-bmff/src/traverseIsoBoxes.ts:25`, `libs/iso-bmff/src/TraverseIsoBoxesConfig.ts:19`

**Evidence.** traverseIsoBoxes.ts:25-27 `if (maxDepth < 0 || typeof maxDepth !== 'number' || Number.isNaN(maxDepth)) { return }`. With `{ maxDepth: -1 }` or a NaN from a calculation, `findIsoBox` returns null and `filterIsoBoxes` returns `[]`, the same results as a tree with no match. No test covers this branch (no negative or NaN `maxDepth` in test/traverseIsoBoxes.test.ts, findIsoBox.test.ts, filterIsoBoxes.test.ts).

**Proposal of the finder.** Throw `RangeError('maxDepth must be a number of 0 or more, received ' + maxDepth)`. Because the function is a generator, the error appears on the first `next()` call. Add a test for both cases. If a silent result is preferred, document it in the TSDoc of `maxDepth` and add the test.

**Proposal after verification.** Do not put the throw inside the recursive generator body. Validate once at the public entry and move the recursion into an internal generator that carries a depth counter:

1. Make `traverseIsoBoxes` a plain function that returns `Generator<T>`. It checks `if (!(maxDepth >= 0)) throw new RangeError('maxDepth must be a number of 0 or more, received ' + maxDepth)` (one comparison covers negative, NaN, and non-numeric values), then returns the internal generator. The error then appears at the call, not at the first `next()`.
2. The internal generator takes `(boxes, depthFirst, maxDepth, depth)` and recurses with `depth + 1`. This removes the guard and the `{ depthFirst, maxDepth: maxDepth - 1 }` object allocation per container, and makes depth-first and breadth-first agree for fractional depths (today 0.5 gives [moov] depth-first and [moov,trak] breadth-first).
3. Add tests for -1, NaN, and a fractional depth in both modes. State the accepted range in the TSDoc of `maxDepth`.

Non-breaking alternative if the throw is not wanted: keep the silent return, apply step 2 only for the internal recursion, document "a negative or NaN value yields no boxes" in TraverseIsoBoxesConfig.ts, and add the tests. That variant is do-anytime.


## F288: The stream writes the first box inside the constructor, so an error for the first box is thrown synchronously and an error for a later box rejects a read.

Severity low. Category errors. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The error for the first box moves from a synchronous throw of `createIsoBoxReadableStream` to a rejected read. The first box is written on the first read and not at construction.

**Files.** `libs/iso-bmff/src/IsoBoxReadableStream.ts:53`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:39`

**Evidence.** IsoBoxReadableStream.ts:53 `super({ start: pull, pull })`. `start` runs in the constructor with `desiredSize` 1, so line 48 `controller.enqueue(writeIsoBox(next.value, cfg))` runs once before the constructor returns. A node replica of lines 36-53 confirms it: one box is written at construction, a writer error for box 1 is thrown by the constructor ("sync throw from constructor: No writer found"), and the same error for box 2 rejects `reader.read()`. A lazy iterable also has its first item consumed before any consumer exists.

**Proposal of the finder.** Pass only `pull` to the `ReadableStream` constructor. Every box is then written on demand and every writer error reaches the consumer the same way, as a rejected read.

**Proposal after verification.** Removing `start` alone makes the error path uniform, but it does not make the stream on demand: the default high water mark of 1 still writes the first box a microtask after construction, with no consumer. For both properties, write one box per `pull` call and set the high water mark to 0:

super({ pull(controller) { const next = iterator.next(); if (next.done) { controller.close() } else { controller.enqueue(writeIsoBox(next.value, cfg)) } } }, { highWaterMark: 0 })

A node 24 replica (scratchpad f288/probe2.mjs) confirms it: zero items consumed with no reader, one item after one read, box 1 and box 2 errors both reject the read, and `pipeTo` and `for await` deliver all boxes in order. Dropping the `desiredSize` loop also removes a latent double `controller.close()` if the size were ever above 1. If the maintainers prefer one prebuffered box, pass only `pull` and keep the loop, and state in the changelog that only the error path changes. Either way, add a test that a writer error for the first box rejects the read, and one changelog line for the migration: a first-box error no longer throws from `createIsoBoxReadableStream` or `new IsoBoxReadableStream`.


## F169: `defaultReaderConfig` and `defaultWriterConfig` are functions with the names of constants and no package token.

Severity low. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Two public function names change.

**Files.** `libs/iso-bmff/src/readers/defaultReaderConfig.ts:84`, `libs/iso-bmff/src/writers/defaultWriterConfig.ts:74`, `libs/iso-bmff/config/cml-iso-bmff.api.md:146`

**Evidence.** `export function defaultWriterConfig(): IsoBoxWriteViewConfig` allocates a new object for each call. Every other function of the package that builds a value starts with `create`: `createInt64OverflowReader`, `createIsoBoxReadableStream`, `createAudioSampleEntryReader`. cmcd and id3 put the package token in nearly every public name.

**Proposal of the finder.** Rename to `createDefaultIsoBoxReadConfig` and `createDefaultIsoBoxWriteConfig`, in step with the new config type names.

**Proposal after verification.** If the maintainers want the `create` verb, add the verb only: `createDefaultReaderConfig` and `createDefaultWriterConfig`. Keep `Reader` and `Writer`, because they match the `readers` and `writers` maps that the cursor RFC keeps. Add no `IsoBox` token, in line with `createInt64OverflowReader` and `createAudioSampleEntryReader`. Do not derive the names from config type names that no RFC defines. Record the rename in rfc/iso-bmff-cursor-api.md, because that RFC promises that the names of the int64 RFC do not change, and update the `defaultReaderConfig` signatures of rfc/uint64-reader-config.md by reference. Keeping the current names is also a valid result: the read call `readIsoBoxes(buffer, defaultReaderConfig())` then compiles unchanged in 2.0.0.

**Prior decision.** No decision on the verb itself. PR 301 (a31419299, issue 298) introduced the names and chose a function over the constant that the issue requested. The accepted RFCs rfc/uint64-reader-config.md (lines 84-95, 200-209, 227) and rfc/iso-bmff-container-readers-writers.md:162 use the names in their contracts, and rfc/iso-bmff-cursor-api.md:241 says the names of both RFCs do not change.

## F175: `WebVttCueChild` is the only child alias without `Box` in its name, and `WebVttSettingsBox` drops the word `Cue` that its own TSDoc and its sibling types keep.

Severity low. Category naming. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Two public type names change.

**Files.** `libs/iso-bmff/src/boxes/WebVttCueBox.ts:9`, `libs/iso-bmff/src/boxes/WebVttSettingsBox.ts:2`, `libs/iso-bmff/config/cml-iso-bmff.api.md:1592`

**Evidence.** `export type WebVttCueChild = ...` next to 25 aliases of the form `<BoxType>Child`, such as `TrackBoxChild`. TSDoc of `WebVttSettingsBox`: "ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box", while `WebVttCueIdBox` and `WebVttCuePayloadBox` keep `Cue`. The text of ISO/IEC 14496-30 was not available, so I did not compare the names with its syntax classes.

**Proposal of the finder.** `WebVttCueBoxChild` (or remove it with the other child aliases) and `WebVttCueSettingsBox`. Check all seven WebVTT type names against the 14496-30 text before 2.0.0.

**Proposal after verification.** Rename `WebVttCueChild` to `WebVttCueBoxChild` and `WebVttSettingsBox` to `WebVttCueSettingsBox`. In the same change, add the settings box to the union: `export type WebVttCueBoxChild = WebVttCueIdBox | WebVttCueSettingsBox | WebVttCuePayloadBox`. Then remove the cast at test/readers/readSttg.test.ts:19 (narrow by `type === 'sttg'`). Drop the alternative "remove it with the other child aliases": no RFC removes them. Remove the period from the TSDoc titles of the three files (WebVttSettingsBox.ts:2, WebVttCueIdBox.ts:2, WebVttCuePayloadBox.ts:2 all end with a period). Before 2.0.0, read the 14496-30 syntax and check the other names, in particular `WebVttEmptySampleBox` for `vtte` (the spec class may be `VTTEmptyCueBox`) and the missing `ctim` and `vsid` children. The spec text was not available here, so those names stay unverified. The changelog needs a migration line for each renamed type.


## F75: ProducerReferenceTimeBox splits the spec field `ntp_timestamp` into two fields with abbreviated names and no documentation.

Severity low. Category naming. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Only if the fields are renamed. A documentation-only fix is not breaking.

**Files.** `libs/iso-bmff/src/boxes/ProducerReferenceTimeBox.ts:12`, `libs/iso-bmff/src/boxes/ProducerReferenceTimeBox.ts:13`, `libs/iso-bmff/src/readers/readPrft.ts:25`

**Evidence.** Spec 8.16.5.2: `unsigned int(64) ntp_timestamp;`. Type: `ntpTimestampSec: number` and `ntpTimestampFrac: number`, no TSDoc. readPrft.ts:25-26 reads two 32-bit values. The split is reasonable, because a number cannot hold the 64-bit value. The names `Sec` and `Frac` are not spec names, and the type does not say that the two fields are the halves of one spec field or that the seconds count from 1900.

**Proposal of the finder.** Keep the split. Rename to `ntpTimestampSeconds` and `ntpTimestampFraction`, and add TSDoc: the upper and the lower 32 bits of `ntp_timestamp`, in NTP format (RFC 5905). If the rename is not wanted, add only the TSDoc.

**Proposal after verification.** Keep the split, keep the `number` type, and keep the names `ntpTimestampSec` and `ntpTimestampFrac`. Do the documentation fix only, in any release (not breaking):
1. Add field docs in ProducerReferenceTimeBox.ts in the style of TrackEncryptionBox.ts. `ntpTimestampSec`: the upper 32 bits of `ntp_timestamp`, the seconds since 1900-01-01 UTC in NTP format (RFC 5905). `ntpTimestampFrac`: the lower 32 bits of `ntp_timestamp`, the fraction of a second in units of 2^-32 seconds.
2. In docs/reading-boxes.md near line 101, add one sentence: the `ntp_timestamp` field of `prft` is not in the table, because the reader returns the field as two 32-bit numbers.
The rename to `ntpTimestampSeconds` / `ntpTimestampFraction` is a matter of taste (worth "optional"). It breaks adopters, it leaves the names that shaka-player and dash.js use, and neither form is a spec name. Do the rename only if the major version adopts a package-wide rule against abbreviated field names, and then apply it as part of that rule, not as a single-box change.

**Prior decision.** Partial. PR 645 (2aca3e3e9, rfc/uint64-reader-config.md:56 and test/int64.types.test.ts:244) deliberately keeps `ntpTimestampSec` a `number` outside the `int64` option, so the split and the `number` type are intentional. No prior decision covers the names `Sec` and `Frac`. They come from the first import (8ac3ef9b9) and copy codem-isoboxer.

## G517: Three field names differ from the spec name by more than casing: `mfraSize`, `defaultIvSize`, and `subsampleEncryption`, and `TrackEncryptionBox` mixes the names of two editions.

Severity low. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Each rename changes a public field name of a box type and the object that the reader returns.

**Files.** `libs/iso-bmff/src/boxes/MovieFragmentRandomAccessOffsetBox.ts:10`, `libs/iso-bmff/src/readers/readMfro.ts:18`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:19`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:51`, `libs/iso-bmff/src/boxes/EncryptedSample.ts:10`, `libs/iso-bmff/src/boxes/SubsampleEntry.ts:11`

**Evidence.** Answer to question 7. mfro: the 2015 syntax is `unsigned int(32) size;`, the package field is `mfraSize: number` (readMfro.ts:18 `mfraSize: view.readUint(4)`), a changed word with no TSDoc that gives the spec name. tenc: the 2016 syntax is `unsigned int(8) default_Per_Sample_IV_Size;`, the package field is `defaultIvSize` (TrackEncryptionBox.ts:18 has the TSDoc "`default_Per_Sample_IV_Size`" on line 19 `defaultIvSize: number`). The short name and `defaultIsEncrypted` match the first edition of 23001-7 as I remember it (that text was not available), while `defaultConstantIvSize`, `defaultCryptByteBlock` and `defaultIsProtected` are 2016 names, so one type mixes two editions. senc sample: the loop `{ BytesOfClearData; BytesOfProtectedData } [subsample_count]` has no name in the spec, the package names it `subsampleEncryption` (singular, EncryptedSample.ts:10), and subs names the list with the same count stem `subsamples` (SubsampleEntry.ts:11). senc has no reader. All other differences are casing only (`track_ID` to `trackId`, `SAP_type` to `sapType`, `KID` to `kid`, `schemeURI` to `schemeUri`). `Id` is used in every field and `ID` in none, so that rule is consistent. No field adds or drops a unit apart from the already reported prft fields. The already reported names (`sampleDependencyTable`, `ntpTimestampSec`, `rangesCount`, `reference`, `sap`, `compressorName`) are not repeated here.

**Proposal of the finder.** Rename `defaultIvSize` to `defaultPerSampleIvSize`, together with the already reported cleanup of the tenc bit fields, so the type uses 2016 names only. Rename `subsampleEncryption` to `subsamples`, or remove the type with the other types that have no reader. For mfro, check the current edition first. If it names the field `parent_size` (I recall that it does, but the text was not available), rename to `parentSize`. If it is still `size`, keep `mfraSize`, because `size` is the name of the box header field, and add TSDoc that gives the spec name. Each rename is a break.

**Proposal after verification.** Split the finding into three items.

1. tenc (do-in-major): do the rename only as one change with the tenc bit-field finding. Remove the 24-bit `defaultIsEncrypted`, make `defaultIsProtected` the required field that `writeTenc` writes, keep `defaultCryptByteBlock` and `defaultSkipByteBlock`, and rename `defaultIvSize` to `defaultPerSampleIvSize`. The type then has 2016 names only (23001-7:2016 clause 8.2.2). Update libs/drm/src/ensureEncryptedInit.ts:172-173 in the same change, and state the migration in the changelog. A rename of `defaultIvSize` with `defaultIsEncrypted` still present is not worth a break.

2. senc (optional, follows another finding): decide first whether `SampleEncryptionBox`, `EncryptedSample` and `SubsampleEncryption` stay, because the package has no reader or writer for `senc`. If the types stay, rename `EncryptedSample.subsampleEncryption` to `subsamples` and keep the element type name `SubsampleEncryption`, because `Subsample` is already the `subs` type. If the types go, no rename is needed.

3. mfro: keep `mfraSize` for now. Do not use the bare 2015 name `size`: on a box object, a reader takes `size` for the size of the box itself, even after the cursor RFC removes the header field. Rename to `parentSize` only after someone reads a later edition and confirms `parent_size` (I also recall that name, but the text was not available). Without a break, at any time: add TSDoc to `mfraSize` that gives the spec field name and its meaning (bytes of the enclosing `mfra` box), and correct the clause title in MovieFragmentRandomAccessOffsetBox.ts:4 to "Movie Fragment Random Access Offset Box".

**Prior decision.** No decision that chose these names. PR 658 (commit 60ae65d0f, fixes issue 648) kept `defaultIsEncrypted`, `defaultIvSize` and `defaultKid` on purpose, but only to avoid a break in a minor version ("A box that code builds today still compiles and writes the same bytes"). The names themselves date from 8ac3ef9b9 (CML Version 1, #265). A major version may revisit them.

## F212: stss and prsl wrap each number of a list in an object with one field, while the other number lists are plain arrays.

Severity low. Category performance. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** Two field names and their element types change in the public types and in the reader results.

**Files.** `libs/iso-bmff/src/boxes/SyncSample.ts:6`, `libs/iso-bmff/src/boxes/SyncSampleBox.ts:12`, `libs/iso-bmff/src/readers/readStss.ts:25`, `libs/iso-bmff/src/boxes/Entity.ts:6`, `libs/iso-bmff/src/readers/readPrsl.ts:23`, `libs/iso-bmff/src/boxes/ChunkOffsetBox.ts:12`

**Evidence.** SyncSample.ts:6-8 `export type SyncSample = { sampleNumber: number }` and readStss.ts:24-26 `view.readEntries<SyncSample>(entryCount, () => ({ sampleNumber: view.readUint(4) }))` allocate one object for each sync sample. Entity.ts:6-9 `{ entityId: number }` does the same for prsl. Lists of one number elsewhere are `number[]`: stco `chunkOffset`, stsz `entrySize`, sdtp `sampleDependencyTable`, saio `offset`, tref `trackIds`.

**Proposal of the finder.** `SyncSampleBox.sampleNumbers: number[]` and `PreselectionGroupBox.entityIds: number[]`. Remove the exported types `SyncSample` and `Entity`.

**Proposal after verification.** Use the spec field name, as stco, stsz, stz2, saio, and saiz do. `SyncSampleBox` becomes `{ type: 'stss'; entryCount: number; sampleNumber: number[] }` (spec: `sample_number`, 14496-12:2015 clause 8.6.2.2). `PreselectionGroupBox.entities: Entity[]` becomes `entityId: number[]`, if the current edition of the spec names the field `entity_id`. The 2015 text does not contain the box, so confirm the name against the current edition first. Remove the exported types `SyncSample` and `Entity`. `writeStss` and `writePrsl` write the numbers directly. Changelog migration: replace `box.entries.map((e) => e.sampleNumber)` with `box.sampleNumber`, and `box.entities.map((e) => e.entityId)` with `box.entityId`. If a different audit finding changes all one-column lists to plural names, apply that rule to these two fields too, so the package keeps one rule. Do not include the `Uint32Array` change of F300 in this fix. That change needs its own decision and a heap measurement on a long non-fragmented file.


## G516: `sidx` is the only box with a counted list whose reader does not return the count, while `ssix`, which the spec ties to it, returns two counts.

Severity low. Category reader-writer-asymmetry. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A new required `referenceCount` field breaks every `SegmentIndexBox` literal. The other direction removes the count fields of the other box types, which is a break of the same kind.

**Files.** `libs/iso-bmff/src/readers/readSidx.ts:28`, `libs/iso-bmff/src/readers/readSidx.ts:46`, `libs/iso-bmff/src/boxes/SegmentIndexBox.ts:17`, `libs/iso-bmff/src/writers/writeSidx.ts:49`, `libs/iso-bmff/src/readers/readSsix.ts:16`, `libs/iso-bmff/src/readers/readSsix.ts:18`

**Evidence.** Answer to question 6. readSidx.ts:28 `const referenceCount = readUint(2)` is a local value. The returned object (lines 46 to 56) has no count, and `SegmentIndexBox` has only `references: SegmentIndexReference[]`. writeSidx.ts:49 `writer.writeUint(box.references.length, 2)`. Every other reader of a counted list returns the count: stts, ctts, stss, stsc, stco, elst, dref, stsd, subs (`entryCount` and `subsampleCount`), stsz and trun (`sampleCount`), tfra (`numberOfEntry`), ssix (readSsix.ts:16 `subsegmentCount`, line 18 `rangesCount`), pssh (`kidCount`, `dataSize`), prsl (`numEntitiesInGroup`), tenc (`defaultConstantIvSize`). The spec says that `subsegment_count` of ssix "shall be equal to reference_count" of the sidx box before it, and the package gives the first as a field and the second only as `references.length`. Other fields that a reader derives and the writer ignores: labl `isGroupLabel` (separate finding), and the already reported tenc `defaultIsProtected`, sidx `reference` and `sap`, and tfra `reserved`. I found no field that a writer needs and the reader does not return: `writeSidx` takes the count from the array.

**Proposal of the finder.** Treat sidx as the model for the count-field finding that is already reported: the reader returns the list, the writer writes `list.length`, and the type has no count field. If the decision is to keep count fields, add `referenceCount` to `SegmentIndexBox` so that all counted lists follow one rule. Do not keep both forms.

**Proposal after verification.** Do not add `referenceCount` to `SegmentIndexBox`. Keep sidx as it is and decide issue 625 in the 2.0.0 work with this rule: if a list in the box gives the count, the type has no count field, the reader returns the list only, and the writer writes `list.length`. This removes `entryCount` from stts, stss, stsc, stco, elst, dref, stsd and subs, `subsampleCount` from the subs entry, `subsegmentCount` and `rangesCount` from ssix, `numberOfEntry` from tfra, and `numEntitiesInGroup` from prsl. Keep a count field only where no list gives the count: `sampleCount` of stsz (a `sampleSize` other than 0 has no list) and `entryCount` of ctts for version 2 or above (PR 674). Three cases need an explicit answer in the same decision: trun `sampleCount` (with no per-sample flags the list holds only empty objects), pssh `kidCount` and `dataSize` (flat byte lists), and the types with no reader such as saiz, saio, sbgp, sgpd, iinf and stz2. Record the rule in the cursor RFC or a short RFC, as issue 625 asks, and close this finding as a duplicate of the count-field finding and issue 625. The ssix and sidx relation then reads as `ssix.subsegments.length === sidx.references.length`.

**Prior decision.** No decision makes the sidx form intentional. Open issue 625 ("iso-bmff: writers use the count field of a box, not the length of its list") already records the inconsistency, names `writeSidx` as one of three writers that use the list length, and leaves the rule undecided. PR 674 (issue 670, commit e89d4eb8a) is a settled decision that limits the proposal: `ctts` of version 2 or above keeps `entryCount` with an empty `entries` list. PR 672 (issue 666) made `readDref` and `readStsd` return no entries for a count of 0, which is consistent with a rule that uses the list length.

## F106: The three length fields of `tfra` have the type `number`, and `writeTfra` neither masks nor checks them.

Severity low. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The field types narrow from `number` to `0 | 1 | 2 | 3`, so code that passes a plain `number` no longer compiles.

**Files.** `libs/iso-bmff/src/boxes/TrackFragmentRandomAccessBox.ts:15`, `libs/iso-bmff/src/writers/writeTfra.ts:45`, `libs/iso-bmff/src/writers/writeTfra.ts:53`, `libs/iso-bmff/src/IsoBoxWriteView.ts:69`

**Evidence.** Spec 8.8.10.2: `unsigned int(2) length_size_of_traf_num;` (0 to 3). TrackFragmentRandomAccessBox.ts:15-17 declare `number`. writeTfra.ts:45 `(box.lengthSizeOfTrafNum << 4) | (box.lengthSizeOfTrunNum << 2) | box.lengthSizeOfSampleNum` has no `& 3`, so a value of 4 changes the bits of the next field. writeTfra.ts:53 `writer.writeUint(entry.trafNumber, box.lengthSizeOfTrafNum + 1)` then asks for 5 bytes, and the `switch (size)` in IsoBoxWriteView.ts:69 has no case for 5: it writes nothing and moves the cursor.

**Proposal of the finder.** Declare the three fields as `0 | 1 | 2 | 3`, so a wrong value fails at compile time. Mask each value with `& 3` in the writer.

**Proposal after verification.** Split the finding into two parts.

Part 1 (do-anytime, not breaking): `writeTfra` computes the three length sizes one time with `& 3` and uses the masked values in all three places: the packed word (line 45), the entry size (lines 25 to 27), and the field widths (lines 53 to 55). A mask on the packed word alone leaves the box size and the field widths wrong. This follows `writeSidx`, `writeTenc`, and `writeMdhd`. With the cursor RFC, `writeTfra` selects `writeUint8`, `writeUint16`, `writeUint24`, or `writeUint32` from the masked value, so the case of an unknown size no longer exists.

Part 2 (optional, breaking, major only): do not narrow the three `tfra` fields alone. If the maintainers want literal types for bit fields, decide one rule for the package and apply it to `tfra`, `sidx` (`referenceType`, `startsWithSap`, `sapType`), and `iloc` (`offsetSize`, `lengthSize`, `baseOffsetSize`) in the same change. Without that rule, keep `number`.

Related note for the major version: `TrackFragmentRandomAccessBox.reserved` (TrackFragmentRandomAccessBox.ts:13) holds the complete 32-bit word, which includes the three length sizes. `readTfra` returns it (readTfra.ts:45) and `writeTfra` never reads it. The spec defines the 26 reserved bits as the constant 0. Removing the field is a separate breaking change to consider.


## F210: CONTAINERS is a public mutable `string[]` that repeats the keys of IsoBoxContainerMap with no check that the two agree.

Severity low. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The exported type changes from `string[]` to a readonly tuple of literals, so `CONTAINERS.push(...)` stops compiling.

**Files.** `libs/iso-bmff/src/utils/CONTAINERS.ts:6`, `libs/iso-bmff/src/IsoBoxContainerMap.ts:27`, `libs/iso-bmff/src/utils/isContainer.ts:29`, `libs/iso-bmff/src/utils/writeBox.ts:30`, `libs/iso-bmff/src/IsoBoxContainerMap.ts:23`

**Evidence.** CONTAINERS.ts:6 `export const CONTAINERS: string[] = [ 'dinf', ... ]`. Checked with node: `Object.isFrozen(CONTAINERS)` is false, and tsc accepts `CONTAINERS.push('zzzz')`, which changes the reader, the writer, and the traversal for every caller in the process. IsoBoxContainerMap lists the same 19 keys by hand. The TSDoc of IsoBoxContainerMap is also wrong: "Map of container box types to their allowed child box types", while each value is the container type itself.

**Proposal of the finder.** `export const CONTAINERS = ['dinf', ...] as const satisfies readonly (keyof IsoBoxContainerMap)[]`, plus a type test that `(typeof CONTAINERS)[number]` equals `keyof IsoBoxContainerMap`. The literal element type also gives `includes` callers a completion list. Correct the TSDoc sentence.

**Proposal after verification.** Keep the element type `string` and make the array readonly: `export const CONTAINERS: readonly string[] = ['dinf', ...] satisfies (keyof IsoBoxContainerMap)[]`. I compiled this form: `CONTAINERS.includes(box.type)` still accepts a `string`, `CONTAINERS.push('x')` is a compile error, and a misspelled or extra entry is a compile error. The break for adopters is small: `push` and other mutating calls stop compiling, and so does passing the list to a parameter of type `string[]`. No run-time value and no written byte changes. Keep the existing tests (containerReaders.test.ts:86, containerWriters.test.ts:102) as the check for a missing key, because `satisfies` does not detect one. Do not use the literal tuple (`as const`) or `readonly (keyof IsoBoxContainerMap)[]`: both make `includes(box.type)` a compile error for adopters and for isContainer.ts:29 and writeBox.ts:30. Adopters who need the literal union already have `keyof IsoBoxContainerMap`. Change the TSDoc of CONTAINERS to state that the list is read-only and that `readIsoBoxes` and `writeIsoBoxes` handle these types as containers. Correct the TSDoc of IsoBoxContainerMap to "Map of container box types to their box types". The TSDoc fix does not break adopters and can ship at any time. Treat the rename and the `switch` lookup as separate optional items, and measure the lookup in the cursor read loop first.

**Prior decision.** rfc/iso-bmff-container-readers-writers.md:151 states "Existing exports. `CONTAINERS` and `isContainer` do not change", and line 172 requires the test that compares `CONTAINERS` with the named readers and writers. That RFC was scoped to a minor version, so it records no decision that `string[]` is the intended type. The TSDoc error has no prior decision.

## F284: `depthFirst?: boolean` selects between two named orders with a boolean whose `false` value means a different algorithm.

Severity low. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A public option is renamed and its type changes.

**Files.** `libs/iso-bmff/src/TraverseIsoBoxesConfig.ts:12`, `libs/iso-bmff/src/traverseIsoBoxes.ts:22`

**Evidence.** TraverseIsoBoxesConfig.ts:8-12 "Whether to traverse the boxes depth-first or breadth-first." / `depthFirst?: boolean`. A call site reads `{ depthFirst: false }` for breadth-first order. AGENTS.md, Developer Experience: "Use union and literal types, so autocomplete guides adopters to valid values."

**Proposal of the finder.** Replace with `order?: 'depth-first' | 'breadth-first'`, default `'depth-first'`. State in the TSDoc that both orders yield a parent before its children.

**Proposal after verification.** Split the finding in two. (1) Non-breaking, do anytime: keep `depthFirst?: boolean` and fix the TSDoc at TraverseIsoBoxesConfig.ts:8. State that `true` selects depth-first order, that `false` selects breadth-first order, and that both orders yield a parent before its children. (2) Optional, only in the major: rename to `order?: 'depth-first' | 'breadth-first'` with default `'depth-first'`. If the maintainers choose the rename, the changelog needs a migration line (`depthFirst: false` becomes `order: 'breadth-first'`) and a warning that JavaScript callers who keep `depthFirst: false` get depth-first order with no error. The rename also changes the config of `findIsoBox` and `filterIsoBoxes`, and the RFC sentence at rfc/iso-bmff-cursor-api.md:191 needs an update. The gain of the rename is a matter of taste, because the boolean has exactly two states and no third order is planned.

**Prior decision.** No decision chose the boolean over a union. PR 289 (commit 3102f626e, 1.0.0-alpha.4, CHANGELOG.md:256) moved `depthFirst` from a positional argument into `TraverseIsoBoxesConfig` and kept the boolean. The draft RFC rfc/iso-bmff-cursor-api.md:191 says `traverseIsoBoxes`, `findIsoBox`, and `filterIsoBoxes` do not change, which is a scope statement of a draft and not an acceptance of the option's shape.

## F33: EventMessageBoxUnrecognizedVersionNumber exposes a type parameter that adopters must not set

Severity low. Category type-design. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Removes a type parameter from a public type.

**Files.** `libs/iso-bmff/src/boxes/EventMessageBox.ts:46`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:50`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:67`

**Evidence.** `@typeParam A - The list of versions that the type builds. Do not set this parameter.` on `export type EventMessageBoxUnrecognizedVersionNumber<A extends number[] = [0, 1]> = A['length'] extends 256 ? ... : EventMessageBoxUnrecognizedVersionNumber<[...A, A['length']]>`. The recursion counter is part of the public signature. The literal 2 to 255 version is a settled decision, and this finding concerns only the form of the type. In the same type, `presentationTime: number` is not `V`, so with `readInt64AsBigInt` the field is a bigint for version 1 and the number 0 for an unknown version.

**Proposal of the finder.** Move the recursion into one shared helper for an 8-bit value (for example `IsoUint8`, with the counter parameter there) and export `EventMessageBoxUnrecognizedVersionNumber = Exclude<IsoUint8, 0 | 1>` with no parameter. Other full boxes with literal versions can use the same helper. Document the number type of `presentationTime` for an unknown version in the reading guide table of 64-bit fields.

**Proposal after verification.** Do not add a public `IsoUint8` helper. If the parameter is worth removing, remove it before the first release that contains the type, so no adopter breaks. Keep the recursion in a helper type in EventMessageBox.ts that the entry point does not export, and export `EventMessageBoxUnrecognizedVersionNumber = Exclude<Helper, 0 | 1>` with no parameter. Cost: api-extractor adds an `ae-forgotten-export` warning to the API report, as it already does for `ReadableStreamBase` (cml-iso-bmff.api.md:479). If that warning is not acceptable, keep the current form, because the parameter has a default and a TSDoc note, and misuse only changes a type that the adopter wrote. Leave `presentationTime: number` as is. Optionally add one sentence to the 64-bit field table in docs/reading-boxes.md: for an `emsg` box of a version other than 0 or 1, `presentationTime` is the number 0 in every mode.

**Prior decision.** PR 676 (commit 755330372, fixes issue 667, merged 2026-11-16) chose the literal 2 to 255 version type and chose `presentationTime: number` for an unrecognized version on purpose. The PR description documents the `bigint | number` result, and test 20b in libs/iso-bmff/test/int64.types.test.ts:828-831 pins it. The form of the type (the recursion counter as a defaulted parameter) has no recorded decision. The type is unreleased (CHANGELOG.md:28-29 under [Unreleased], published version 1.0.7).

## F418: Fields with a fixed length are `number[]`, and the writers pad a short array with 0 and ignore extra elements.

Severity low. Category type-design. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A tuple type rejects a `number[]` value that adopters pass today.

**Files.** `libs/iso-bmff/src/boxes/MovieHeaderBox.ts:24`, `libs/iso-bmff/src/boxes/TrackHeaderBox.ts:26`, `libs/iso-bmff/src/boxes/VideoMediaHeaderBox.ts:11`, `libs/iso-bmff/src/writers/writeMvhd.ts:59`, `libs/iso-bmff/src/writers/writeVmhd.ts:27`, `libs/iso-bmff/src/IsoBoxWriteView.ts:297`

**Evidence.** The matrix is consistent between the two boxes that have one: mvhd and tkhd both have `matrix: number[]`, both decode a, b, c, d, x, y as 16.16 and u, v, w as 2.30, and both have the same field doc. The type does not state the length 9. vmhd `opcolor: number[]` has 3 values. The writers take a fixed count from `writeArray`: `for (let i = 0; i < length; i++) { write(data[i] ?? 0, size) }`. A matrix of 6 values writes three zero entries, so w is 0, with no error.

**Proposal of the finder.** Type `matrix` as a tuple of 9 numbers and `opcolor` as a tuple of 3 numbers, so a wrong length is a compile error. If the tuple is too strict for callers that build arrays at run time, keep `number[]` and document the padding rule on the field. This item has the lowest priority of the list.

**Proposal after verification.** Apply the tuple with one stated rule: a fixed-length field whose positions each have their own meaning is a labeled tuple. That rule covers exactly `matrix` and `opcolor`. Declare `matrix: [a: number, b: number, u: number, c: number, d: number, v: number, x: number, y: number, w: number]` in MovieHeaderBox and TrackHeaderBox, and `opcolor: [red: number, green: number, blue: number]` in VideoMediaHeaderBox. Share one type alias for the matrix between the two boxes, and export it only if adopters need to name it. Do not use `readonly`, so the reader result stays assignable to `number[]`. Keep the run-time padding of `writeArray` (or its cursor replacement) for JavaScript callers, with no throw. Do not extend the tuple to byte strings (`systemId`, `defaultKid`, `kid`, `compressorName`) or to reserved fields: those need their own decision (`Uint8Array`, or removal). Leave the identity-matrix default for a missing `matrix` out of this item. Today a missing `matrix` or `opcolor` throws a TypeError (`box.matrix.map` at writeMvhd.ts:60), which differs from the no-throw rule. Decide that case once for all writers, not for the matrix alone. Changelog migration note: a caller that builds the array at run time adds a cast or a tuple annotation.

**Prior decision.** No prior decision on the type. PR 620 (commit a13db9ace) pins the padding on purpose with the tests 'should write 0 for a missing matrix entry' (test/writers/writeMvhd.test.ts:73, test/writers/writeTkhd.test.ts:77). The padding follows the settled rule that a writer does not throw for a missing field (PR 626).
