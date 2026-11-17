# Audit of `@svta/cml-iso-bmff` before version 2.0.0

This file lists findings only. No fix is applied. The maintainer decides each group.

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

One row of the last group is urgent. **G466**: `parsePsshList` in `@svta/cml-drm` does not return for a box with a size of 0. The author of this file reproduced the defect. The input comes from the media. Issue 683 records the defect and the proposed fix.

## Proposed order

| Step | Work | Rows | Needs |
| --- | --- | --- | --- |
| 1 | Fix G466 in drm (issue 683) | 1 | No decision. A patch release of drm |
| 2 | Amend the cursor RFC | 30 | No code. One revision of the draft |
| 3 | Fix the rows that break nothing | 73 | No decision. 37 rows are documentation |
| 4 | Decide the twelve themes | 92 | RFC text, because each theme changes the public API |
| 5 | Implement the themes on the 2.0.0 branch | 92 | Step 4. One PR for each theme |
| 6 | Record the other rows as issues | 18 | The maintainer selects the rows |

The size of each step in hours is not estimated.
