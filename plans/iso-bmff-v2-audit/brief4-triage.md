# Brief 4: triage of the breaking rows at HEAD

Source: HEAD 7df125fd5 (`feat/iso-bmff-v2`), checked on 2026-11-17 with probes on `libs/iso-bmff/src`. The cursor RFC text is PR 682 at b6b0c4296. The probe scripts and the per-group tables are in the session scratchpad, not in the repository.

Result: 82 rows had a check. 64 rows hold in full, and 18 rows hold in part. No row is fixed. The other 10 rows are decided in the cursor RFC and had no second check.

Columns: "At HEAD" is `true` or `partly`. "Home" is a theme of this RFC, `cursor` (the cursor RFC owns the subject), or `out` (not in this RFC).

## Rows decided in the cursor RFC

F237, F188, F189, F270, F173, F194, F53, F85, G468, G522. Home: `cursor`, decided on 2026-11-17 (PR 682, b6b0c4296).

## Rows of this RFC

| ID | At HEAD | Home | Note |
| --- | --- | --- | --- |
| F152 | true | 1 | `entries` in `stsd` and `dref`. The Count fields table of the cursor RFC uses the name `entries`, so a rename changes two rows there |
| F199 | true | 3 | `number[]` in `pssh`, `tenc`, and the sample entries |
| G473 | true | 3 | Conflict: the cursor RFC keeps a flat `kid` (Count fields, question 9) |
| F418 | true | 3 | Fixed-length `number[]` fields: `matrix`, `opcolor` |
| F4 | true | 3 | `compressorName` is 32 numbers. The string rule is in theme 8 |
| F72 | partly | 3 | `sdtp` bytes. A test exists since PR 704 |
| G448 | true | 3 | A `number[]` in a `Uint8Array` field writes 0 bytes |
| F400 | true | 4 | `number` in `frma`, `schm`, `saio`, `saiz`, `sbgp`, `sgpd` |
| F20 | true | 4 | The writer writes `value.length` bytes. The growing buffer of the cursor RFC makes a long code silent |
| G454 | true | 4 | `fourCcToUint32` accepts any string. No reverse function |
| F177 | true | 4 | The readers map finds `url`, the writers map does not |
| F197 | true | 4 | `IsoBoxWriterMap` is `Record<string, IsoBoxWriter<any>>` |
| F198 | true | 4 | No pairing of map key and box type |
| F171 | true | 5 | `Box` suffix of the sample entry types |
| F174 | true | 5 | Names of the entry and record types |
| F280 | partly | 5 | Config types named after the view classes. PR 708 fixed most of the TSDoc |
| F332 | partly | 5 | Exports with no `Iso` token. cmcd also has such exports |
| F406 | true | 5 | Two casing rules for field names |
| G513 | true | 5 | Two naming rules for list fields |
| G517 | partly | 5 | `mfro` part done in PR 708. `tenc` and `senc` names open |
| F169 | true | 5 | Conflict: the cursor RFC says that the exported names do not change |
| F175 | partly | 5 | `WebVttSettingsBox` name only. The `WebVttCueChild` alias is `cursor` (rule 5) |
| F26 | true | 5 | `TypeBox` and `FreeSpaceBox` patterns |
| F193 | partly | 5 | `isContainer` and its predicate. With F287 part B |
| F212 | true | 5 | `stss` and `prsl` wrap each number in an object |
| F75 | true | 5 | `prft` splits `ntp_timestamp` into two fields |
| F204 | true | 6 | 18 types with no reader and no writer. Issue 652 |
| F94 | true | 6 | `TrackReferenceTypeBox` shape. The TSDoc of PR 708 now contradicts the type |
| F415 | true | 6 | Four lowercase aliases and one dead file |
| F232 | partly | 6 | Exports with no use after the cursor RFC. Rule 6 removes two of them |
| F333 | partly | 6 | Two exports for the stream |
| G507 | true | 6 | The stream class fixes its base class at module load. One export removes the defect |
| F229 | partly | 7 | Three error types, four message styles. Item 3 was never a throw |
| F222 | true | 7 | The iterator matches the message text `Truncated box` |
| G457 | true | 7 | `stsd` and `dref` return fewer entries than the count with no error |
| G455 | partly | 7 | Read and write still overflow the stack. PR 706 fixed the traversal |
| F288 | partly | 7 | The stream throws for the first box and rejects for a later box |
| F224 | true | 8 | Four rules for the `size` parameter |
| G447 | true | 8 | Nine writers write a U+0000 inside the value |
| G449 | true | 8 | `writeMdhd` writes `enm` for `en-US` |
| F246 | true | 8 | Three string write methods, two encodings |
| F409 | true | 8 | Four decode rules, WebVTT boxes disagree on the string end |
| F120 | true | 8 | `location` of `url ` and `urn `. Issue 629 |
| F257 | true | 8 | `writeMdhd` writes 0 for a short `language` |
| F200 | partly | 9 | Required `reserved` and `pre_defined` fields. `writeTfra` already ignores `reserved` |
| F9 | true | 9 | `entry_version` hides in `reserved2`. The `srat` box is `out` (a new box) |
| F201 | true | 9 | A raw field next to its decoded fields in `sidx`, `tfra`, `labl`, `tenc` |
| G511 | true | 9 | `isGroupLabel` repeats a flag bit, and the writer ignores it |
| F250 | true | 9 | Overlapping `tenc` forms. The constant IV write rule of PR 658 stays |

Carried rows: F196 step 2 (true, theme 4), F287 part B (true, theme 5), F180 (true, theme 5), F279 (true, theme 10), F371 (partly, `cursor`: rule 5 removes `PreselectionGroupBoxChild`).

## Rows that the cursor RFC owns

The subject is a section or a question of the cursor RFC. A change goes to the review of PR 682, not to this RFC.

| ID | At HEAD | Section of the cursor RFC | Note |
| --- | --- | --- | --- |
| F190 | true | Count fields | The table removes `tenc.defaultConstantIvSize`. PR 658 kept the field in version 1 |
| F88 | true | Count fields | The table removes `rangesCount` |
| G516 | true | Count fields | Duplicate of issue 625 |
| F178 | true | Result type, rule 6 | |
| F405 | true | Functions, question 5 | `readTemplate16` and `readTemplate32` |
| F411 | true | Question 5 | `readVttc` and `readVttC` |
| G488 | partly | Contract | The box above 4 GiB is decided. The error type of a missing writer is open |
| F253 | true | Result type, raw boxes | No sentence about a bare `ArrayBufferView` child |
| F268 | true | Functions | No sentence that `writeBytes` takes one array |
| F230 | true | Functions | No signed 24-bit function |
| F259 | true | Contract | No sentence that `writeIsoBox` copies |
| F210 | partly | Contract | The type of `CONTAINERS` |
| F276 | true | Contract | Each added container changes a raw box into a container. The guide sentence is a docs fix |
| F202 | true | Contract | The rule for absent keys. The cursor work rewrites every reader |
| F231 | true | Contract | Size 0 of a child box. PR 662 keeps size 0 valid |
| F272 | true | Result type, rule 2 | The RFC keeps `isIsoBoxType(type, box)` |
| F281 | true | Functions | The RFC keeps `null` |
| F282 | partly | Functions | Conflict: the RFC says that the traversal functions do not change |

## Rows not in this RFC

| ID | At HEAD | Reason |
| --- | --- | --- |
| G450 | true | Fix in a minor release |
| G504 | partly | PRs 705 and 714 fixed most of it. The byte order mark rule is documented |
| G521 | true | Docs fix |
| F374 | true | Waits for the decision on the syntax target |
| F298 | true | Part 1 is a speed fix. Part 2 belongs to the cursor rewrite |
| F408 | partly | Reader half: cursor RFC question 12. Writer half: fix in a minor release |
| G512 | true | Optional literal types of low value. The `writeTfra` mask is a minor fix |
| F214 | true | The type is unreleased. Fix before the first release |
| F215 | true | Docs sentence. PR 676 decided the result |
| F33 | true | Duplicate of F214 and F215 |
| F28 | true | Fix in a minor release |
| G458 | true | `Object.hasOwn` in a minor release |
| F106 | true | Mask in a minor release. A check conflicts with PR 669 |
| F285 | partly | TSDoc. A throw conflicts with the cursor RFC sentence on traversal |
| F284 | true | TSDoc. A rename conflicts with the same sentence |

## Count

| Home | Rows of the breaking group |
| --- | --- |
| Decided in the cursor RFC | 10 |
| Owned by the cursor RFC | 18 |
| Themes of this RFC | 49 |
| Not in this RFC | 15 |
| Total | 92 |

Theme 2 has no row of its own: the cursor RFC owns F190. Theme 10 has only the carried row F279.
