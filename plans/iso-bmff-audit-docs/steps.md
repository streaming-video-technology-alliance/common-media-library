# iso-bmff audit documentation fixes: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 36 documentation findings of brief 1, and the 4 optional findings, in one PR against `main`.

**Architecture:** Documentation only. The PR changes TSDoc, the README, the three guides, the changelog, and example regions of tests. Each task is one commit and covers one area of files. `scope.md` gives the decision for each finding ID, and this file refers to the IDs only.

**Tech stack:** TypeScript TSDoc, Markdown, Vitest example regions, api-extractor report, `scripts/agentDocs.ts`.

**Spec:** `origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/briefs.md` (section 1) and `details-non-breaking.md`. Read the "Proposal after verification" of each ID before its step. Read it with `git show origin/feat/iso-bmff-v2:plans/iso-bmff-v2-audit/details-non-breaking.md`.

## Global constraints

- Branch `docs/iso-bmff-audit-docs` from `origin/main`. Target `main`. One PR.
- Do not change a public type, an export name, or a run-time result. If a fix needs such a change, stop and list the finding as not done.
- Do not copy the audit files into the branch. Delete `plans/iso-bmff-audit-docs/` before the PR leaves draft.
- Writing Style of AGENTS.md for every sentence: under 20 words, no semicolons, no em dashes, no "e.g.", one name for each thing.
- No rationale comments in source. Spec references and field facts are fine.
- Every commit: `git commit -s` on the feature branch, with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Spec text: `~/Desktop/Specs/ISO_BMFF_ISO_IEC_14496-12_2015.pdf` and `~/Desktop/Specs/DASH_ISO_IEC 23009-1_2022 ed.5 - id.83314 Publication PDF (en).pdf`. Search them with `pdftotext -layout <pdf> - | grep -n '<term>'`.

## Review focus

1. A guide block that compiles and does nothing on a real file (the G520 defect class). Run each changed guide block against `test/fixtures/mss_moof_tfdt.mp4` and confirm that the body runs (Task 4, Task 5).
2. A linked `#region example` that uses a name declared outside the region (the G528 defect class). Task 9 ends with a grep for that case.
3. A TSDoc edit that changes a declaration. The API report diff must show only removed `// (undocumented)` lines (Task 6, Task 7, Task 8).
4. A spec citation with a clause number that nobody checked. Task 8 checks each number against the 2015 PDF.
5. A rebase conflict with brief 2 in the files that `scope.md` lists. Task 10 rebases on `origin/main` before the PR.

---

### Task 1: Branch and verification table

**Files:**

- Create: `plans/iso-bmff-audit-docs/results.md`

- [ ] **Step 1:** Run `git fetch origin && git switch -c docs/iso-bmff-audit-docs origin/main`, then `git submodule update --init`, `npm ci`, and `npm run build`.
- [ ] **Step 2:** For each of the 40 IDs in `scope.md`, open the files that the finding names and confirm the evidence at HEAD. Line numbers moved after 8ce63c212, so search by text.
- [ ] **Step 3:** Write `results.md` as a table with the columns ID, holds (yes, partly, no), and note. A row with "no" gets the reason and no fix. This table becomes the PR table in Task 10.
- [ ] **Step 4:** Commit `plans/iso-bmff-audit-docs/` with the message `docs(iso-bmff): add the plan for the audit documentation fixes`.

### Task 2: Changelog structure (F340, F330)

**Files:**

- Modify: `libs/iso-bmff/CHANGELOG.md`

- [ ] **Step 1:** Move the entries under the second `### Changed` of `## [Unreleased]` to the end of the first `### Changed` list. Delete the second heading.
- [ ] **Step 2:** Change `## [1.0.0-alpha.3] - 2025-01-07` to `2026-01-07` and `## [1.0.0-alpha.2] - 2025-01-05` to `2026-01-05`. Change `### Fix` under `## [1.0.0-alpha.7]` to `### Fixed`.
- [ ] **Step 3:** Run `grep -c '^### Changed' libs/iso-bmff/CHANGELOG.md` before and after. Expected: the count drops by 1. Run `node scripts/unreleasedEntries.ts` if it has a CLI, or `npx vp test --run scripts/unreleasedEntries.test.ts`. Expected: pass.
- [ ] **Step 4:** Commit: `docs(iso-bmff): merge the changelog headings and correct two dates`.

### Task 3: README (F187, F341, G510)

**Files:**

- Modify: `libs/iso-bmff/README.md`
- Regenerated: `skills/common-media-library/SKILL.md`, `skills/common-media-library/references/iso-bmff.md`

- [ ] **Step 1:** Change line 3 to `Read and write ISO Base Media File Format (ISO BMFF) boxes.` Change the first "When to use" bullet from "Parse the boxes" to "Read the boxes".
- [ ] **Step 2:** Change the timescale bullet to name `readMdhd`, `readStsd`, `readTrex`, `readTfhd`, `readTrun`. Change the 64-bit bullet to `Read a 64-bit field, such as a tfdt time at a 10 MHz timescale, exactly or with an overflow report: \`readInt64AsBigInt\`, \`createInt64OverflowReader\``. Keep 8 bullets.
- [ ] **Step 3:** Add `## Quick start` after Installation with two blocks. The read block: fetch a segment, call `readIsoBoxes(buffer, defaultReaderConfig())`, then `findIsoBox(boxes, box => box.type === 'tfdt')` and log `baseMediaDecodeTime`. The write block: `writeIsoBoxes(boxes, defaultWriterConfig())`. Import every name. Keep the three guide links.
- [ ] **Step 4:** Add `## Runtime requirements` with a table of three rows: `TextEncoder` (every writer of a string field, no fallback), `BigInt` (`readInt64AsBigInt` and boxes with `bigint` fields, no check), `ReadableStream` (`createIsoBoxReadableStream` and `IsoBoxReadableStream`, the constructor throws an error with a clear message). State no ES baseline.
- [ ] **Step 5:** Run `npm run build`. Expected: `skills/common-media-library/` changes. Run `npm test` later in Task 10 for the README example check.
- [ ] **Step 6:** Commit the README and the `skills/` files: `docs(iso-bmff): add a quick start and runtime requirements to the README`.

### Task 4: Reading guide (G461, G520, G525, G526, G527, G529, F34, F343, F57, F316)

**Files:**

- Modify: `libs/iso-bmff/docs/reading-boxes.md`

- [ ] **Step 1 (G461):** In "Incomplete boxes", change "The function does not throw." to "The function does not throw for an incomplete box." Add the paragraph: "A box with a body shorter than its fields is not an incomplete box. `readIsoBoxes` then throws a `RangeError` and returns no boxes. If the data comes from the network, call `readIsoBoxes` inside a `try` block." Mention no nesting limit and no count check.
- [ ] **Step 2 (G527):** Replace the last sentence of the QuickTime paragraph with the three sentences of the G527 proposal.
- [ ] **Step 3 (G520):** Replace the top-level `tfdt` loop with `const tfdt = findIsoBox(boxes, box => box.type === "tfdt")` and import `findIsoBox`.
- [ ] **Step 4 (G526):** Keep the fraction: `const seconds = Number(box.earliestPresentationTime / scale) + Number(box.earliestPresentationTime % scale) / box.timescale` with `const scale = BigInt(box.timescale)`.
- [ ] **Step 5 (G525):** Give `readTfdtWide` one more field, `extra: "x"`, in its return object. Add the sentence: "A custom reader whose result equals the built-in box type gets the fields of the configuration without a type argument."
- [ ] **Step 6 (G529, F34, F343, F57, F316):** Add these sentences. G529, next to the first read: "`readIsoBoxes` accepts an `ArrayBuffer` and any view, such as a `Uint8Array`, a `DataView`, or a Node.js `Buffer`. The function does not copy the data. Pass the view itself. Do not pass the `buffer` property of a view, because that buffer can contain other data." F34, next to the `emsg` example: byte fields share memory with the input, so call `slice()` to keep the bytes. F343: the paragraph of its proposal in "Reporting a rounded value". F57: a link to the new `mfraSize` sentence of the writing guide, next to the chunk offset note. F316: under "Using default config": "Each call returns a new configuration object. A player can create the configuration once and pass it to every read."
- [ ] **Step 7:** Run the changed blocks of Steps 3 and 4 against `test/fixtures/mss_moof_tfdt.mp4` and `test/fixtures/vttc.mp4`. Use the method of the README example check: copy the block to the scratchpad, replace `fetch` with `readFile`, and run it with `node`. Expected: Step 3 prints a `tfdt` value, and Step 4 prints `150.15` for `vttc.mp4`.
- [ ] **Step 8:** Commit: `docs(iso-bmff): correct the reading guide`.

### Task 5: Writing and utilities guides (F262, F342, G520, F57, F343, G510, F292, F346, F316)

**Files:**

- Modify: `libs/iso-bmff/docs/writing-boxes.md`, `libs/iso-bmff/docs/utilities.md`, `libs/iso-bmff/docs/utilities.context.d.ts`

- [ ] **Step 1 (F262, F342):** Line 8: "It takes an iterable of streamable items". Line 11: the two bullets of the F262 part 1 proposal. Add the exact-key rule (`'url '` and `'urn '` with the trailing space) and the rule that a writer follows the flags and the version and does not throw for a missing field.
- [ ] **Step 2 (F342):** Replace "cast raw box objects ... There are two ways" with the F342 wording. Replace the `as const` example with `satisfies FileTypeBox`. In both `appendBuffer` loops, replace the comment with `await new Promise((resolve) => sourceBuffer.addEventListener("updateend", resolve, { once: true }))`.
- [ ] **Step 3 (G520):** Replace `const [tfdt] = readIsoBoxes(...)` with `findIsoBox`, change the field on the found box, and write the whole segment with `writeIsoBoxes(boxes, { writers: { tfdt: writeTfdt } })`.
- [ ] **Step 4 (F57, F343, G510, F316):** F57: one sentence that the caller sets `mfraSize` after a change to the children of the `mfra` box. F343: link the all-bits sentence to the new reading guide paragraph. G510: "Streaming boxes" states that the function needs `ReadableStream` and throws without it. F316: the same sentence as Task 4 Step 6, for writers.
- [ ] **Step 5 (F292, G520):** Rewrite the `traverseIsoBoxes` paragraph for one optional configuration with `depthFirst` (default `true`) and `maxDepth` (default `Infinity`). Add an example with `{ depthFirst: false, maxDepth: 1 }`. Add "Finding boxes" for `findIsoBox`, `filterIsoBoxes`, and `isIsoBoxType`, with the rule that the search follows only the `boxes` field and does not reach the `entries` of `stsd` and `dref`. Use `moov` in the `isContainer` example and `mfhd` with version 0 in the `isFullBox` example. Test `child.type === "mfhd"` and log `child.sequenceNumber`.
- [ ] **Step 6 (F346):** Change `declare const buffer: Uint8Array` to `ArrayBuffer` in `utilities.context.d.ts`. Add "In the examples, `buffer` holds the bytes of a segment." before the first block of `utilities.md`.
- [ ] **Step 7:** Run the blocks of Steps 2, 3, and 5 against `test/fixtures/mss_moof_tfdt.mp4` as in Task 4 Step 7. For Step 2, stub `sourceBuffer` with an `EventTarget` that dispatches `updateend`. Expected: each `if` body runs.
- [ ] **Step 8:** Run `npm run build`. The utilities guide feeds `skills/common-media-library/references/iso-bmff.md`. Commit the guides and `skills/`: `docs(iso-bmff): correct the writing and utilities guides`.

### Task 6: TSDoc of the top-level files (F334, F184, F335, F336, G461, F343, G510, F338, F371, F370, F368, F365, G452)

**Files:**

- Modify: `src/IsoBoxContainerMap.ts`, `src/IsoBoxReaderMap.ts`, `src/IsoBoxWriterMap.ts`, `src/IsoBoxReadViewConfig.ts`, `src/readIsoBoxes.ts`, `src/IsoBoxReadView.ts`, `src/IsoBoxWriteView.ts`, `src/utils/writeContainerBox.ts`, `src/findIsoBox.ts`, `src/filterIsoBoxes.ts`, `src/writeIsoBox.ts`, `src/writeIsoBoxes.ts`, `src/createIsoBoxReadableStream.ts`, `src/IsoBoxReadableStream.ts`, `src/createInt64OverflowReader.ts`, `src/IsoBoxData.ts`, `src/IsoBoxType.ts`, `src/IsoBoxContainer.ts`, `src/IsoBoxMap.ts`, `src/IsoBoxReader.ts`, `src/IsoBoxWriter.ts`, `src/boxes/Box.ts`, `src/boxes/PreselectionGroupBox.ts`, `src/readers/read{Grpl,Meco,Meta,Strk,Udta}.ts`, `src/readers/create{Audio,Visual}SampleEntryReader.ts`, every writer with `@param config` (all paths under `libs/iso-bmff/`)

- [ ] **Step 1 (F334):** Apply the ten corrections of the finder, with the three changes of the verification. `readIsoBoxes` gets `@param config - The readers map and the \`int64\` option.` on every overload.
- [ ] **Step 2 (F184):** Give the second overload of `findIsoBox` and `filterIsoBoxes` a full block (summary, `@param`, `@returns`, `@public`). The first overload narrows with a type guard callback, the second takes a `boolean` callback. Remove the blank line before `filterIsoBoxes`.
- [ ] **Step 3 (F336, G461):** Add `@throws` tags. `writeIsoBox`, `writeIsoBoxes`, `createIsoBoxReadableStream`, `IsoBoxReadableStream`: "Error if a box has no writer, no `boxes` field, and no `view`. The message starts with \"No writer found for box type\"." and "RangeError if a `bigint` field does not fit its size." Every `readIsoBoxes` overload: "RangeError if a box is complete and a reader reads past the end of that box." `IsoBoxReadableStream` constructor: the `ReadableStream` error. No tag for `Invalid box`.
- [ ] **Step 4 (F335):** Write the corrected summaries of the F335 verification for `IsoBoxData`, `IsoBoxContainer`, `IsoBoxContainerMap`, `IsoBoxType`, `IsoBoxMap`, `IsoBoxReaderMap`, `IsoBoxWriterMap`, and `Box`. Write `IsoBoxReader` and `IsoBoxWriter` for the 1.x signature (a view, not a cursor). Do not touch `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox`, or `IsoBoxFields`.
- [ ] **Step 5 (F338, F371, G510, F343, G452):** "box parsers" becomes "box readers". Move the `prsl` TODO above the TSDoc block. Add the `ReadableStream` sentence to `createIsoBoxReadableStream` and `IsoBoxReadableStream`. Add the all-bits sentence to `createInt64OverflowReader`. Add to `IsoBoxReadView.readUtf8`: "The function expects valid UTF-8. The result for bytes that are not valid UTF-8 depends on the environment, and a write of that string does not return the source bytes."
- [ ] **Step 6 (F370, F368, F365):** Copy the int64 sentence of `readEdts` to the five readers. Replace the first paragraph of both sample entry factories with the F368 sentence (`ac-3` or `ec-3`, `av01` or `vp09`). Use `@param config - The \`IsoBoxWriteViewConfig\` with the writers for the child boxes` on every writer that takes `config`, and add it to `writeMp4a`.
- [ ] **Step 7:** Run `npm run build -w libs/iso-bmff` and `git diff libs/iso-bmff/config/cml-iso-bmff.api.md`. Expected: only removed `// (undocumented)` lines for the two overloads. Any other line in that diff means a declaration changed, so stop and revert it.
- [ ] **Step 8:** Commit: `docs(iso-bmff): correct the TSDoc of the top-level functions and types`.

### Task 7: Summary lines of the readers and writers (F31, F338)

**Files:**

- Modify: every file in `libs/iso-bmff/src/readers/read*.ts` and `libs/iso-bmff/src/writers/write*.ts` with a box summary

- [ ] **Step 1:** Write a TypeScript script in the scratchpad. For each reader, it takes the four-character code from the file name and the box type from the return type. It replaces the summary line `Parse a(n) \`X\`` with `Read the \`<fourcc>\` box (\`X\`).` For each writer, it replaces `Write a(n) \`X\` ...` with `Write the \`<fourcc>\` box (\`X\`).` It replaces `the encoded box` with `the written box` in the `@returns` lines. It prints every file that it skips.
- [ ] **Step 2:** Run the script. Fix each skipped file by hand. Check the 13 readers that share a class name (avc1 to avc4, hev1, hvc1, encv, enca, mp4a, free, skip, and the two shared sample entry readers). Each must name its own code.
- [ ] **Step 3:** Run `grep -rn 'Parse a\|box parsers\|encoded box' libs/iso-bmff/src`. Expected: no line. Keep "parsed box" in `@returns` lines, because the type `ParsedIsoBox` keeps its name.
- [ ] **Step 4:** Run `npm run build -w libs/iso-bmff` and check the API report as in Task 6 Step 7. Commit: `docs(iso-bmff): use one summary form for the readers and writers`.

### Task 8: TSDoc of the box types (F366, F359, F58, F57, F60, F360, G518, F110, F34)

**Files:**

- Modify: `libs/iso-bmff/src/boxes/*.ts`, the reference lines in `src/readers/*.ts` and `src/writers/*.ts`

- [ ] **Step 1 (F366, F359):** List every summary and reference line with `grep -rn 'ISO/IEC\|- Container\|^ \* [A-Z].* - .[a-z0-9 ]\{4\}.' libs/iso-bmff/src`. Use one form for each box type: the first line is `<Box name in title case> (\`<fourcc>\`).`, and the second line is `ISO/IEC 14496-12:2015 - <clause>`.
- [ ] **Step 2 (F359):** Check each clause number against the 2015 PDF before you write it. Use 23001-7:2016 for `pssh`. Check the emsg version 1 clause in the 23009-1:2022 PDF. For `imda`, `labl`, `prsl`, and `ardi`, remove the clause number and keep the box name. Replace every `202x`. Use the same citation on the type, the reader, and the writer.
- [ ] **Step 3 (F366):** Fix the named exceptions: `meco` loses the clause in its title, `strk` and `vttc` follow the form, two blank lines in `ChunkOffsetBox.ts`, `EMSG` becomes `emsg`, one rule for the final period of the WebVTT summaries.
- [ ] **Step 4 (F58, F57):** `MovieFragmentRandomAccessOffsetBox`: title `Movie Fragment Random Access Offset Box`, and TSDoc on `mfraSize` from the F57 proposal. Add the caller sentence to `writeMfra` and `writeMfro`.
- [ ] **Step 5 (F360, F60, G518):** Rewrite the six `MediaHeaderBox` field comments with the F360 text. Add one line to the converted, time, and renamed fields of `MovieHeaderBox`, `TrackHeaderBox`, `MovieExtendsHeaderBox`, and `EditListEntry`: seconds since 1904-01-01 UTC for the times, the timescale of each duration, "All bits set means that the duration cannot be determined." with a link to the 64-bit section of the writing guide, and -1 for an empty edit in `mediaTime`. Write `systemId` as "The UUID of the protection system, 16 bytes." and `defaultKid` as "`default_KID`: the default key ID, 16 bytes."
- [ ] **Step 6 (F110, F34):** `TrackFragmentHeaderBox`: the flag bit of each of the five optional fields, and that the writer writes a field only when its flag is set. `TrackHeaderBox`: `volume` is a decoded 8.8 value, `width` and `height` are decoded 16.16 values, and the type comment lists the flags 0x1, 0x2, 0x4, 0x8. `tfra`: each `lengthSizeOf*` is the byte length minus one. "Sub sample" becomes "Sub-sample". `messageData` of `emsg` and `data` of `free`, `mdat`, and `imda`: "The bytes are a view over the input buffer."
- [ ] **Step 7:** Run `npm run build -w libs/iso-bmff` and check the API report as in Task 6 Step 7. Commit: `docs(iso-bmff): document the fields and the spec references of the box types`.

### Task 9: Example regions of the tests (F369, F368, F336, F392, G528, G529, G520)

**Files:**

- Create: `libs/iso-bmff/test/readers/createAudioSampleEntryReader.test.ts`, `libs/iso-bmff/test/readers/createVisualSampleEntryReader.test.ts`, `libs/iso-bmff/test/writers/defaultWriterConfig.test.ts`
- Modify: the 25 source files and test files of F369, `test/createIsoBoxReadableStream.test.ts`, `test/traverseIsoBoxes.test.ts`, `test/isContainer.test.ts`, `test/readers/readEmsg.test.ts`, `test/readInt64AsBigInt.test.ts`, `test/createInt64OverflowReader.test.ts`, `test/readers/defaultReaderConfig.test.ts`, the 9 files of G529, `test/api.test.ts`

- [ ] **Step 1 (F369):** Add `@example {@includeCode ../../test/<readers|writers>/<name>.test.ts#example}` to the 25 functions. In each region, keep the input and the call. Move the `assert` calls and the expected bytes below `// #endregion example`.
- [ ] **Step 2 (F368, F336):** Write the three new test files. Each has an `#example` region with a working read or write, and assertions after the region. `defaultWriterConfig.test.ts` also asserts that the writer keys match the reader keys of `defaultReaderConfig`, apart from the container keys. Replace the inline blocks of the two factories with `{@includeCode}`. Add `{@includeCode}` to `defaultWriterConfig`, `writeIsoBox`, `isIsoBoxType`, and `isFullBox`, with a region in the existing test file. Link `IsoBoxReadableStream` to `createIsoBoxReadableStream` with `{@link}`.
- [ ] **Step 3 (G528, G520):** Declare the input inside each region: the 20 bytes of the version 1 `tfdt` box, wrapped with `boxBytes('moof', boxBytes('traf', bytes))` from `test/util/wideBoxes.ts`, then read with `findIsoBox`. In `readEmsg.test.ts`, move the read call into the region. In `isContainer.test.ts`, use `moof` with an `mfhd` child, declared inside the region. Leave the `writeUint` and `writeIsoBoxes` regions.
- [ ] **Step 4 (F392):** Stream example: pipe to `new WritableStream({ write(chunk) { chunks.push(chunk) } })` and compare the joined chunks with the fixture bytes. Remove the temporary file and the Node stream adapter from both tests. Traverse example: `Array.from(traverseIsoBoxes(boxes), box => box.type)` on a `moof` with `mfhd` and `traf`, with the order asserted, and one more line with `{ depthFirst: false }`.
- [ ] **Step 5 (G529):** Pass `isoFile` to `readIsoBoxes` in the 9 files. Keep `test/util/load.ts`.
- [ ] **Step 6:** Run `npm test -w libs/iso-bmff`. Expected: pass, with more tests than before.
- [ ] **Step 7:** Check each linked region for a name declared outside it. Copy each region to a scratchpad file, add imports from `@svta/cml-iso-bmff`, `node:assert`, and `node:fs/promises` only, and run it with `node`. Expected: no `ReferenceError` in the regions that this task changed.
- [ ] **Step 8:** Commit: `docs(iso-bmff): link the test examples and declare their input`.

### Task 10: Changelog entries, full check, PR

**Files:**

- Modify: `libs/iso-bmff/CHANGELOG.md`
- Delete: `plans/iso-bmff-audit-docs/`

- [ ] **Step 1:** Add entries under `### Changed` of `[Unreleased]`, one change each, present tense, at most three sentences of 25 words. One entry for each guide, one for the README, one for the field TSDoc, one for the summary form, one for the `@throws` tags, and one for the examples. Run the Writing Style gate on each entry.
- [ ] **Step 2:** `git fetch origin && git rebase origin/main`. Resolve conflicts with brief 2 by keeping both changes. Then run `npm test` at the root. Expected: lint, format, build, typecheck, the README and guide example check, and all tests pass.
- [ ] **Step 3:** Copy the table of `results.md` into the PR description, with one more column: done, deferred to 2.0.0, or not done, and the reason. Delete `plans/iso-bmff-audit-docs/`, then commit: `docs(iso-bmff): add the changelog entries for the audit documentation fixes`.
- [ ] **Step 4:** Hand the PR creation to Casey with `/create-pr main`, unless Casey asks for the PR in the session.
