# Changes that break nothing: details

The audit agents wrote this text. The index is in `findings.md`.

## G506: The documented feature test for `readInt64AsBigInt` (`typeof BigInt === 'function'`) passes on a runtime that has `BigInt` and no `DataView` BigInt methods, and the read then throws only for version 1 boxes.

Severity medium. Category behavior. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readInt64AsBigInt.ts:11`, `libs/iso-bmff/docs/reading-boxes.md:166`, `libs/iso-bmff/src/IsoBoxReadView.ts:241`, `libs/iso-bmff/src/IsoBoxWriteView.ts:126`, `libs/iso-bmff/src/IsoBoxWriteView.ts:213`, `libs/iso-bmff/test/int64.environment.test.ts:27`

**Evidence.** readInt64AsBigInt.ts:11-13: "This function needs `BigInt` and does not test for it ... test `typeof BigInt === 'function'` before you pass this function". The guide repeats the advice at reading-boxes.md:166. IsoBoxReadView.ts:241 is `this.dataView.getBigUint64(this.cursor)`. IsoBoxWriteView.ts:126 is `this.dataView.setBigUint64(this.cursor, value)` and line 213 is `this.dataView.setBigInt64(this.cursor, value)`. Run with the three `DataView.prototype` methods deleted and `BigInt` present: the documented test returns `true`, a version 0 `tfdt` reads as `9`, a version 1 `tfdt` throws `TypeError: this.dataView.getBigUint64 is not a function`, and `writeIsoBox` of a version 1 `tfdt` with a `bigint` throws `TypeError: this.dataView.setBigUint64 is not a function`. Public browser compatibility tables list `BigInt` from Safari 14 and the `DataView` BigInt methods from Safari 15. I did not test a device. The environment test removes `BigInt` only.

**Proposal of the finder.** Make `BigInt` the only requirement, so that the documented test is correct. Read the two 32-bit halves and combine them: `BigInt(hi) * BigInt(4294967296) + BigInt(lo)`. Write with two `setUint32` calls from `value >> BigInt(32)` and `value & BigInt(0xffffffff)`. A rough loop in Node 24 (one process, 1024 fields) measured 13.5 ns for `getBigUint64` and 14.3 ns for the combined form. If the project keeps the native methods, change the documented test to `typeof DataView.prototype.getBigUint64 === 'function'` in readInt64AsBigInt.ts and reading-boxes.md, and state the same need in the TSDoc of `readUint64`, `writeUint64`, `writeWideUint` and `writeWideInt`. Add an environment test that deletes the three methods.

**Proposal after verification.** Keep `getBigUint64`, `setBigUint64` and `setBigInt64`. Do not read or write two 32-bit halves. Change the documentation only:
1. In libs/iso-bmff/src/readInt64AsBigInt.ts:11-13 and libs/iso-bmff/docs/reading-boxes.md:166, state that the function needs `BigInt` and the `DataView` methods for 64-bit integers. Replace the test with `typeof DataView.prototype.getBigUint64 === 'function'`. A runtime with that method also has `BigInt`, so one test covers both needs.
2. State the same need in the TSDoc of `readUint64`, `writeUint64`, `writeWideUint` and `writeWideInt` (for a `bigint` value), and in the 64-bit section of libs/iso-bmff/docs/writing-boxes.md. Carry the text to the exported field functions of the cursor API when that RFC lands.
3. Optional: add one case to test/int64.environment.test.ts that deletes the DataView BigInt methods, keeps `BigInt`, and asserts that the default mode and `createInt64OverflowReader` still read and write. This pins the claim that only the `bigint` path needs the methods.
4. Optional: amend the same sentence in rfc/uint64-reader-config.md:166.
No behavior, type, or written byte changes, so the fix does not need the major version.

**Prior decision.** PR 612 (cf6add83e) chose `DataView.getBigUint64` and `setBigUint64` on purpose. RFC rfc/uint64-reader-config.md (PR 613, accepted) lines 166, 426 and 461 decide that `readInt64AsBigInt`, `readUint64` and `writeUint64` have no runtime check and that the read fails with the error of the runtime. These decisions make the native methods and the missing check intentional. They do not cover the documented feature test: the RFC does not consider a runtime with `BigInt` and without the DataView BigInt methods.

**Result.** Done in PR 702.

## F279: The config argument is optional for writeIsoBox and required for writeIsoBoxes, createIsoBoxReadableStream and the stream constructor, and `writers` is required while `readers` is optional.

Severity medium. Category consistency. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/writeIsoBox.ts:19`, `libs/iso-bmff/src/writeIsoBoxes.ts:22`, `libs/iso-bmff/src/createIsoBoxReadableStream.ts:21`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:35`, `libs/iso-bmff/src/IsoBoxWriteViewConfig.ts:12`, `libs/iso-bmff/src/IsoBoxReadViewConfig.ts:18`, `libs/iso-bmff/src/utils/createWriterConfig.ts:4`, `libs/iso-bmff/src/utils/writeBox.ts:25`, `rfc/iso-bmff-cursor-api.md:168`

**Evidence.** writeIsoBox.ts:19 `config?: IsoBoxWriteViewConfig`. writeIsoBoxes.ts:22, createIsoBoxReadableStream.ts:21 and IsoBoxReadableStream.ts:35 `config: IsoBoxWriteViewConfig`. IsoBoxWriteViewConfig.ts:12 `writers: IsoBoxWriterMap` against IsoBoxReadViewConfig.ts:18 `readers?:`. The implementation already accepts a missing value everywhere: createWriterConfig.ts:4-8 `config?: Partial<IsoBoxWriteViewConfig>` / `writers: config?.writers ?? {}`, and writeBox.ts:25 `config.writers?.[type]`. So `writeIsoBoxes(parsedBoxes)` works at run time and fails to compile. The RFC table keeps the difference: `writeIsoBoxes(boxes, config)` and `writeIsoBox(box, config?)` (lines 168-169), while its `IsoBoxWriteCursor` has `writers?`.

**Proposal of the finder.** Make `config` optional in `writeIsoBoxes`, `createIsoBoxReadableStream` and any remaining stream constructor, and make `writers` optional in the write config type. A call with no config then copies raw boxes and writes containers, the same as `readIsoBoxes(data)` with no config. Update the RFC table.

**Proposal after verification.** Resolve the inconsistency in the direction of issue 298 and PR 301. Do not make `config` or `writers` optional.

1. Make `config` required in `writeIsoBox`: `writeIsoBox(box: IsoBoxStreamable<IsoInt64>, config: IsoBoxWriteViewConfig)`. A caller who writes only containers and raw boxes passes `{ writers: {} }`, as issue 298 states.
2. Remove the internal `createWriterConfig` (src/utils/createWriterConfig.ts). Pass `config` through in writeIsoBox.ts:21, writeIsoBoxes.ts:24 and IsoBoxReadableStream.ts:37. Change writeBox.ts:25 to `config.writers[type]`. The removal also stops one object allocation per box in the stream (IsoBoxReadableStream.ts:48 calls `writeIsoBox`, which calls the helper again).
3. Correct the TSDoc at src/IsoBoxWriteViewConfig.ts:4. The text "Configuration for the IsoBoxReadableStream." is the old name of the type (CHANGELOG.md:281). Write "Configuration for the box writers."
4. In rfc/iso-bmff-cursor-api.md:174, change the row to `writeIsoBox(box, config)`. The `writers?` field of `IsoBoxWriteCursor` (line 154) may stay optional, because a direct call such as `writeTfdt(cursor, box)` needs no map.

Step 1 is the only breaking part. Steps 2 and 3 fit any release.

**Prior decision.** Issue 298 "Optional configuration footgun?" (closed as completed) and PR 301 (commit a31419299, merged 2026-01-29) made the config and `writers` required on purpose. libs/iso-bmff/CHANGELOG.md:194 records the change in 1.0.0-beta.1. rfc/iso-bmff-container-readers-writers.md:217 (accepted) rejects an optional `config` argument for the writers for the same reason.

**Result.** Not done. Brief 4 covers the row in theme 10, rules for an optional configuration.

## F330: The unreleased changes that alter results have no migration guide in the docs, and the changelog does not mark them as breaking

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/CHANGELOG.md:40`, `libs/iso-bmff/CHANGELOG.md:47`, `libs/iso-bmff/CHANGELOG.md:60`, `libs/iso-bmff/CHANGELOG.md:76`, `libs/iso-bmff/CHANGELOG.md:77`, `libs/iso-bmff/CHANGELOG.md:79`, `libs/iso-bmff/CHANGELOG.md:89`

**Evidence.** Entries under `### Fixed` and `### Changed` change values or types for existing code. Examples: "If your code passes 16384 for w, pass 1. The value 16384 now writes 0." "If your code passes 256 for full right, pass 1. The value 256 now writes 0." "If your code passes 0 or no size to read to the end of the view, pass -1". "The `kid` field has 16 numbers for each key ID." "...is a compile error." "Cast the child: `(child as ParsedIsoBox).view`". AGENTS.md: "If one is unavoidable, provide migration guidance in the changelog and the docs." `grep -rn "16384\|migrat" docs README.md` returns nothing. The entries are in the same lists as changes with no effect, such as "`readTfra` now computes the size of the 64-bit integer fields one time for each box."

**Proposal of the finder.** At release prep for 2.0.0, add `docs/migrating-to-v2.md` and link it from the README. Give one table row for each changed value or type: the old result, the new result, and the change in adopter code. Include the rows above and the cursor changes. In the changelog, add a `### Breaking` list at the top of the 2.0.0 section (or prefix each entry with "Breaking:") that links to the guide.

**Proposal after verification.** Do this at 2.0.0 release prep, after the cursor RFC settles question 1 (release order). Add `libs/iso-bmff/docs/migrating-to-v2.md` with a `title` frontmatter and link it from README.md next to the three guides. Write the guide as the delta from 1.0.7 to 2.0.0: one table for changed values (matrix u, v, w as 2.30 with w = 1, `balance` as signed 8.8, signed `rate`, `volume`, `layer`, `alternateGroup`, the `readTemplate` fraction, `pssh` `kid` with 16 bytes for each key ID, `entry_count` 0 in `dref` and `stsd`, UTF-8 strings, `emsg`, `sidx`, `prft`, and `ctts` for version 2 or above), one table for changed types (`EventMessageBox` narrowing, `IsoBox` children of `udta`, `grpl`, `strk`, `meco`, generic readers and `ReturnType`), one table for changed errors (`Truncated box`, `No writer found for box type`), and one section for the cursor API. Do not add rows for `IsoBoxReadView` methods or the `view` cast if 2.0.0 removes them before any release. Rewrite or remove those changelog entries instead. In the changelog, keep the Keep a Changelog headings. Add one line under the `## [2.0.0]` heading that links the guide, and prefix each entry that changes a value, a type, or an error with `**Breaking:**`. Do not add a `### Breaking` heading. Merge the two `### Changed` headings of the `[Unreleased]` section (lines 31 and 103) now, since that part does not depend on the release.

**Prior decision.** No decision against a guide. PR 620 (a13db9ace) and closed release PR 616 show the maintainers classed the value changes as fixes for a minor release (1.1.0), with the migration sentence inside each changelog entry. rfc/uint64-reader-config.md:12 records "Breaking change: No" with named exceptions. AGENTS.md:67 requires guidance in the changelog and the docs.

**Result.** Partly done in PR 708. The migration guide and the breaking-change prefixes go to the 2.0.0 release prep.

## G520: Seven examples look for `tfdt` at a position where no ISO BMFF file has it, so they do nothing on every fixture.

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/docs/reading-boxes.md:157`, `libs/iso-bmff/docs/utilities.md:43`, `libs/iso-bmff/docs/writing-boxes.md:141`, `libs/iso-bmff/test/isContainer.test.ts:24`, `libs/iso-bmff/test/readInt64AsBigInt.test.ts:18`, `libs/iso-bmff/test/createInt64OverflowReader.test.ts:34`, `libs/iso-bmff/test/readers/defaultReaderConfig.test.ts:19`

**Evidence.** ISO/IEC 14496-12:2015 clause 8.8.12 states "Box Type: `tfdt' Container: Track Fragment box ('traf')" (spec text lines 4101 to 4102). A tfdt box is therefore two levels below a top-level moof box.

reading-boxes.md L156-L157 loops over the top level: `for (const box of boxes) { if (box.type === "tfdt") {`. utilities.md L41-L43 tests the direct children of a top-level box: `if (isContainer(box)) { for (const child of box.boxes) { if (child.type === "tfdt")`. writing-boxes.md L141 takes the first box of the buffer: `const [tfdt] = readIsoBoxes(buffer, {` and then tests `tfdt?.type === "tfdt"`.

Run of each block against all 15 fixtures (scratchpad examples/a/*.run.ts with FIXTURE=<name>): reading-boxes L147 block printed 0 lines for all 15 files. utilities L38 block printed 0 lines for all 15 files. In the writing-boxes L133 block the variable `tfdt` held `{"size":32,"type":"ftyp"...}`, `styp` or `moof`, so the `if` body never ran. With a buffer of one bare tfdt box the body works (`17899796424433664n -> 17899796424523664n`).

The same pattern is in four TSDoc examples. isContainer.test.ts L24-L33 builds `TRAF` and `MOOV > UDTA > TFDT` at the top level. readInt64AsBigInt.test.ts L18, createInt64OverflowReader.test.ts L34 and defaultReaderConfig.test.ts L19 read `TFDT_V1`, one bare tfdt box, with `const [box] = readIsoBoxes(TFDT_V1, ...)`.

**Proposal of the finder.** Use the lookup functions in every example that reads a nested box: `const tfdt = findIsoBox(boxes, box => box.type === 'tfdt')` or `filterIsoBoxes`. In writing-boxes.md L141 replace the array destructuring with `findIsoBox`. In the isContainer example use a real direct child, such as `mfhd` in `moof`, or `trex` in `mvex`. In the three int64 TSDoc examples wrap the tfdt bytes in moof and traf, or read a top-level box with a 64-bit field (`sidx`, version 1 `emsg`).

**Proposal after verification.** Split the finding in two and lower the scope of the title.

1. Three guide blocks never run their body on a real segment (medium, docs): reading-boxes.md L147-161, utilities.md L38-48, writing-boxes.md L133-151. Fix reading-boxes and writing-boxes with `const tfdt = findIsoBox(boxes, box => box.type === "tfdt")`. In writing-boxes, keep `boxes`, change the field on the found box, then write the whole segment with `writeIsoBoxes(boxes, { writers: { tfdt: writeTfdt } })`. A lone `writeIsoBox(tfdt)` returns a bare tfdt box that no player can append. In utilities.md use a real direct child: `child.type === "mfhd"` and `child.sequenceNumber` for a top-level moof.

2. Four TSDoc examples run and pass, but they show a pattern that fails on a real segment (low, docs). Keep tfdt, because it is the motivating case of the int64 RFC. Wrap the bytes with the existing test helper, which accepts nested `Uint8Array` fields (test/util/wideBoxes.ts:2): `boxBytes('moof', boxBytes('traf', TFDT_V1))`, and read the box with `findIsoBox`. In isContainer.test.ts change the example to moof > mfhd to match the guide.

If the cursor RFC lands in 2.0.0, the guides are rewritten anyway. Then write the new examples with the real path (`['moof', 'traf', 'tfdt']`) from the start. Consider a run of each guide block against one fixture in the example check, because a compile-only check did not find this defect.


**Result.** Done in PR 708.

## F327: The published package does not contain NOTICE.md with the codem-isoboxer license text

Severity medium. Category package-config. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/package.json:24`, `libs/iso-bmff/NOTICE.md:6`

**Evidence.** `"files": ["dist/**/*", "NOTICE"]`. The file is `NOTICE.md`. `npm pack --dry-run --json -w libs/iso-bmff` lists `LICENSE`, `README.md`, `package.json`, and the `dist` files. It does not list `NOTICE.md`. The file says "Contains code derived from the `codem-isoboxer` library" and holds an MIT text with the condition "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software." No script in `scripts/` or `.github/` copies the file. The cmcd, id3, webvtt, dash, and utils packages have the same `"NOTICE"` entry.

**Proposal of the finder.** Change the entry to `"NOTICE.md"` in this package. Open a follow-up issue for the same entry in the other packages. After the cursor rewrite, review whether the package still has code derived from codem-isoboxer, and keep or reword the notice to match.

**Proposal after verification.** Change `"NOTICE"` to `"NOTICE.md"` in `libs/iso-bmff/package.json` now. Do not wait for 2.0.0: the fix is not breaking, and every published 1.x tarball lacks the MIT notice. Apply the same one-line fix in one PR to the seven other packages that have a NOTICE.md file and the wrong entry: 608, dash, id3, mse, structured-field-values, webvtt, xml. Packages with no NOTICE.md file (cmcd, utils, and the others) need no change, or the unused entry can go. Add a changelog entry per affected package. After the cursor rewrite, review whether NOTICE.md still describes the code.

**Prior decision.** No decision keeps the current state. Two precedents support the fix: commit e1e43230f (PR 344, c2pa pre-publish review) renamed `libs/c2pa/NOTICE` to `NOTICE.md` and changed the `files` entry to match, and `rfc/error-codes.md:128` specifies `files: ["dist/**/*", "NOTICE.md"]` for new packages. PR 105 (5d22395fd, "include full license text in notice file") shows that the maintainers intend to ship the license text. The `"NOTICE"` entry is a leftover of the pre-v1 single package (`lib/NOTICE`, removed in 8ac3ef9b9, PR 265).

**Result.** Done in PR 703, for eight packages.

## F121: `readTrun` creates one empty object for each sample of a box with no per-sample flag, and the count has no limit.

Severity medium. Category performance. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readTrun.ts:29`, `libs/iso-bmff/src/readers/readTrun.ts:30`, `libs/iso-bmff/src/IsoBoxReadView.ts:439`

**Evidence.** readTrun.ts:29-30 `const samples = view.readEntries<TrackRunSample>(sampleCount, () => { const sample: TrackRunSample = {}`. With `tr_flags` 0x000000 or 0x000001 each row has zero bytes, so no read fails at the end of the box. A 16-byte `trun` box with `sample_count` 0xFFFFFFFF makes `readEntries` (IsoBoxReadView.ts:439-446) push 4294967295 objects, and the process runs out of memory with no error for the caller. This case differs from issue 668: the built-in reader reaches it, and the caller gets no error. For a valid file the rows are also pure allocation, because every sample uses the `tfhd` defaults.

**Proposal of the finder.** For a `trun` box with no bit of 0x000F00 set, do not allocate rows. Two options. Keep `sampleCount` and return `samples: []` for that case, or keep the rows and throw a `RangeError` when `sampleCount` exceeds a documented limit. Decide together with the finding about `sampleCount` in `writeTrun`.

**Proposal after verification.** Keep one row per sample. `samples.length === sampleCount` stays the contract, as in the spec text (8.8.8.3, "the rows can be empty") and in shaka-player and codem-isoboxer. Do not return `samples: []` for a box with no per-sample flag.

If the maintainers want protection against the 16-byte box, add one guard in `readTrun` for the zero-byte row case only (no bit of 0xF00 set). The guard throws a `RangeError` that names `sample_count`, the limit, and the received value. Rows with at least one field need no guard, because the read already throws a `RangeError` at the end of the box view. This guard changes behavior only for input above the limit, so it is not a break for adopters and does not need the major version. The limit is a number that the spec does not define, so it needs a maintainer decision and a documentation line. Without agreement on a number, leave the reader unchanged and document that `readTrun` allocates `sample_count` rows. Correct the finding text: the allocation cost for valid fragments is about 80 bytes per row and is not a performance reason for a change.

**Prior decision.** None found. Issue 668 (closed as not planned) does not cover this case: its reasons were that only a custom reader reaches the position and that the error goes to the caller. Neither reason applies here. `gh issue list` searches for `trun sample_count memory` and `readEntries` returned no matching issue.

**Result.** Issue 710. The limit needs a number from the maintainer.

## G456: traverseIsoBoxes takes quadratic time in two shapes: breadth-first over many sibling containers, and depth-first over deep nesting.

Severity medium. Category performance. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/traverseIsoBoxes.ts:32`, `libs/iso-bmff/src/traverseIsoBoxes.ts:50`, `libs/iso-bmff/src/traverseIsoBoxes.ts:52`

**Evidence.** Breadth-first: `const item = queue.shift()` (:32) with `queue.push([next, depth + 1])` (:52) for every container. Measured for N sibling 8-byte `moof` boxes (N x 8 bytes of input), `depthFirst: false`:
- 25,000: 62 ms to 515 ms
- 50,000: 246 ms to 1.15 s
- 100,000 (800 KB of input): 0.99 s to 7.7 s
- 200,000: 3.98 s to 21.6 s
- 400,000 (3.2 MB of input): 95.8 s
The low value is for boxes from readIsoBoxes after a depth-first pass in the same process. The high value is findIsoBox over plain objects. Depth-first over the same 200,000 boxes takes 52 ms. A copy of the loop with an index in place of `shift` takes 29 ms for 200,000 boxes, so `shift` on a large queue is the cause.

Depth-first: `yield* traverseIsoBoxes(next, ...)` (:50) passes every box through one generator for each level. Measured for one chain of nested containers: depth 250: 3.8 ms, 500: 8.1 ms, 1000: 26.9 ms, 2000: 107.8 ms, 3000: 234 ms to 260 ms. Breadth-first over the same chains: 0.2 ms to 0.4 ms. A loop with an explicit stack takes 0.81 ms for depth 3000.

The known finding lists `Array.shift` and the generator for each container as avoidable work for each box. These numbers show that the cost is not constant for each box: both shapes grow with the square of the input, and the breadth-first case exceeds one second from about 100,000 containers.

**Proposal of the finder.** Replace `queue.shift()` with a read index into the queue (or a ring of two arrays for each level). Replace the recursive `yield*` with one generator and an explicit stack of `{ list, index }` frames. Both changes keep the order and the yielded values. Add one test with 100,000 sibling containers in each order with a time bound.

**Proposal after verification.** Keep the two algorithm changes and change two details.

1. Frames of `{ list, index }` do not fit the signature. The root parameter is `boxes: Iterable<T>` (traverseIsoBoxes.ts:19), not an array, and the function accepts a generator. Use a stack of iterators (`boxes[Symbol.iterator]()`), or iterate the root with `for...of` and use index frames only for `box.boxes`. If the stack holds iterators, close the open iterators in a `finally` block. The current `for...of` closes a generator input when `findIsoBox` returns early, and a manual `next()` loop does not.

2. Do not add a test with a wall-clock time bound. A time bound fails at random on shared CI workers. Add a test that compares the yielded order with a fixed expected list for both orders and for `maxDepth`, and one test that completes 100,000 sibling containers and a chain of depth 3,000 under the normal Vitest timeout. The current quadratic code already exceeds 2 s for 100,000 siblings, so the default 5 s timeout gives a weak guard only. Put the measured numbers in the PR description.

Also measure the bundle bytes of `traverseIsoBoxes` before and after. The variant with one index loop and one stack loop adds a few lines. The entry `if (!item) { continue }` at :33 becomes dead code and leaves with `shift`.


**Result.** Done in PR 706.

## G503: String writers need `TextEncoder` and have no fallback, while string readers work without `TextDecoder`, and the TSDoc of `encodeText` claims a fallback that does not exist.

Severity medium. Category reader-writer-asymmetry. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/utils/src/encodeText.ts:2`, `libs/utils/src/encodeText.ts:14`, `libs/utils/src/decodeText.ts:60`, `libs/iso-bmff/src/IsoBoxWriteView.ts:256`, `libs/iso-bmff/src/writers/writeEmsg.ts:23`, `libs/iso-bmff/src/writers/writeHdlr.ts:18`, `libs/iso-bmff/src/writers/writeElng.ts:17`, `libs/iso-bmff/src/writers/writeIden.ts:15`, `libs/iso-bmff/src/writers/writeKind.ts:15`, `libs/iso-bmff/src/writers/writeLabl.ts:15`, `libs/iso-bmff/src/writers/writePayl.ts:15`, `libs/iso-bmff/src/writers/writePrsl.ts:25`, `libs/iso-bmff/src/writers/writeSchm.ts:19`, `libs/iso-bmff/src/writers/writeSttg.ts:15`, `libs/iso-bmff/src/writers/writeUrl.ts:19`, `libs/iso-bmff/src/writers/writeUrn.ts:17`, `libs/iso-bmff/src/writers/writeVlab.ts:15`, `libs/iso-bmff/src/writers/writeVttC.ts:15`

**Evidence.** encodeText.ts:2-3 says "works like `TextEncoder.encode` and also supports environments without `TextEncoder`". Line 14 is `return new TextEncoder().encode(data)` with no test for the global. decodeText.ts:60 has `if (typeof TextDecoder !== 'undefined')` and a hand-written decoder after it. 14 writers and `IsoBoxWriteView.writeUtf8TerminatedString` call `encodeText` (15 files). Run with `TextEncoder` deleted from globalThis: reading a `payl` box returns "hello", `writeIsoBox(payl, defaultWriterConfig())` throws `ReferenceError: TextEncoder is not defined`, and `writeIsoBox` of a `tfdt` box works. The README names `writeEmsg` as a main use, and `writeEmsg` is one of the 14. No iso-bmff test removes `TextEncoder` or `TextDecoder` (the three `*.environment.test.ts` files cover `BigInt` and `ReadableStream` only).

**Proposal of the finder.** Give reads and writes of a string field the same platform needs. In 2.0.0, the `writeUtf8` field function of the write cursor encodes straight into `cursor.bytes`: `TextEncoder.prototype.encodeInto` when the runtime has it, a loop over the code points otherwise. This form also removes the intermediate `Uint8Array` that every string writer allocates today. Alternative with less code: add the fallback to `encodeText` in cml-utils so that its TSDoc is true. In both cases add an `*.environment.test.ts` that deletes `TextEncoder` and writes an `emsg` box. If the project decides to require `TextEncoder`, correct the TSDoc of `encodeText` and state the requirement in the README.

**Proposal after verification.** Split the finding into two items, and neither item needs the major version.

1. Do now, no break: make the TSDoc of `encodeText` in libs/utils/src/encodeText.ts true. The option that matches the recorded decision of PR 643 removes the sentence about environments without `TextEncoder` and states that the function needs `TextEncoder`. Add one sentence to the writing guide of iso-bmff, in the form of the `BigInt` note at libs/iso-bmff/docs/reading-boxes.md:166: the writers of string fields need `TextEncoder` and do not test for it.

2. Maintainer decision, optional: a fallback inside `encodeText` in cml-utils, so that `encodeText` and `decodeText` have the same platform needs. This change is additive. Measure the bundle bytes of `writeEmsg` and of `encodeText` alone before the decision, and add an `*.environment.test.ts` in utils that deletes `TextEncoder`. Do not put a second encoder in iso-bmff.

Move the `encodeInto` idea to the open questions of rfc/iso-bmff-cursor-api.md as a measurement item for the `writeUtf8` field function. It is not an audit fix, and PR 637 already dropped a similar fast path after a measurement.

**Prior decision.** PR 643 (merged 2026-11-11, commit 6b2a23c36) and libs/iso-bmff/CHANGELOG.md:121 accept and record that the UTF-8 writers need `TextEncoder` and that `encodeText` has no fallback. The same PR and PR 637 record that an ASCII fast path in the writers was measured and dropped. rfc/uint64-reader-config.md:166 is the pattern for a platform need: state the need, add no check. No decision covers the false TSDoc sentence of `encodeText` (present since PR 280, commit b242334af).

**Result.** Done in PRs 705 and 708.

## F384: Ten readers and eleven writers have no test of any kind, and the cursor RFC says the fixtures and the round-trip test cover all of them.

Severity medium. Category tests. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/test/fixtureRoundTrip.test.ts:39`, `libs/iso-bmff/test/fixtureRoundTrip.test.ts:43`, `rfc/iso-bmff-cursor-api.md:243`

**Evidence.** The round-trip test says `A type with the count 0 has no box in a fixture, so this test does not cover it` and lists `avc2: 0, avc3: 0, avc4: 0, enca: 0, encv: 0, frma: 0, hev1: 0, imda: 0, sdtp: 0, skip: 0, vttC: 0`. No test file names these functions or uses these types in a parsed box. Readers with no test: readAvc2, readAvc3, readAvc4, readEnca, readEncv, readFrma, readHev1, readImda, readSdtp, readSkip. Writers with no test: writeAvc2, writeAvc3, writeAvc4, writeEnca, writeEncv, writeFrma, writeHev1, writeImda, writeSdtp, writeSkip, writeVttC. readVttC has one test, in readUtf8.test.ts. readSthd, readStss, and readStyp have fixture coverage only, with no assertion on a field value. The RFC says `The test fixtures and the round-trip test already cover them` about 87 readers and 85 writers.

**Proposal of the finder.** Before the rewrite, add one byte-level test for each of the 21 functions with the `boxBytes` helper, or add a small fixture for each type. Then make the round-trip test fail for a count of 0 that has no synthetic test. Correct the sentence in the RFC.

**Proposal after verification.** Keep the goal and change two details.

1. Size the work by risk, and land it before the cursor rewrite as a test-only PR. Write byte-level tests with literal bytes and literal field values (the `boxBytes` helper in test/util/wideBoxes.ts) for the five types with their own logic: frma, imda, sdtp, skip, and vttC (reader and writer each). Cover the six wrapper types (avc2, avc3, avc4, hev1, encv, enca) with one table test that runs the same entry bytes through each reader and writer with the type changed. Do not write six separate files. The tests must not use `view`, `size`, or `bytesRemaining` of a parsed box, so they stay valid after the rewrite.

2. Enforce the rule inside the round-trip test with data, not with a file-name lookup. Add a table of synthetic boxes for the types that no fixture contains, run those boxes through the same bytes, values, and remaining checks, and assert that no type in the default configs has a total of 0. pssh, schm, tenc, urn, and vlab then need one synthetic box each, or an explicit exemption list that names their test files.

3. Correct rfc/iso-bmff-cursor-api.md:243. Proposed text: "The fixtures and the round-trip test cover 47 of the 63 types in the default configs. Eleven types have no test today, and those tests land before the rewrite. The round-trip test uses the `view` field, so the round-trip test changes with the rewrite." Verify the counts 87 and 85 at the same time: src/readers has 88 files and src/writers has 86, and some are helpers.

The readSthd, readStss, and readStyp point (fixture coverage only, no field assertion) is lower value and optional.

**Prior decision.** None that makes the current state intentional. PR 641 (commit 2406305cd, "test(iso-bmff): add a read, write, read test for every fixture") recorded the gap as a known limit: "16 types have the count 0, so no fixture covers them."

**Result.** Done in PR 704.

## G505: Every read bundle contains the complete `decodeText` of cml-utils, with its UTF-16 branches and its byte order mark detection, although iso-bmff only decodes UTF-8 and the RFC size table does not count that code.

Severity medium. Category tree-shaking. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:20`, `libs/iso-bmff/src/IsoBoxReadView.ts:198`, `libs/iso-bmff/src/IsoBoxReadView.ts:1`, `libs/iso-bmff/src/utils/readUtf8String.ts:1`, `libs/utils/src/decodeText.ts:37`, `libs/utils/src/decodeText.ts:146`, `rfc/iso-bmff-cursor-api.md:226`

**Evidence.** IsoBoxReadView.ts:198 is `result = (type === UTF8 ? readUtf8String : readString)(dataView, offset, length)` inside the private `read` field, so the class always references `decodeText`. readUtf8String.ts always passes `{ encoding: UTF_8 }` and a `DataView`, so decodeText.ts:37-58 (`if (!encoding)` detection), the `case UTF_16_BE: case UTF_16: case UTF_16_LE:` branch at 146-151, and the `isArrayBufferLike(data)` branch can never run. The package has no reader for `cprt`, the only box of ISO/IEC 14496-12:2015 that allows UTF-16. Measured with rolldown and minify, source of both packages: `export { readIsoBoxes }` is 4944 B (1976 B gzip) with cml-utils in the bundle and 3885 B (1620 B gzip) with cml-utils external. `export { readIsoBoxes, readTfdt }` is 5094 B and 4035 B. The difference is 1059 B min (356 B gzip) for a bundle that reads no string. `decodeText` alone is 1156 B min (567 B gzip). A UTF-8-only sketch with a fallback is 434 B min (336 B gzip), and a cached `TextDecoder` call alone is 82 B. RFC line 226 says "The bundle entries keep `@svta/cml-utils` external".

**Proposal of the finder.** In 2.0.0 the `readUtf8` field function imports a UTF-8-only decoder (the `decodeUtf8` export proposed in the previous finding), not `decodeText` and `UTF_8`. Only bundles that import a string reader then pay for the decoder, and they pay about a third of the current size. Replace `isArrayBufferLike(raw)` in the input handling with `ArrayBuffer.isView(raw)`, which removes the last cml-utils import of the read side. Add a row to the RFC size table with cml-utils inside the bundle, and a row for one string reader such as `readEmsg`.

**Proposal after verification.** Split the finding into three parts.

1. No extra work for bundles without strings. The RFC already makes `readUtf8` an exported field function (rfc/iso-bmff-cursor-api.md:185). Confirm in the implementation that no shared cursor code imports `readUtf8` or `decodeText`, and pin it with the size check.

2. Keep one decoder implementation, in cml-utils. Move the UTF-8 path of `decodeText` (the `TextDecoder` call and the UTF-8 fallback loop) into an exported `decodeUtf8(view)`, and let `decodeText` call it for the UTF-8 case. This is an additive minor change in cml-utils and keeps the intent of issue 244. iso-bmff `readUtf8` then imports `decodeUtf8`. The function must keep the `TextDecoder` behavior for a leading byte order mark, so returned strings do not change. Do not copy a decoder into iso-bmff. Do not remove the fallback unless the maintainer decides that readers may need `TextDecoder`, as the writers already need `TextEncoder` (libs/iso-bmff/CHANGELOG.md:121). That variant is the only breaking one.

3. In the cursor input handling, use `ArrayBuffer.isView(raw) ? new DataView(raw.buffer, raw.byteOffset, raw.byteLength) : new DataView(raw)`. Add two rows to the RFC size table: one with cml-utils inside the bundle, and one with a string reader such as `readEmsg`. Measure the sizes again at that time. The numbers in the finding were not reproduced here.

**Prior decision.** Issue 244 and PR 246 (commit 80c272e64, "feat: consolidate text decode utils into decodeText"): the maintainer chose one `decodeText` in cml-utils with a `TextDecoder` default and a fallback. The single decoder is intentional. Its cost inside every iso-bmff read bundle is a side effect of the view class, not a decision. PR 643 measured bundles with cml-utils external and recorded that a shared decoder saves about 40 ns for each string.

**Result.** Done in PRs 705 and 714. utils 1.8.0 is published (PR 713).

## F196: IsoBoxType is identical to `string`: it accepts the empty string and any length, and gives no completion for the known box types.

Severity medium. Category type-design. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxType.ts:6`, `libs/iso-bmff/src/IsoBoxReaderMap.ts:10`

**Evidence.** IsoBoxType.ts:6 `export type IsoBoxType = `${string}${string}${string}${string}``. The form suggests four characters. Checked with tsc: `const a: IsoBoxType = ''`, `'ab'`, `'abcdefgh'`, and a variable of type `string` all compile, and a type equality test of `IsoBoxType` against `string` passes. `Record<IsoBoxType, ...>` in IsoBoxReaderMap.ts:10 is therefore a plain string index, and `{ toolongkey: readTfdt }` compiles as a readers map.

**Proposal of the finder.** `export type IsoBoxType = keyof IsoBoxMap | (string & {})`. Editors then suggest the 100 known types and still accept a custom type. State in the TSDoc that the value is four characters and that TypeScript does not check the length. Do not keep a template literal that suggests a check.

**Proposal after verification.** Do not use `keyof IsoBoxMap | (string & {})` for the alias. With `Record<IsoBoxType, ...>` it makes all known keys required and breaks `readIsoBoxes(data, { readers: { tfdt: readTfdt } })` and the package build.

Step 1 (not breaking, identical type): declare `export type IsoBoxType = string`. Write the TSDoc as: "A four-character box type. TypeScript does not check the length." Use `IsoBoxType` as the key in `IsoBoxWriterMap` too, so both maps use one name.

Step 2 (optional, not breaking in my probe): if key completion is wanted, add it to the maps and not to the alias. `IsoBoxReaderMap<V> = { [K in keyof IsoBoxMap]?: IsoBoxReader<unknown, IsoBoxType, V> } & Record<IsoBoxType, IsoBoxReader<unknown, IsoBoxType, V>>`. Every key keeps the same value type, so the single call signature rule of rfc/uint64-reader-config.md:335 holds. Do not type each key against its built-in box type, because a custom reader may replace a built-in type. Run the existing type tests and review the API report diff before adoption.

**Prior decision.** None for the template form of the alias (introduced without rationale in PR 289, commit 3102f626e). One related constraint: the accepted RFC rfc/uint64-reader-config.md:335 (PR 613) relies on `IsoBoxReaderMap<V>` as `Record<IsoBoxType, IsoBoxReader<unknown, IsoBoxType, V>>` with one call signature per value. Any change to the map must keep that property.

**Result.** Partly done in PR 702 (step 1). Step 2, keys in the reader map, goes to the second RFC.

## F126: `readVtte` and `writeVtte` publish a parameter named `_`, disable every lint rule for the line, and have no `@param` tag.

Severity low. Category api-surface. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readVtte.ts:12`, `libs/iso-bmff/src/readers/readVtte.ts:14`, `libs/iso-bmff/src/writers/writeVtte.ts:11`, `libs/iso-bmff/config/cml-iso-bmff.api.md:1118`, `libs/iso-bmff/config/cml-iso-bmff.api.md:1879`

**Evidence.** readVtte.ts:12-14 `// eslint-disable-next-line` / `export function readVtte(_: IsoBoxReadView<IsoInt64>): WebVttEmptySampleBox {` / `// Nothing should happen here.` writeVtte.ts:11-12 has the same directive and `export function writeVtte(_: WebVttEmptySampleBox): IsoBoxWriteView`. The API report and the generated docs show the parameter as `_`. The directive names no rule, so it hides every finding on that line. Only three such directives exist in `src`. The line comment sits between the TSDoc block and the function.

**Proposal of the finder.** Name the parameters as the other readers and writers do (`view` and `box` today, the cursor names after the RFC). Add the `@param` tags, remove both directives and the comment `Nothing should happen here.`. If the linter reports the unused parameter, drop the parameter from the reader, because a function with fewer parameters still fits the reader type.

**Proposal after verification.** Keep the parameters so every reader and writer has the same call form. Name them as the other functions do (`view` and `box` today, `cursor` and `box` after the cursor RFC). Add the `@param` tags and one TSDoc sentence: the box has no fields. Delete the comment `Nothing should happen here.`. Replace each bare directive with a directive that names the rule: `// oxlint-disable-next-line no-unused-vars`. The directive cannot simply be removed: oxlint 1.88 with the repo options reports every unused parameter, including `_` and `_view`. After the cursor RFC the reader still needs the directive for `cursor`, and the writer needs it for `box`. Alternative with no directive: add `argsIgnorePattern: '^_'` to the `no-unused-vars` options in vite.config.ts and name the parameters `_view` and `_box`. Do not remove the parameters: a direct call `readVtte(view)` would stop compiling, for no gain.


**Result.** Done in PR 702.

## F289: The stream `pull` loop continues after `controller.close()`, and the stream has no `cancel` handler for the source iterator.

Severity low. Category behavior. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/src/IsoBoxReadableStream.ts:42`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:46`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:53`

**Evidence.** Lines 42-50: `for (let i = 0; i < desiredSize; i++) { const next = iterator.next(); if (next.done) { controller.close() } else { ... } }`. There is no `break` after `close()`. With a `desiredSize` above 1 the next pass calls `close()` on a closed controller, which throws a TypeError. Today the constructor passes no queuing strategy, so `desiredSize` is at most 1 and the loop body runs once: the loop is dead code with a latent defect. Line 53 passes `{ start: pull, pull }` with no `cancel`, so `stream.cancel()` or a failed `pipeTo` never calls `iterator.return()`. A generator source, such as `traverseIsoBoxes(...)`, then never runs its `finally` blocks.

**Proposal of the finder.** Write one box for each `pull` call with no loop: `const next = iterator.next(); if (next.done) controller.close(); else controller.enqueue(...)`. Add `cancel() { iterator.return?.() }`. Add a test that cancels the stream over a generator source.


**Result.** Done in PR 702.

## F111: Readers and writers of this scope use different local forms for the same concept.

Severity low. Category consistency. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readTfdt.ts:26`, `libs/iso-bmff/src/readers/readTrex.ts:17`, `libs/iso-bmff/src/readers/readTfra.ts:30`, `libs/iso-bmff/src/writers/writeTfra.ts:21`, `libs/iso-bmff/src/writers/writeSubs.ts:17`, `libs/iso-bmff/src/writers/writeTfdt.ts:20`

**Evidence.** readTfdt.ts:26 `version == 1 ? 8 : 4` uses loose equality, and the other files use `===`. readTrex.ts:17 spreads `...view.readFullBox()`, and the other readers destructure `{ version, flags }`. The width of a field that depends on the version is `size` in readTfra.ts:30, readTkhd.ts:20, writeTfdt.ts:20, and writeTkhd.ts:22, `timeSize` in writeTfra.ts:21, and `subsampleSizeBytes` in writeSubs.ts:17. Writers declare `const v1 = box.version === 1`, and readers do not.

**Proposal of the finder.** The cursor RFC rewrites every reader and writer. Fix one template for that rewrite: strict equality, the same local name for the same value in a reader and its writer, and the same field order and comments in both files, so a diff of the pair shows only real differences.

**Proposal after verification.** Split the finding in two.

1. Strict equality (do-anytime, not a major version item): change the five `version == 1` comparisons in readTfdt.ts:26, readMdhd.ts:20, 21, 23, and readMvhd.ts:22 to `===`. The fix changes no behavior. A repo-wide `eqeqeq` lint rule is a separate decision: about 41 loose comparisons exist in other packages, many of them intentional `== null` checks in libs/c2pa, so the rule needs the `null: ignore` option and a pass over libs/608.

2. Local names and field order (optional, taste): do not add a written template to the RFC. The cursor rewrite already removes `readFullBox()` (rfc/iso-bmff-cursor-api.md:188) and the size code of the writers, so the spread form and most of the differing locals disappear. For the locals that remain, one line in the implementation PR is enough: a width that depends on the version has the name `size` when the box has one such width, and a name with the field prefix (`timeSize`, `mediaTimeSize`) when the box has more than one. The reader and the writer of one box use the same name. Drop the `v1` local where it has one use.


**Result.** Not done. The cursor rewrite replaces the code.

## F258: Three writers write a signed field with the unsigned function and depend on wrap for a negative value.

Severity low. Category consistency. Breaking: no. Fact check: partly. Value check: confirmed.

**Files.** `libs/iso-bmff/src/writers/writeCtts.ts:33`, `libs/iso-bmff/src/writers/writeTrun.ts:38`, `libs/iso-bmff/src/writers/writeTrun.ts:56`, `libs/iso-bmff/src/readers/readCtts.ts:21`, `libs/iso-bmff/src/readers/readTrun.ts:22`, `libs/iso-bmff/src/readers/readTrun.ts:42`

**Evidence.** writeCtts: `// For version 1, sampleOffset is signed, but we store as unsigned` / `writer.writeUint(entry.sampleOffset, 4)`. The comment is wrong for the read side: `const read = version === 1 ? view.readInt : view.readUint`. writeTrun: `writer.writeUint(box.dataOffset ?? 0, 4)` but the reader has `dataOffset = view.readInt(4)`. `writer.writeUint(sample.sampleCompositionTimeOffset ?? 0, 4)` but the reader has `version === 0 ? view.readUint(4) : view.readInt(4)`. The bytes are correct today because `DataView.setUint32` wraps a negative number.

**Proposal of the finder.** In 2.0.0 each writer uses the function with the sign that its reader uses: `writeInt32` for `dataOffset`, and `version === 0 ? writeUint32 : writeInt32` for the two offsets. Remove the comment in `writeCtts`. This is required if any integer function gets a range check.

**Proposal after verification.** Two writers write three signed fields with the unsigned method and depend on the `DataView.setUint32` wrap: `writeCtts` (`sampleOffset`, version 1) and `writeTrun` (`dataOffset`, and `sampleCompositionTimeOffset` for version above 0). `writeVisualSampleEntryBox.ts:74` also pairs `writeUint` with a `readInt` field, but it masks with `& 0xffff` and does not depend on the wrap. Proposal: the cursor RFC must add signed write functions (`writeInt8`, `writeInt16`, `writeInt32`), which it does not list today. Then `writeTrun` uses `writeInt32` for `dataOffset` and `version === 0 ? writeUint32 : writeInt32` for the composition offset. `writeCtts` uses `version === 1 ? writeInt32 : writeUint32`, the same condition as `readCtts`. Delete the comment at writeCtts.ts:33.

**Prior decision.** No decision keeps the current state. A precedent supports the fix: PR 677 (commit 2c8b7fa9d), changelog entry "`writeTkhd` now writes `layer` and `alternateGroup` as signed integers, as `readTkhd` reads them. The written bytes do not change." PR 679 (issue 678) fixed the signed read of the trun composition offset and left the writer unchanged.

**Result.** Done in PR 702.

## F311: The matrix code is copied into four files with a closure and an extra array, and signed fixed-point reads are written by hand while writes use `writeTemplate`

Severity low. Category consistency. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readMvhd.ts:37`, `libs/iso-bmff/src/readers/readTkhd.ts:37`, `libs/iso-bmff/src/writers/writeMvhd.ts:60`, `libs/iso-bmff/src/writers/writeTkhd.ts:67`, `libs/iso-bmff/src/readers/readMvhd.ts:32`, `libs/iso-bmff/src/readers/readSmhd.ts:18`, `libs/iso-bmff/src/writers/writeMvhd.ts:54`

**Evidence.** readMvhd and readTkhd: `readArray(INT, 4, 9).map((value, i) => value / (i % 3 === 2 ? 0x40000000 : 0x10000))`. writeMvhd and writeTkhd: `box.matrix.map((value, i) => Math.round(value * (i % 3 === 2 ? 0x40000000 : 0x10000)))`, then `writeArray`. Each call creates two arrays and one closure. For the signed values the readers divide by hand: `rate: readInt(4) / 65536`, `volume: readInt(2) / 256`, `balance: view.readInt(2) / 256`. The writers use one method: `writer.writeTemplate(box.rate, 4)`. `readTemplate` is documented as "Reads an unsigned fixed-point value", and the field functions of the RFC (`readTemplate16`, `readTemplate32`) have no signed form.

**Proposal of the finder.** Add one internal pair `readMatrix(cursor)` and `writeMatrix(cursor, matrix)` with a loop over nine values and no intermediate array. Add signed field functions to the RFC list, for example `readSignedTemplate16` and `readSignedTemplate32`, and use them for `rate`, `volume`, and `balance`.

**Proposal after verification.** Do not add `readMatrix`/`writeMatrix` on the strength of this finding. In the cursor rewrite, write the nine-value loop inline in each of the four functions (the reader allocates only the result array, the writer allocates none). That removes the closure and the extra array. Add a shared internal pair only if a new min+gzip measurement on the cursor build shows fewer bytes than inline, because the PR 620 measurement showed 17 B more.

Do not add `readSignedTemplate16`/`readSignedTemplate32`. Fix the asymmetry in the RFC text instead: state in the field function table that `writeTemplate16`/`writeTemplate32` accept a negative value (two's complement), and that a reader of a signed fixed-point field uses `readInt16`/`readInt32` and a division, as PR 620 decided. If the major version renames the `Template` functions to a fixed-point name (the spec keyword `template` means a field with a default value, not a fixed-point format), decide a signed read form as part of that rename, not as a separate addition.

**Prior decision.** PR 620 (commit a13db9ace, "fix(iso-bmff): read and write fixed-point fields correctly"), Design section: the matrix expression stays inline in the four functions because shared read and write helpers measured 1331 B against 1314 B inline; `readTemplate` stays unsigned, and the readers of signed fixed-point fields call `readInt` and divide.

**Result.** Skipped. PR 620 measured the inline form and chose it.

## F338: The docs and TSDoc use several words for one thing: parse and read, encoded and written, raw box, library and package

Severity low. Category consistency. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readPrft.ts:6`, `libs/iso-bmff/src/writers/writeTfdt.ts:15`, `libs/iso-bmff/src/IsoBoxReaderMap.ts:6`, `libs/iso-bmff/docs/reading-boxes.md:11`, `libs/iso-bmff/docs/writing-boxes.md:10`, `libs/iso-bmff/docs/writing-boxes.md:11`, `libs/iso-bmff/docs/writing-boxes.md:212`, `libs/iso-bmff/docs/utilities.md:24`, `libs/iso-bmff/src/IsoBoxReadView.ts:352`, `rfc/iso-bmff-cursor-api.md:159`

**Evidence.** The settled prefix is read and write. The TSDoc of 84 readers starts "Parse a `X` from an `IsoBoxReadView`" and ends "@returns A parsed `X`". The TSDoc of 84 writers ends "@returns An `IsoBoxWriteView` containing the encoded box". Two type docs say "box parsers". The reading guide says "The function parses container boxes automatically" one sentence after "reads boxes". The writing guide calls a plain object literal a "Raw box object" (lines 10, 13, 155, 212) and calls the result of `readIsoBoxes` "box structures". `readBox` "Reads a raw box from the data view" means a box with a header only. The cursor RFC defines a third sense: `type IsoRawBox = { type: IsoBoxType; bytes: Uint8Array }`. The guides say "The library provides" and "a box type from the library". The README says "the package".

**Proposal of the finder.** One name per thing for 2.0.0: "read" and "reader" (never parse or parser), "write" and "writer" (never encode), "package" (never library), "box object" for a plain object with fields, "raw box" only for the `IsoRawBox` of the RFC, and "box tree" for the result of `readIsoBoxes`. Reader TSDoc: "Reads a `tfdt` box. @returns The box." Writer TSDoc: "Writes a `tfdt` box."

**Proposal after verification.** Fold the wording into the 2.0.0 cursor rewrite, which rewrites all 168 reader and writer TSDoc blocks, and reference issue 435 for the remaining TSDoc. Use these terms:
- Verb: "read" and "write" only, in the imperative, which is the dominant form in the package. Reader: "Read a `tfdt` box." with "@returns The box". Writer: "Write a `tfdt` box." Factories: "Create". Replace "box parsers" with "box readers" in IsoBoxReaderMap.ts:6 and IsoBoxReadViewConfig.ts:16.
- Noun for a reader result: keep "parsed box" while the public types are `ParsedBox`, `ParsedIsoBox`, and `IsoTypedParsedBox`, and the cursor RFC uses the same words. Banning "parse" is only consistent if 2.0.0 also renames those types. That rename is a separate, breaking finding and needs its own decision.
- "raw box": only the `IsoRawBox` of the RFC. In docs/writing-boxes.md (lines 10, 13, 155, 208, 212) write "box object" or "plain box object" for an object literal. Fix IsoBoxReadView.readBox ("Reads a raw box") when the class goes.
- Do not add the term "box tree". Write "the boxes that `readIsoBoxes` returns" in place of "box structures" (writing-boxes.md:11).
- "package" for "library" at docs/utilities.md:24 and docs/writing-boxes.md:212. README.md lines 3, 9, 28 and the front matter of reading-boxes.md say "Parse" and "parsing": change them to "read" and regenerate skills/common-media-library, because the README section feeds it.


**Result.** Partly done in PR 708. The rename of "box object" goes to the cursor RFC. The two terms are in the Migration section of PR 682 (8435c2ae0).

## F366: The summaries of the box types follow three patterns, and the sample entry writers follow two.

Severity low. Category consistency. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/TrackRunBox.ts:5`, `libs/iso-bmff/src/boxes/SampleSizeBox.ts:4`, `libs/iso-bmff/src/boxes/MovieBox.ts:19`, `libs/iso-bmff/src/boxes/AdditionalMetadataContainerBox.ts:12`, `libs/iso-bmff/src/boxes/SubTrackBox.ts:12`, `libs/iso-bmff/src/boxes/WebVttCueBox.ts:12`, `libs/iso-bmff/src/boxes/WebVttCueIdBox.ts:2`, `libs/iso-bmff/src/boxes/WebVttConfigurationBox.ts:2`, `libs/iso-bmff/src/boxes/ChunkOffsetBox.ts:6`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:5`, `libs/iso-bmff/src/writers/writeAvc1.ts:7`, `libs/iso-bmff/src/writers/writeAvc2.ts:7`, `libs/iso-bmff/src/writers/writeMp4a.ts:7`, `libs/iso-bmff/src/writers/writeEnca.ts:7`, `libs/iso-bmff/src/writers/writeSkip.ts:5`

**Evidence.** Pattern 1, 51 files: `ISO/IEC 14496-12:2012 - 8.8.8 Track Run Box`. Pattern 2, 21 files: `Sample Size Box - 'stsz'`. Pattern 3, 21 files: `Movie Box - 'moov' - Container`. The other 27 files are entry types with a bare name, some with a period (`An edit list entry.`) and some in lower case (`Sub sample entry`). Exceptions: `Additional Metadata Container Box - 'meco' - Container - 8.11.7.1` adds a clause. `Sub track box - 'strk'` is a container without the word. `WebVttCueBox - 'vttc' - Container` uses the type name. Three WebVTT summaries end with a period and three do not. ChunkOffsetBox.ts:5-6 has two blank comment lines. EventMessageBox.ts writes `EMSG` in upper case. Writers: writeAvc2, writeAvc3, writeAvc4, writeHev1, writeHvc1, writeEncv, writeEnca add `(avc2)` and so on, writeSkip adds `(skip variant)`, and writeAvc1 and writeMp4a add nothing. The seven visual readers all say `Parse a `VisualSampleEntryBox`` with no box type. A spec line is in 6 of 84 readers and 45 of 84 writers.

**Proposal of the finder.** Use one summary for every box type: `<Clause title of the spec> (`<fourcc>`).`, then the reference line. Mark containers in a second sentence. For the per-type sample entry functions, name the box type in every summary. The cursor RFC rewrites all 168 function summaries (they name IsoBoxReadView and IsoBoxWriteView), so apply the pattern in that change.

**Proposal after verification.** Keep the proposal with three changes. (1) Define the title source: use the box name of the exported type in title case, then the four-character code, for example `Track Run Box (`trun`).`. Put the edition and the clause on the reference line. A clause title differs between editions (2012 `Track Run Box`, 2015 `Track Fragment Run Box`), so the clause title is not a stable summary. (2) Cite one edition per reference line, and fix the `202x` placeholder in the six files when the edition question is decided. (3) Do the work once: either in the cursor change, which already rewrites the 168 function summaries that name `IsoBoxReadView` and `IsoBoxWriteView`, or in the iso-bmff PR of issue 435. Reference issue 435 from the change so the package is not rewritten twice. Also correct the evidence: 8 of 84 reader files contain a spec reference, not 6. The container marker in a second sentence is optional, because the `boxes` field already shows it.


**Result.** Done in PR 708.

## F417: The readers get `version` and `flags` in two ways and compare the version with two operators.

Severity low. Category consistency. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readMfhd.ts:17`, `libs/iso-bmff/src/readers/readStco.ts:21`, `libs/iso-bmff/src/readers/readMdhd.ts:20`, `libs/iso-bmff/src/readers/readMvhd.ts:22`, `libs/iso-bmff/src/readers/readTfdt.ts:26`, `libs/iso-bmff/src/readers/readTkhd.ts:20`, `libs/iso-bmff/src/readers/readStyp.ts:17`, `libs/iso-bmff/src/writers/writeStyp.ts:15`

**Evidence.** Spread, 14 readers (ardi, elng, hdlr, kind, meta, mfhd, mfro, sdtp, smhd, sthd, trex, url, urn, vmhd): `...view.readFullBox()`. Destructure, 27 readers: `const { version, flags } = view.readFullBox()`. Several of the 27 never use either value (stco, stsc, stss, stts, dref, stsd, ssix), so the form does not follow a need. Version test: `version == 1` in mdhd, mvhd, and tfdt, and `version === 1` in tkhd, mehd, elst, tfra, and subs. Delegation: `readStyp` and `readSkip` call `readFtyp` and `readFree`, and `writeStyp` and `writeSkip` copy the body of `writeFtyp` and `writeFree`. None of this changes a result. The RFC rewrites every reader (`view.readFullBox()` becomes `readUint32` and two bit operations), so the rewrite is the time to pick one form.

**Proposal of the finder.** In the cursor rewrite, use one form in every full box reader: read the header word once, then `version: header >>> 24, flags: header & 0xffffff` in the object literal, as the RFC example shows. Use `===` everywhere. Make ftyp and styp, and free and skip, share one function on both the read and the write side.

**Proposal after verification.** 1. Change the five `==` to `===` in readMdhd.ts, readMvhd.ts, and readTfdt.ts now. The change is three files and does not depend on the cursor rewrite.
2. If the `eqeqeq` rule is added, add it in the root vite.config.ts as `['error', 'always', { null: 'ignore' }]`. The other packages use `== null` and `!= null` on purpose (c2pa 17 lines, cmcd 9, utils 3, and others). The only other real hits are four lines in libs/608/src/findCta608Nalus.ts:28-31. The rule is a repo-wide lint change, so it belongs in its own PR, not in the iso-bmff major.
3. In the cursor rewrite, use the RFC form (`header >>> 24`, `header & 0xffffff`) in every full box reader. This is already the RFC example, so add one sentence to the RFC that makes the form the rule.
4. The read side of ftyp/styp and free/skip already delegates. The defect there is the spread: `{ ...readFtyp(view), type: 'styp' }` allocates a second object per box. Replace it with one internal, non-exported helper that takes the type (`readTypeBox(cursor, 'styp')`, `readFreeSpaceBox(cursor, 'skip')`), and keep the four public reader names. On the write side, the cursor rewrite removes the size code, so each body shrinks to about four lines. A shared internal helper there is optional. Keep the public names `writeFtyp`, `writeStyp`, `writeFree`, `writeSkip`.


**Result.** Not done. The cursor rewrite replaces the code.

## F110: The box types of this scope have almost no field documentation, and only `tenc` has TSDoc examples.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/TrackFragmentHeaderBox.ts:9`, `libs/iso-bmff/src/boxes/TrackFragmentRandomAccessBox.ts:10`, `libs/iso-bmff/src/boxes/TrackFragmentRandomAccessEntry.ts:8`, `libs/iso-bmff/src/boxes/TrackExtendsBox.ts:8`, `libs/iso-bmff/src/boxes/TrackHeaderBox.ts:9`, `libs/iso-bmff/src/boxes/Subsample.ts:2`, `libs/iso-bmff/src/boxes/SubsampleEntry.ts:4`, `libs/iso-bmff/src/writers/writeTkhd.ts:6`, `libs/iso-bmff/test/writers/writeTkhd.test.ts:34`

**Evidence.** `TrackFragmentHeaderBox` does not say which bit of `flags` controls each optional field (0x01, 0x02, 0x08, 0x10, 0x20), although `writeTfhd` drops a field whose flag is not set. `TrackHeaderBox` documents only `matrix`: nothing states that `volume`, `width`, and `height` are decoded fixed-point values or lists the four flag values. The `tfra` length fields do not say that the value is the byte length minus one. `Subsample.ts:2` is 'Sub sample'. writeTkhd.test.ts:34 marks `// #region example`, and the TSDoc of `writeTkhd` (writeTkhd.ts:6-19) has no `{@includeCode}` for it. `readTenc` and `writeTenc` are the only functions of this scope with an `@example`.

**Proposal of the finder.** Add one TSDoc line to each field with the spec name, the unit, and the flag or version that controls it. Add `@example {@includeCode ../../test/writers/writeTkhd.test.ts#example}` to `writeTkhd`. Add an example region for `readTfhd` and `readTfdt`, which the README 'When to use' section names as entry points.

**Proposal after verification.** Split the proposal in two and widen the scope to the whole package.

1. Field documentation (any time, best after the field renames and removals of the major are decided, so each comment is written once). Add one TSDoc line per field of the box types: the spec field name, the unit or fixed-point format, and the flag or version that controls the field. Minimum content for this scope: `tfhd` flags 0x000001, 0x000002, 0x000008, 0x000010, 0x000020 on the five optional fields, with a note that the writer writes a field only when its flag is set. `tkhd`: `volume` is a decoded 8.8 value, `width` and `height` are decoded 16.16 values, and the type comment lists the flag values 0x1, 0x2, 0x4, 0x8. `tfra`: each `lengthSizeOf*` value is the byte length of the field minus one. Correct "Sub sample" to "Sub-sample" in Subsample.ts:2 and SubsampleEntry.ts:4. Apply the same rule to the other 100+ undocumented box types, not only to this scope.

2. Examples (in the implementation PR of the cursor RFC, not before). Every reader and writer TSDoc changes there anyway (`@param view`, `@returns An IsoBoxWriteView`). In that PR, rewrite the existing example regions for the cursor signatures and link all of them with `@example {@includeCode ...}`: 20 writer regions (writeTkhd, writeFtyp, writeMvhd, writeStco, and the others) and 5 reader regions (readUrn, readSchm, readUrl, readHdlr, readVlab) have no link today. Add new test files with an example region for `readTfhd` and `readTfdt`, and link `writeTfdt`, because the README "When to use" section and the RFC summary name tfdt as the main entry point. Do not add the `writeTkhd` link against the current signature.

**Prior decision.** None found that makes the current state intentional. The comment rule of the project allows spec references on fields, and src/boxes/TrackEncryptionBox.ts:11-57 (PR 658) already documents each field with its spec name. The TSDoc pass of issue 435 covers the remaining packages and is not finished.

**Result.** Partly done in PR 708. New `readTfhd` and `readTfdt` example files go to the cursor RFC. The example files belong to the pull requests that implement the cursor RFC.

## F184: Three exports appear as "(undocumented)" in the API report beside the four lowercase aliases.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/findIsoBox.ts:27`, `libs/iso-bmff/src/filterIsoBoxes.ts:28`, `libs/iso-bmff/src/IsoBoxFields.ts:60`, `libs/iso-bmff/config/cml-iso-bmff.api.md:249`

**Evidence.** The second overloads of `findIsoBox` and `filterIsoBoxes` have only `/** @public */`. The type `IsoBoxFields` has the same. `readIsoBoxes` and `isIsoBoxType` document every overload. The first TSDoc block of `filterIsoBoxes` is followed by a blank line before the function.

**Proposal of the finder.** Give each overload one sentence that states the difference: the first narrows with a type guard callback, the second takes a `boolean` callback. The `IsoBoxFields` type goes away with the enum.

**Proposal after verification.** Limit the fix to the two overloads and do it in any release, since TSDoc text changes no public name, type, or byte. Follow the PR 540 form: a full block per overload (summary, @param, @returns, @public), where the first states that a type guard callback narrows the result to S and the second states that a boolean callback returns the input type T. Remove the blank line at src/filterIsoBoxes.ts:21. Do not tie this finding to the removal of IsoBoxFields: no RFC decides that removal. If the enum stays, either leave its type with the bare tag (the house pattern in cmcd) or add one line such as "A value of IsoBoxFields" and apply the same rule to every package, not to iso-bmff alone. The four lowercase aliases belong to their own finding.

**Prior decision.** No decision keeps the current state. PR 540 (c7edf435f, "chore: resolve api-extractor warnings") shows the opposite practice: second overloads get a doc comment. The bare tag on the IsoBoxFields type follows the repo-wide const enum pattern (cmcd CmcdObjectType, CmcdStreamType).

**Result.** Done in PR 708.

## F187: The README has no quick-start example, and the README and `package.json` describe the package as parsing only.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/README.md:3`, `libs/iso-bmff/README.md:26`, `libs/iso-bmff/package.json:4`

**Evidence.** README: "ISO Base Media File Format (ISO BMFF) parsing." and a `## Usage` section with three links and no code. `package.json`: "ISO Base Media File Format (ISOBMFF) parsing functionality". The package also writes boxes. AGENTS.md requires "a quick-start example" in every package README. The two descriptions spell the format name in two ways.

**Proposal of the finder.** Add one example to the README that reads a box and one that writes a box, with the 2.0.0 API. Use one description in both files: "Read and write ISO Base Media File Format (ISO BMFF) boxes."

**Proposal after verification.** No factual correction. Two notes on the proposal. First, keep the quick-start short (one read example, one write example) and keep the three guide links, because PR 301 moved the long examples into the guides on purpose. Second, the description change and a quick-start with the current API can land in any release. Only the example that uses the 2.0.0 API must wait for 2.0.0. After the package.json description changes, run the root build and commit the regenerated skills/common-media-library/SKILL.md. The `authors` key is the same in every package, so it belongs in a repo-wide follow-up, as F328 says.

**Prior decision.** Commit a31419299 (PR 301, 2026-01-29) states "Refactor README documentation into separate doc files". That commit removed about 180 lines of examples from the README and created docs/reading-boxes.md, docs/writing-boxes.md, and docs/utilities.md. The links-only Usage section is therefore a deliberate move of the examples into guides, not an omission. The AGENTS.md rule at line 75 still asks for a quick-start example in the README, so the finding stands. The "parsing" description has no recorded decision; it predates the writers.

**Result.** Done in PRs 708 and 702.

## F262: The writing guide states that parsed boxes implement `ArrayBufferView`, calls a type annotation a cast, and uses the term raw box for a meaning that differs from the RFC.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/docs/writing-boxes.md:10`, `libs/iso-bmff/docs/writing-boxes.md:11`, `libs/iso-bmff/docs/writing-boxes.md:212`, `libs/iso-bmff/src/ParsedBox.ts:14`, `rfc/iso-bmff-cursor-api.md:87`

**Evidence.** Guide line 11: `the box structures that readIsoBoxes returns. Those structures implement the ArrayBufferView interface.` `ParsedBox` has `view`, `size`, `largesize`, and `usertype`, and no `buffer`, `byteOffset`, or `byteLength`. The writer handles it through `'view' in box`. Guide line 212: `cast raw box objects to a box type for type safety`, but the example is the annotation `const box: FileTypeBox = {...}`. Guide line 10 uses `Raw box objects` for an object with fields that code builds. The RFC uses `raw box` for `{ type, bytes }`. The guide also never states which key the `url ` writer needs.

**Proposal of the finder.** Rewrite the guide for 2.0.0 with one name for each thing: `box object` for an object with fields, `raw box` for `{ type, bytes }`. Remove the `ArrayBufferView` sentence. Replace `cast` with `annotate`. Add the rules that 2.0.0 defines: the count rule, the missing-field rule, the range rule, and the exact map key.

**Proposal after verification.** Split the work in two parts.

Part 1, now, in a docs-only PR against the current 1.x guide (no API change):
- Replace line 11 with two bullets. First: "`ArrayBufferView`s such as `Uint8Array` and `DataView`." Second: "Boxes that `readIsoBoxes` returns. If the `writers` map has a writer for the type, the function writes the fields of the box. If the map has no writer and the type is not a container, the function writes the source bytes of the box, and a changed field has no effect."
- Line 212: replace "cast raw box objects to a box type" with "annotate box objects with a box type". Keep the `as const` example as the second way.
- State that the key of the `writers` map is the exact four-character type, with the trailing space for `'url '` and `'urn '`.
- State the settled rule that a writer follows the flags and the version, and does not throw for a missing field. That rule exists today.

Part 2, with the implementation of the cursor RFC (2.0.0): the guide rewrite that the RFC already requires uses "box object" for an object with fields and "raw box" for `{ type, bytes }`, and repeats the precedence sentence for the raw box. Do not rename the term in the 1.x guide before the RFC is accepted. Add a count rule or a range rule to the guide only if the findings that define those rules are accepted. Do not list them as part of this finding.


**Result.** Partly done in PR 708. Part 2 goes to the cursor RFC. Part 2 is in the Migration section of PR 682 (8435c2ae0).

## F292: The utilities guide describes a signature that was removed, omits five public utilities, and uses `meta` in two examples where it does not fit.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/docs/utilities.md:10`, `libs/iso-bmff/docs/utilities.md:31`, `libs/iso-bmff/docs/utilities.md:56`, `libs/iso-bmff/CHANGELOG.md:256`, `libs/iso-bmff/README.md:9`

**Evidence.** utilities.md:10 "It takes an iterable of boxes and two optional arguments: depth-first traversal and maximum depth." CHANGELOG.md:256 records the change to one config object, and no example in the guide shows `{ depthFirst, maxDepth }`. The guide has no text for `findIsoBox`, `filterIsoBoxes`, `isIsoBoxType`, `fourCcToUint32` or `CONTAINERS`, while README.md:9 presents `findIsoBox` and `filterIsoBoxes` as entry points. utilities.md:31 demonstrates `isContainer` with a `meta` box, a type outside CONTAINERS that the type predicate excludes. utilities.md:56 `const box = { type: "meta", version: 1, flags: 0 }`, while the spec defines `class MetaBox (handler_type) extends FullBox('meta', version = 0, 0)` (spec text line 4875). The same text is copied to skills/common-media-library/references/iso-bmff.md:345.

**Proposal of the finder.** Rewrite the first paragraph: one optional config object with the options `depthFirst` (or `order`) and `maxDepth`, with an example. Add sections for `findIsoBox`, `filterIsoBoxes` and `isIsoBoxType` with one example each, including the rule about `stsd` and `dref` children. Use `moov` for the isContainer example and `mfhd` with version 0 for the isFullBox example. Run the root build so the generated skill file follows.

**Proposal after verification.** Split the work in two parts.

Part 1, at any time, with no dependence on the RFC:
- Rewrite utilities.md:10. The function takes one optional configuration with `depthFirst` (default `true`) and `maxDepth` (default `Infinity`). Add one example with `{ depthFirst: false, maxDepth: 1 }`. Keep the name `depthFirst`. Do not write `order` unless a separate finding renames the option.
- Add a section "Finding boxes" for `findIsoBox`, `filterIsoBoxes`, and `isIsoBoxType`. State the rule that the traversal follows only the `boxes` field, so the search does not reach the `entries` of `stsd` and `dref`. If 2.0.0 changes that rule, change the sentence in the same PR.
- Use `moov` in the first `isContainer` example. Use a box with a spec-valid version in the `isFullBox` example, such as `mfhd` with version 0 or `tfdt` with version 1.
- Run the root build and commit skills/common-media-library/references/iso-bmff.md.

Part 2, with the 2.0.0 guide rewrite, because the write API and the custom reader API change in the RFC:
- The sections "Patching a segment", "Inserting a box", and "A reader and a writer for another box type".
- The `tfdt` example of writing-boxes.md:141 that finds the box in the tree with `findIsoBox`.

Drop the proposed line for `CONTAINERS`. reading-boxes.md:11 and writing-boxes.md:16 already document the constant. A guide line for `fourCcToUint32` is optional, because its TSDoc has an example. First decide whether the function stays a public export.


**Result.** Partly done in PR 708. Part 2 goes to the cursor RFC. Part 2 is in the Migration section of PR 682 (8435c2ae0).

## F316: `defaultReaderConfig` and `defaultWriterConfig` build an object with 62 entries on each call, and the guides call them inside the read call

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/defaultReaderConfig.ts:120`, `libs/iso-bmff/src/writers/defaultWriterConfig.ts:74`, `libs/iso-bmff/docs/reading-boxes.md:24`, `libs/iso-bmff/docs/utilities.md:40`, `libs/iso-bmff/docs/writing-boxes.md:45`

**Evidence.** `return { ...options, readers: { ardi: readArdi, avc1: readAvc1, ... } }` with 62 keys. The guides show `readIsoBoxes(buffer, defaultReaderConfig())` and `writeIsoBoxes(boxes, defaultWriterConfig())`. A player that copies the example allocates the map for every segment. The names read as constants, and the two functions differ: the reader function takes options, the writer function takes none.

**Proposal of the finder.** Change the guide examples to create the configuration once: `const config = defaultReaderConfig()` outside the function that reads a segment, and add one sentence that states it. No code change is required. If the names are open in 2.0.0, `createDefaultReaderConfig` and `createDefaultWriterConfig` match the `create*` factories of the package.

**Proposal after verification.** Drop the performance argument and the rename. The measured cost of a call is about 50 to 60 ns and about 560 bytes, which is below the noise of one `readIsoBoxes` call on a 200-byte segment. Correct the entry count to 63. Remove the asymmetry remark, because RFC 613 decided it. The only change with any value is one optional sentence in docs/reading-boxes.md and docs/writing-boxes.md under "Using default config": "Each call returns a new configuration object. A player can create the configuration once and pass it to every read." Keep the inline calls in the examples, because each example is a one-time read. Keep the names `defaultReaderConfig` and `defaultWriterConfig`.

**Prior decision.** PR 301 (commit a31419299, closes issue 298) added `defaultReaderConfig` and `defaultWriterConfig` as functions on purpose. RFC rfc/uint64-reader-config.md (PR 613, implemented in PR 645) gives `defaultReaderConfig` the `int64` argument (lines 95, 202-209) and rejects an option on the writer configuration (lines 136, 265, 422), so the difference between the two functions is intentional. rfc/iso-bmff-container-readers-writers.md:162 also names both functions and keeps them without the container entries.

**Result.** Done in PR 708.

## F334: TSDoc statements in the top-level files do not match the code

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: confirmed.

**Files.** `libs/iso-bmff/src/IsoBoxContainerMap.ts:23`, `libs/iso-bmff/src/IsoBoxReaderMap.ts:6`, `libs/iso-bmff/src/IsoBoxReadViewConfig.ts:16`, `libs/iso-bmff/src/IsoBoxWriterMap.ts:4`, `libs/iso-bmff/src/readIsoBoxes.ts:20`, `libs/iso-bmff/src/IsoBoxReadView.ts:71`, `libs/iso-bmff/src/IsoBoxReadView.ts:126`, `libs/iso-bmff/src/IsoBoxReadView.ts:149`, `libs/iso-bmff/src/IsoBoxReadView.ts:168`, `libs/iso-bmff/src/IsoBoxReadView.ts:219`, `libs/iso-bmff/src/IsoBoxWriteView.ts:17`, `libs/iso-bmff/src/IsoBoxWriteView.ts:286`, `libs/iso-bmff/src/utils/writeContainerBox.ts:9`

**Evidence.** (1) `IsoBoxContainerMap`: "Map of container box types to their allowed child box types". The values are the container box types (`moov: MovieBox<V>`). (2) `IsoBoxReaderMap` and the `readers` field: "A map of box parsers to their box types". The keys are the box types. `IsoBoxWriterMap` has the same reversed order. (3) `readIsoBoxes`, three times: "@param config - The configuration for the IsoView". No `IsoView` exists. `IsoBoxReadView` has "Creates a new IsoView instance" at lines 71, 147, and 150. (4) `slice = (offset: number, size: number)` documents only `@param size`. (5) "The current byteoffset in the data view." (6) "Reads a unsigned integer". (7) `// TODO: Change all sizes from bits to bytes`, and all sizes are bytes. (8) `constructor(type: string, size: number)` of `IsoBoxWriteView` documents only `@param size - The size of the data view.` (9) `writeArray`: "@param length - The number of values to write. (optional)" for the required parameter `length: number`. (10) `writeContainerBox`: "Write a ContainerBox to an IsoBmffWriter", "encoded using their `view` property", and no `@param config`.

**Proposal of the finder.** Corrected text: (1) "Map of each container box type to the type of that container box." (2) "A map of box types to their readers." and "A map of box types to their writers." (3) "@param config - The readers map and the `int64` option." (4) add "@param offset - The byte offset of the slice in the buffer." (5) "byte offset". (6) "Reads an unsigned integer". (7) delete the comment. (8) add "@param type - The type of the box." and "@param size - The size of the box in bytes, with its header." (9) delete "(optional)". (10) "Writes a container box from the child boxes in its `boxes` field." Items 3 to 9 are in the view classes that the cursor RFC removes. Carry the corrected wording to the field functions.

**Proposal after verification.** Three corrections. (a) The exact phrase "Creates a new IsoView instance" is at IsoBoxReadView.ts:71 and :147 only. Line 150 reads "@returns A new IsoView instance." and line 76 reads "The configuration for the IsoView", so the class has four `IsoView` mentions (71, 76, 147, 150). (b) "Items 3 to 9 are in the view classes that the cursor RFC removes" is wrong for the first half of item 3. readIsoBoxes.ts is not a view class, and the RFC keeps `readIsoBoxes` with an unchanged signature (rfc/iso-bmff-cursor-api.md:168). The three `@param config` lines there need an explicit fix. Items 1, 2 and the readIsoBoxes part of 3 are the only items on public API that survives 2.0.0. (c) Item 10: the sentence about the `view` property is misleading, not fully false. utils/writeBox.ts:25-33 uses the writers map first, then the container handling, then `box.view` as the last fallback. Also `writeContainerBox` is tagged `@internal` (writeContainerBox.ts:18) and src/index.ts does not export it, so item 10 does not reach the generated docs.


**Result.** Done in PR 708.

## F335: Many public types have a TSDoc summary that only repeats the type name

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxContainer.ts:5`, `libs/iso-bmff/src/IsoBoxData.ts:2`, `libs/iso-bmff/src/IsoBoxType.ts:2`, `libs/iso-bmff/src/IsoBoxWriter.ts:4`, `libs/iso-bmff/src/IsoBoxReader.ts:6`, `libs/iso-bmff/src/ParsedBox.ts:7`, `libs/iso-bmff/src/ParsedIsoBox.ts:7`, `libs/iso-bmff/src/IsoTypedParsedBox.ts:6`, `libs/iso-bmff/src/IsoBoxFields.ts:60`, `libs/iso-bmff/src/boxes/Box.ts:4`, `libs/iso-bmff/src/IsoBoxMap.ts:96`

**Evidence.** "Iso Box Container Type", "ISO data", "Iso Box Type", "ISO box writer.", "ISO BMFF box reader", "A Parsed Box Type", "Parsed Box Type", "Typed Parsed Box Type", "Base Box Type". The type alias `IsoBoxFields` has only `@public`. The fields `view`, `size`, `largesize`, and `usertype` of `ParsedBox` have no TSDoc. `IsoBoxReader` does not describe its second argument `type: T`. `IsoBoxMap` says "Comprehensive mapping from box type strings to their corresponding TypeScript interfaces". The values are type aliases, and the map does not hold every box of the specification.

**Proposal of the finder.** Write one sentence of purpose for each type that survives 2.0.0. Examples: `IsoBoxData`: "The input of `readIsoBoxes`: a buffer or a view over a buffer." `IsoBoxContainer`: "The union of the container box types in `CONTAINERS`." `IsoBoxType`: "The four-character type of a box, such as `moov`." `IsoBoxMap`: "Map of each box type that the package names to the type of that box." `IsoBoxWriter`: "A function that writes one box. `writeIsoBoxes` calls the function for each box of its type."

**Proposal after verification.** Write the summaries in the same PRs that implement the cursor RFC, for the types that survive 2.0.0 and with their 2.0.0 shapes. Do not document `view`/`size`/`largesize`/`usertype` or the `type` argument of `IsoBoxReader`: the RFC removes them. Leave the `@public`-only type alias of `IsoBoxFields` as is: that form is the repository convention for const enum types (cmcd uses it). Coordinate with open issue 435 so that the iso-bmff TSDoc gets one pass, and note that the "no growth in prose words" gate of issue 435 cannot apply to these summaries.

Corrected sentences:
- `IsoBoxData`: "The bytes that the read functions accept: a buffer or a view over a buffer."
- `IsoBoxContainer`: "The union of the container boxes in `IsoBoxContainerMap`."
- `IsoBoxContainerMap` (add to the list, IsoBoxContainerMap.ts:24 is wrong today): "Map of each container box type to the type of that container box."
- `IsoBoxType`: "The four-character type of a box, such as `moov`."
- `IsoBoxMap`: "Map of each box type that the package names to the type of that box."
- `IsoBoxWriter` (2.0.0 signature): "A function that writes the fields of one box to the write cursor. `writeIsoBoxes` calls the function for each box of its type."
- `IsoBoxReader` (2.0.0 signature): "A function that reads the fields of one box from the read cursor and returns the box."
- `IsoBoxReaderMap` / `IsoBoxWriterMap` (add to the list, key and value are reversed today): "Map of each box type to the reader of that box." / "Map of each box type to the writer of that box."
- `Box`: "The base of every box: the four-character `type`."
- `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox`: write these after the RFC implementation decides whether the three types still differ from `IsoBox` once the four fields are removed. If a type becomes an alias of another, remove the type instead of documenting it (that removal is a separate, breaking item).


**Result.** Partly done in PR 708. `ParsedBox`, `ParsedIsoBox`, and `IsoTypedParsedBox` wait for the RFC decision on those types. Rule 6 of "Result type" in PR 682 (8435c2ae0) states the fate of the three types.

## F336: Entry points have no @throws tags, and some have no @example

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/writeIsoBox.ts:7`, `libs/iso-bmff/src/writeIsoBoxes.ts:7`, `libs/iso-bmff/src/utils/writeBox.ts:37`, `libs/iso-bmff/src/utils/writeBox.ts:46`, `libs/iso-bmff/src/readIsoBoxes.ts:15`, `libs/iso-bmff/src/findIsoBox.ts:27`, `libs/iso-bmff/src/filterIsoBoxes.ts:28`, `libs/iso-bmff/src/isIsoBoxType.ts:6`, `libs/iso-bmff/src/utils/isFullBox.ts:3`, `libs/iso-bmff/src/writers/defaultWriterConfig.ts:66`

**Evidence.** `writeBox` throws `new Error(`No writer found for box type: ${type}`)` and `new Error('Invalid box')`. The built-in writers throw a `RangeError` for a `bigint` that does not fit. The TSDoc of `writeIsoBox` and `writeIsoBoxes` has no `@throws`. `readIsoBoxes` says it "does not throw" for an incomplete box. It has no `@throws` for the other case: a reader that reads past the end of its box gets a `RangeError` from the `DataView` of the box, and the iterator rethrows it (`throw error` at IsoBoxReadView.ts:480). The second overloads of `findIsoBox` and `filterIsoBoxes` have a TSDoc block with only `@public`. `writeIsoBox`, `isIsoBoxType`, `isFullBox`, `IsoBoxReadableStream`, and `defaultWriterConfig` have no `@example`. `test/writers` has no `defaultWriterConfig.test.ts`, although `test/readers/defaultReaderConfig.test.ts` exists.

**Proposal of the finder.** Add: `@throws Error with the message "No writer found for box type" if a box has no writer and no source bytes.` `@throws RangeError if a bigint field does not fit its size.` On `readIsoBoxes`: `@throws RangeError if a reader reads past the end of its box.` Copy the summary, `@param`, and `@returns` to the second overloads. Add example regions in tests for the five exports, and add the `defaultWriterConfig` test.

**Proposal after verification.** 1. Write the tags once, against the 2.0 contract. The RFC removes `view` and adds `bytes`, so "no source bytes" becomes wrong. Use the RFC wording (rfc/iso-bmff-cursor-api.md:201): `@throws Error if a box has no writer, no boxes field, and no bytes field. The message starts with "No writer found for box type".` The real message has a suffix (`: ${type}`), so the tag must say "starts with". If the tags land before the cursor API, they need a second edit.

2. Widen the read tag. The RangeError is not limited to a custom reader. A built-in reader throws it for a complete box whose body is shorter than its fields (IsoBoxReadView.ts:153 limits the view to the box). Proposed text on every overload of `readIsoBoxes`: `@throws RangeError if a box is complete and a reader reads past the end of that box.` Add one sentence to docs/reading-boxes.md:89, which today states only "The function does not throw". Add the write tags to `createIsoBoxReadableStream` and `IsoBoxReadableStream` too, with the note that the error reaches the consumer of the stream. Also tag the `IsoBoxReadableStream` constructor for `ReadableStream is not available in this environment` (IsoBoxReadableStream.ts:18).

3. Do not add a tag for `Invalid box` (writeBox.ts:46). A typed caller cannot reach it. The value has neither `type` nor `buffer`.

4. State the scope of the example work. The five exports are not the only ones without @example: 78 of 87 reader files and 83 of 85 writer files have none. Limit the work to the entry points and say so, or the same finding returns for every reader. For `IsoBoxReadableStream`, link to `createIsoBoxReadableStream` with `{@link}`, because that function already has the example. `defaultWriterConfig` is already used in int64.test.ts, incompleteBoxHeader.test.ts, and createIsoBoxReadableStream.test.ts. The new test file is still worth adding for the example region and for a check of the writer keys, as defaultReaderConfig.test.ts does for readers.

The overload part of the proposal stands as written.


**Result.** Done in PR 708.

## F34: The types of messageData (emsg) and data (free, skip) do not say that the bytes share memory with the input buffer

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/EventMessageBox.ts:18`, `libs/iso-bmff/src/boxes/FreeSpaceBox.ts:8`, `libs/iso-bmff/src/IsoBoxReadView.ts:286`, `libs/iso-bmff/src/readers/readEmsg.ts:43`

**Evidence.** `messageData: Uint8Array` and `data: Uint8Array` have no TSDoc. Only the view method states the fact: `@returns The data. The array shares memory with the buffer of the view.` The reader returns that view: `messageData: readData(-1)`. A search of README.md and docs/*.md for the shared memory statement returns no line. A player that keeps emsg boxes in an event queue keeps the whole segment buffer alive, and a later change of the buffer changes the event payload.

**Proposal of the finder.** Add one TSDoc line to both fields and one paragraph to the reading guide: the bytes are a view over the input, copy them with `slice()` to keep them after the segment buffer is released. Keep the no-copy behavior, because it is the fast path.

**Proposal after verification.** Cover all four box types that return `readData(-1)`: `messageData` of `emsg`, and `data` of `free`/`skip`, `mdat`, and `imda`. Add one TSDoc line to each field in EventMessageBox.ts, FreeSpaceBox.ts, MediaDataBox.ts, and IdentifiedMediaDataBox.ts: the bytes are a view over the input buffer. Add one short paragraph to docs/reading-boxes.md, next to the emsg example at line 49: byte fields share memory with the input, call `slice()` to keep the bytes after the segment buffer is released or changed. Keep the no-copy behavior. If the cursor API RFC lands, carry the sentence to `readBytes` (rfc/iso-bmff-cursor-api.md:186) and state the same fact for the `bytes` field of a raw box (rfc/iso-bmff-cursor-api.md:87), which is also a view.

**Prior decision.** PR 644 (commit af0e23eb0, "fix(iso-bmff): limit readData to the view and read no bytes for 0") chose the no-copy behavior on purpose. Its test plan lists "a form that returns a copy" as a wrong form that must fail a test, and test/readData.test.ts:88 asserts `data.buffer === buffer.buffer`. The same PR added the shared memory sentence to the TSDoc of `readData`. AGENTS.md (PR 583) sets the type rule: a function that returns a view over its input returns `Uint8Array`, an allocating function returns `Uint8Array<ArrayBuffer>`. No prior decision says that the fields or the guides must stay silent about it, so the documentation gap is not intentional.

**Result.** Done in PR 708. The `readBytes` sentence goes to the cursor RFC. The `readBytes` sentence is in the contract of PR 682 (8435c2ae0).

## F340: The Unreleased section has two '### Changed' headings, and two older sections have the wrong year

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/CHANGELOG.md:31`, `libs/iso-bmff/CHANGELOG.md:103`, `libs/iso-bmff/CHANGELOG.md:259`, `libs/iso-bmff/CHANGELOG.md:269`

**Evidence.** Line 31 `### Changed` and line 103 `### Changed` are both inside `## [Unreleased]`. Keep a Changelog has one heading for each change type in a version. `## [1.0.0-alpha.3] - 2025-01-07` and `## [1.0.0-alpha.2] - 2025-01-05` are between `## [1.0.0-alpha.4] - 2026-01-08` and `## [1.0.0-alpha.1] - 2025-12-27`.

**Proposal of the finder.** Merge the entries of line 103 into the list of line 31 before the release. Correct the two dates to `2026-01-07` and `2026-01-05`.

**Proposal after verification.** No correction to the finding. One more defect of the same kind is in the same file: line 217 has the heading `### Fix` under `## [1.0.0-alpha.7]`, and Keep a Changelog names that heading `### Fixed`.


**Result.** Done in PR 708.

## F341: Two bullets of the README 'When to use' section do not match the functions that they name

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/README.md:10`, `libs/iso-bmff/README.md:12`, `libs/iso-bmff/src/createInt64OverflowReader.ts:6`

**Evidence.** Line 12: "Read 64-bit fields, such as a tfdt time at a 10 MHz timescale, with the exact value: `readInt64AsBigInt`, `createInt64OverflowReader`". `createInt64OverflowReader` does not return the exact value: "The function reads every 64-bit integer field as a `number`... the read continues with the rounded value." Line 10: "Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTfhd`, `readTrun`". The default sample duration of `moov` is in the `trex` box, and `readTrex` is not in the list.

**Proposal of the finder.** Line 12: "Read 64-bit fields, such as a tfdt time at a 10 MHz timescale, with the exact value, or get a report of a rounded value: `readInt64AsBigInt`, `createInt64OverflowReader`". Line 10: add `readTrex` to the list. `scripts/agentDocs.ts` reads the section, so regenerate `skills/common-media-library` after the edit.

**Proposal after verification.** Keep 8 bullets (scripts/agentDocs.ts maxBullets = 8) and keep each bullet under 20 words. Line 12: "Read a 64-bit field, such as a tfdt time at a 10 MHz timescale, exactly or with an overflow report: `readInt64AsBigInt`, `createInt64OverflowReader`". Line 10: keep the text and add `readTrex` to the list (`readMdhd`, `readStsd`, `readTrex`, `readTfhd`, `readTrun`). Describe line 10 as a missing fallback reader, not as a wrong bullet: `readTfhd` does return `defaultSampleDuration`, and `trex` holds the default when the tfhd flag is absent. Then run the root build so that skills/common-media-library/SKILL.md and references/iso-bmff.md regenerate, and commit the result. No changelog version impact beyond a docs entry under Unreleased.


**Result.** Done in PR 708.

## F342: The writing guide has wording errors and an example that fails at runtime

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/docs/writing-boxes.md:8`, `libs/iso-bmff/docs/writing-boxes.md:47`, `libs/iso-bmff/docs/writing-boxes.md:87`, `libs/iso-bmff/docs/writing-boxes.md:212`, `libs/iso-bmff/docs/writing-boxes.md:236`

**Evidence.** (1) "In TypeScript, cast raw box objects to a box type for type safety. There are two ways." The first example is a type annotation (`const box: FileTypeBox = {...}`), not a cast. A third way follows: "You can also get a box type from `IsoBoxMap`". (2) Both examples run `for (const byteArray of byteArrays) { sourceBuffer.appendBuffer(byteArray); // wait for updateend event }`. `appendBuffer` throws an `InvalidStateError` while the previous append is in progress, so the loop fails on the second array. (3) "It takes an array of streamable items". The parameter is `Iterable<IsoBoxStreamable<IsoInt64>>`.

**Proposal of the finder.** (1) "In TypeScript, give a box object a box type. There are three ways." and name the third way in the list. A `satisfies FileTypeBox` example is a fourth option that keeps the literal types. (2) Await the event in the loop: `await new Promise((resolve) => sourceBuffer.addEventListener("updateend", resolve, { once: true }))`. With the single array of the cursor RFC, the loop goes away. (3) "It takes an iterable of streamable items".

**Proposal after verification.** Keep the three fixes, with two changes to item (1).

First, do not write "three ways". The `IsoBoxMap["ftyp"]` example is the same technique as the first example (a type annotation), with a different route to the type name. Drop the count: "In TypeScript, give a raw box object a box type." Then "Annotate the object with a box type from the library", "or get the same type from `IsoBoxMap`", then the second technique. Keep the name "raw box objects", which the guide uses everywhere else.

Second, replace the `as const` example with `satisfies FileTypeBox` and do not add it as a fourth option. `type: "ftyp" as const` checks nothing at the declaration: a wrong `majorBrand` type surfaces only at the `writeIsoBoxes` call. `satisfies` reports the error on the literal and keeps the literal types. The TypeScript minimum is 5.7, and the tests already use the operator (libs/iso-bmff/test/writeUint.test.ts:100).

Item (2): the awaited `updateend` listener with `{ once: true }` is correct, because `updateend` fires after both a successful and a failed append. Apply it to both blocks (lines 47-50 and 87-90). If the cursor RFC lands first, both loops become one `sourceBuffer.appendBuffer(bytes)` call and the fix is not needed.

Item (3) as proposed: "It takes an iterable of streamable items".


**Result.** Done in PR 708.

## F343: The docs of createInt64OverflowReader do not state that the all-ones duration of ISO/IEC 14496-12 reports an overflow

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/docs/reading-boxes.md:172`, `libs/iso-bmff/src/createInt64OverflowReader.ts:8`, `libs/iso-bmff/src/createInt64OverflowReader.ts:26`, `libs/iso-bmff/docs/writing-boxes.md:173`

**Evidence.** `if (!Number.isSafeInteger(value)) { onOverflow(new RangeError(...)) }`. ISO/IEC 14496-12:2015 for `mvhd`, `tkhd`, and `mdhd`: "If the duration cannot be determined then duration is set to all 1s." A version 1 box with that duration reads as 2^64, which is not a safe integer. The writing guide knows the value: "ISO/IEC 14496-12 uses that value for a duration that cannot be determined." The reading guide says only: "When a 64-bit value is outside the safe integer range, the callback receives a `RangeError`... If the callback throws, the read stops with that error." A callback that throws therefore stops the read of a valid init segment with an unknown duration in a version 1 header box.

**Proposal of the finder.** Add to the guide section and to the TSDoc: "A version 1 `mvhd`, `tkhd`, or `mdhd` box can have a `duration` with all bits set. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. The callback receives a `RangeError` for that value too. Do not throw from the callback if your code reads such boxes."

**Proposal after verification.** Keep the behavior. Add one short paragraph to the section "Reporting a rounded value" of docs/reading-boxes.md, and one sentence to the TSDoc of createInt64OverflowReader. Suggested guide text: "A version 1 `mvhd`, `tkhd`, or `mdhd` box can have a `duration` with all bits set. ISO/IEC 14496-12 uses that value for a duration that cannot be determined. The callback receives a `RangeError` for that value too, and the field reads as `2 ** 64`. That report does not mean that the file is damaged. If your code reads such boxes, do not throw from the callback." Link the sentence in docs/writing-boxes.md:173 to that paragraph instead of a second explanation. Do not add a special case to the function: an exception for all ones costs bytes on every adopter of the function, and the stored value 2^64 - 1 is in fact rounded. Carry the note into the guide text that the cursor API RFC rewrites.

**Prior decision.** The reporting behavior is intentional: rfc/uint64-reader-config.md (PR 613, section "Overflow detection", line 274, and decision "Overflow check" at line 467) defines the check as `Number.isSafeInteger` with no exception, and PR 645 added the test "should report the largest unsigned value" (test/createInt64OverflowReader.test.ts:63). No prior decision covers the missing documentation note. Issue 653 and PR 669 documented the all-ones value on the write side only.

**Result.** Done in PR 708.

## F346: The guide context files give the name `buffer` two types, and the guides never say what `buffer` holds

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/docs/reading-boxes.context.d.ts:2`, `libs/iso-bmff/docs/utilities.context.d.ts:2`, `libs/iso-bmff/docs/writing-boxes.context.d.ts:4`, `libs/iso-bmff/docs/reading-boxes.md:128`, `libs/iso-bmff/docs/writing-boxes.md:141`, `libs/iso-bmff/docs/utilities.md:15`

**Evidence.** `declare const buffer: ArrayBuffer` (reading and writing) and `declare const buffer: Uint8Array` (utilities). The first two blocks of the reading guide declare `buffer` with `fetch`. Every later block uses `buffer` with no declaration and no sentence that names it. The writing guide uses `sourceBuffer` and `transport` in the same way.

**Proposal of the finder.** Use one type in the three context files (`Uint8Array`, the type a player has after a segment download). Add one sentence before the first use in each guide: "In the examples, `buffer` holds the bytes of a segment, `sourceBuffer` is a `SourceBuffer`, and `transport` is a `WebTransport`."

**Proposal after verification.** Use `ArrayBuffer` in utilities.context.d.ts, not `Uint8Array` in all three files. `ArrayBuffer` matches the `r.arrayBuffer()` declaration that reading-boxes.md:20 shows. Add the sentence only where no block declares the name: utilities.md before line 15 ("In the examples, `buffer` holds the bytes of a segment.") and writing-boxes.md before the first use of `sourceBuffer`, `transport` and `buffer`. reading-boxes.md needs no sentence because its first two blocks declare `buffer`. The cursor API RFC rewrites the writing guide (`writeIsoBoxes` returns one array, `IsoBoxStreamable` goes away), so add the sentence in that rewrite and not as a separate change.

**Prior decision.** PR 573 (commit e7db0e39e, "docs: make every README and guide example block typecheck") added the context files, and AGENTS.md:80 records the rule: a block may use a value from the reader's code, declared in `<guide>.context.d.ts`. That decision makes the undeclared names intentional. It does not decide the type mismatch or forbid an explanatory sentence.

**Result.** Done in PR 708.

## F359: Spec references use four year formats, and the type and the writer of the same box cite different editions or clauses.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/SoundMediaHeaderBox.ts:4`, `libs/iso-bmff/src/writers/writeSmhd.ts:7`, `libs/iso-bmff/src/boxes/VideoMediaHeaderBox.ts:4`, `libs/iso-bmff/src/writers/writeVmhd.ts:8`, `libs/iso-bmff/src/boxes/AudioSampleEntryBox.ts:13`, `libs/iso-bmff/src/writers/writeAudioSampleEntryBox.ts:12`, `libs/iso-bmff/src/writers/writeMp4a.ts:9`, `libs/iso-bmff/src/writers/writeAvc1.ts:9`, `libs/iso-bmff/src/boxes/SubtitleMediaHeaderBox.ts:4`, `libs/iso-bmff/src/writers/writeSthd.ts:7`, `libs/iso-bmff/src/boxes/SyncSampleBox.ts:5`, `libs/iso-bmff/src/writers/writeStss.ts:7`, `libs/iso-bmff/src/boxes/SubsampleInformationBox.ts:5`, `libs/iso-bmff/src/writers/writeSubs.ts:7`, `libs/iso-bmff/src/boxes/ExtendedLanguageBox.ts:4`, `libs/iso-bmff/src/writers/writeElng.ts:8`, `libs/iso-bmff/src/boxes/MetaBox.ts:28`, `libs/iso-bmff/src/writers/writeMeta.ts:10`, `libs/iso-bmff/src/boxes/TrackKindBox.ts:4`, `libs/iso-bmff/src/boxes/LabelBox.ts:4`, `libs/iso-bmff/src/boxes/AudioRenderingIndicationBox.ts:4`, `libs/iso-bmff/src/boxes/PreselectionGroupBox.ts:13`, `libs/iso-bmff/src/boxes/CompositionTimeToSampleBox.ts:5`, `libs/iso-bmff/src/readers/readCtts.ts:9`, `libs/iso-bmff/src/writers/writeCtts.ts:7`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:4`, `libs/iso-bmff/src/writers/writePssh.ts:8`, `libs/iso-bmff/src/boxes/EventMessageBox.ts:71`, `libs/iso-bmff/src/readers/readEmsg.ts:14`, `libs/iso-bmff/src/writers/writeEmsg.ts:9`, `libs/iso-bmff/src/boxes/SampleDependencyTypeBox.ts:4`, `libs/iso-bmff/src/writers/writeSdtp.ts:7`, `libs/iso-bmff/src/boxes/TrackFragmentBaseMediaDecodeTimeBox.ts:5`, `libs/iso-bmff/src/writers/writeTfdt.ts:8`, `libs/iso-bmff/src/boxes/ProducerReferenceTimeBox.ts:5`, `libs/iso-bmff/src/writers/writePrft.ts:8`

**Evidence.** Counts in src/boxes: `14496-12:2012` 31 lines, `:2015` 4, `:202x` 6, `23001-7:2011` 1, `23001-7:2016` 1. Writers: `14496-12:2012` 42, `23001-7` with no year 1, `23009-1` with no year 1. Same box, two citations: smhd `2012 - 8.4.5.3` (type) and `2012 - 12.2.2` (writer). vmhd `2012 - 8.4.5.2` and `2012 - 12.1.2`. Audio sample entry `2012 - 8.5.2.2` and `2012 - 12.2.3`. sthd, stss, subs: `2015` on the type and `2012` on the writer. elng and meta: `202x` on the type and `2012` on the writer, and both boxes are in the 2015 text (8.4.6, 8.11.1). ctts: `2012` type, `2015` reader, `2012` writer. pssh: `23001-7:2011` on a type that documents the version 1 `kid` fields, no year on the writer. emsg: `23009-1:2014` on the type, including the version 1 type, no year on reader and writer. `202x` is a placeholder, not an edition. Names differ too: sdtp `8.6.4.1 Sample Dependency Type box` and `8.6.4 Independent and Disposable Samples Box`, tfdt `Track Fragment Decode Time` and `Track Fragment Base Media Decode Time Box`, prft `Producer Reference Time` and `Producer Reference Time Box`. The 12.x clause numbers match the 2015 text. The 2012 text was not available.

**Proposal of the finder.** Pick one edition per document for the whole package and one format, for example `ISO/IEC 14496-12:2015, 8.8.8`. Put the reference on the box type only, and link the type from the reader and the writer with `{@link}`. Replace each `202x` with the published edition after a read of that text. Use the clause title of the spec as the name.

**Proposal after verification.** "One edition for the whole package" cannot be the 2015 edition: `imda`, `labl`, `prsl` and `ardi` are not in that text. Use this rule instead. Cite ISO/IEC 14496-12:2015 for every box that the 2015 text contains, with the 2015 clause number (smhd 12.2.2, vmhd 12.1.2, sthd 12.6.2, AudioSampleEntry 12.2.3, VisualSampleEntry 12.1.3 of 14496-12 and not 14496-15, elng 8.4.6, kind 8.4.10 is wrong, use 8.10.4, meta 8.11.1). That also fixes the writers, whose 12.x numbers already are 2015 numbers under a 2012 label. For `imda`, `labl`, `prsl` and `ardi`, cite the edition or amendment that defines the box, and only after a read of that text. Until then, remove the clause number and keep the box name, because a wrong clause is worse than none. Cite 23001-7:2016 for pssh (clause 8.1 confirmed) and check the 23009-1 edition for emsg version 1 before a year is written (the 2014 year on the version 1 type is doubtful, the text was not available). Do not use the clause title as the name without a check: the 2015 title of 8.8.12 is `Track fragment decode time` and of 12.2.2 is `Sound media header`. Use the clause number plus the box class name of the syntax (`TrackFragmentBaseMediaDecodeTimeBox`, `SampleDependencyTypeBox`). One citation on the box type and a `{@link}` from the reader and the writer is a good rule. Apply it in the cursor change, which edits every reader and writer file, or in the iso-bmff PR of issue 435. A major version is not needed.


**Result.** Done in PR 708.

## F360: The field comments of MediaHeaderBox contradict the field types.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:12`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:15`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:18`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:24`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:27`

**Evidence.** Line 12-13 `A 32-bit integer that specifies the creation time` on `creationTime: V`, a 64-bit field in version 1. Line 15 has the same error for `modificationTime`. Line 24-25 `A 16-bit integer that specifies the language code` on `language: string`. Line 18 `A time value that indicates the time-scale`, but the spec says `timescale is an integer`. Line 27 `A 16-bit value that is reserved for use in other specifications` on `preDefined`, and the spec has `unsigned int(16) pre_defined = 0`. No comment states the 1904 epoch that the spec gives.

**Proposal of the finder.** Rewrite from 8.4.2.3: `creationTime`: seconds since 1904-01-01 UTC, 32 bits in version 0 and 64 bits in version 1. `language`: the three-letter ISO 639-2/T code. `preDefined`: the `pre_defined` field, 0 in a compliant box.

**Proposal after verification.** Rewrite the five comments from clause 8.4.2.3, with no bit width where the width depends on the version:
- `creationTime`: "The creation time of the media in this track, in seconds since midnight, 1904-01-01, UTC. The field has 32 bits in version 0 and 64 bits in version 1."
- `modificationTime`: "The most recent time the media in this track was modified, in seconds since midnight, 1904-01-01, UTC."
- `timescale`: "The number of time units that pass in one second for this media." (This wording also removes the semicolon.)
- `duration`: "The duration of this media in units of `timescale`. A field with all bits set means that the duration cannot be determined." Do not state a number. Link to the 64-bit section of docs/writing-boxes.md for the value that each `int64` reader returns.
- `language`: "The ISO 639-2/T language code, three lower-case letters."
- `preDefined`: "The `pre_defined` field. The default value is 0." Do not write "0 in a compliant box", because clause 4.2 says "should" and tells readers to ignore the field.
Add one entry under `## [Unreleased]` in the changelog. The fix can ship in any release and can merge with the same correction for `MovieHeaderBox` and `TrackHeaderBox`, which have no comments on these fields (MovieHeaderBox.ts:11-14).


**Result.** Done in PR 708.

## F365: The @param config lines of the writers use four wordings, and writeMp4a has none.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/writers/writeMp4a.ts:11`, `libs/iso-bmff/src/writers/writeAvc3.ts:10`, `libs/iso-bmff/src/writers/writeDref.ts:10`, `libs/iso-bmff/src/writers/writeStsd.ts:10`, `libs/iso-bmff/src/writers/writeVisualSampleEntryBox.ts:15`

**Evidence.** writeMp4a.ts:17-20 takes `config: IsoBoxWriteViewConfig`, and its TSDoc (lines 6-16) has only `@param box`. Counts over all writers: `The `IsoBoxWriteViewConfig` with the writers for the child boxes` 19, `The `IsoBoxWriteViewConfig` to use` 10, `The IsoBoxWriteViewConfig to use` with no backticks 3 (writeAvc3, writeDref, writeStsd), `The configuration for the writer` 1.

**Proposal of the finder.** Use one line for all 33 writers that take a config: `@param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes`. Add it to writeMp4a.

**Proposal after verification.** Do not edit the 34 `@param config` lines as a separate task for 2.0.0. The cursor RFC removes the `config` parameter from every writer (`(cursor: IsoBoxWriteCursor, box: B) => void`), so the lines disappear. Apply the rule to the rewrite instead: every writer gets the same two lines, in signature order, for example `@param cursor - The `IsoBoxWriteCursor` to write to` and `@param box - The `<BoxType>` fields to write`, and no writer (writeMp4a included) omits a parameter. Add the same rule for the readers (`@param cursor`). If the RFC is rejected or delayed and version 1 stays, then the original proposal is fine as a docs-only change under issue 435: one wording for all 34 writers, with the missing line added to writeMp4a.


**Result.** Done in PR 708.

## F368: The TSDoc of the two sample entry reader factories gives misleading examples and does not follow the documentation rules.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/createAudioSampleEntryReader.ts:10`, `libs/iso-bmff/src/readers/createAudioSampleEntryReader.ts:17`, `libs/iso-bmff/src/readers/createVisualSampleEntryReader.ts:10`, `libs/iso-bmff/src/readers/createVisualSampleEntryReader.ts:17`

**Evidence.** createAudioSampleEntryReader.ts:10-11: `types that aren't in the standard `AudioSampleEntryType` union (e.g., `'mp4a'`, `'enca'`)`. The two listed types are members of the union, so the sentence reads as the opposite of its meaning. The visual file has the same text with `'avc1'`, `'hvc1'`. Lines 17-25 hold an inline `ts` example with no imports, and AGENTS.md requires `{@includeCode ../test/<file>.test.ts#example}`. No test file exists for either factory in test/readers. The text uses `e.g.` and a contraction, which the writing style forbids.

**Proposal of the finder.** Write: `Create a reader for an audio sample entry box of a type that `AudioSampleEntryType` does not list, such as `ac-3` or `ec-3`.` Add a test file with an example region for each factory and include it.

**Proposal after verification.** Keep the proposed sentence, with one form per factory: "Create a reader for an audio sample entry box of a type that `AudioSampleEntryType` does not list, such as `ac-3` or `ec-3`." and the same sentence for the visual factory with `av01` or `vp09`. Those examples match the inline blocks that already exist at lines 21-22 of each file.

Change the test claim: tests already use both factories (test/api.test.ts:26-27, test/readIsoBoxes.test.ts:57, test/writeIsoBoxes.test.ts:270). Add only a dedicated test file with an `#example` region per factory, for example test/readers/createAudioSampleEntryReader.test.ts and test/readers/createVisualSampleEntryReader.test.ts, and replace each inline block with `{@includeCode ../../test/readers/<file>.test.ts#example}`.

Order the work in two parts. The sentence fix can go now, in the iso-bmff PR of issue 435. The example region shows the reader signature, and rfc/iso-bmff-cursor-api.md replaces `IsoBoxReadView` in that signature. Write the example region with the cursor work, so the example is written once.

The duplicate report F50 adds a separate item (the TSDoc of `readHev1` and `readHvc1` does not name the box type, and no guide mentions the factories). Track that item on its own. It is also documentation only.


**Result.** Done in PR 708.

## F369: Twenty-five test files have an example region that no TSDoc includes.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readHdlr.ts:6`, `libs/iso-bmff/src/readers/readSchm.ts:5`, `libs/iso-bmff/src/readers/readUrl.ts:5`, `libs/iso-bmff/src/readers/readUrn.ts:5`, `libs/iso-bmff/src/readers/readVlab.ts:5`, `libs/iso-bmff/src/writers/writeElng.ts:5`, `libs/iso-bmff/src/writers/writeFtyp.ts:4`, `libs/iso-bmff/src/writers/writeHdlr.ts:6`, `libs/iso-bmff/src/writers/writeIden.ts:5`, `libs/iso-bmff/src/writers/writeKind.ts:5`, `libs/iso-bmff/src/writers/writeLabl.ts:5`, `libs/iso-bmff/src/writers/writeMvhd.ts:6`, `libs/iso-bmff/src/writers/writePayl.ts:5`, `libs/iso-bmff/src/writers/writePrsl.ts:8`, `libs/iso-bmff/src/writers/writeSchm.ts:5`, `libs/iso-bmff/src/writers/writeSmhd.ts:4`, `libs/iso-bmff/src/writers/writeStco.ts:4`, `libs/iso-bmff/src/writers/writeStsc.ts:4`, `libs/iso-bmff/src/writers/writeStsd.ts:6`, `libs/iso-bmff/src/writers/writeStsz.ts:4`, `libs/iso-bmff/src/writers/writeSttg.ts:5`, `libs/iso-bmff/src/writers/writeTkhd.ts:6`, `libs/iso-bmff/src/writers/writeUrl.ts:5`, `libs/iso-bmff/src/writers/writeUrn.ts:5`, `libs/iso-bmff/src/writers/writeVlab.ts:5`

**Evidence.** 34 files in test/readers and test/writers have `// #region example`, for example test/readers/readHdlr.test.ts:24 and test/writers/writeMvhd.test.ts:32. Only 9 source files have `{@includeCode}`: defaultReaderConfig, readEmsg, readPssh, readStco, readStsc, readStsz, readTenc, writePssh, writeTenc. The other 25 regions never reach the API reference.

**Proposal of the finder.** Add `@example {@includeCode ../../test/<dir>/<name>.test.ts#example}` to the 25 functions, or remove the unused region markers. For 2.0, decide one rule: every reader and writer has an example, or only the ones with a special rule.

**Proposal after verification.** Keep the region markers. Do not offer removal as an option, and do not ask for a new rule: .claude/rules/code-quality.md:40-41 already requires an `@example` with `{@includeCode}` for public functions and a region in every test file. Apply that rule in the same change that rewrites each reader and writer for the cursor API, because the writer regions read `writer.buffer` and will change then. In that pass: (1) add `@example` followed by `{@includeCode ../../test/<readers|writers>/<name>.test.ts#example}` to the 25 functions, with the path form that src already uses, (2) cut each region to the call and its input, and move the `assert` calls and expected byte arrays below `// #endregion example` (18 of the 25 regions contain an assert, and writeStsd is 148 lines), (3) treat the 25 as the first step only: 88 files in src/readers and 86 in src/writers exist, and 9 have an example, so the remaining readers and writers need a region and a tag as well if the rule is enforced for 2.0.


**Result.** Done in PR 708. Regions for the other readers and writers belong to issue 435.

## F370: Five container readers with a type parameter for 64-bit fields do not document the int64 option, and their writers do.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/src/readers/readGrpl.ts:6`, `libs/iso-bmff/src/readers/readMeco.ts:9`, `libs/iso-bmff/src/readers/readMeta.ts:6`, `libs/iso-bmff/src/readers/readStrk.ts:6`, `libs/iso-bmff/src/readers/readUdta.ts:6`

**Evidence.** readGrpl.ts:17 `export function readGrpl<V extends IsoInt64>(view: IsoBoxReadView<V>): GroupsListBox<V>` has no int64 paragraph. readEdts.ts:11-12, readMdia, readMfra, readMoof, readMoov, readMvex, readTraf and readTrak have `The 64-bit integer fields of the child boxes have the type that the `int64` option of the view returns.` The writers writeGrpl.ts:13, writeMeco.ts:13, writeMeta.ts:12, writeStrk.ts:13 and writeUdta.ts:13 have `Each 64-bit integer field of a child box is a `number` or a `bigint`.`

**Proposal of the finder.** Add the int64 paragraph to the five readers. No generic function has a `@typeParam V` line, so add one line to each or state the rule once in the guide.

**Prior decision.** None that makes the omission intentional. rfc/iso-bmff-container-readers-writers.md:146 states the rule the five readers now fall under: "A reader with the type parameter returns the 64-bit integer fields of the child boxes with that type. With no option, those fields are numbers." That RFC text predates PR 659 and still counts 8 box types with `V` (lines 99 and 147), so the RFC is stale in the same way.

**Result.** Done in PR 708.

## F371: A TODO line comment sits between the TSDoc and the declaration of a public type.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/PreselectionGroupBox.ts:9`

**Evidence.** PreselectionGroupBox.ts:4-10: TSDoc `Child boxes of Preselection Group Box`, then `// TODO: Find documentation on what children are allowed`, then `export type PreselectionGroupBoxChild = any`. writeDref.ts:22 and writeStsd.ts:25 hold `// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?`, which the cursor RFC answers.

**Proposal of the finder.** Read the edition that defines `prsl`, type the children, and delete the TODO. The spec text for `prsl` was not available. Delete the two writer TODO lines with the size code.

**Proposal after verification.** Split the finding in two.

1. Not breaking, do anytime: delete the TODO line at PreselectionGroupBox.ts:9 (or move it above the TSDoc block). The TODO lines at writeDref.ts:22, writeStsd.ts:25 and utils/writeContainerBox.ts:25 disappear with the size code of the cursor RFC, so they need no separate work. IsoBoxReadView.ts:168 and utils/writeBox.ts:28 disappear with the view classes for the same reason.

2. Breaking at compile time, do in 2.0.0: follow the pattern of PR 659, not a spec list. Declare `PreselectionGroupBoxChild<V = number> = IsoBox<V>` (plus the raw box type of the cursor RFC, if the RFC keeps raw boxes outside `IsoBox`), give `PreselectionGroupBox` the `V` parameter, and remove the `box.boxes as IsoBox[]` cast in writePrsl.ts:37. Do not restrict the children to a list until someone reads the edition that defines `prsl`. Handle `AudioSampleEntryBoxChild` and `VisualSampleEntryBoxChild` in the same change, since PR 659 left all three as `any` for one reason. Add a changelog migration like the one of PR 659: test `child.type` before a field read.

**Prior decision.** PR 659 (commit 1337aaed4, fixes issue 646) kept the prsl child type as `any` on purpose: "The child types of the audio sample entry, the visual sample entry, and the prsl box stay any. The writeStsd example passes raw bytes as a child, and IsoBox rejects that child." The decision avoided a wider compile break in a minor version. It does not forbid the change in a major version. Issue 584 (open) tracks no-explicit-any.

**Result.** Partly done in PR 708. Typed `prsl` children are breaking and go to the second RFC.

## F392: Two documentation examples in the tests do not show the use of the function well.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/test/createIsoBoxReadableStream.test.ts:43`, `libs/iso-bmff/test/createIsoBoxReadableStream.test.ts:152`, `libs/iso-bmff/test/traverseIsoBoxes.test.ts:22`

**Evidence.** The example of createIsoBoxReadableStream has `const copy = join(tmpdir(), 'captions-copy.mp4')` and `await stream.pipeTo(Writable.toWeb(createWriteStream(copy)))`. The example uses Node file APIs in a package for web players, and the test leaves two files in the temporary folder of the system. The example of traverseIsoBoxes is `for (const box of traverseIsoBoxes(boxes)) { equal(box.type, 'ftyp'); break }`, which reads one top-level box and shows no traversal.

**Proposal of the finder.** In the stream example, read the stream with `new Response(stream).arrayBuffer()` and compare the bytes, with no file. In the traverse example, collect the types of the boxes of a small moof tree and assert the order.

**Proposal after verification.** Keep the fixture read with `readFile`. Remove only the temporary file and the Node stream adapter, in both tests (lines 42-45 and 152-155).

Stream example: `new Response(stream).arrayBuffer()` works, but it buffers the whole output, which is the job of `writeIsoBoxes`. An example that shows the streaming use is better: pipe to a web `WritableStream` sink, as the guide does. For example: `const chunks: Uint8Array[] = []` then `await stream.pipeTo(new WritableStream({ write(chunk) { chunks.push(chunk) } }))`, then compare the joined chunks with the fixture bytes. This form needs no import and runs in every browser. Do not use `for await` over the stream in the public example, because Safari may not support async iteration of a `ReadableStream`. The second test (line 152) is not an example, so `new Response(stream).arrayBuffer()` or the existing `for await` pattern (line 162) is fine there.

Traverse example: the proposal is good. Use a small literal tree, or the fixture, and assert the order of the types, for example `const types = Array.from(traverseIsoBoxes(boxes), box => box.type)` with a `moof` that has `mfhd` and `traf` children. A second line with `{ maxDepth: 0 }` or `{ depthFirst: false }` would show the config, which the current example and the guide (docs/utilities.md:17) do not show.


**Result.** Done in PR 708.

## F57: writeMfra and writeMfro do not keep `mfraSize` correct, and no TSDoc or guide tells the adopter to set it.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/MovieFragmentRandomAccessOffsetBox.ts:10`, `libs/iso-bmff/src/writers/writeMfro.ts:23`, `libs/iso-bmff/src/writers/writeMfra.ts:26`, `libs/iso-bmff/docs/reading-boxes.md:95`

**Evidence.** MovieFragmentRandomAccessOffsetBox.ts:10 `mfraSize: number` with no TSDoc. writeMfro.ts:23 `writer.writeUint(box.mfraSize, 4)` writes the stored value. writeMfra.ts:26 `return writeContainerBox(box, config)` does not touch the child. Spec 8.8.11.1: "The size field here must be correct." and 8.8.11.3: "size is an integer gives the number of bytes of the enclosing 'mfra' box". An adopter who adds or removes a tfra entry and writes the mfra gets a wrong `mfraSize` with no error. docs/reading-boxes.md:95 documents the similar chunk offset case but not this case. The spec name of the field is `size`. The name `mfraSize` avoids the `size` field of a parsed box, which the RFC removes.

**Proposal of the finder.** Add TSDoc to `mfraSize` and to writeMfra: the value is the size in bytes of the enclosing mfra box, and the caller sets it after a change to the mfra children. Add one sentence to the guide next to the chunk offset note. Keep the name `mfraSize` in version 2 and state in the TSDoc that the spec name is `size`. Do not add automatic patching to the container path, because the named writer and the automatic path must write the same bytes.

**Proposal after verification.** Keep the documentation-only scope, the name `mfraSize`, and no automatic patch. Change three details. (1) Add TSDoc to `mfraSize`: the value is the size in bytes of the enclosing `mfra` box, the spec name of the field is `size` (ISO/IEC 14496-12, 8.8.11.3), and the writer writes the stored value. Add one sentence to the TSDoc of `writeMfra` and `writeMfro`: the caller sets `mfraSize` after a change to the children of the `mfra` box. (2) Put the guide sentence in libs/iso-bmff/docs/writing-boxes.md, not next to reading-boxes.md:95. That paragraph describes dropped trailing bytes of a parsed box. A short cross-reference from reading-boxes.md:95 is enough. (3) Fix the clause title in libs/iso-bmff/src/boxes/MovieFragmentRandomAccessOffsetBox.ts:4 from "8.8.11 Movie Fragment Random Access Box" to "8.8.11 Movie Fragment Random Access Offset Box", and add the same spec reference to readMfro.ts.


**Result.** Done in PR 708.

## F58: The TSDoc of MovieFragmentRandomAccessOffsetBox names the wrong box.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/src/boxes/MovieFragmentRandomAccessOffsetBox.ts:4`, `libs/iso-bmff/src/writers/writeMfro.ts:7`

**Evidence.** MovieFragmentRandomAccessOffsetBox.ts:4 `ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Box`. Clause 8.8.11 is "Movie Fragment Random Access Offset Box". The "Movie Fragment Random Access Box" is clause 8.8.9 (mfra). writeMfro.ts:7 has the correct name: `8.8.11 Movie Fragment Random Access Offset Box`.

**Proposal of the finder.** Change the type TSDoc to `8.8.11 Movie Fragment Random Access Offset Box`.


**Result.** Done in PR 708.

## F60: The fields of MovieHeaderBox, MovieExtendsHeaderBox, MovieFragmentHeaderBox, and MovieFragmentRandomAccessOffsetBox have no TSDoc, except `matrix`.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/MovieHeaderBox.ts:11`, `libs/iso-bmff/src/boxes/MovieExtendsHeaderBox.ts:11`, `libs/iso-bmff/src/boxes/MovieFragmentHeaderBox.ts:10`, `libs/iso-bmff/src/boxes/MovieFragmentRandomAccessOffsetBox.ts:10`, `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:12`

**Evidence.** MovieHeaderBox.ts:11-26 lists `creationTime`, `modificationTime`, `timescale`, `duration`, `rate`, `volume`, `nextTrackId` with no comment. Only `matrix` (lines 19-23) has one. MovieExtendsHeaderBox.ts:11 `fragmentDuration: V`, MovieFragmentHeaderBox.ts:10 `sequenceNumber: number`, and MovieFragmentRandomAccessOffsetBox.ts:10 `mfraSize: number` have none. The sibling MediaHeaderBox.ts:12-28 documents every field. The missing facts matter to adopters: `rate` and `volume` are already divided (16.16 and 8.8, readMvhd.ts:32-33), the times count seconds from 1904-01-01 UTC, `duration` and `fragmentDuration` use the mvhd `timescale`, and a `duration` with all bits set means unknown (spec 8.2.2.3 "If the duration cannot be determined then duration is set to all 1s").

**Proposal of the finder.** Add one TSDoc line to each field with the unit and the converted form. For `duration`, state the unknown value for each version and for each `int64` mode (0xffffffff in version 0, and the value the default reader returns for 64 bits set in version 1).

**Proposal after verification.** Treat this as one package-wide documentation task, not a four-file fix, and do it after the cursor API lands so the comments are written once. Scope: every box type in src/boxes whose reader converts or reinterprets a stored value gets a one-line TSDoc on that field. Priority order: (a) converted fields (mvhd `rate` 16.16 and `volume` 8.8, tkhd `volume`, `width`, `height`, and similar), (b) time fields (seconds since 1904-01-01 UTC) and the timescale each duration uses (mvhd `duration` and mehd `fragmentDuration` use the mvhd `timescale`), (c) fields whose name differs from the spec (`mfraSize` is `size` in 8.8.11.2). Plain integer fields with a self-evident name (`sequenceNumber`, `nextTrackId`) can stay without a comment, or take the one-line spec semantic. For the unknown duration, write one short sentence on `duration` ("All bits set means that the duration is unknown") and link to the 64-bit section of docs/writing-boxes.md instead of listing a value for each version and int64 mode. In the same pass, correct MediaHeaderBox.ts:12-28 (remove "32-bit integer" from the time fields, describe `language` as the ISO 639-2/T three-letter code string, describe `preDefined` as pre_defined), and correct the type-level title in MovieFragmentRandomAccessOffsetBox.ts:4 from "8.8.11 Movie Fragment Random Access Box" to "8.8.11 Movie Fragment Random Access Offset Box" (14496-12-2015.txt:4064).

**Prior decision.** None found against field TSDoc. CHANGELOG.md:107 shows the `matrix` field documentation of MovieHeaderBox and TrackHeaderBox was added on purpose (PR 620), which is why `matrix` is the only documented field. No entry states that the other fields stay undocumented.

**Result.** Done in PR 708.

## G452: A string field with bytes that are not valid UTF-8 is read with U+FFFD and no signal, so a read and a write change the bytes and the size of the box.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly. Merged duplicates: G459.

**Files.** `libs/iso-bmff/src/utils/readUtf8String.ts:15`, `libs/iso-bmff/src/readers/readHdlr.ts:22`

**Evidence.** `decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 })` uses a TextDecoder that is not fatal. Input `hdlr` with a Latin-1 name (bytes a9 41 00): `0000002368646c720000000000000000736f756e000000000000000000000000a94100`. The reader returns name '�A'. The writer returns a box of 0x25 bytes that ends with `efbfbd4100`. The same result for `kind` (ff 00 c3 00 becomes efbfbd00 efbfbd00), `payl` and `emsg`. No TSDoc and no guide states the rule. The input breaks the spec, which requires UTF-8 for these fields.

**Proposal of the finder.** Keep the replacement, because a player must not fail on a track name. State the rule one time in the TSDoc of the UTF-8 read function of the cursor RFC and in docs/reading-boxes.md: invalid bytes become U+FFFD, and a write of that box does not return the source bytes.

**Proposal after verification.** Keep the read behavior. If the cursor RFC adds a TSDoc sentence to the UTF-8 read function, do not promise U+FFFD. Write the contract as the maintainer stated it: "The function expects valid UTF-8. The result for bytes that are not valid UTF-8 depends on the environment, and a write of that string does not return the source bytes." The reason is the path of decodeText with no TextDecoder (libs/utils/src/decodeText.ts:141-154), which returns the byte value as a code point (a9 41 reads as U+00A9 U+0041), not U+FFFD. Do not add tests or changelog text for invalid UTF-8 (PR 643). One sentence in the TSDoc is enough, and docs/reading-boxes.md does not need it. A separate question for @svta/cml-utils, outside this audit: whether the fallback path of decodeText should return U+FFFD to match TextDecoder.

**Prior decision.** Merged PR 643 (fix(iso-bmff): read and write the emsg strings as UTF-8), description, section "Not changed, by earlier decisions of the maintainer": "No changelog text and no tests for input that is not valid UTF-8. The library expects UTF-8 in a field that the spec defines as UTF-8." The decision covers changelog text and tests. It does not name TSDoc, so it limits the proposal and does not refute it. PR 637 and PR 643 also record a related known effect with no follow-up issue: decodeText removes a leading byte order mark.

**Result.** Done in PR 708.

## G461: The reading guide says that `readIsoBoxes` does not throw for damaged input, but 1,995 of 367,642 single-byte changes to the fixtures make the function throw.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/docs/reading-boxes.md:89`

**Evidence.** "`readIsoBoxes` stops before the first incomplete box and returns the boxes before that box. The function does not throw." (reading-boxes.md:89).

Measured with defaultReaderConfig:
- Cut matrix: each of the 15 fixtures cut at every byte offset, 5,806,033 cuts. Every cut returns the complete top-level boxes before the cut. No cut throws, and the slowest cut takes 4.1 ms. The sentence is true for input that is cut at the end.
- Byte-change matrix: one changed byte in the first 4 KB, 8 to 10 values for each byte, 367,642 cases. 1,995 cases throw `RangeError: Offset is outside the bounds of the DataView` and return no box. 21 cases end the process (the known `trun` count). The other cases return.

The section title is "Incomplete boxes", so a reader of the guide takes the sentence as the rule for damaged data in general. A player that reads data from the network needs the opposite statement.

**Proposal of the finder.** Limit the sentence to its case: "The function does not throw for data that ends inside a top-level box." Add one paragraph that lists what throws: a box that is shorter than its fields, a count above the entries that the box holds, and nesting above the limit. Add the matching `@throws` tags to `readIsoBoxes`. Use the final error type of version 2 in the text.

**Proposal after verification.** Split the work in two.

Now, documentation only, not breaking:
- In docs/reading-boxes.md:89 and the TSDoc at src/readIsoBoxes.ts:15-17, limit the sentence to its case: "The function does not throw for an incomplete box."
- Add one short paragraph to the guide: "A box with a body shorter than its fields is not an incomplete box. `readIsoBoxes` then throws a `RangeError` and returns no boxes. If the data comes from the network, call `readIsoBoxes` inside a `try` block."
- Add one tag to `readIsoBoxes`: `@throws RangeError if a reader reads past the end of its box.` The native `RangeError` is also the error type that the RFC names for version 2, so the text survives the major version.

Not now:
- Do not mention a nesting limit. None exists in the code or in the RFC.
- Do not document "a count above the entries that the box holds" as a throw. For `trun` with no per-sample flags, the read exhausts memory and does not throw. Add that line only if a separate finding adds a count check, in the same PR as that check.

**Prior decision.** Issue 668 (closed as not planned, 2026-11-16): an error from a reader that reads past its data goes to the caller, so the throw for a damaged box is intentional. PR 661 (7d67e217a, issue 650) and PR 662 (issue 663) added the "does not throw" sentence, scoped to incomplete boxes only. rfc/iso-bmff-cursor-api.md:195 and :198 keep both rules for version 2. No prior decision states that the documentation should omit the throw.

**Result.** Done in PR 708.

## G510: No document states the runtime APIs that the package needs, and the website says the packages need no polyfills.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/README.md:20`, `README.md:29`, `site/index.md:30`, `site/guide/getting-started.md:27`, `libs/iso-bmff/docs/reading-boxes.md:166`, `libs/iso-bmff/docs/writing-boxes.md:95`, `libs/iso-bmff/package.json:44`

**Evidence.** The iso-bmff README has an Installation section with one `npm i` line and no requirement. The root README line 29 and the getting-started guide state one requirement: "The type declarations need TypeScript 5.7 or later". site/index.md:30 says "No framework, no runtime, no polyfills." The only runtime statement for iso-bmff is the `BigInt` paragraph at reading-boxes.md:166. The streaming section at writing-boxes.md:95 does not say that the function needs `ReadableStream`. The only machine-readable statement is `"engines": { "node": ">=20" }`, which says nothing about browsers. What the source uses, from a search of `src`: `TextEncoder` (14 writers, no fallback), `TextDecoder` (optional), `ReadableStream` (stream exports), `BigInt` with `DataView.prototype.getBigUint64`, `setBigUint64` and `setBigInt64` (bigint paths only), `SharedArrayBuffer` (optional, guarded with `typeof`), and the ES2015 and ES2016 built-ins `Symbol.iterator` with generators, `Object.assign`, `Array.from`, `Number.isSafeInteger`, `Number.isNaN` and `Array.prototype.includes`.

**Proposal of the finder.** Add a "Runtime requirements" section to the iso-bmff README with one table: the API, the exports that need it, and whether the package has a fallback. After the fixes of the other findings the table can be short: ES2015 built-ins for every export, `BigInt` for `readInt64AsBigInt` and `bigint` fields, `ReadableStream` for `createIsoBoxReadableStream`, and no other requirement. State the same facts in the TSDoc of the exports that have a requirement. Reword the site line so that it does not promise that no polyfill is ever needed, or keep the promise and make it true with the fallbacks.

**Proposal after verification.** Keep the documentation part and drop the fallback option.

1. Add a short "Runtime requirements" section to libs/iso-bmff/README.md with three rows. `TextEncoder`: every writer of a string field, no fallback. `BigInt`: `readInt64AsBigInt` and boxes with `bigint` fields, no check. `ReadableStream`: `createIsoBoxReadableStream` and `IsoBoxReadableStream`, the constructor throws an error with a clear message. Keep the `TextEncoder` row unless a separate change really adds a fallback. I did not verify that such a change is planned.
2. Do not list `Symbol.iterator`, `Object.assign`, `Array.from`, `Number.isSafeInteger`, `Number.isNaN`, or `Array.prototype.includes`. One sentence with the syntax baseline replaces them. tsconfig.json:42 and rfc/uint64-reader-config.md:166 say ES2019, but I did not check the syntax level of the bundler output (dist is stale). Confirm the target of the published files before the README states a baseline.
3. Add one sentence to the TSDoc of `createIsoBoxReadableStream` and `IsoBoxReadableStream`, and to docs/writing-boxes.md "Streaming boxes": the function needs `ReadableStream` and throws on a runtime without it.
4. Fix the TSDoc of `encodeText` at libs/utils/src/encodeText.ts:3. It claims support for environments without `TextEncoder`, and the code has none. This is the root statement for the `TextEncoder` row and it belongs to @svta/cml-utils.
5. The site card at site/index.md:29-30 is about dependencies. A rewording is optional, such as "No framework and no third-party runtime dependency." Do not add fallbacks to make a "no polyfills" claim true.

**Prior decision.** No decision covers the missing section. Three decisions make the runtime needs themselves intentional. (1) PR 643, libs/iso-bmff/CHANGELOG.md:121: "`writeEmsg`, `writeHdlr`, `writeUrl`, `writeUrn`, and `writeSchm` now need `TextEncoder`, as the other UTF-8 writers do." (2) rfc/uint64-reader-config.md:166, 426, 461 (accepted, PR 613 and PR 645): the package targets ES2019, `readInt64AsBigInt` needs `BigInt` and has no check, and a `BigInt` check was a rejected alternative. (3) PR 383 for issue 382, libs/iso-bmff/CHANGELOG.md:157: `IsoBoxReadableStream` guards the `ReadableStream` global and throws a descriptive error on construction.

**Result.** Partly done in PR 708. The ES baseline waits for the open target decision.

## G518: No time field states the 1904 epoch or its unit, and no ID field states that it holds a UUID or a key ID, except `kid` of pssh.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/MediaHeaderBox.ts:12`, `libs/iso-bmff/src/boxes/MovieHeaderBox.ts:11`, `libs/iso-bmff/src/boxes/TrackHeaderBox.ts:11`, `libs/iso-bmff/src/boxes/ProtectionSystemSpecificHeaderBox.ts:10`, `libs/iso-bmff/src/boxes/TrackEncryptionBox.ts:21`, `libs/iso-bmff/src/boxes/EditListEntry.ts:9`, `libs/iso-bmff/docs/reading-boxes.md:113`

**Evidence.** Answer to question 8. `grep -rn 1904` over `src`, `docs` and README.md returns 0 lines. Spec: creation_time is "in seconds since midnight, Jan. 1, 1904, in UTC time". MediaHeaderBox.ts:12 says only "A 32-bit integer that specifies the creation time of the media in this track." `creationTime: V` and `modificationTime: V` in MovieHeaderBox.ts:11 to 12 and TrackHeaderBox.ts:11 to 12 have no TSDoc. docs/reading-boxes.md:113 lists `creationTime`, `modificationTime`, `duration` for the int64 option and gives no epoch. So `new Date(box.creationTime * 1000)` is 66 years early, and nothing warns the adopter. The timescale of each time is also not stated: elst `segmentDuration: V` is in the movie timescale and `mediaTime: V` in the media timescale (EditListEntry.ts:9 to 10, no TSDoc), and tkhd `duration` is in the movie timescale. UUID: `systemId: number[]` (ProtectionSystemSpecificHeaderBox.ts:10) has no TSDoc, and the spec says "SystemID specifies a UUID". Key ID: `defaultKid` has only "`default_KID`" (TrackEncryptionBox.ts:21). `kid` of pssh is the one field with a full sentence. NTP: the two prft fields are already reported. No field has a type that marks an ID or a time: all are `number`, `V`, or `number[]`.

**Proposal of the finder.** Add one TSDoc sentence to each field. For the six time fields of mvhd, tkhd and mdhd: "Seconds since 1904-01-01T00:00:00Z." For each duration and media time: the timescale that applies, and for mvhd, tkhd and mdhd `duration` that all ones means unknown. For `systemId`: "The UUID of the protection system, 16 bytes." For `defaultKid`: "The default key ID, 16 bytes." Do not add branded types: they add a cast for every writer input and no check at run time. A conversion from a 1904 time to a `Date` is one subtraction of 2082844800 seconds. Show it in the reading guide and do not export a function for it.

**Proposal after verification.** 1. The evidence states that `new Date(box.creationTime * 1000)` is 66 years early. The date is 66 years late: the 1904 value is larger than the Unix value by 2082844800.
2. Replace the two mdhd sentences instead of adding to them. MediaHeaderBox.ts:12 and 15 say "A 32-bit integer", which is wrong for a version 1 box (64 bits) and for the `int64` option.
3. Do not write "all ones" as one value. The read value depends on the version and on the `int64` option: 4294967295 for version 0, 2^64 for version 1 with the default reader, 2^64 - 1 as a `bigint`. docs/writing-boxes.md:173 already states this rule. The TSDoc of `duration` should say "all bits set means that the duration cannot be determined" and link to that section, not repeat the numbers.
4. For `mediaTime` of elst, also state that -1 marks an empty edit. readElst.ts:26 reads the field as signed (`readWideInt`), so the value reaches the adopter as -1.
5. The guide example must work for both modes of the `int64` option, because the field is `V`: `new Date((Number(box.creationTime) - 2082844800) * 1000)`.
6. Keep the tenc comment form of PR 658 for `defaultKid`: "`default_KID`: the default key ID, 16 bytes."
7. If 2.0.0 changes the type of `systemId`, `kid`, or `defaultKid` (another finding may propose `Uint8Array`), write these sentences in the same change, so the "16 bytes" wording matches the final type.


**Result.** Done in PR 708.

## G525: The reading guide states that a generic custom reader in a stored map needs a type argument, but the guide's own example has `bigint` fields without the type argument.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/docs/reading-boxes.md:222`, `libs/iso-bmff/docs/reading-boxes.md:227`, `libs/iso-bmff/src/IsoBoxReaderReturn.ts:28`

**Evidence.** reading-boxes.md L222-L223: `// A readers map in a variable needs a type argument for a generic custom reader.` `const readers = { tfdt: readTfdtWide<bigint> };`. L227: "Without the type argument, the fields of that reader have the type `number | bigint`."

tsc 6.0.3 on examples/t/types2.ts with the guide's `readTfdtWide` and `const readersJ = { tfdt: readTfdtWide }` (no type argument): the probe line reports `Type 'bigint' is not assignable to type '{ __probe: true; }'`. The field is `bigint`, not `number | bigint`. The cause is the rule in IsoBoxReaderReturn.ts L28-L30 and L42-L46: a return type equal to the built-in box type is replaced by `IsoBoxMap<V>[N]`. The return type of `readTfdtWide` equals the built-in `tfdt` type.

The statement is true only for a reader with another shape. The same reader with one more field (`extra: true`) gives `Type 'IsoInt64' is not assignable...`, which is `number | bigint`.

**Proposal of the finder.** Change the example to a reader whose result differs from the built-in type, for example add a field (`return { type: "tfdt" as const, version, flags, baseMediaDecodeTime, wallClock }`), so the type argument is needed. Or reword L227: "Without the type argument, the fields of a reader whose result differs from the built-in box type have the type `number | bigint`."

**Proposal after verification.** Prefer the example change over the reword alone, and match test 21. A custom reader that returns exactly the built-in shape is not a real use case, so give `readTfdtWide` one more field (for example `extra: 'x'`, as `readTfdtAware` has in test/int64.types.test.ts L79-L88). The comment at L222 and the sentence at L227 are then true as written. Add one short sentence that states the exemption, taken from the RFC: "A custom reader whose result equals the built-in box type gets the fields of the configuration without a type argument." If the 2.0.0 guide rewrite for the cursor API happens first, apply the same correction there and do not patch the old text separately.


**Result.** Done in PR 708.

## G526: The `bigint` example of the reading guide names a value `seconds`, but the `bigint` division drops the fraction.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/docs/reading-boxes.md:136`

**Evidence.** reading-boxes.md L135-L137: `// earliestPresentationTime is a bigint.` `const seconds = box.earliestPresentationTime / BigInt(box.timescale);` `console.log(seconds);`. No sentence states that the result is whole seconds.

Run of the block and of examples/a/sidx.ts on the fixtures: `vttc.mp4 EPT 150150n timescale 1000 example prints 150n exact 150.15`, `spliced_10000.m4v EPT 1001n timescale 24000 example prints 0n exact 0.04170833333333333`, `spliced_10000.m4v EPT 2978976n timescale 24000 example prints 124n exact 124.124`. An adopter who copies the line loses up to one second of the presentation time.

**Proposal of the finder.** Show a conversion that keeps the fraction and states the limit: `const whole = time / scale; const rest = time % scale; const seconds = Number(whole) + Number(rest) / box.timescale`. Or keep the division, rename the variable to `wholeSeconds`, and add the comment `// The division of two bigints drops the fraction.`


**Result.** Done in PR 708.

## G527: The guide states that the `size` field of a parsed box is the size of the source box, but the field is 1 for a box with `largesize` and 0 for a box that extends to the end.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/docs/reading-boxes.md:93`, `libs/iso-bmff/src/IsoBoxReadView.ts:374`

**Evidence.** reading-boxes.md L93: "The `size` field of the parsed box is the size of the source box." L91 describes `largesize` and the `size` of 0 two paragraphs above.

IsoBoxReadView.ts L371-L385 stores the raw 32-bit field: `const size = readUint(dataView, offset, 4)`, `box = { size, type }`, and only the local `actualSize` gets the real length.

Script examples/a/claims2.ts: `d: largesize box => [{"size":1,"type":"free","largesize":20,"data":"U8(4)"},...]`, `d: size 0 last box => [...,{"size":0,"type":"mdat","data":"U8(3)"}]`, `d: size 0 child in container => [{"size":18,"type":"moov","boxes":[{"size":0,"type":"free","data":"U8(2)"}]},...]`. Code that sums `box.size` to find the byte position of a box gets a wrong position for both cases with no error.

**Proposal of the finder.** The cursor RFC removes `size`, so remove the sentence with the field. If 2.0 adds a byte position and a size to a parsed box (a known gap), define that size as the complete byte length of the box, also for `largesize` and for a `size` of 0, and state this rule in the guide.

**Proposal after verification.** Docs only, no break. If a 1.x release ships before 2.0, replace the sentence at reading-boxes.md:93 with: "The `size` field of the parsed box is the `size` field of the source box header, so it counts those bytes. The field is 1 when the box has a `largesize` field, and the parsed box then has `largesize`. The field is 0 when the box extends to the end of the data." In 2.0, delete the sentence in the implementation PR of the cursor RFC, together with the field. Drop the second part of the proposal: a byte position or a byte length on a parsed box is a new feature. If the maintainers want it, add it as an open question to rfc/iso-bmff-cursor-api.md, with the rule that the length is the complete byte length for `largesize` and for a `size` of 0.

**Prior decision.** PR 661 (7d67e217a, fixes issue 650) added the sentence on purpose for the QuickTime trailing bytes case. It records no decision about the wording for `largesize` or a `size` of 0. rfc/iso-bmff-cursor-api.md:199 already removes the `size` and `largesize` fields in 2.0.

**Result.** Done in PR 708.

## G528: Ten of the 28 TSDoc examples use a name that the example does not define, so the published example cannot run and the reader cannot see the input.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/test/readInt64AsBigInt.test.ts:18`, `libs/iso-bmff/test/createInt64OverflowReader.test.ts:34`, `libs/iso-bmff/test/readers/defaultReaderConfig.test.ts:19`, `libs/iso-bmff/test/isContainer.test.ts:39`, `libs/iso-bmff/test/readers/readEmsg.test.ts:133`, `libs/iso-bmff/test/writeUint.test.ts:30`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:60`, `libs/iso-bmff/test/traverseIsoBoxes.test.ts:23`, `libs/iso-bmff/test/createIsoBoxReadableStream.test.ts:42`

**Evidence.** Script examples/r/extract.ts copies each `#region example` that a TSDoc `{@includeCode}` references into one file. The script adds imports for every package export, `node:assert` and `readFile`. tsc and node then report:
`createInt64OverflowReader => ReferenceError: TFDT_V1 is not defined`
`readInt64AsBigInt => ReferenceError: TFDT_V1 is not defined`
`readers_defaultReaderConfig => ReferenceError: TFDT_V1 is not defined`
`isContainer => ReferenceError: buffer is not defined`
`readers_readEmsg => ReferenceError: box is not defined`
`writeUint => ReferenceError: ALL_BITS_SET is not defined`
`writeIsoBoxes => ReferenceError: deepEqual is not defined` (tsc also: `Cannot find name 'reduceUint8Arrays'`)
`traverseIsoBoxes => ReferenceError: equal is not defined`
`createIsoBoxReadableStream => ReferenceError: join is not defined` (also `tmpdir`, `Writable`, `createWriteStream`, `equal`)
The other 18 regions run with no error.

Six of the ten depend on a constant or a helper of the test file: `TFDT_V1` (declared at L13 or L14, outside the region), `buffer` (isContainer.test.ts L33), `box` (readEmsg.test.ts L130, so the published example of `readEmsg` never calls `readEmsg`), `ALL_BITS_SET` (writeUint.test.ts L15), and `reduceUint8Arrays` (a test helper). The published page shows the name with no value.

**Proposal of the finder.** Declare the input inside each region, for example `const bytes = new Uint8Array([...]) // one version 1 tfdt box` in place of `TFDT_V1`, and move the `findBox(...)` call of the readEmsg test into the region. Keep assertions that use a test-only constant outside the region. Use `assert.strictEqual` and `assert.deepStrictEqual` from the one `assert` import, so each example needs the package and `node:assert` only. Add a check to the example script: a region must compile with imports from the package and `node:` modules only.

**Proposal after verification.** Limit the fix to the regions where the reader cannot see the input, and do it in the same PRs that rewrite the tests for the cursor API.
1. readEmsg.test.ts: move the read call into the region, with bytes or a `readFile` of the fixture, so the example calls `readEmsg`.
2. readInt64AsBigInt, createInt64OverflowReader, defaultReaderConfig: declare the 20 bytes of the version 1 tfdt box inside the region (for example `const bytes = new Uint8Array([...])`), in place of `TFDT_V1`.
3. isContainer.test.ts: declare the input inside the region, or read a fixture with `readFile` as the traverseIsoBoxes example does.
4. writeUint and writeIsoBoxes: no separate work. The cursor RFC replaces both regions. Write the new regions with no test-only name.
Drop the `assert.strictEqual` style change. Imports are outside every region today, so the named `equal` and `deepEqual` calls are not a defect. Do not add the new check as part of the major version. File it as a separate repo-wide issue, because it changes the rule of AGENTS.md:82 for all packages.

**Prior decision.** AGENTS.md:82 and PR 573 (e7db0e39e, "docs: make every README and guide example block typecheck"): TSDoc `{@includeCode}` regions compile with the test file, so the README example rule (import every name, no pseudocode) does not apply to them. The exemption from the check is intentional. The undefined input names are not covered by any decision.

**Result.** Partly done in PR 708. The `writeUint` and `writeIsoBoxes` regions go to the cursor RFC. The regions belong to the pull requests that implement the cursor RFC.

## G529: Eight TSDoc examples copy the complete file with `new Uint8Array(isoFile)` before the read, although `readIsoBoxes` accepts the `Buffer`.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: confirmed.

**Files.** `libs/iso-bmff/test/findIsoBox.test.ts:19`, `libs/iso-bmff/test/filterIsoBoxes.test.ts:19`, `libs/iso-bmff/test/traverseIsoBoxes.test.ts:20`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:48`, `libs/iso-bmff/test/createIsoBoxReadableStream.test.ts:30`, `libs/iso-bmff/test/readers/readStco.test.ts:18`, `libs/iso-bmff/test/readers/readStsc.test.ts:18`, `libs/iso-bmff/test/readers/readStsz.test.ts:18`, `libs/iso-bmff/src/IsoBoxData.ts:6`

**Evidence.** Each example has `const isoFile = await readFile(...)` and then `readIsoBoxes(new Uint8Array(isoFile), ...)`. `new Uint8Array(typedArray)` allocates and copies every byte. IsoBoxData.ts L6 is `ArrayBufferLike | ArrayBufferView`, and the view constructor uses `raw.buffer, raw.byteOffset, raw.byteLength` (IsoBoxReadView.ts L89), so a `Buffer` is a valid input.

Script examples/b/inputs.ts passes a `Buffer` with no copy and compiles with tsc: `Buffer byteOffset 46224 pool size 65536`, `Buffer input: styp,moof,mdat tfdt 0`, `fs/promises readFile byteOffset 0 styp,moof,mdat`. The same script shows why the buffer of a view is not a valid replacement: `Buffer.buffer input (the documented ArrayBuffer type): 0` boxes. The guides declare `buffer: ArrayBuffer` and never show a `Uint8Array` or a Node `Buffer` as input.

**Proposal of the finder.** Pass `isoFile` to `readIsoBoxes` in the eight examples. Add one sentence to the reading guide: "`readIsoBoxes` accepts an `ArrayBuffer` and any view, such as a `Uint8Array`, a `DataView`, or a Node.js `Buffer`. The function does not copy the data."

**Proposal after verification.** The proposal is right. Two small additions. (1) Also change test/api.test.ts:22 for consistency, although it is not a TSDoc example. (2) Extend the guide sentence with the trap that the finder measured: "Pass the view itself. Do not pass the `buffer` property of a view, because that buffer can contain other data." Keep test/util/load.ts as is: that helper must return a standalone `ArrayBuffer`, so its copy is needed.


**Result.** Done in PR 708.

## F265: `writeBoxHeader` can write a 16-byte header with `largesize`, but every built-in writer computes its size with an 8-byte header, so a box above 4 GiB fails with an unclear `RangeError`.

Severity low. Category errors. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `libs/iso-bmff/src/IsoBoxWriteView.ts:323`, `libs/iso-bmff/src/writers/writeMdat.ts:16`, `libs/iso-bmff/src/utils/writeContainerBox.ts:24`, `rfc/iso-bmff-cursor-api.md:172`

**Evidence.** `const isLarge = size > 0xffffffff` / `this.writeUint(1, 4) // size = 1 indicates largesize follows` / `this.writeUint(size, 8)`. The writers use `const headerSize = 8` and `const totalSize = headerSize + dataSize`. For a large box the header takes 16 bytes of a buffer that has room for 8, so the last write of the body is outside the buffer. The RFC says `endIsoBox(cursor, start)` `Writes the size into the header at start` and does not state the result for a size above 2^32 - 1.

**Proposal of the finder.** 2.0.0 defines the case in the contract of `endIsoBox`: the function throws a `RangeError` with the box type and the size when the size is above 2^32 - 1. Support for `largesize` can come later with the stream writer that the RFC lists under Future possibilities.


**Result.** Not done. The header size of a box above 4 GiB goes to the cursor RFC, because a 1.x check is a range check. Decided on 2026-11-17 in PR 682 (b6b0c4296): `endIsoBox` throws a `RangeError`.

## F291: The default container writing throws an opaque TypeError for a container box with no `boxes` field, which differs from the rule that a writer does not throw for a missing field.

Severity low. Category errors. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/utils/writeContainerBox.ts:26`, `libs/iso-bmff/src/utils/writeBoxes.ts:20`, `libs/iso-bmff/src/utils/writeBox.ts:30`

**Evidence.** writeBox.ts:30 sends every box with a type in CONTAINERS to `writeContainerBox`. writeContainerBox.ts:26 `writeChildBoxes(box.boxes as IsoBox<IsoInt64>[], config)` reaches writeBoxes.ts:20 `Array.from(boxes, box => writeBox(box, config))`. For `{ type: 'moov' }` built in JavaScript, node reports `TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))`. The message names no box type and no field. Other writers write a default for a missing value, for example IsoBoxWriteView.ts:298 `write(data[i] ?? 0, size)`.

**Proposal of the finder.** Treat a missing `boxes` field as an empty list in the container writer (`box.boxes ?? []`), in version 1 and in the cursor implementation. Add a test that `writeIsoBox({ type: 'moov' })` writes an 8-byte box.

**Proposal after verification.** Do not fix `boxes` in the container writer alone. Decide one rule for every required list field in the cursor implementation and record it in rfc/iso-bmff-cursor-api.md. Option A (matches the settled rule literally): every writer treats a missing list as empty (`boxes`, `entries`, `samples`, `references`, `compatibleBrands`), with one test per field kind. Option B (matches the issue 668 precedent, no code): keep the lists required in the types, add no guard, and state in the writing guide that a box must satisfy its type. Option B is the lower-cost default. If option A is chosen, the change does not break adopters and can ship in any version.

**Prior decision.** No direct decision for a missing `boxes` field. Related: issue 668 closed as not planned (an error for input outside the contract already goes to the caller). PRs 626, 627 and 640 applied the "no throw for a missing field" rule to optional fields that the flags govern, not to required list fields.

**Result.** Skipped. Only JavaScript or a cast reaches the error, as in issue 668.

## G508: The input handling uses `instanceof` tests, so an `ArrayBuffer` from another realm throws an unclear `TypeError`, a wrong input type gives an engine error with no parameter name, and a `SharedArrayBuffer` from another realm passes the copy step of `writeIsoBox`.

Severity low. Category errors. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:85`, `libs/utils/src/isArrayBufferLike.ts:18`, `libs/iso-bmff/src/utils/writeBox.ts:59`

**Evidence.** IsoBoxReadView.ts:85-89: `isArrayBufferLike(raw) ? new DataView(raw) : raw instanceof DataView ? raw : new DataView(raw.buffer, raw.byteOffset, raw.byteLength)`. isArrayBufferLike.ts:18 is `value instanceof ArrayBuffer`. Run with `vm.runInNewContext('new ArrayBuffer(12)')` as input: `TypeError: First argument to DataView constructor must be an ArrayBuffer`. A `Uint8Array` and a `DataView` from the same foreign context both work, because the third branch needs only the three properties. Other wrong inputs: a `number[]` and a string give the same DataView message, and `undefined` gives `Cannot read properties of undefined (reading 'buffer')`. writeBox.ts:59 is `buffer instanceof SharedArrayBuffer`. A parsed box over a `SharedArrayBuffer` from another context comes back from `writeIsoBox` with `[object SharedArrayBuffer]` as its buffer, under the return type `Uint8Array<ArrayBuffer>`. All other tested forms work with correct offsets: a `Uint8Array` with byteOffset 5, a Node `Buffer` from the pool (byteOffset 52472), a `DataView` over a part, a `SharedArrayBuffer`, a resizable `ArrayBuffer`, an `Int16Array`, and three empty inputs.

**Proposal of the finder.** In `createIsoBoxReadCursor` of 2.0.0, branch on the view test, which works across realms: `ArrayBuffer.isView(data) ? new DataView(data.buffer, data.byteOffset, data.byteLength) : new DataView(data)`. This form needs no `isArrayBufferLike` import and no special case for `DataView`. Wrap or precede the construction with one `TypeError` that names the parameter, the accepted types (`ArrayBuffer`, `SharedArrayBuffer`, `ArrayBufferView`) and the received type. For the copy step of the writer, test `Object.prototype.toString.call(buffer) === '[object SharedArrayBuffer]'`, or state in the TSDoc that the copy applies to a `SharedArrayBuffer` of the current realm only.

**Proposal after verification.** Keep only the branch change. In `createIsoBoxReadCursor` of 2.0.0, build the view with `ArrayBuffer.isView(data) ? new DataView(data.buffer, data.byteOffset, data.byteLength) : new DataView(data)` and drop the `isArrayBufferLike` import. This form accepts buffers and views of any realm, and every wrong input gives one engine `TypeError` that names the expected type. Add one test with a `vm.runInNewContext` `ArrayBuffer`. Do not add the hand-written `TypeError` wrapper: the compiler already rejects the wrong types, no package in the repo has such a check, and the wrapper costs bundle bytes. Do not add the `Object.prototype.toString` test or a TSDoc note to `writeBox`: the cursor writer of the RFC copies all bytes into its own `ArrayBuffer`, so that code path is removed. The same `isArrayBufferLike` branch exists in libs/drm/src/cenc/parsePsshList.ts:37 and libs/id3/src/util/toArrayBuffer.ts:21 and utf8.ts:37. Those files are outside this package and are a possible follow-up.

**Prior decision.** No prior decision covers realms. Related decisions: (1) Issue 668, closed as not planned on 2026-11-16: bad input whose error already reaches the caller gets no extra guard. This decision speaks against the `TypeError` wrapper. (2) PR 583 (27316b9b4) added the `SharedArrayBuffer` copy step of `writeBox` on purpose for the `Uint8Array<ArrayBuffer>` return type (CHANGELOG.md:111). (3) rfc/iso-bmff-cursor-api.md lines 87 and 203: `writeIsoBoxes` copies every raw box into the cursor buffer, so the copy step of `writeBox` does not exist in 2.0.0.

**Result.** Done in PR 702.

## F180: Seven type names follow the clause title and not the syntax class of the spec, and the package does not state which rule it uses.

Severity low. Category naming. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/HandlerReferenceBox.ts:8`, `libs/iso-bmff/src/boxes/DecodingTimeToSampleBox.ts:5`, `libs/iso-bmff/src/boxes/CompositionTimeToSampleBox.ts:5`, `libs/iso-bmff/src/boxes/ProtectionSchemeInformationBox.ts:18`, `libs/iso-bmff/src/boxes/SubTrackBox.ts:12`, `libs/iso-bmff/src/boxes/TrackKindBox.ts:4`, `libs/iso-bmff/src/boxes/SubsampleInformationBox.ts:5`

**Evidence.** Spec classes in the 2015 text: `HandlerBox` (hdlr), `TimeToSampleBox` (stts), `CompositionOffsetBox` (ctts), `ProtectionSchemeInfoBox` (sinf), `SubTrack` (strk), `KindBox` (kind), `SubSampleInformationBox` (subs). Package: `HandlerReferenceBox`, `DecodingTimeToSampleBox`, `CompositionTimeToSampleBox`, `ProtectionSchemeInformationBox`, `SubTrackBox`, `TrackKindBox`, `SubsampleInformationBox`. Each package name matches the clause title, such as "8.4.3 Handler Reference Box".

**Proposal of the finder.** Keep the names and write the rule in the README: a type name is the clause title in PascalCase with the suffix `Box`. An adopter who searches for the spec class name then knows where to look. No rename is needed if the rule is stated.

**Proposal after verification.** Do not write "clause title" as the rule. State the rule that about 70 types already follow: a type name is the class name of the spec syntax, and the package adds the suffix `Box` when the class has none.

Preferred fix in 2.0.0: rename six types so that the rule has no exception list. `HandlerReferenceBox` to `HandlerBox`, `DecodingTimeToSampleBox` to `TimeToSampleBox`, `CompositionTimeToSampleBox` to `CompositionOffsetBox`, `ProtectionSchemeInformationBox` to `ProtectionSchemeInfoBox` (and `ProtectionSchemeInformationBoxChild` to `ProtectionSchemeInfoBoxChild`), `TrackKindBox` to `KindBox`, `SubsampleInformationBox` to `SubSampleInformationBox`. Keep `SubTrackBox`: the spec class is `SubTrack`, and the suffix rule covers it. Add a migration table to the changelog. Do not keep a deprecated alias for `SubsampleInformationBox`: the names differ only by case, and TypeDoc page names ignore case (the problem recorded for `readVttc` in PR 654). The break is compile time only, for adopters who import these type names.

Fallback without a break: keep the names and document the true rule in the README with the seven exceptions in a table (package name, spec class, box type). This fallback is weaker, because the adopter must read the table to find the type.


**Result.** Not done. Brief 4 covers the row in theme 5, names.

## F317: `package.json` has no `sideEffects` field

Severity low. Category package-config. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/package.json:1`

**Evidence.** The file has `"type": "module"` and one `exports` entry, and no `sideEffects` key. A search of every `libs/*/package.json` and of the build scripts found no `sideEffects` key. The source has module-scope statements that a bundler must prove pure by analysis: `export const CONTAINERS: string[] = [...]`, `export const IsoBoxFields = {...}`, three classes, and the `ReadableStreamBase` IIFE. This audit ran no bundler, so the effect on a real bundle is not measured.

**Proposal of the finder.** Add `"sideEffects": false` to the package (and consider the same for the other CML packages). Confirm with the bare-import probe on Rollup, tsdown, and webpack that an import of one reader leaves no other statement in the bundle.

**Proposal after verification.** Remove this item from the 2.0.0 list. It is a non-breaking, repo-wide packaging change. File it as a separate issue: add `"sideEffects": false` to every published `libs/*/package.json` in one PR, after a bare-import probe per package (Rollup, tsdown, webpack) confirms that the statement is true for each package. State the real gain: a bundler that reads the field drops the whole module when no export is used. Because each package ships one bundled dist/index.js, the field does not improve partial imports. PURE annotations and the bare-import probe stay the primary control. Do not add a default export or subpath exports.

**Prior decision.** No decision about the `sideEffects` field exists. Related decisions: PR 383 (5b1f124c0, issue 382) and PR 514 (2086dad8d) chose pure module-scope statements verified by a bare-import probe, and .claude/rules/code-quality.md:12 forbids module-scope side effects. The field is consistent with those decisions and does not replace them.

**Result.** Issue 711. Rolldown already drops a bare import, and webpack is not measured.

## F387: package.json has fields with no effect and a description that names only parsing.

Severity low. Category package-config. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/package.json:4`, `libs/iso-bmff/package.json:8`, `libs/iso-bmff/package.json:20`, `libs/iso-bmff/package.json:41`, `libs/iso-bmff/README.md:3`

**Evidence.** `"authors": "Casey Occhialini <...>"`: npm reads `author` and `contributors`, not `authors`. `publishConfig.scope: "svta"`: the scope comes from the package name. `"description": "ISO Base Media File Format (ISOBMFF) parsing functionality"` and README line 3 `ISO Base Media File Format (ISO BMFF) parsing.`: the package also writes boxes. The test script has `--passWithNoTests`, so a wrong `--dir` reports success with zero tests in a package with more than 100 test files. The exports map has no `"./package.json"` entry, so a tool that reads the manifest through the package name fails.

**Proposal of the finder.** Rename `authors` to `author`, remove `publishConfig.scope`, write the description as `Read and write ISO Base Media File Format (ISO BMFF) boxes` in package.json and the README, remove `--passWithNoTests` from this package, and add `"./package.json": "./package.json"` to the exports. The first two items apply to every package.

**Proposal after verification.** Split the finding into two parts.

Part A, for iso-bmff, do anytime and include in the 2.0.0 work: change the description in libs/iso-bmff/package.json line 4 and README.md line 3 to `Read and write ISO Base Media File Format (ISO BMFF) boxes`. Then run the root build, because scripts/agentDocs.ts copies the description into skills/common-media-library/SKILL.md (line 213) and llms.txt, and commit the regenerated files. Add a changelog entry.

Part B, repo-wide chore in one separate PR, not part of the iso-bmff major version: rename `authors` to a field npm reads in all 21 packages and the root package.json. The maintainer must choose the value: `author` with one person, or `author` with the SVTA project name plus `contributors`, since CONTRIBUTORS.md lists several people. Remove `publishConfig.scope` from all 21 packages in the same PR.

Drop the two other items, or treat them as optional repo-wide questions. Keep `--passWithNoTests` identical in every package as PR 582 chose. If the guard matters, remove the flag from every package that has tests in one change, not from iso-bmff alone. Add `"./package.json": "./package.json"` only if an adopter tool needs it, and then in every package.

**Prior decision.** PR 582 (051864d5d, "chore: run the tests with Vitest through vp test") chose the identical `--passWithNoTests` test script for every package and validated that a package with no tests exits 0. No prior decision covers `authors`, `publishConfig.scope`, the description text, or the missing `./package.json` export. They all date from PR 265 (8ac3ef9b9, CML Version 1).

**Result.** Partly done in PR 702 (part A). Part B is issue 712.

## F236: Each string read allocates two DataViews and a TextDecoder, and readUtf8 removes a byte order mark without notice.

Severity low. Category performance. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/utils/readUtf8String.ts:15`, `libs/iso-bmff/src/utils/readString.ts:6`, `libs/utils/src/decodeText.ts:30`, `libs/utils/src/decodeText.ts:61`

**Evidence.** readUtf8String calls `decodeText(new DataView(dataView.buffer, offset, length), { encoding: UTF_8 })`. decodeText then creates `new DataView(data.buffer, data.byteOffset, data.byteLength)` and `new TextDecoder(encoding).decode(view)`. readString adds one character for each byte with `readUint(dataView, cursor, 1)` and `str += String.fromCharCode(char)`, so each byte passes the size switch of readUint. Probe: `readUtf8(-1)` on the bytes EF BB BF 61 00 returns 'a' with length 1. A write of that string then has 3 bytes fewer than the source. Invalid UTF-8 becomes U+FFFD with no error.

**Proposal of the finder.** In the cursor API, decode from a `Uint8Array` view of the cursor bytes with one shared decoder, or pass a subarray to decodeText so that only one view is created. Read a four-character code with four `getUint8` calls and one `String.fromCharCode` call. State in the TSDoc of `readUtf8` that a leading byte order mark is removed and that invalid bytes become U+FFFD.

**Proposal after verification.** Keep the performance part, change the place of the fix, and drop one documentation sentence.

1. Fix `decodeText` in `@svta/cml-utils`, with no API change. Keep one `TextDecoder` for each encoding in a module-scope `let`, created on first use behind the existing `typeof TextDecoder` check (same rule as PRs 383 and 384: no module-scope read of a platform global). Pass an `ArrayBufferView` input directly to `decode`. Create the `DataView` only for the byte order mark detection with no `encoding` and for the fallback branch. This fix also helps drm and id3, which call `decodeText`.
2. In iso-bmff, create one view for each string. In the cursor API that is `new Uint8Array(view.buffer, view.byteOffset + pos, length)`, because the read cursor of the RFC has no `bytes` field. Keep the call to `decodeText` (reuse of the CML package, and the fallback stays). A direct `TextDecoder` call in iso-bmff would add a platform requirement, so do not make that change without a size measurement and a decision.
3. Read the box type in `readBox` and each four-character code with four `getUint8` calls and one `String.fromCharCode` call. Measured: 22.3 ns to 9.2 ns for each box.
4. TSDoc of `readUtf8`: state that a leading byte order mark is removed. Do not add the sentence on U+FFFD, because PR 643 records the decision to write nothing about input that is not valid UTF-8. Also make the fallback branch of `decodeText` remove the mark when the caller passes `UTF_8`, so both branches return the same string.
5. Leave `TextEncoder.encodeInto` to the write cursor work of the RFC. PR 643 measured that a shared encoder gives no gain, and `encodeInto` needs a capacity rule for the growing buffer and new measurements.

Expected gain for item 1 plus item 2 on my machine: about 255 ns to about 112 ns for each string.

**Prior decision.** PR 643 (merged, commit 6b2a23c36, "fix(iso-bmff): read and write the emsg strings as UTF-8"). The description records three points. (1) Measured: a shared `TextEncoder` does not recover the write time, and a shared `TextDecoder` saves about 40 ns for each string. (2) Maintainer decision: no changelog text and no tests for input that is not valid UTF-8. (3) The byte order mark removal is a "Known effect for a follow-up". Points 1 and 3 do not make the current state intentional. Point 2 argues against the U+FFFD sentence. PR 637 (aecfdfa19) follows the same rule.

**Result.** Partly done in PR 702 (documentation). The speed change goes to the cursor rewrite.

## F286: The traversal does avoidable work for each box: a linear scan of CONTAINERS, a new generator and config object for each container, and `Array.shift`.

Severity low. Category performance. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/traverseIsoBoxes.ts:32`, `libs/iso-bmff/src/traverseIsoBoxes.ts:33`, `libs/iso-bmff/src/traverseIsoBoxes.ts:46`, `libs/iso-bmff/src/traverseIsoBoxes.ts:50`, `libs/iso-bmff/src/utils/isContainer.ts:29`

**Evidence.** Line 46 `if (isContainer(box) && box.boxes)`: isContainer.ts:29 evaluates `'boxes' in box || CONTAINERS.includes(box.type)`, so every leaf box costs a scan of 19 strings, and the result is then replaced by the `box.boxes` test. Line 50 `yield* traverseIsoBoxes(next, { depthFirst, maxDepth: maxDepth - 1 })` allocates an object and a generator for each container, and each yielded box passes through one generator for each level. Line 32 `queue.shift()` is O(n). Lines 33-35 `if (!item) { continue }` cannot be true after `queue.length > 0`. The import of isContainer also puts the CONTAINERS array into every bundle that uses findIsoBox, filterIsoBoxes or traverseIsoBoxes.

**Proposal of the finder.** Read the children directly: `const next = (child as { boxes?: T[] }).boxes; if (next) ...`. Use one loop with an explicit stack of `[array, index, depth]` frames for depth-first order and an index-based queue for breadth-first order. Remove the import of isContainer and the dead check.

**Proposal after verification.** Keep every signature and the box order. In traverseIsoBoxes, replace `isContainer(box) && box.boxes` with a truthy test of `box.boxes` (not `Array.isArray`, which would skip a non-array iterable that the current code accepts), and remove the isContainer import and the dead `!item` check. Replace the recursive `yield*` with one generator: for depth-first order use a stack of iterators (not `[array, index]` frames, because the root is `Iterable<T>`), and close the open iterators in a `finally` block so an early `break` by the caller still closes a root generator as `for...of` does today. For breadth-first order use an index-based queue. Do not write findIsoBox and filterIsoBoxes as separate recursive loops by default: that puts the depth-first, breadth-first and maxDepth logic in three places for a saving of about 0.25 microseconds per call beyond the flat generator. If the maintainers want the non-generator speed, add one internal callback-based walker that both functions share, and measure the bundle bytes first. Drop the `Array.shift` and tree-shaking arguments from the rationale. This fix does not need the major version.

**Prior decision.** rfc/iso-bmff-cursor-api.md:191 states that `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`, and `isIsoBoxType` do not change. That statement covers the API, not the implementation, so it does not block an internal rewrite with the same signatures and order. No prior decision makes the current implementation intentional (git log for the file shows only type-inference and formatting changes).

**Result.** Done in PR 706.

## F310: The box type and every other four-character string are decoded one byte at a time with a `switch` call and a string concatenation for each byte

Severity low. Category performance. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/utils/readString.ts:6`, `libs/iso-bmff/src/IsoBoxReadView.ts:372`, `libs/iso-bmff/src/IsoBoxWriteView.ts:227`, `libs/iso-bmff/src/readers/readFtyp.ts:20`

**Evidence.** readString: `for (let c = 0; c < length; c++) { const char = readUint(dataView, cursor, 1); str += String.fromCharCode(char) }`. `readBox` calls it for every box: `const type = readString(dataView, offset + 4, 4)`. Each call of `readUint` computes `offset - dataView.byteOffset` and enters a `switch`. writeString does the reverse with `this.writeUint(value.charCodeAt(c), 1)` for each character. `readFtyp` reads each brand through `readArray(STRING, size, length)`. The RFC removes the classes, and `readIsoBoxes` still needs the type string of every box.

**Proposal of the finder.** Rule for 2.0.0: one internal function reads a four-character code with four `getUint8` calls and one `String.fromCharCode(a, b, c, d)` call. `readIsoBoxes`, `readFtyp`, `readStyp`, `readHdlr`, `readFrma`, and `readSchm` use it. The write side uses four `setUint8` calls or one `setUint32` call.

**Proposal after verification.** Keep the item, with three changes. (1) Scope: fold it into the cursor implementation of RFC iso-bmff-cursor-api, not a separate rule. The header read of `readIsoBoxes` and `readChildBoxes` uses four `getUint8` calls and one `String.fromCharCode(a, b, c, d)` call. `readFtyp` (and `readStyp` through it) and `readHdlr` use the same internal function. Measured gain: about 14 ns for each box (29 ns to 15 ns). (2) Remove `readFrma` and `readSchm` from the list. Both return a number today (`dataFormat: view.readUint(4)`, `schemeType: view.readUint(4)`). A change to a string is a breaking type change and needs its own finding and decision. (3) `seekIsoBox` should not create a type string at all. Convert each path element one time with the existing public `fourCcToUint32` (libs/iso-bmff/src/utils/fourCcToUint32.ts:14) and compare it with `getUint32` of the header. On the write side, `beginIsoBox` writes the type with one `setUint32(pos, fourCcToUint32(type))` call, which reuses the same export and adds no new helper. The generic `readString` and `writeString` field functions stay for other lengths. Measure the bundle bytes of the six-box trial build before and after, because the new internal function adds bytes to every bundle that reads a tree.


**Result.** Done in PR 706.

## F313: Values that do not change inside a loop are computed for every entry in readSubs, readTfra, writeTfra, and readMdhd, and three readers compare the version with `==`

Severity low. Category performance. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readSubs.ts:21`, `libs/iso-bmff/src/readers/readTfra.ts:35`, `libs/iso-bmff/src/writers/writeTfra.ts:53`, `libs/iso-bmff/src/readers/readMdhd.ts:20`, `libs/iso-bmff/src/readers/readTfdt.ts:26`, `libs/iso-bmff/src/readers/readMvhd.ts:22`

**Evidence.** readSubs, inside the inner closure: `subsampleSize: view.readUint(version === 1 ? 4 : 2)`. readTfra, for each entry: `trafNumber: view.readUint(lengthSizeOfTrafNum + 1)` and two more sums. writeTfra, for each entry: `writer.writeUint(entry.trafNumber, box.lengthSizeOfTrafNum + 1)`, with three property loads of `box`. readMdhd writes `version == 1 ? 8 : 4` three times. readMdhd, readTfdt, and readMvhd use `==`, and the other readers use `===`. The tfra fields have a size of 1 to 4 bytes that the box selects, so the fixed-size field functions of the RFC need a dispatch for this box.

**Proposal of the finder.** Rule for 2.0.0: compute every size and every test that depends only on the version, the flags, or a box header field once, before the loop. Use `===` in all readers. For tfra, select the three field functions before the loop.

**Proposal after verification.** Split the finding into three parts and drop the written rule.

1. Loose equality: replace the five `==` lines (readMdhd.ts:20,21,23, readTfdt.ts:26, readMvhd.ts:22) with `===`, and enforce the result with the linter, not with a prose rule. Add `eqeqeq: ['error', 'always', { null: 'ignore' }]` to the `lint.rules` block of vite.config.ts. The `null: 'ignore'` option is required: about 90 lines in libs/*/src use `== null` or `!= null` on purpose. Other packages have about 40 more loose comparisons (c2pa 17, cmcd 9, 608 4), so the lint rule is a repo-wide change and belongs in its own PR. This part does not break adopters and can ship in any release.

2. Loop-invariant values: do not open a separate change. Apply the pattern during the cursor rewrite of the RFC, which rewrites readSubs, readTfra, writeTfra, and readMdhd anyway. In readMdhd use one `const size = version === 1 ? 8 : 4`, as readMvhd.ts:22 and readTkhd already do. Do not claim a performance gain in the changelog: none is measurable.

3. RFC gap (the part with real value): add one sentence or one open question to rfc/iso-bmff-cursor-api.md near line 176. The sentence states how a reader and a writer handle a field whose size is known only at run time. `tfra` (1 to 4 bytes, 14496-12:2015 clause 8.8.10.2) and `subs` (2 or 4 bytes) are the only boxes with such a field. Two options: readTfra and writeTfra select the field function for each of the three fields before the loop (for example from a local array `[readUint8, readUint16, readUint24, readUint32]`), or the package keeps one field function with a size parameter. The first option needs no new public export and keeps the other readers free of the generic function.


**Result.** Not done. The cursor rewrite replaces the code. No speed gain.

## F294: Two traversal tests cannot fail for a wrong order, and the breadth-first test of traverseIsoBoxes states that its two orders are the same.

Severity low. Category tests. Breaking: no. Fact check: partly. Value check: confirmed.

**Files.** `libs/iso-bmff/test/findIsoBox.test.ts:100`, `libs/iso-bmff/test/traverseIsoBoxes.test.ts:68`

**Evidence.** findIsoBox.test.ts:100-114 'should respect depthFirst config' expects `child1` for both orders, and its comment says "Breadth-first should also find child1 first in this case". An implementation that ignores `depthFirst` passes. traverseIsoBoxes.test.ts:68-82 'should traverse nested boxes breadth-first when specified' has the comment "In this simple case, the order is the same, but let's verify" and asserts the depth-first order. Only the 'deeply nested' test at lines 97-112 separates the two orders.

**Proposal of the finder.** In the findIsoBox test, put the first match of breadth-first order in the second root container and a deeper match in the first one, then expect different boxes for the two orders. Replace the tree in the traverse test with one where the orders differ, or delete the test and keep the 'deeply nested' one.

**Proposal after verification.** The core problem holds for both tests. Correct the last sentence of the evidence: the test at traverseIsoBoxes.test.ts:97-112 is the only test that asserts a breadth-first order different from the depth-first order. The test at lines 136-149 also separates the two orders, from the depth-first side. So the suite as a whole does detect an implementation that ignores `depthFirst` in `traverseIsoBoxes`. The gap that remains is in findIsoBox.test.ts, where no test separates the orders, plus one redundant test at traverseIsoBoxes.test.ts:68-82 with a misleading comment.


**Result.** Done in PR 704.

## F388: Test files are in inconsistent locations and some names do not match a source file.

Severity low. Category tests. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/test/readers/readMoov.test.ts:5`, `libs/iso-bmff/test/containerReaders.test.ts:86`, `libs/iso-bmff/test/readers/defaultReaderConfig.test.ts:16`, `libs/iso-bmff/test/readers/readVttc.test.ts:1`, `libs/iso-bmff/test/isContainer.test.ts:1`, `libs/iso-bmff/test/readBoxes.test.ts:8`

**Evidence.** readMoov has its own file in test/readers with a positional lookup (`.at(-3)`), and the other 18 container readers are in test/containerReaders.test.ts, which also covers readMoov. test/readers has defaultReaderConfig.test.ts, and test/writers has no defaultWriterConfig.test.ts. readVttc.test.ts tests the export of src/readers/readVttCue.ts. Tests for src/utils (isContainer, fourCcToUint32) are in the test root, and the folder test/util holds helpers, not tests for src/utils. Twelve root files test methods of the two view classes under method names (readData, readInt, readString, readTemplate, readUint64, readUtf8, readWideUint, readBoxes, writeTerminatedString, writeUint, writeUint64, writeWideUint), and no source file has those names.

**Proposal of the finder.** Use one rule in the rewrite: a test file has the path and the name of its source file. Delete test/readers/readMoov.test.ts. Move the tests for src/utils to test/utils and rename the helper folder to test/helpers. The twelve method test files become tests of the field functions with the same names as the new source files.

**Proposal after verification.** Split the finding into three parts.
1. Do anytime, no adopter effect: delete test/readers/readMoov.test.ts. test/containerReaders.test.ts and test/fixtureRoundTrip.test.ts already cover readMoov, and the file asserts `box.size`, which the cursor RFC removes.
2. Do inside the implementation PR of the cursor RFC, not as a separate item: name each new field-function test after its source file, and update the nine `{@includeCode}` paths in the same commit. The view-method test files disappear with the view classes.
3. Optional: use the rule "a test file has the name of the export under test", which is the convention of cmcd, id3, and utils. That rule keeps readVttc.test.ts. If the major version renames readVttc, name the test after the new export. Move isContainer.test.ts and fourCcToUint32.test.ts only together with the two `{@includeCode ../../test/...}` paths in src/utils. Rename test/util to test/helpers only if those two tests move to test/utils. Add test/writers/defaultWriterConfig.test.ts only if the TSDoc of defaultWriterConfig needs an example region.

**Prior decision.** No decision on the test layout. One related decision: rfc/iso-bmff-container-readers-writers.md:158 (RFC of PR 622, implemented in PR 654, 75f5d7b64) placed readVttc in readVttCue.ts on purpose because of file systems that ignore case. The mismatch between readVttc.test.ts and readVttCue.ts follows from that decision.

**Result.** Partly done in PR 704 (part 1). The file moves wait for the cursor work.

## F389: Test helpers have names close to the public functions, one helper has dead code, and one helper name has two meanings.

Severity low. Category tests. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/test/util/box.ts:8`, `libs/iso-bmff/test/util/findBox.ts:17`, `libs/iso-bmff/test/util/filterBoxes.ts:10`, `libs/iso-bmff/test/util/getReaderName.ts:4`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:29`, `libs/iso-bmff/test/util/wideBoxes.ts:11`

**Evidence.** box.ts has `export * from '@svta/cml-iso-bmff'` and `export { assert, describe, filterBoxes, findBox, it, parseBox, parseFile }`, so one module exports `findBox(file, type, config)` next to `findIsoBox(boxes, predicate)`. In findBox.ts, `let found` never gets a value, so the final `assert.ok(found, ...)` can only fail. getReaderName derives the box type from `reader.name.toLowerCase().replace('read', '')`, which returns `vttc` for readVttC and readVttc and works for readUrl only through the trimmed key lookup. writeIsoBoxes.test.ts declares a local `boxBytes(boxes, types)`, and wideBoxes.ts exports `boxBytes(type, ...fields)`, which psshBoxes.ts, tencBoxes.ts, and versionBoxes.ts import from a file named for wide boxes.

**Proposal of the finder.** Rename the helpers to `findFixtureBox` and `filterFixtureBoxes`. Replace the dead variable in findBox with `assert.fail`. Change `parseBox(file, reader, index)` to take the box type as an argument and delete getReaderName. Move `boxBytes` to its own helper file and rename the local function in writeIsoBoxes.test.ts.

**Proposal after verification.** Keep three parts and drop one.

1. findBox.ts: remove `let found` and `return found`. End the function with `assert.fail(...)` and the same message.
2. Delete parseBox.ts and getReaderName.ts. Change the four callers (readMdat, readFree, readSsix, readFtyp tests) to `findBox(file, type, { readers: { [type]: reader } })`, the form that the other reader tests already use. This is simpler than a new parseBox signature, and it removes the index argument.
3. Move `boxBytes` and `BoxField` from wideBoxes.ts to a new test/util/boxBytes.ts and update the 18 imports. Rename the local function in writeIsoBoxes.test.ts, for example to `sourceBytes`. Do this step with the cursor work, because that work rewrites the local function when the `view` field goes away.

Drop the rename to findFixtureBox and filterFixtureBoxes, or treat it as optional. It is a matter of taste with 45 call sites of churn. None of this needs the major version.


**Result.** Partly done in PR 704 (parts 1 and 2). The `boxBytes` names wait for the cursor work.

## F390: Nine test files use the loose assertions `equal` and `deepEqual`, two of them inside a documentation example.

Severity low. Category tests. Breaking: no. Fact check: partly. Value check: confirmed.

**Files.** `libs/iso-bmff/test/writeIsoBoxes.test.ts:1`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:60`, `libs/iso-bmff/test/readIsoBoxes.test.ts:38`, `libs/iso-bmff/test/traverseIsoBoxes.test.ts:2`, `libs/iso-bmff/test/createIsoBoxReadableStream.test.ts:1`, `libs/iso-bmff/test/writers/writeEmsg.test.ts:1`, `libs/iso-bmff/test/readers/readEmsg.test.ts:1`, `libs/iso-bmff/test/int64.environment.test.ts:1`, `libs/iso-bmff/test/IsoBoxReadableStream.environment.test.ts:1`, `libs/iso-bmff/test/writeUint64.environment.test.ts:1`

**Evidence.** `import { deepEqual, doesNotThrow, equal, ok, throws } from 'node:assert'`. I counted 30 calls in 9 files. `deepEqual(isoFile, reduceUint8Arrays(bytes))` is inside the `#region example` of writeIsoBoxes and compares a Buffer with a Uint8Array in loose mode. `assert.deepEqual(box.compatibleBrands, ['isom'])` is inside the example of readIsoBoxes. The other test files use `assert.strictEqual` and `assert.deepStrictEqual`.

**Proposal of the finder.** Replace the 30 calls with `strictEqual` and `deepStrictEqual`. In the writeIsoBoxes example, compare `new Uint8Array(isoFile)` with the result.

**Proposal after verification.** Nine test files contain 30 loose `equal` or `deepEqual` calls. Four of the calls (not two) are inside `#region example` blocks that TSDoc publishes: writeIsoBoxes.test.ts:60, readIsoBoxes.test.ts:38, traverseIsoBoxes.test.ts:23, createIsoBoxReadableStream.test.ts:45. The loose calls in the emsg tests are at writers/writeEmsg.test.ts:173, 260, 285, 315 and readers/readEmsg.test.ts:123, not line 1. Proposal stays: replace all 30 with `strictEqual` and `deepStrictEqual`, and compare `new Uint8Array(isoFile)` in the writeIsoBoxes example because deepStrictEqual of a Buffer and a Uint8Array fails. Check writeIsoBoxes.test.ts:277 (`deepEqual(bytes, source)`) and the emsg `messageData` lines for the same Buffer or prototype mismatch when converting. Optional: change `from 'assert'` to `from 'node:assert'` at traverseIsoBoxes.test.ts:2. Tests only, no adopter impact, not tied to the major version.


**Result.** Done in PR 704.

## F16: One reader and three writers in scope import a view class as a value where every other file uses `import type`.

Severity low. Category tree-shaking. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readAvc1.ts:2`, `libs/iso-bmff/src/writers/writeAvc1.ts:2`, `libs/iso-bmff/src/writers/writeEnca.ts:2`, `libs/iso-bmff/src/writers/writeMp4a.ts:2`

**Evidence.** readAvc1.ts:2 `import { IsoBoxReadView } from '../IsoBoxReadView.ts'`, and the file uses the name only as a parameter type. The other 85 readers use `import type { IsoBoxReadView }`. writeAvc1.ts:2, writeEnca.ts:2, and writeMp4a.ts:2 `import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'` with no `new IsoBoxWriteView` in the file, while writeAvc2.ts:2 uses `import type`. The root tsconfig.json sets `verbatimModuleSyntax: true` (line 44), so the compiler keeps these imports as value imports.

**Proposal of the finder.** Use `import type` in the four files. The cursor RFC replaces the classes, so apply the rule to the cursor types in the new files and consider the lint rule `consistent-type-imports`.

**Proposal after verification.** Reclassify the finding as internal consistency with no effect on bundle size. Do not edit the four files as part of the major version: the cursor RFC deletes both view classes and rewrites every reader and writer, so the imports disappear. The lasting fix is a separate chore PR that enables `typescript/consistent-type-imports` in vite.config.ts for the whole repo and applies the autofix. Run the rule first to count the findings in the other packages. That PR needs no changelog entry for adopters, because the output of the build does not change.


**Result.** Skipped. The bundle size does not change, and the cursor rewrite removes the imports.

## F29: writeSkip and writeStyp copy the bodies of writeFree and writeFtyp, while the readers delegate with an object spread

Severity low. Category tree-shaking. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/writers/writeSkip.ts:15`, `libs/iso-bmff/src/writers/writeFree.ts:15`, `libs/iso-bmff/src/writers/writeStyp.ts:15`, `libs/iso-bmff/src/writers/writeFtyp.ts:15`, `libs/iso-bmff/src/readers/readSkip.ts:16`, `libs/iso-bmff/src/readers/readStyp.ts:16`

**Evidence.** writeStyp repeats all lines of writeFtyp and changes only `new IsoBoxWriteView('styp', totalSize)`. writeSkip does the same with writeFree. An adopter that writes ftyp and styp (every fragmented stream) gets both copies in the bundle. The readers use another pattern: `return { ...readFtyp(view), type: 'styp' }` and `return { ...readFree(view), type: 'skip' }`, which creates two objects for each box. The visual sample entry uses a third pattern, a shared function with a type argument.

**Proposal of the finder.** Use the pattern of the visual sample entry for both pairs: one internal function that takes the box type, for the reader and for the writer. With the cursor API the writer takes the type from `box.type`, so `writeStyp` and `writeSkip` can be the same function as `writeFtyp` and `writeFree` under a second export name.

**Proposal after verification.** Keep four named function declarations for each direction. Do not export one function under two names. Follow the pattern of the container functions and the sample entries: an internal `readTypeBox<T extends 'ftyp' | 'styp'>(cursor, type): TypeBox<T>` and an internal `writeTypeBox(cursor, box: TypeBox<'ftyp' | 'styp'>)` that passes `box.type` to `beginIsoBox`. `readFtyp`, `readStyp`, `writeFtyp`, and `writeStyp` are one-line wrappers with their own parameter types, so `writeStyp` with a `FileTypeBox` still fails at compile time. Do the same for the readers of `free` and `skip` to remove the spread: `readFreeSpaceBox(cursor, type)`. For the writers of `free` and `skip`, a shared function is optional: the cursor body is three statements, so measure the bundle before the change. Do the work inside the cursor rewrite, which touches all eight files, not as a separate change.

**Prior decision.** No decision on styp or skip. For the alias part of the proposal: rfc/iso-bmff-container-readers-writers.md (accepted, PR 622, implemented in PR 654) rejects "One shared function under 19 names" (line 213) and requires "One box type per function" as a function declaration (lines 151-152).

**Result.** Not done. The cursor rewrite replaces the code.

## F287: isFullBox takes `any`, throws for null and primitives, has no test and is not used by the package.

Severity low. Category type-design. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/utils/isFullBox.ts:12`, `libs/iso-bmff/src/isIsoBoxType.ts:38`, `libs/iso-bmff/docs/utilities.md:56`

**Evidence.** isFullBox.ts:12-13 `export function isFullBox(box: any): box is FullBox { return 'version' in box && 'flags' in box }`. `isFullBox(null)` throws `TypeError: Cannot use 'in' operator to search for 'version' in null` (checked with node), while the sibling guard returns false: isIsoBoxType.ts:38 `typeof box === 'object' && box !== null && ...`, and CHANGELOG.md:110 records that isIsoBoxType moved from `any` to `unknown`. `grep isFullBox` finds no file in test/ and no caller in src/. AGENTS.md: "Create tests for new public API members".

**Proposal of the finder.** Change to `isIsoFullBox(box: unknown): box is FullBox` with `typeof box === 'object' && box !== null && 'version' in box && 'flags' in box`. Add a test file with a full box, a plain box, null and a primitive. If no adopter use case exists, remove the export in 2.0.0.

**Proposal after verification.** Split the finding in two. Part A, do anytime, not breaking: `export function isFullBox(box: unknown): box is FullBox { return typeof box === 'object' && box !== null && 'version' in box && 'flags' in box }`, plus test/isFullBox.test.ts (a full box, a plain box, null, a primitive) and a changelog entry in the same form as the isIsoBoxType entry. This also closes one of the public `any` sites of issue 584. Part B, a 2.0.0 decision only: either remove the export (no caller in the package and no known adopter use), or keep it. If the guards get the `Iso` token, rename `isFullBox` and `isContainer` together (`isIsoFullBox`, `isIsoContainer`) in one change. Do not rename `isFullBox` alone. The generic form `isFullBox<T>(box: T): box is T & FullBox` from the duplicate F195 depends on the separate `FullBox extends Box` type change and should be judged with that finding.

**Prior decision.** No decision for the current state. PR 585 (facd7ba42) deferred public `any` parameters to issue 584 (open), whose plan is to replace each public `any` with `unknown`. The same PR already made that change for isIsoBoxType (CHANGELOG.md:110).

**Result.** Partly done in PR 702 (part A). Part B, remove or rename the export, goes to the second RFC.

## G519: The 64-bit fields of `co64`, `saio`, and `iloc` have the type `number` with no `IsoInt64` parameter, so a custom reader cannot return them as `bigint` under the documented rule.

Severity low. Category type-design. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/boxes/ChunkLargeOffsetBox.ts:11`, `libs/iso-bmff/src/boxes/SampleAuxiliaryInformationOffsetsBox.ts:13`, `libs/iso-bmff/src/boxes/ItemLocation.ts:12`, `libs/iso-bmff/src/boxes/ItemExtent.ts:8`, `libs/iso-bmff/src/IsoBoxMap.ts:106`, `libs/iso-bmff/src/IsoBoxMap.ts:126`, `libs/iso-bmff/src/IsoBoxMap.ts:155`

**Evidence.** Spec: co64 `unsigned int(64) chunk_offset;`, saio version 1 `unsigned int(64) offset[ entry_count ];`, iloc `unsigned int(base_offset_size*8) base_offset;` with a size of 0, 4 or 8 bytes, and the same for `extent_offset` and `extent_length`. Package: ChunkLargeOffsetBox.ts:11 `chunkOffset: number[]`, SampleAuxiliaryInformationOffsetsBox.ts:13 `offset: number[]`, ItemLocation.ts:12 `baseOffset: number`, ItemExtent.ts:8 to 9 `extentOffset: number` and `extentLength: number`. IsoBoxMap.ts:106 `co64: ChunkLargeOffsetBox`, line 126 `iloc: ItemLocationBox`, line 155 `saio: SampleAuxiliaryInformationOffsetsBox` pass no `V`, while every 64-bit field of a box with a built-in reader has the type `V` (tfdt, sidx, tfra, mehd, mvhd, mdhd, tkhd, elst, tfhd, prft `mediaTime`, emsg). These three types have no built-in reader, and that fact is already reported. This finding matters only if the types stay.

**Proposal of the finder.** If the three types stay in the package, add `<V extends IsoInt64 = number>` and type the fields as `V[]` or `V`, and pass `V` in `IsoBoxMap`. If the types without a reader are removed, this finding needs no work.

**Proposal after verification.** Do not add the type parameter alone. Bind it to the reader decision for each box:
1. If a box gets a built-in reader and writer (co64 is issue 652), add `<V extends IsoInt64 = number>` in that same change, read each 64-bit field with `readWideUint`, write with `writeWideUint`, and pass `V` in `IsoBoxMap` and in the parent child unions (`TrackFragmentBoxChild` for saio, `MetaBoxChild` for iloc, `SampleTableBoxChild` plus `SampleTableBox` and `MediaInformationBox` for co64). This step is not breaking and can ship in any version.
2. For saio, the field is `V[]` for both versions, per the rule that a field has one type for every version of its box.
3. For iloc, include `extentIndex` with `baseOffset`, `extentOffset` and `extentLength`, and decide the size 0 case first: `readWideUint` accepts only 4 or 8, and the spec gives the value 0 for a size of 0. Either the fields stay `number` and the reader uses the overflow check only, or the int64 function gains a way to return a zero of type `V`. That second option changes `IsoInt64Reader`, whose rules are settled, so the default answer for iloc is `number` fields unless a reader RFC decides otherwise.
4. If a type stays without a reader, leave the fields as `number`. If the types without a reader are removed in 2.0.0, this finding needs no work.
Fold the co64 part into issue 652 and do not file a separate issue for it.

**Prior decision.** rfc/uint64-reader-config.md (accepted, PR 613, implemented in PR 645): line 17 scopes the option to the 64-bit fields of the built-in readers, line 221 lists the eleven affected box types, line 425 rejects type parameters that add no type information. Issue 652 (open) has a maintainer comment that already assigns the `V[]` change for `co64` to the change that adds the `co64` reader and writer.

**Result.** Not done. The `co64` part belongs to issue 652. `saio` and `iloc` keep `number`.

## F31: Reader summaries use the wrong article before a vowel, and the readSkip and readEncv summaries do not name their box type

Severity low. Category typo. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/readers/readElng.ts:6`, `libs/iso-bmff/src/readers/readElst.ts:7`, `libs/iso-bmff/src/readers/readEmsg.ts:9`, `libs/iso-bmff/src/readers/readSkip.ts:7`, `libs/iso-bmff/src/readers/readEncv.ts:7`, `libs/iso-bmff/src/writers/writeSkip.ts:5`

**Evidence.** `Parse a `ExtendedLanguageBox``, `Parse a `EditListBox``, `Parse a `EventMessageBox``. readFrma has the correct form: `Parse an `OriginalFormatBox``. The same error is in readImda, readArdi, readAudioSampleEntryBox (outside this scope). readSkip says `Parse a `FreeSpaceBox`` and readEncv says `Parse a `VisualSampleEntryBox``, with the same text as readFree and the other sample entry readers. The writers do name the variant: `Write a `FreeSpaceBox` (skip variant)`, `Write a `VisualSampleEntryBox` (encv)`. The summaries say `Parse`, while the function prefix and the settled term is `read`.

**Proposal of the finder.** The cursor API rewrites every summary line. Use one template then: `Reads an `elng` box (ExtendedLanguageBox).` and `Writes an `elng` box.` Name the four-character type in every summary, and use `read`, not `parse`.

**Proposal after verification.** Use a template with the definite article, so no article depends on the pronunciation of a code: "Reads the `elng` box (`ExtendedLanguageBox`)." and "Writes the `elng` box (`ExtendedLanguageBox`)." Apply it to every reader and writer when the cursor API rewrites the summary lines, in one mood (third person matches readIsoBoxes and readInt64AsBigInt). Name the four-character code in all 13 readers that share a class name (avc1 to avc4, hev1, hvc1, encv, enca, mp4a, free, skip, and the two shared sample entry readers), not only readSkip and readEncv. Keep "parsed box" as the noun for the result while the type `ParsedIsoBox` keeps its name. If the cursor rewrite is far away, the six "a" to "an" fixes can go in the TSDoc pass of issue 435 now, with a docs note in the changelog.


**Result.** Done in PR 708.
