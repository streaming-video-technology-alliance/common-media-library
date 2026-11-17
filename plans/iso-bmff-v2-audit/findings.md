# Audit of `@svta/cml-iso-bmff` before version 2.0.0

This file lists the findings. The maintainer decides each group. The "Result" column of each table states what happened to a row. `results.json` holds that column.

## Status on 2026-11-17

Briefs 1 and 2 of `briefs.md` are complete. Their PRs merged into `main`: 702, 703, 704, 705, 706, 708, 713, and 714. Brief 3 is complete: PR 682 has the amended cursor RFC at 8435c2ae0. Brief 4 has not started.

| Result for the 73 rows that break nothing | Rows |
| --- | --- |
| Done | 45 |
| Partly done. The rest waits for the cursor RFC, the second RFC, or the 2.0.0 release prep | 15 |
| Not done. The cursor work, brief 4, or issue 652 covers the row | 8 |
| Filed as an issue (710, 711) | 2 |
| Skipped, with the reason in the row | 3 |

The section "Carried to briefs 3 and 4" of `briefs.md` lists each part that waits.

## Method

The audit read the source at commit 8ce63c212. That commit is `main` plus the draft of the cursor RFC.

1. Twenty finder agents read the package. Eight of them compared each box with the specification text.
2. Two agents checked each finding. The first agent tried to refute the facts. The second agent searched for a prior decision and judged the value of the change.
3. A critic named seven missing probes. The same two checks ran on the findings of those probes.
4. The author of this file checked eight findings against the source: F152, F237, F94, F20, F270, F340, F327, and G466. All eight are correct.

| Step | Findings |
| --- | --- |
| Reported by the finders and the probes | 529 |
| After the merge of duplicates by an agent | 228 |
| After verification | 226 |
| After a second merge of duplicates by hand | 219 |

Limits of the audit:

- The audit read the package code of `main`. Version 2.0.0 builds on `main`.
- The audit read the first draft of the cursor RFC at commit 8ce63c212. The rows of the RFC group need a check against the later text of the RFC.
- The specification texts were ISO/IEC 14496-12:2015, 23001-7:2016, and 23000-19:2020. Later editions were not available.
- ISO/IEC 14496-15, 14496-30, and 23009-1 were not available. The `ardi`, `imda`, `labl`, and `grpl` boxes were not compared with a specification.
- The agents wrote the detail files. Only the eight findings above have a second check by hand.

## Groups

| Group | High | Medium | Low | Total |
| --- | --- | --- | --- | --- |
| Corrections to the cursor RFC | 4 | 22 | 4 | 30 |
| Breaking changes for 2.0.0 | 7 | 59 | 26 | 92 |
| Changes that break nothing | 0 | 11 | 62 | 73 |
| Rows that conflict with a recorded decision | 0 | 2 | 3 | 5 |
| New functions and new box types | 0 | 0 | 9 | 9 |
| Other packages and repository files | 1 | 5 | 4 | 10 |

## Decisions for the maintainer

The breaking rows form twelve themes. Each theme needs one decision.

1. **One field name for child boxes (F152).** `stsd` and `dref` keep child boxes in `entries`. Every other box uses `boxes`. `findIsoBox` therefore never reaches a sample entry or a `tenc` box. Recommendation: rename the field to `boxes`.
2. **Count fields (F190).** Twenty-four box types have a count field that repeats a list length. The writers use three rules for the field. A count that differs from the list throws or writes entries of zeros. Recommendation: remove the count fields, and each writer writes the list length. This rule closes issue 625. `stsz`, `saiz`, and `ctts` of version 2 or above keep their count.
3. **Types that match the run-time value (F188, F189, F270, F53, F173, F194, F85, G468, G522).** The result type of `readIsoBoxes` has parsed fields for a box that no reader read. The child types of 12 containers are closed lists. `isIsoBoxType` narrows a box with no fields to the complete type. Recommendation: build the result type from the readers map, and use one element type for every `boxes` list.
4. **Source bytes before the writer (F237).** A box that was read with no reader loses against a writer in the map. The writer writes zeros or throws. Recommendation: `writeIsoBoxes` copies a box that has a `bytes` field and uses the map for the other boxes.
5. **Byte fields (F199, G473, F418, F4, F72).** Bytes are `number[]` in `pssh`, `tenc`, and the sample entries, and `Uint8Array` in five other boxes. `kid` is one flat list for all key IDs. `compressorName` is 32 numbers. Recommendation: `Uint8Array` for bytes, one entry for each key ID, and a string for `compressorName`.
6. **Four-character codes (F400, F20).** The field is a string in three boxes and a number in the other boxes. The writers write `value.length` bytes, so a short brand moves every later field. Recommendation: a string in every box, and a writer that always writes 4 bytes.
7. **Names (F171, F88, F178, F280, F332, F405, F406, F411, F174, G513, G517).** The rows cover the `Box` suffix of the sample entry types, the three names for a parsed box, the config types that are named after the view classes, exports with no `Iso` token, `template` for fixed-point values, two casing rules for field names, and `readVttc` next to `readVttC`. Recommendation: decide the names once, in the RFC.
8. **Types with no reader and no writer (F204, F94, F415).** `IsoBoxMap` has 18 such box types. `TrackReferenceTypeBox` has a shape that no code produces. Four box types have a second lowercase export. Recommendation: remove each type or add its reader and writer.
9. **Errors (F229, F222, G457).** The package throws three error types with four message styles. The box iterator finds a truncated box by the text of an error message. An error from a custom reader with the same text silently drops a box. Recommendation: one error type for a short box, found by type and not by text.
10. **Strings (F224, G447, G449, F246, F409).** The `size` parameter has four rules. The writers of terminated strings write a U+0000 character that is inside the value. `writeMdhd` writes a wrong language code for `en-US` with no error. Recommendation: one size rule, and writers that stop at the first U+0000.
11. **Reserved fields (F200).** Ten box types have required `reserved` and `pre_defined` fields. Recommendation: remove the fields from the types, and each writer writes the value of the specification.
12. **Range check for a `number` (G446, rejected F239).** A `number` that does not fit its field wraps, and a `bigint` throws. The maintainer chose this rule on 2026-11-16 in PR 669. Recommendation: no change.

The RFC rows with the highest value:

- **G480.** The cursor type of the RFC is invariant in `V`. A model of the RFC types does not compile with TypeScript 6.0.3. The accepted `int64` RFC names the same problem for the view.
- **F240.** The RFC writes any box with a `boxes` field as a container. That rule reverses the decision of issue 651.
- **G462.** The raw box needs the header size. `@svta/cml-c2pa` reads the body of a box with no reader at four places.
- **G482.** The write cursor replaces `view` and `bytes` when the buffer grows. The public fields need `readonly`, and the contract needs a rule.
- **G497, G498.** The Summary states that the trial build is faster in every scenario, and one table row is slower. The reader count and the writer count are wrong.
- **G499, G502.** The RFC makes text of the two accepted RFCs wrong and has no migration guide.

One row of the last group is urgent. **G466**: `parsePsshList` in `@svta/cml-drm` does not return for a box with a size of 0. The author of this file reproduced the defect. The input comes from the media. Issue 683 records the defect and the proposed fix. PR 685 fixed the defect, and drm 1.1.13 is published.

## Proposed order

| Step | Work | Rows | Needs | Status |
| --- | --- | --- | --- | --- |
| 1 | Fix G466 in drm (issue 683) | 1 | No decision. A patch release of drm | Done. PR 685, drm 1.1.13 |
| 2 | Amend the cursor RFC | 30 | No code. One revision of the draft | Done (brief 3). PR 682 at 8435c2ae0 |
| 3 | Fix the rows that break nothing | 73 | No decision. 37 rows are documentation | Done (briefs 1 and 2). See "Status on 2026-11-17" |
| 4 | Decide the twelve themes | 92 | RFC text, because each theme changes the public API | Not started (brief 4) |
| 5 | Implement the themes on the 2.0.0 branch | 92 | Step 4. One PR for each theme | Waits for step 4 |
| 6 | Record the other rows as issues | 18 | The maintainer selects the rows | Done. Issues 683 and 686 to 701 |

The size of each step in hours is not estimated.

## Corrections to the cursor RFC

Each row names a defect or a gap in `rfc/iso-bmff-cursor-api.md`. Fix these rows before the RFC is accepted. Details: `details-rfc.md`.

| ID | Severity | Category | When | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| G462 | high | api-surface | any time | The raw box of the RFC has no header size, so the four c2pa call sites that read the body of a box with no reader must parse the header by hand. | Question 16 of the RFC in PR 682 (8435c2ae0): `headerSize` on the raw box, default yes |
| F240 | high | behavior | any time | The RFC contract writes any box with a `boxes` field and no writer as a container, which reverses the tested rule of version 1 and would write a `meta` box or a sample entry with no fields. | Done in PR 682 (8435c2ae0). The contract states the rule of PR 673. Question 10 covers a parsed box |
| G480 | high | type-design | any time | The RFC cursor type is invariant in `V`, so a reader of either mode accepts no cursor and the accepted `int64` rule fails to compile. | Confirmed with a TypeScript 6.0.3 model (8 errors). PR 682 (8435c2ae0) adds a variance paragraph and question 14, default: a method signature for the readers map |
| G482 | high | type-design | major | A write cursor replaces `view` and `bytes` when the buffer grows, and a read cursor is shared by all boxes, but every cursor field is public and mutable and the contract does not warn about either case. | Contract lines done in PR 682 (8435c2ae0). Question 15 asks for `readonly` fields, default yes |
| F273 | medium | api-surface | major | The RFC states that isIsoBoxType does not change, but its first overload takes `{ view: IsoBoxReadView<V> }`, a class that the RFC removes. | Done in PR 682 (8435c2ae0), section "Result type" |
| G463 (G495) | medium | api-surface | any time | A container box never becomes a raw box under the RFC, so the migration text "omit the reader and use the raw box" is false for the 19 container types. | Done in PR 682 (8435c2ae0). The Drawbacks limit the raw box advice to types outside `CONTAINERS` and name question 13 |
| G470 | medium | api-surface | major | Under the RFC the user type of a uuid box moves into a reader, but the package has no uuid reader and no uuid box type, so c2pa keeps a local type and a double cast. | Question 17 of the RFC in PR 682 (8435c2ae0). Issue 694 tracks a helper after 2.0.0 |
| G483 | medium | api-surface | any time | The RFC states that each method of the two view classes becomes a field function, but the table has no row and no stated fate for 11 members of the read view and 9 members of the write view. | Not done. Question 11 of the RFC covers four members |
| G493 | medium | api-surface | major | The RFC drops two documented inputs of `writeIsoBoxes` without a line in Drawbacks: a bare `Uint8Array` in the list, and the result of a direct writer call. | Not done. Open for the RFC review |
| G500 | medium | api-surface | any time | The RFC lists four functions that do not change and gives no fate for the other public exports outside the two view classes, among them the stream API and the sample entry helpers that take a view. | Not done. Open for the RFC review |
| G509 | medium | api-surface | any time | Version 1 uses two position systems in public members (`cursor` is relative to the view, `slice(offset, size)` takes an offset from the start of the buffer and documents only `size`), and the RFC cursor type does not state which system `pos` and `end` use. | Done in PR 682 (8435c2ae0). The contract states the origin of `pos` and `end` |
| G485 | medium | behavior | major | The RFC keeps a `size` parameter for `readString`, `readUtf8` and `readBytes` with no rule for -1, 0 or no size, and its new rule for a read past the end contradicts the limit that version 1 applies. | Not done. Open for the RFC review |
| G491 (G469) | medium | behavior | major | The RFC removes the `type` argument of a reader and does not say who sets `type` on the box, what happens when a reader reads fewer bytes than the box has, or whether a reader may keep the cursor. | Position and lifetime done in PR 682 (8435c2ae0). Question 18 asks who sets `type` |
| G492 | medium | behavior | any time | The RFC does not say what a writer that never calls `endIsoBox` produces, and a size of 0 is a legal size that means the box extends to the end of the file. | The `largesize` part is question 23 in PR 682 (8435c2ae0). The check for a missing `endIsoBox` call is not done |
| G487 | medium | consistency | optional | `seekIsoBox` returns `null`, and the first example of the RFC converts that `null` to `undefined`. | Done in PR 682 (8435c2ae0). The examples return `null` |
| G489 | medium | consistency | major | The RFC has three rules for an optional configuration, and its writer signature brings back an alternative that the accepted container RFC rejected. | Not done. Open for the RFC review |
| G496 | medium | docs | any time | The RFC states twice that `readIsoBoxes` keeps its signature and that only the return type of `writeIsoBoxes` changes, but the source shows that the return type, both configuration types and both map value types change. | Done in PR 682 (8435c2ae0) |
| G497 | medium | docs | any time | The Summary states that the trial build is faster in every scenario, but the second table of the RFC shows a slower row, and the only faster row for a large payload uses a behavior that the contract excludes. | Done in PR 682 (8435c2ae0). Question 2 asks for the copy rule and `capacity` |
| G499 | medium | docs | any time | The RFC states that the names and the rules of the two accepted RFCs do not change, but it reverses one recorded decision and makes about 75 lines of those RFCs wrong, with no plan to amend them. | Done in PR 682 (8435c2ae0), section "Changes to accepted RFCs" |
| G502 | medium | docs | any time | The RFC has no migration guide, no deprecation release, no list of the dependent packages in this repository, and no decision on the two open items that the accepted RFCs left for a major version. | Done in PR 682 (8435c2ae0): Migration section, a drawback, numbers in question 1, names in question 5 |
| G484 | medium | naming | major | The RFC has no field function that reads or writes an 8-byte field as a `number`, and `readUint64` returns a `bigint` in a family of functions that return a `number`. | Not done. Open for the RFC review |
| G486 | medium | naming | any time | The RFC adds 32 exports with generic names and no `Iso` token, next to 6 new functions that have the token. | Done in PR 682 (8435c2ae0). Question 5 asks for the `Iso` token |
| G490 | medium | naming | any time | The cursor field names `pos` and `end` are abbreviations with no stated origin, and the RFC gives the words `view`, `bytes` and `cursor` meanings that differ from version 1. | Not done. Open for the RFC review |
| G471 | medium | package-config | major | The RFC does not list the two CML packages that depend on iso-bmff, and the release script gives them a patch version whose peer range moves to a new major. | Done in PR 682 (8435c2ae0): a drawback and question 24 |
| G494 | medium | spec-compliance | major | The `uuid` contract contradicts the reader contract of the same RFC, and the RFC states no rule for the `usertype` of a `uuid` box with no reader or for a `uuid` writer. | Done in PR 682 (8435c2ae0). The contract points to question 17 |
| G481 | medium | type-design | major | The RFC cursor makes `int64` optional for `bigint` fields, which drops the accepted rule that a type with `bigint` fields always has the function. | Done in PR 682 (8435c2ae0). A `bigint` cursor requires `int64` |
| F433 | low | api-surface | any time | Gap: a parsed box will have no byte position after the RFC, and all three players need the position and the size of a box. | Partly done by question 13 of the RFC (the `start` field) |
| G476 | low | docs | any time | The RFC has no migration text for a direct call of a built-in writer, and the only in-repo direct call depends on the `buffer` of the write view. | Done in PR 682 (8435c2ae0). A drawback shows two forms |
| G498 | low | docs | any time | The RFC counts 87 readers and 85 writers, but the package has 84 reader functions and 84 writer functions, and two other statements in Motivation do not match the source. | Done in PR 682 (8435c2ae0) |
| G501 | low | reader-writer-asymmetry | any time | The RFC gives the writer a helper for the full box header and the box type, and gives the reader neither, so 41 readers repeat two bit operations. | Done in PR 682 (8435c2ae0). The example reads `readUint8` and `readUint24` |

## Breaking changes for 2.0.0

Each row changes a public type, a name, or a result. The major version is the only release that can take these rows. Details: `details-breaking.md`.

| ID | Severity | Category | When | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| F152 | high | behavior | major | `findIsoBox`, `filterIsoBoxes`, and `traverseIsoBoxes` never visit the child boxes of `stsd` and `dref`, because those two types store child boxes in `entries` and every other type uses `boxes`. |  |
| F237 | high | behavior | major | A writer in the map wins over the source bytes of a box that was read with no reader, so the writer writes zeros or throws. | Theme 4 is in PR 682 (8435c2ae0): section "Raw boxes in writeIsoBoxes" and question 20 |
| F190 | high | reader-writer-asymmetry | major | Twenty-four box types have a required count field that duplicates an array length, and the writers use three different rules for it. |  |
| F188 | high | type-design | major | The return type of readIsoBoxes has parsed fields for every built-in box type, but a box with no reader in the map has only the header fields at run time. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| F189 | high | type-design | major | The child types of 12 container boxes are closed lists that omit children the specification allows, so a test for a legal child is a compile error. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| F270 | high | type-design | major | isIsoBoxType narrows a box that has no decoded fields to the complete box type, so typed fields are `undefined` at run time. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| F94 | high | type-design | major | `TrackReferenceTypeBox` declares `type: 'tref'` and `trackIds`, and no reader or writer produces or accepts that shape. |  |
| F204 | medium | api-surface | major | IsoBoxMap contains 18 box types that no reader produces and no writer accepts, and several of those types differ from the specification. |  |
| F198 | medium | behavior | major | The readers map has no key check, and a reader under the wrong key silently changes the `type` of the box. |  |
| F20 | medium | behavior | major | Writers of four-character code fields write value.length bytes, so a brand or handler type that is not 4 characters corrupts the box or throws |  |
| F224 | medium | behavior | major | The size parameter of readString, readUtf8, readData and readBoxes has four different rules for -1, 0, other negative values, and a size past the end. |  |
| G447 | medium | behavior | any time | The writers of null-terminated strings write a U+0000 character inside the value, so the next field of the box starts at the wrong byte. |  |
| G448 | medium | behavior | major | A `number[]` in a field of the type `Uint8Array` writes zero bytes with no error. |  |
| G449 | medium | behavior | major | writeMdhd packs each character of `language` with `& 0x1f`, so a value such as `en-US` writes another language code with no error. |  |
| G450 | medium | behavior | any time | readMeta reads a QuickTime `meta` box, which has no version and flags, as a box with no children and with the size of the first child in `flags`. |  |
| G455 (G451) | medium | behavior | major | Box nesting has no limit, so read, write, the stream and depth-first traversal end with an engine stack overflow, and the write limit is below the read limit. |  |
| G504 | medium | behavior | any time | The result of a UTF-8 string read depends on whether the runtime has `TextDecoder`: the fallback of `decodeText` keeps the byte order mark, returns different characters for malformed bytes, and throws a `RangeError` for one malformed sequence. |  |
| G507 | medium | behavior | major | `IsoBoxReadableStream` fixes its base class when the module is first evaluated, so a `ReadableStream` polyfill that the player installs later is never used, and the public class extends a symbol that the package does not export. |  |
| G521 | medium | behavior | any time | A reader in the map for a box inside `stsd`, `dref` or `meta` is never called unless the map also has the reader of every enclosing box, and the README bullet for `readTenc` and `readSchm` does not say so. |  |
| F202 | medium | consistency | major | Readers set 12 absent optional fields to an explicit `undefined`, while the types declare them optional and other readers omit the key. |  |
| F272 | medium | consistency | major | isIsoBoxType takes the tested value as the second argument, and every other type guard in CML takes it first. |  |
| F281 | medium | consistency | optional | findIsoBox returns `null` for no match, while the platform function with the same shape and several CML lookup functions return `undefined`. |  |
| F400 | medium | consistency | major | Four-character-code fields are a `string` in three boxes and a `number` in the others. |  |
| F409 | medium | consistency | optional | String fields use four decode rules, and the WebVTT text boxes do not agree on where the string ends. |  |
| F222 | medium | errors | major | The box iterator finds a truncated box by the text of an error message, so an error from a custom reader can silently drop a box and every box after it. |  |
| F229 | medium | errors | major | The thrown errors of the package use three error types and four message styles. |  |
| G457 | medium | errors | major | `readStsd` and `readDref` return fewer entries than `entry_count` with no error, while every other count-driven reader throws when the box ends before the count. |  |
| G488 | medium | errors | any time | The RFC contract keeps two different results for malformed input and names an error type for only one of four failures. |  |
| F171 | medium | naming | major | `SampleEntryBox`, `AudioSampleEntryBox`, and `VisualSampleEntryBox` add a `Box` suffix that the spec does not have, while `ItemInfoEntry` keeps the spec name. |  |
| F174 | medium | naming | major | The names of the entry and record types follow at least four patterns, and several are too generic for a public name. |  |
| F178 | medium | naming | major | `ParsedBox`, `ParsedIsoBox`, and `IsoTypedParsedBox` are three names for one idea with three prefix orders, and they lose their purpose when `view` and `size` leave a parsed box. |  |
| F280 | medium | naming | major | The config types are named after the view classes that the RFC removes, and the TSDoc of the write config names a third class. |  |
| F332 | medium | naming | major | Several exports have generic names with no ISO prefix, against the pattern of the other packages |  |
| F405 | medium | naming | major | The package uses the name "template" for fixed-point values, the RFC keeps the name, and no helper reads a signed fixed-point value. |  |
| F406 | medium | naming | major | Field names follow two casing rules: camelCase on word boundaries in most boxes, and the unbroken lowercase of the spec in six boxes. |  |
| F411 | medium | naming | major | `readVttc` and `readVttC` (and the two writers) differ only by the case of one letter, and their files have other names. |  |
| F88 | medium | naming | major | `Subsegment.rangesCount` is the only count field with a plural stem, and it differs from the spec name `range_count`. |  |
| G513 | medium | naming | optional | List fields follow two naming rules: a list of numbers keeps the singular spec name, a list of records gets a plural name, and three lists follow neither rule. |  |
| F374 | medium | package-config | any time | The syntax level of the published JavaScript is not declared, and the configuration states a level that the output does not have. |  |
| F199 | medium | performance | major | Byte fields are `number[]` in pssh, tenc, and the sample entries, but `Uint8Array` in emsg, mdat, free, imda, and senc. |  |
| F298 | medium | performance | major | readTrun builds each sample with conditional property writes and tests the flags for every sample, and writeTrun loads `box.flags` four times for every sample |  |
| F177 | medium | reader-writer-asymmetry | major | The readers map finds a reader by the trimmed type (`url`), the writers map does not, and the two maps have different key types. |  |
| F201 | medium | reader-writer-asymmetry | major | Four box types have a raw field next to the fields decoded from it, and each writer has a different rule for which one it writes. |  |
| F246 | medium | reader-writer-asymmetry | major | The write view has three string methods with two encodings, the built-in writers use none of the two terminated methods, and the method with the short name writes Latin-1 that the built-in readers decode as UTF-8. |  |
| F408 | medium | reader-writer-asymmetry | major | The sample entry readers take any box type and the sample entry writers take only the built-in types, and the reader parameters are in the reverse order of `IsoBoxReader`. |  |
| G511 | medium | reader-writer-asymmetry | major | `isGroupLabel` of `labl` is the only `boolean` field of the package and the only field decoded from `flags`, and `writeLabl` ignores it. |  |
| F250 | medium | spec-compliance | major | `TrackEncryptionBox` has three overlapping forms of the same bits, `writeTenc` writes one of the new fields and ignores another, and the writer writes a constant IV that the syntax does not allow. |  |
| F276 | medium | spec-compliance | major | CONTAINERS omits container boxes of ISO/IEC 14496-12 while the guides say that the constant lists all known container types. |  |
| F9 | medium | spec-compliance | major | The package cannot express `AudioSampleEntryV1`: `entry_version` is hidden in the high half of `reserved2[0]`, there is no `srat` box, and a sample rate above 65535 writes a wrong value without an error. |  |
| G473 (G514, G523) | medium | spec-compliance | major | The `kid` field of the pssh box is one flat `number[]` with 16 numbers for each key ID, and the specification defines a list of 16-byte key IDs. |  |
| F120 | medium | type-design | major | `location` is a required string in `DataEntryUrlBox` and `DataEntryUrnBox`, and the spec forbids it in one case and makes it optional in the other. |  |
| F173 | medium | type-design | major | Three exported child aliases and five other public positions are `any`, while four containers with the same open content use `IsoBox<V>`. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| F193 | medium | type-design | major | isContainer returns true for 14 box types that its type predicate excludes, and the package has three different definitions of a container. |  |
| F194 | medium | type-design | major | The default `never` of `Box<T>` makes an unknown box impossible to write as a value and makes a test for an unknown type a compile error. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| F197 | medium | type-design | major | IsoBoxWriterMap is `Record<string, IsoBoxWriter<any>>`, so a writer under the wrong key compiles and writeBox needs an `any` cast. |  |
| F200 | medium | type-design | major | Ten box types have required reserved and pre_defined fields, and the writers write whatever value the box has. |  |
| F253 | medium | type-design | major | A container cannot hold a child given as bytes without a cast, although the writer accepts such a child. |  |
| F26 | medium | type-design | major | Boxes that share one shape use three different type patterns, and TypeBox is an unconstrained generic with a vague name |  |
| F282 | medium | type-design | major | The generic `T` of traverseIsoBoxes, findIsoBox and filterIsoBoxes has no constraint, and the yielded type is wrong when `T` is narrower than the tree. |  |
| F4 | medium | type-design | major | `compressorName` is a `number[]` of 32 raw bytes, but the spec defines a counted string. |  |
| F53 | medium | type-design | major | The child types of the container readers claim a fully read box for a child that no reader read. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| F72 | medium | type-design | major | SampleDependencyTypeBox returns the packed bytes as number[] under a name that is not in the spec, with no documentation of the bits. |  |
| F85 | medium | type-design | major | The default entry type of `SampleDescriptionBox` claims fields that many entries do not have, `readStsd` has a type parameter that only casts, and `writeStsd` rejects the type that `readStsd` returns. | Theme 3 is in PR 682 (8435c2ae0): section "Result type" and question 19 |
| G468 | medium | type-design | any time | A readers map with the exported type IsoBoxReaderMap makes every box of the readIsoBoxes result lose `type`, so drm builds its map through a second variable. | Theme 3 is in PR 682 (8435c2ae0): rule 3 of "Result type" and question 19 |
| G512 | medium | type-design | optional | No field with a closed set of values has a literal type, and `writeSidx` masks a value outside the set without an error. |  |
| G522 | medium | type-design | major | A custom reader that returns only fields, with no `type`, works at run time but removes `type` from the whole result type, so `box.type` is a compile error for every box. | Theme 3 is in PR 682 (8435c2ae0): question 18 |
| F232 | low | api-surface | major | Several exports have no purpose after the cursor RFC, and six of them are generic constant names. |  |
| F268 | low | api-surface | major | `writeBytes` takes one array or a list of arrays, and `writeArray` accepts field types that it cannot write. |  |
| F333 | low | api-surface | major | createIsoBoxReadableStream and IsoBoxReadableStream are two exports for one feature, and the chunk type is not Uint8Array<ArrayBuffer> |  |
| G454 | low | api-surface | major | fourCcToUint32 returns a number for a string that is not four one-byte characters, and the package has no function for the reverse direction. |  |
| F230 | low | behavior | major | readUint, readInt and readTemplate return NaN for a size that they do not support, and the view still moves. |  |
| F231 | low | behavior | any time | Eight or more zero bytes after the last box become a box with the type of four null characters, but one to seven bytes are dropped. |  |
| F257 | low | behavior | any time | `writeMdhd` writes 0 for a `language` shorter than 3 characters, and the comment says the result is `und`, but a read of that box returns three grave accents. |  |
| F259 | low | behavior | major | `writeIsoBox` returns a view of the input memory for a box given as bytes, but its return type marks an allocated result, and it rejects an `ArrayBuffer` that the read side accepts. |  |
| F28 | low | behavior | any time | readFtyp and readStyp compute a fractional brand count when the body length is not a multiple of 4 |  |
| G458 | low | behavior | optional | `writeBox` finds a writer with a plain property read, so a box type that is a name on `Object.prototype` returns empty bytes or throws a `TypeError` in place of `No writer found for box type`. |  |
| F214 | low | consistency | any time | Only emsg has a literal type for `version`. The other 55 full box types use `number`, and the emsg helper type exposes an internal type parameter. |  |
| F215 | low | consistency | any time | With the `bigint` option, an emsg box of an unrecognized version has `presentationTime` as a `number`, which differs from the documented rule that each field has one type for every version. |  |
| F415 | low | dead-code | major | Four box types have a second lowercase export, one box type file is dead, and one duplicate entry type exists. |  |
| F285 | low | errors | optional | An invalid `maxDepth` makes the traversal yield nothing, so findIsoBox reports "not found" for a configuration error. |  |
| F288 | low | errors | major | The stream writes the first box inside the constructor, so an error for the first box is thrown synchronously and an error for a later box rejects a read. |  |
| F169 | low | naming | optional | `defaultReaderConfig` and `defaultWriterConfig` are functions with the names of constants and no package token. |  |
| F175 | low | naming | major | `WebVttCueChild` is the only child alias without `Box` in its name, and `WebVttSettingsBox` drops the word `Cue` that its own TSDoc and its sibling types keep. |  |
| F75 | low | naming | any time | ProducerReferenceTimeBox splits the spec field `ntp_timestamp` into two fields with abbreviated names and no documentation. |  |
| G517 | low | naming | major | Three field names differ from the spec name by more than casing: `mfraSize`, `defaultIvSize`, and `subsampleEncryption`, and `TrackEncryptionBox` mixes the names of two editions. |  |
| F212 | low | performance | major | stss and prsl wrap each number of a list in an object with one field, while the other number lists are plain arrays. |  |
| G516 | low | reader-writer-asymmetry | major | `sidx` is the only box with a counted list whose reader does not return the count, while `ssix`, which the spec ties to it, returns two counts. |  |
| F106 | low | type-design | any time | The three length fields of `tfra` have the type `number`, and `writeTfra` neither masks nor checks them. |  |
| F210 | low | type-design | major | CONTAINERS is a public mutable `string[]` that repeats the keys of IsoBoxContainerMap with no check that the two agree. |  |
| F284 | low | type-design | optional | `depthFirst?: boolean` selects between two named orders with a boolean whose `false` value means a different algorithm. |  |
| F33 | low | type-design | optional | EventMessageBoxUnrecognizedVersionNumber exposes a type parameter that adopters must not set |  |
| F418 | low | type-design | major | Fields with a fixed length are `number[]`, and the writers pad a short array with 0 and ignore extra elements. |  |

## Changes that break nothing

Each row can ship in any release. Details: `details-non-breaking.md`.

| ID | Severity | Category | When | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| G506 | medium | behavior | any time | The documented feature test for `readInt64AsBigInt` (`typeof BigInt === 'function'`) passes on a runtime that has `BigInt` and no `DataView` BigInt methods, and the read then throws only for version 1 boxes. | Done in PR 702 |
| F279 | medium | consistency | major | The config argument is optional for writeIsoBox and required for writeIsoBoxes, createIsoBoxReadableStream and the stream constructor, and `writers` is required while `readers` is optional. | Not done. Brief 4 covers the row in theme 10, rules for an optional configuration |
| F330 | medium | docs | any time | The unreleased changes that alter results have no migration guide in the docs, and the changelog does not mark them as breaking | Partly done in PR 708. The migration guide and the breaking-change prefixes go to the 2.0.0 release prep |
| G520 | medium | docs | any time | Seven examples look for `tfdt` at a position where no ISO BMFF file has it, so they do nothing on every fixture. | Done in PR 708 |
| F327 | medium | package-config | any time | The published package does not contain NOTICE.md with the codem-isoboxer license text | Done in PR 703, for eight packages |
| F121 | medium | performance | optional | `readTrun` creates one empty object for each sample of a box with no per-sample flag, and the count has no limit. | Issue 710. The limit needs a number from the maintainer |
| G456 | medium | performance | any time | traverseIsoBoxes takes quadratic time in two shapes: breadth-first over many sibling containers, and depth-first over deep nesting. | Done in PR 706 |
| G503 | medium | reader-writer-asymmetry | any time | String writers need `TextEncoder` and have no fallback, while string readers work without `TextDecoder`, and the TSDoc of `encodeText` claims a fallback that does not exist. | Done in PRs 705 and 708 |
| F384 | medium | tests | any time | Ten readers and eleven writers have no test of any kind, and the cursor RFC says the fixtures and the round-trip test cover all of them. | Done in PR 704 |
| G505 | medium | tree-shaking | any time | Every read bundle contains the complete `decodeText` of cml-utils, with its UTF-16 branches and its byte order mark detection, although iso-bmff only decodes UTF-8 and the RFC size table does not count that code. | Done in PRs 705 and 714. utils 1.8.0 is published (PR 713) |
| F196 | medium | type-design | any time | IsoBoxType is identical to `string`: it accepts the empty string and any length, and gives no completion for the known box types. | Partly done in PR 702 (step 1). Step 2, keys in the reader map, goes to the second RFC |
| F126 | low | api-surface | any time | `readVtte` and `writeVtte` publish a parameter named `_`, disable every lint rule for the line, and have no `@param` tag. | Done in PR 702 |
| F289 | low | behavior | any time | The stream `pull` loop continues after `controller.close()`, and the stream has no `cancel` handler for the source iterator. | Done in PR 702 |
| F111 | low | consistency | optional | Readers and writers of this scope use different local forms for the same concept. | Not done. The cursor rewrite replaces the code |
| F258 | low | consistency | any time | Three writers write a signed field with the unsigned function and depend on wrap for a negative value. | Done in PR 702 |
| F311 | low | consistency | optional | The matrix code is copied into four files with a closure and an extra array, and signed fixed-point reads are written by hand while writes use `writeTemplate` | Skipped. PR 620 measured the inline form and chose it |
| F338 | low | consistency | any time | The docs and TSDoc use several words for one thing: parse and read, encoded and written, raw box, library and package | Partly done in PR 708. The rename of "box object" goes to the cursor RFC. The two terms are in the Migration section of PR 682 (8435c2ae0) |
| F366 | low | consistency | any time | The summaries of the box types follow three patterns, and the sample entry writers follow two. | Done in PR 708 |
| F417 | low | consistency | any time | The readers get `version` and `flags` in two ways and compare the version with two operators. | Not done. The cursor rewrite replaces the code |
| F110 | low | docs | any time | The box types of this scope have almost no field documentation, and only `tenc` has TSDoc examples. | Partly done in PR 708. New `readTfhd` and `readTfdt` example files go to the cursor RFC. The example files belong to the pull requests that implement the cursor RFC |
| F184 | low | docs | any time | Three exports appear as "(undocumented)" in the API report beside the four lowercase aliases. | Done in PR 708 |
| F187 | low | docs | any time | The README has no quick-start example, and the README and `package.json` describe the package as parsing only. | Done in PRs 708 and 702 |
| F262 | low | docs | any time | The writing guide states that parsed boxes implement `ArrayBufferView`, calls a type annotation a cast, and uses the term raw box for a meaning that differs from the RFC. | Partly done in PR 708. Part 2 goes to the cursor RFC. Part 2 is in the Migration section of PR 682 (8435c2ae0) |
| F292 | low | docs | any time | The utilities guide describes a signature that was removed, omits five public utilities, and uses `meta` in two examples where it does not fit. | Partly done in PR 708. Part 2 goes to the cursor RFC. Part 2 is in the Migration section of PR 682 (8435c2ae0) |
| F316 | low | docs | optional | `defaultReaderConfig` and `defaultWriterConfig` build an object with 62 entries on each call, and the guides call them inside the read call | Done in PR 708 |
| F334 | low | docs | any time | TSDoc statements in the top-level files do not match the code | Done in PR 708 |
| F335 | low | docs | any time | Many public types have a TSDoc summary that only repeats the type name | Partly done in PR 708. `ParsedBox`, `ParsedIsoBox`, and `IsoTypedParsedBox` wait for the RFC decision on those types. Rule 6 of "Result type" in PR 682 (8435c2ae0) states the fate of the three types |
| F336 | low | docs | any time | Entry points have no @throws tags, and some have no @example | Done in PR 708 |
| F34 | low | docs | any time | The types of messageData (emsg) and data (free, skip) do not say that the bytes share memory with the input buffer | Done in PR 708. The `readBytes` sentence goes to the cursor RFC. The `readBytes` sentence is in the contract of PR 682 (8435c2ae0) |
| F340 | low | docs | any time | The Unreleased section has two '### Changed' headings, and two older sections have the wrong year | Done in PR 708 |
| F341 | low | docs | any time | Two bullets of the README 'When to use' section do not match the functions that they name | Done in PR 708 |
| F342 | low | docs | any time | The writing guide has wording errors and an example that fails at runtime | Done in PR 708 |
| F343 | low | docs | any time | The docs of createInt64OverflowReader do not state that the all-ones duration of ISO/IEC 14496-12 reports an overflow | Done in PR 708 |
| F346 | low | docs | optional | The guide context files give the name `buffer` two types, and the guides never say what `buffer` holds | Done in PR 708 |
| F359 | low | docs | any time | Spec references use four year formats, and the type and the writer of the same box cite different editions or clauses. | Done in PR 708 |
| F360 | low | docs | any time | The field comments of MediaHeaderBox contradict the field types. | Done in PR 708 |
| F365 | low | docs | optional | The @param config lines of the writers use four wordings, and writeMp4a has none. | Done in PR 708 |
| F368 | low | docs | any time | The TSDoc of the two sample entry reader factories gives misleading examples and does not follow the documentation rules. | Done in PR 708 |
| F369 | low | docs | any time | Twenty-five test files have an example region that no TSDoc includes. | Done in PR 708. Regions for the other readers and writers belong to issue 435 |
| F370 | low | docs | any time | Five container readers with a type parameter for 64-bit fields do not document the int64 option, and their writers do. | Done in PR 708 |
| F371 | low | docs | major | A TODO line comment sits between the TSDoc and the declaration of a public type. | Partly done in PR 708. Typed `prsl` children are breaking and go to the second RFC |
| F392 | low | docs | any time | Two documentation examples in the tests do not show the use of the function well. | Done in PR 708 |
| F57 | low | docs | any time | writeMfra and writeMfro do not keep `mfraSize` correct, and no TSDoc or guide tells the adopter to set it. | Done in PR 708 |
| F58 | low | docs | any time | The TSDoc of MovieFragmentRandomAccessOffsetBox names the wrong box. | Done in PR 708 |
| F60 | low | docs | any time | The fields of MovieHeaderBox, MovieExtendsHeaderBox, MovieFragmentHeaderBox, and MovieFragmentRandomAccessOffsetBox have no TSDoc, except `matrix`. | Done in PR 708 |
| G452 (G459) | low | docs | optional | A string field with bytes that are not valid UTF-8 is read with U+FFFD and no signal, so a read and a write change the bytes and the size of the box. | Done in PR 708 |
| G461 | low | docs | any time | The reading guide says that `readIsoBoxes` does not throw for damaged input, but 1,995 of 367,642 single-byte changes to the fixtures make the function throw. | Done in PR 708 |
| G510 | low | docs | any time | No document states the runtime APIs that the package needs, and the website says the packages need no polyfills. | Partly done in PR 708. The ES baseline waits for the open target decision |
| G518 | low | docs | any time | No time field states the 1904 epoch or its unit, and no ID field states that it holds a UUID or a key ID, except `kid` of pssh. | Done in PR 708 |
| G525 | low | docs | any time | The reading guide states that a generic custom reader in a stored map needs a type argument, but the guide's own example has `bigint` fields without the type argument. | Done in PR 708 |
| G526 | low | docs | any time | The `bigint` example of the reading guide names a value `seconds`, but the `bigint` division drops the fraction. | Done in PR 708 |
| G527 | low | docs | any time | The guide states that the `size` field of a parsed box is the size of the source box, but the field is 1 for a box with `largesize` and 0 for a box that extends to the end. | Done in PR 708 |
| G528 | low | docs | any time | Ten of the 28 TSDoc examples use a name that the example does not define, so the published example cannot run and the reader cannot see the input. | Partly done in PR 708. The `writeUint` and `writeIsoBoxes` regions go to the cursor RFC. The regions belong to the pull requests that implement the cursor RFC |
| G529 | low | docs | any time | Eight TSDoc examples copy the complete file with `new Uint8Array(isoFile)` before the read, although `readIsoBoxes` accepts the `Buffer`. | Done in PR 708 |
| F265 | low | errors | any time | `writeBoxHeader` can write a 16-byte header with `largesize`, but every built-in writer computes its size with an 8-byte header, so a box above 4 GiB fails with an unclear `RangeError`. | Not done. The header size of a box above 4 GiB goes to the cursor RFC, because a 1.x check is a range check. Question 23 of the RFC in PR 682 (8435c2ae0) |
| F291 | low | errors | optional | The default container writing throws an opaque TypeError for a container box with no `boxes` field, which differs from the rule that a writer does not throw for a missing field. | Skipped. Only JavaScript or a cast reaches the error, as in issue 668 |
| G508 | low | errors | any time | The input handling uses `instanceof` tests, so an `ArrayBuffer` from another realm throws an unclear `TypeError`, a wrong input type gives an engine error with no parameter name, and a `SharedArrayBuffer` from another realm passes the copy step of `writeIsoBox`. | Done in PR 702 |
| F180 | low | naming | major | Seven type names follow the clause title and not the syntax class of the spec, and the package does not state which rule it uses. | Not done. Brief 4 covers the row in theme 5, names |
| F317 | low | package-config | any time | `package.json` has no `sideEffects` field | Issue 711. Rolldown already drops a bare import, and webpack is not measured |
| F387 | low | package-config | any time | package.json has fields with no effect and a description that names only parsing. | Partly done in PR 702 (part A). Part B is issue 712 |
| F236 | low | performance | any time | Each string read allocates two DataViews and a TextDecoder, and readUtf8 removes a byte order mark without notice. | Partly done in PR 702 (documentation). The speed change goes to the cursor rewrite |
| F286 | low | performance | any time | The traversal does avoidable work for each box: a linear scan of CONTAINERS, a new generator and config object for each container, and `Array.shift`. | Done in PR 706 |
| F310 | low | performance | any time | The box type and every other four-character string are decoded one byte at a time with a `switch` call and a string concatenation for each byte | Done in PR 706 |
| F313 | low | performance | optional | Values that do not change inside a loop are computed for every entry in readSubs, readTfra, writeTfra, and readMdhd, and three readers compare the version with `==` | Not done. The cursor rewrite replaces the code. No speed gain |
| F294 | low | tests | any time | Two traversal tests cannot fail for a wrong order, and the breadth-first test of traverseIsoBoxes states that its two orders are the same. | Done in PR 704 |
| F388 | low | tests | optional | Test files are in inconsistent locations and some names do not match a source file. | Partly done in PR 704 (part 1). The file moves wait for the cursor work |
| F389 | low | tests | any time | Test helpers have names close to the public functions, one helper has dead code, and one helper name has two meanings. | Partly done in PR 704 (parts 1 and 2). The `boxBytes` names wait for the cursor work |
| F390 | low | tests | any time | Nine test files use the loose assertions `equal` and `deepEqual`, two of them inside a documentation example. | Done in PR 704 |
| F16 | low | tree-shaking | optional | One reader and three writers in scope import a view class as a value where every other file uses `import type`. | Skipped. The bundle size does not change, and the cursor rewrite removes the imports |
| F29 | low | tree-shaking | optional | writeSkip and writeStyp copy the bodies of writeFree and writeFtyp, while the readers delegate with an object spread | Not done. The cursor rewrite replaces the code |
| F287 | low | type-design | any time | isFullBox takes `any`, throws for null and primitives, has no test and is not used by the package. | Partly done in PR 702 (part A). Part B, remove or rename the export, goes to the second RFC |
| G519 | low | type-design | any time | The 64-bit fields of `co64`, `saio`, and `iloc` have the type `number` with no `IsoInt64` parameter, so a custom reader cannot return them as `bigint` under the documented rule. | Not done. The `co64` part belongs to issue 652. `saio` and `iloc` keep `number` |
| F31 | low | typo | any time | Reader summaries use the wrong article before a vowel, and the readSkip and readEncv summaries do not name their box type | Done in PR 708 |

## Rows that conflict with a recorded decision

Each row asks to reverse a decision that the maintainer recorded. Do nothing unless the maintainer reopens the decision. Details: `details-settled.md`.

| ID | Severity | Category | When | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| F223 | medium | errors | any time | A bad box size stops the read silently, but a box that is too short for its fields throws a native RangeError and returns no boxes. |  |
| G446 (G524) | medium | errors | any time | A number that does not fit its field is written with no error and with three different results, and a bigint in the same field throws a RangeError. |  |
| G453 | low | behavior | major | readHdlr returns the count byte of a QuickTime counted string as the first character of `name`. |  |
| F27 | low | errors | any time | Writers handle a missing field in three different ways: 0 for a number, an empty string for text, and a TypeError for an array or bytes |  |
| G460 | low | spec-compliance | optional | A child box with `size` 0 extends to the end of its parent, but ISO/IEC 14496-12 defines `size` 0 only for the last box in the file. |  |

## New functions and new box types

Each row adds scope. None is an inconsistency of the current package. Details: `details-scope.md`.

| ID | Severity | Category | When | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| F436 | low | api-surface | any time | Gap: the built-in sample entry types are avc1 to avc4, hev1, hvc1, encv, mp4a and enca, and the types that players handle today are missing. |  |
| F438 | low | api-surface | optional | Gap: one reader key 'uuid' serves every uuid box, so tfxd, tfrf and PIFF boxes need a hand-written dispatch on the user type. |  |
| F439 | low | api-surface | optional | Scope growth: the package has no function for the track facts that every player takes from an init segment. |  |
| F440 | low | api-surface | optional | Scope growth: the package has no function that resolves the samples of a fragment from trun, tfhd and trex, and none that decodes sample flags. |  |
| F441 | low | api-surface | optional | Scope growth: the package has no function that converts a sidx box to segment references with times and byte ranges. |  |
| F442 | low | api-surface | any time | Scope growth: the package has no function that lists the pssh boxes of a buffer with their complete bytes, and none that builds a pssh box from a system ID, key IDs and data. |  |
| F434 | low | behavior | any time | Gap: readIsoBoxes drops a truncated box with no signal and reports no consumed length, while every player parses partial data. |  |
| F435 | low | docs | any time | Gap: the package reads no codec configuration box and no other child of a sample entry, so the README claim of a codec from readStsd holds only for the 4CC. |  |
| F218 | low | type-design | any time | The package exports no names for the flag bits, although the writers decide the written fields from `flags`. |  |

## Other packages and repository files

Each row is outside `libs/iso-bmff`. Record each row as an issue for its own package. Details: `details-other.md`.

| ID | Severity | Category | When | Finding | Result |
| --- | --- | --- | --- | --- | --- |
| G466 | high | behavior | any time | parsePsshList in drm never returns for a box with size 0 and throws a native RangeError for trailing bytes, because it has its own box walk. |  |
| G464 | medium | api-surface | any time | The package has no flat walk of sibling boxes, so the repo has three more box walkers with four different stop rules, and the skill tells adopters not to write one. |  |
| G465 | medium | behavior | any time | c2pa reads JUMBF boxes with readIsoBoxes, which applies three ISO BMFF rules that JUMBF content does not need. |  |
| G467 | medium | behavior | any time | validateC2paInitSegment checks for mdat with readIsoBoxes and computes the hash with a second walker, and the two walkers stop at different boxes. |  |
| G472 | medium | consistency | any time | Two public options of drm copy field types of iso-bmff that other findings propose to change, so each fix needs a decision for drm. |  |
| G475 | medium | docs | any time | The skill describes the source of `main`, so it names four iso-bmff exports that the published version 1.0.7 does not have, and the gap grows when the 2.0 code merges. |  |
| G478 | low | consistency | optional | Three workarounds in the consumers have no effect with the current types, so they hide which casts the API still requires. |  |
| G477 | low | dead-code | any time | dev/isobmff.html imports a file and seven names that do not exist, and it contains a commented media URL of a private host. |  |
| G474 | low | docs | any time | The skill and the README send an agent to two packages for pssh parsing, and the two parsers have different rules and result types. |  |
| G479 | low | tests | optional | The 608 package asks the caller for the position and the size of each sample, and its tests parse moof, traf and trun by hand to get them. |  |

## Rejected by verification

| ID | Finding |
| --- | --- |
| F239 | A `number` that does not fit its field is written with silent wrap, but a `bigint` with the same value throws a `RangeError`. |
| G515 | A list that the syntax omits for a version, a flag, or a field value has three representations: a required empty array with a count of 0, an optional field set to `undefined`, and an empty array with the count kept. |
