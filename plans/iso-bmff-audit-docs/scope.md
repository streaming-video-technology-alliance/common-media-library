# Scope of brief 1: one decision for each finding

Source: `origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/details-non-breaking.md` at 5c2de5a96. The plan builds on `main` at c8346ca6b.

## Rule for the work now and the work for 2.0.0

Many "Proposals after verification" say "do this in the cursor rewrite". Brief 1 still lists those findings for `main`. The plan applies this rule:

- Do now: every part that describes the 1.x API correctly. The cursor rewrite reads this text as input, so the work is not lost.
- Do not do now: a part that describes a 2.0.0 shape (`IsoBoxReadCursor`, `IsoRawBox`, a removed `config` parameter), or a part that needs a decision on a breaking change. The PR table lists the part as "deferred to 2.0.0" with the reason.
- Package-wide sweeps run only where the finding names them: F31, F338, F366, F359, F369.

Where two verifications disagree, the plan picks one:

- "Raw box object" stays in the 1.x writing guide (F262 part 2, F342). The F338 rename to "box object" waits for the cursor RFC.
- Summary lines use the imperative mood ("Read the `elng` box"), which the package uses today (F338). F31 proposes the third person. The imperative keeps the diff smaller.
- `writeTkhd` and the other 24 functions of F369 get the `@example` link now (F369). F110 proposes to wait. The 1.x signature is the published API, so the example is correct for it.

## Status at c8346ca6b

"Holds" means a spot check at c8346ca6b found the evidence. Task 1 confirms the other rows.

| ID | Spot check | Now | Deferred to 2.0.0, or not done |
| --- | --- | --- | --- |
| F31 | holds | Summary sweep (Task 8) | none |
| F34 | holds | Field TSDoc for `emsg`, `free`, `mdat`, `imda`, plus guide paragraph | `readBytes` sentence of the RFC |
| F57 | holds | `mfraSize` TSDoc, writer TSDoc, writing guide sentence | none |
| F58 | holds | Fix the clause title | none |
| F60 | | Field TSDoc for converted, time, and renamed fields | none |
| F110 | | `tfhd`, `tkhd`, `tfra` field TSDoc, "Sub-sample" | New `readTfhd` and `readTfdt` example files: deferred, cursor signatures |
| F184 | holds | Full TSDoc on the second overloads | `IsoBoxFields` stays `@public` only |
| F187 | holds | README description and quick-start | `package.json` description belongs to F387 (brief 2) |
| F262 | holds | Part 1 | Part 2: cursor RFC |
| F292 | holds | Part 1 | Part 2: cursor RFC |
| F330 | holds | Merge the two `### Changed` headings | Migration guide and `**Breaking:**` prefixes: 2.0.0 release prep |
| F334 | holds | Items 1 to 10 (item 10 is on an `@internal` function) | none |
| F335 | | Summaries for the types that exist on 1.x | `ParsedBox` family: after the RFC decides those types |
| F336 | | `@throws` tags, `defaultWriterConfig` test with example | Tags in RFC wording: 2.0.0 |
| F338 | holds | "box parsers", "Parse", "encoded", "library" | "box object" rename: cursor RFC |
| F340 | holds | Merge headings, two dates, `### Fix` | none |
| F341 | holds | Two bullets | none |
| F342 | holds | Three fixes, with `satisfies` | none |
| F343 | holds | Guide paragraph, TSDoc sentence | none |
| F359 | | 2015 citations, checked against the local PDF | `imda`, `labl`, `prsl`, `ardi`: remove the clause number |
| F360 | holds | Five field comments of `mdhd` | none |
| F366 | | Box type summaries in one pattern | none |
| F368 | holds | Summary sentence, two example test files | none |
| F369 | holds | 25 `@example` links, regions cut to the call | Regions for the other readers and writers: issue 435 |
| F370 | holds | int64 paragraph on 5 readers | none |
| F371 | holds | Move the `prsl` TODO above the TSDoc | Typed `prsl` children: breaking, 2.0.0 |
| F392 | | Stream and traverse examples | none |
| G461 | holds | Scope the sentence, add the throw paragraph and `@throws` | Count check: no such check exists |
| G510 | holds | README "Runtime requirements", stream TSDoc | `encodeText` TSDoc belongs to G503 (brief 2). ES baseline: open decision, see below |
| G518 | | Epoch, timescale, UUID, and key ID sentences | none |
| G520 | holds | Guide blocks and four TSDoc regions | none |
| G525 | holds | Example reader gets one more field | none |
| G526 | holds | Keep the fraction | none |
| G527 | holds | Replace the sentence | none |
| G528 | | Regions declare their input | `writeUint`, `writeIsoBoxes` regions: cursor RFC replaces them |
| G529 | holds | Pass the `Buffer`, guide sentence | none |
| F316 (optional) | | One sentence in two guides | none |
| F346 (optional) | | `ArrayBuffer` in the utilities context file, one sentence | none |
| F365 (optional) | | One `@param config` wording, add it to `writeMp4a` | none |
| G452 (optional) | | One sentence on `IsoBoxReadView.readUtf8` | none |

## Not in this PR

- The ES syntax baseline in G510. The dist output targets ES2022, and `rfc/uint64-reader-config.md` says ES2019. The `--target es2019` decision is open, so the README section states no baseline.
- The `site/index.md` "no polyfills" line (G510 item 5). The line is about dependencies, and the brief excludes site files.

## Files that brief 2 also changes

Brief 2 runs in parallel against `main`. These files overlap:

| File | Brief 1 | Brief 2 |
| --- | --- | --- |
| `libs/iso-bmff/CHANGELOG.md` | F340 heading merge, docs entries | an entry for each fix |
| `test/traverseIsoBoxes.test.ts` | F392, G528, G529 | F294, F390 |
| `test/createIsoBoxReadableStream.test.ts` | F392, G528, G529 | F390 |
| `src/readers/readVtte.ts`, `src/writers/writeVtte.ts` | F31 summary sweep | F126 |
| `src/boxes/ChunkOffsetBox.ts` and the `saio` and `iloc` types | F366, F359 | G519 |

If brief 2 merges first, rebase and keep both changes. Do the F340 heading merge after the last rebase, because every new entry lands next to the two headings.
