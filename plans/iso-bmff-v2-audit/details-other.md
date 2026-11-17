# Other packages and repository files: details

The audit agents wrote this text. The index is in `findings.md`.

## G466: parsePsshList in drm never returns for a box with size 0 and throws a native RangeError for trailing bytes, because it has its own box walk.

Severity high. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The defect is in @svta/cml-drm. A fix changes a thrown RangeError into a returned result for malformed init data.

**Files.** `libs/drm/src/cenc/parsePsshList.ts:51`, `libs/drm/src/cenc/parsePsshList.ts:56`, `libs/drm/src/cenc/parsePsshList.ts:118`, `libs/drm/src/cenc/getPsshForKeySystem.ts:24`

**Evidence.** `const size = dv.getUint32(byteCursor)`, `const nextBox = byteCursor + size` (lines 51-52), then `if (dv.getUint32(byteCursor) !== 0x70737368) { byteCursor = nextBox; continue }` (lines 56-59) and `byteCursor = nextBox` (line 118). With `size` 0, `nextBox` equals the start of the same box, so the loop never ends. I ran the source with the 12 bytes `00 00 00 00 66 72 65 65 01 02 03 04`: the process did not return and a 5 second alarm stopped it. An 8-byte `free` box with 2 trailing bytes, and a `pssh` box with a size of 12, both throw `RangeError: Offset is outside the bounds of the DataView`. Size 1 (`largesize`) is read as a size of 1 byte. `getPsshForKeySystem` calls the function (getPsshForKeySystem.ts:24). The input is init data from the media, so the content controls it. ISO/IEC 14496-12 clause 4.2 allows size 0 for the last box.

**Proposal of the finder.** Short term, in drm: stop the loop when `size < 8` or `nextBox > dv.byteLength`, and treat size 0 as the end of the data. With 2.0: build `parsePsshList` on the flat function of iso-bmff, so the two packages share one stop rule. Record the defect as a drm issue. It is not part of the iso-bmff package.

**Proposal after verification.** Fix it in @svta/cml-drm now as a patch release, independent of iso-bmff 2.0. File one drm issue (none exists). Keep the local walk and do not add an iso-bmff import to parsePsshList. Rules, matching IsoBoxReadView.readBox (iso-bmff src line 383-390): (1) stop when fewer than 8 bytes remain; (2) size 0 means the box ends at `dv.byteLength`; (3) size 1 reads the 64-bit `largesize` (header 16 bytes), or stops if the maintainers do not want largesize support in init data; (4) stop when the box size is below its header size or `nextBox > dv.byteLength`; (5) skip a `pssh` box with a size below 32 (FullBox header 12 + SystemID 16 + DataSize 4, ISO/IEC 23001-7), so the system ID never comes from bytes outside the box. Rule 5 is missing from the finding's proposal and is needed for the size-12 `pssh` cases (one throws a RangeError, one returns a system ID made from the next box). Add tests for each input. Drop the "build on the flat function of iso-bmff" part: the cursor RFC defines no such function, and the bundle cost for adopters of `getPsshForKeySystem` is not measured. Revisit only if 2.0 adds a header-only box walk and a size measurement shows no growth. Not a semver break: a hang becomes a return, and an undocumented native RangeError on malformed input becomes a result, the same class of change that PR 662 shipped as a fix.

**Prior decision.** None for drm: the loop is unchanged since 8ac3ef9b9 (CML Version 1, #265), a port of dash.js. Related precedent that supports the fix, not the current state: issue 663 / PR 662 (6c788e430) made `readIsoBoxes` stop before a box with a size below its header size and shipped it as a `### Fixed` entry with no major version. Issue 668 (closed as not planned) does not apply: a built-in function reaches this state with content-controlled input, and a hang returns no error to the caller.

## G464: The package has no flat walk of sibling boxes, so the repo has three more box walkers with four different stop rules, and the skill tells adopters not to write one.

Severity medium. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/c2pa/src/bmff/readRootBoxes.ts:42`, `libs/c2pa/src/bmff/findExcludedRanges.ts:162`, `libs/drm/src/cenc/parsePsshList.ts:51`, `libs/608/test/utils/helpers.ts:39`, `libs/iso-bmff/src/IsoBoxReadView.ts:388`, `skills/common-media-library/SKILL.md:224`, `libs/iso-bmff/README.md:18`, `libs/c2pa/src/init/validateC2paInitSegment.ts:243`, `libs/c2pa/src/merkle/validateC2paMerkleSegment.ts:41`

**Evidence.** SKILL.md:224 and README.md:18: "Do not write your own box parser, box walker, or box writer." Three CML files do. c2pa: `export function readBoxes(bytes: Uint8Array, start: number, end: number): BmffBox[]` (readRootBoxes.ts:42), called again for each level in `for (const child of readBoxes(root, start, end))` (findExcludedRanges.ts:162). drm: `const size = dv.getUint32(byteCursor)` (parsePsshList.ts:51). 608 tests: `export function findBox(view, type, start, end)` with `pos += size` (helpers.ts:39-57). Stop rules: iso-bmff treats size 0 as "to the end", reads `largesize`, and requires 24 bytes for `uuid` (`const headerSize = box?.type === 'uuid' ? cursor + 16 : cursor`, IsoBoxReadView.ts:388). c2pa does the same with no `uuid` rule. drm and the 608 helper do not handle size 0 or size 1. The reason for the copies is cost and shape: `readIsoBoxes(bytes)` with no readers descends into every container and creates one view for each box (a probe counted 6 views for one `moov` root box), and c2pa calls it only to find a root `mdat` or a root `uuid` box (validateC2paInitSegment.ts:243, validateC2paMerkleSegment.ts:41). The RFC function `seekIsoBox` returns the first box at a path. It does not list siblings.

**Proposal of the finder.** Export one function in 2.0 that lists the boxes of one level as raw boxes, with no decode and no descent. A possible shape: `scanIsoBoxes(data: IsoBoxData | IsoBoxReadCursor): IsoRawBox[]` with the `headerSize` field of the first finding. The name is open. Use the same header code as `seekIsoBox` and document the stop rule once. Then replace `readBoxes` in c2pa, the loop in `parsePsshList`, and `findBox` in the 608 tests with that function.

**Proposal after verification.** Keep the goal and change four points.

1. Put the function in the cursor RFC, not in a later minor version. The RFC removes `IsoBoxReadView.readBox()`, the only public flat step of version 1 (api.md:511). The types `IsoBoxReadCursor` and `IsoRawBox` exist only in 2.0. Add the function to the table at rfc/iso-bmff-cursor-api.md:164 and add an unresolved question for its name.

2. Export the header step that `seekIsoBox` and `readChildBoxes` need internally, not only a function that returns an array. A possible shape: `nextIsoBox(cursor: IsoBoxReadCursor): IsoRawBox | null`, or a step that moves `cursor.pos` and `cursor.end` to the next box and returns its type. That shape allocates nothing for each box, so a hot path can use it. `scanIsoBoxes(data): IsoRawBox[]` can then be a short loop over the step, or can be left out. Decide together with the Future possibilities item at line 280, so 2.0 gets one sibling function and not two.

3. Fix the stop rule before the code is shared. RFC line 199 says a `uuid` reader reads the 16 user type bytes itself. So decide in the RFC whether the 2.0 header step keeps the 24-byte `uuid` rule of IsoBoxReadView.ts:388. Document the rule once.

4. Treat the three replacements as separate changes, not as part of the export.
   - c2pa: `readBoxes` feeds the BMFF hash. A different stop rule changes which boxes the hash covers for malformed input, such as a `uuid` box of 8 to 23 bytes. c2pa also needs the offset in the root bytes, the header size, and the index for each type (readRootBoxes.ts:11-22). The offset comes from `bytes.byteOffset`, and the caller counts the index. Do it in its own PR with the hand-built hash tests of PR 569.
   - drm: `parsePsshList` already has iso-bmff as a peer dependency. The switch also fixes its size 0 loop. That fix changes the result for malformed input, so it needs a changelog entry in drm.
   - 608: `findBox` is a test helper in a package with no iso-bmff dependency. Leave it, or treat it as optional.

**Prior decision.** No decision against a flat walk exists. Related: PR 569 (1c271202e, fixes issue 566) added the internal c2pa walker `readRootBoxes` on purpose with "No public API change", so that `computeBmffHash` and `hashIncludesMoov` see the same root boxes (libs/c2pa/src/init/validateC2paInitSegment.ts:81). PR 570 (ee916b7c8) added `readBoxes` for child levels. rfc/iso-bmff-cursor-api.md:280 lists "A function that returns every box at a path" under Future possibilities.

## G465: c2pa reads JUMBF boxes with readIsoBoxes, which applies three ISO BMFF rules that JUMBF content does not need.

Severity medium. Category behavior. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/c2pa/src/jumbf/parseJumbfBoxes.ts:19`, `libs/c2pa/src/readC2paManifest.ts:32`, `libs/iso-bmff/src/IsoBoxReadView.ts:388`, `libs/iso-bmff/src/IsoBoxReadView.ts:397`, `libs/iso-bmff/src/IsoBoxReadView.ts:470`

**Evidence.** `return readIsoBoxes(bytes).map(box => ({ type: box.type, data: box.view.readData(box.view.bytesRemaining) }))` (parseJumbfBoxes.ts:19-22). c2pa calls the function 8 times, once for each nesting level (6 calls in readC2paManifest.ts, 2 in extractManifestCertificate.ts). Rule 1: a box of type `uuid` loses 16 bytes of its payload: `box.usertype = this.readArray('uint', 1, 16)` (IsoBoxReadView.ts:398). A probe on the source returned `data length 2` for a `uuid` box with a 16-byte ID and 2 data bytes, so `JumbfBox.data` has a different meaning for one type. Rule 2: a `uuid` box below 24 bytes stops the walk and drops every later sibling with no signal (line 388-393). Rule 3: a box whose type is in `CONTAINERS` gets `boxes = view.readBoxes()` (line 470-472), which decodes its payload as child boxes. Each call also allocates one `IsoBoxReadView` for each box. Under the RFC the same code receives the header inside `bytes` (see the first finding).

**Proposal of the finder.** Give c2pa the flat function of the previous finding. The function knows only `size`, `type` and `largesize`, so it fits JUMBF (ISO 19566-5 uses the same box header). `parseJumbfBoxes` then returns `box.bytes.subarray(box.headerSize)` for every type, and the `uuid` rule stays in the ISO BMFF tree reader.

**Proposal after verification.** Split the fix in two steps. Step 1, any time and with no API change: `parseJumbfBoxes` calls the flat function that c2pa already has, `readRootBoxes(bytes)` from libs/c2pa/src/bmff/readRootBoxes.ts, and returns `{ type: box.type, data: box.bytes.subarray(box.headerSize) }` for every type. Add tests for a JUMBF `uuid` box (data keeps the 16-byte ID), for a box below 24 bytes followed by a sibling, and for a box whose type is in CONTAINERS. Step 2, only if 2.0.0 adds the public flat function of the previous finding to iso-bmff: c2pa deletes its own header walk in readRootBoxes.ts and uses the export for both the BMFF hash and JUMBF. Lower the severity to low: for the seven JUMBF types that c2pa consumes, the three rules change no result today. The gain is fewer allocations, one fewer parser difference on hostile input, and a c2pa that is ready for the RFC, which removes `box.view` and `box.usertype`.

**Prior decision.** None that makes the current state a deliberate choice against a flat reader. PR 335 (22afe8877) chose `readIsoBoxes` for JUMBF as reuse. PR 569 (1c271202e) and PR 570 (ee916b7c8) later added an internal flat box walker to c2pa for the BMFF hash. PR 664 (9103e4548) made the short `uuid` stop intentional for ISO BMFF only.

## G467: validateC2paInitSegment checks for mdat with readIsoBoxes and computes the hash with a second walker, and the two walkers stop at different boxes.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The defect is in @svta/cml-c2pa. A fix changes the returned error codes for an init segment with a malformed box before an mdat box.

**Files.** `libs/c2pa/src/init/validateC2paInitSegment.ts:243`, `libs/c2pa/src/init/validateC2paInitSegment.ts:81`, `libs/c2pa/src/bmff/readRootBoxes.ts:61`, `libs/iso-bmff/src/IsoBoxReadView.ts:390`

**Evidence.** `const boxes = readIsoBoxes(bytes)` and `if (findIsoBox(boxes, box => box.type === 'mdat'))` (lines 243-244) use iso-bmff. The comment at line 81 states the rule for the other path: "hashIncludesMoov must see the same root boxes as computeBmffHash", and both use `readRootBoxes`. iso-bmff stops at a `uuid` box below 24 bytes: `actualSize < headerSize` with `headerSize = cursor + 16` (IsoBoxReadView.ts:388-393). c2pa accepts it: `if (size < headerSize || offset + size > end) break` with a header of 8 (readRootBoxes.ts:61). A probe on the source with `ftyp`, a 16-byte `uuid` box, and `mdat` returned `[ 'ftyp' ]` and `mdat found: false` from iso-bmff, and `[ 'ftyp', 'uuid', 'mdat' ]` from `readRootBoxes`. The `mdat` check therefore passes for a segment that the hash walker reads to the end. The hash still covers the later boxes, so only a signer can produce such a segment. `findIsoBox` also searches nested boxes, and the hash walker reads root boxes only.

**Proposal of the finder.** Use one walker for both checks in c2pa. Today: `readRootBoxes(bytes).some(box => box.type === 'mdat')`. With 2.0: the flat function of iso-bmff for the `mdat` check, the manifest `uuid` box, and the hash. This case is in-repo evidence for the known gap that `readIsoBoxes` gives no signal for a dropped box.

**Proposal after verification.** File this as a c2pa bug fix, not as an iso-bmff 2.0 item. In `validateC2paInitSegment`, run the `mdat` check on the hash walker before `readIsoBoxes`: `if (readRootBoxes(bytes).some(box => box.type === 'mdat'))`. The reject path then also skips the full box parse. State in the changelog that the check now reads root boxes only, which matches "Container: File" of clause 8.1.1.1. If the maintainers want to keep the rejection of a nested `mdat` box, keep the `findIsoBox` check as a second condition. Add a test with `ftyp`, the manifest `uuid` box, `moov`, a 16-byte `uuid` box, and `mdat`. Drop the "flat function" part: the cursor RFC defines no root-box iterator with offsets. If iso-bmff should replace `readRootBoxes`, add that as an open question of the RFC, with the c2pa needs: offset, header size, and bytes of each root box, and the same stop rules as `readIsoBoxes`.

**Prior decision.** No decision makes the current state intentional. Issue 566 and PR 569 (commit 1c271202e) set the opposite rule for c2pa: checks and the hash share the `readRootBoxes` walker. The `mdat` check of PR 339 was not moved. Separately, the iso-bmff stop at a `uuid` box below 24 bytes is intentional (issue 660, iso-bmff CHANGELOG line 88, cursor RFC line 198) and must stay.

## G472: Two public options of drm copy field types of iso-bmff that other findings propose to change, so each fix needs a decision for drm.

Severity medium. Category consistency. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** If `schemeType` or `defaultKid` of `EnsureEncryptedInitOptions` follows a new iso-bmff field type, the public option type of drm changes.

**Files.** `libs/drm/src/ensureEncryptedInit.ts:87`, `libs/drm/src/ensureEncryptedInit.ts:94`, `libs/drm/src/ensureEncryptedInit.ts:118`, `libs/drm/src/ensureEncryptedInit.ts:156`, `libs/drm/src/ensureEncryptedInit.ts:172`

**Evidence.** `schemeType: number` with `@defaultValue `1667591779`` (lines 85-87) and `schemeType = 1667591779` (line 118): the number is the four-character code `cenc`. `defaultKid: number[]` (line 94). `dataFormat: fourCcToUint32(entry.type)` (line 156). The `tenc` box uses the oldest of the three field forms: `defaultIsEncrypted: 1, defaultIvSize: 8, defaultKid` (lines 172-174). These lines are the only in-repo use of `writeSchm`, `writeFrma` and `writeTenc`. The known findings on four-character codes as numbers, on byte fields as `number[]`, and on the overlapping `tenc` fields all change these lines.

**Proposal of the finder.** Decide once in the 2.0 plan. Recommended: drm keeps `defaultKid` and widens it to `Uint8Array | number[]`, widens `schemeType` to `'cenc' | 'cbcs' | 'cens' | 'cbc1' | number`, and converts inside `ensureEncryptedInit`. That change is not a break for drm adopters. Use the drm function as the first real test of each new iso-bmff field shape.

**Proposal after verification.** Split the item in two.

1. Required with iso-bmff 2.0 (internal, no break for drm adopters): add an "in-repo consumers" step to the 2.0 plan. Each iso-bmff PR that changes a field of `frma`, `schm` or `tenc`, the reader and writer signatures, or the result of `writeIsoBoxes` updates `libs/drm/src/ensureEncryptedInit.ts` in the same PR. The three byte-exact tests in `libs/drm/test/ensureEncryptedInit.test.ts` must pass without a change to the expected hex. The same step covers c2pa, which reads `box.view` in four files. The peer cascade of `npm run prepare-release` then publishes drm and c2pa with the new peer range.

2. Optional and additive (drm minor, any time): widen `schemeType` to `'cenc' | 'cbc1' | 'cens' | 'cbcs' | number` and `defaultKid` to `Uint8Array | number[]`, convert inside the function, and change the documented default from `1667591779` to `'cenc'`. Decide this only after the iso-bmff decision on four-character codes and byte fields, and use the same type that iso-bmff chooses. Keep `number` and `number[]` as accepted inputs so drm needs no major version. If iso-bmff moves to strings, drm needs a small local number-to-string conversion for the numeric form, or iso-bmff exports the inverse of `fourCcToUint32`. Ship the widening in a drm minor version, not in the patch bump of the peer cascade.


## G475: The skill describes the source of `main`, so it names four iso-bmff exports that the published version 1.0.7 does not have, and the gap grows when the 2.0 code merges.

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `skills/common-media-library/SKILL.md:218`, `skills/common-media-library/SKILL.md:221`, `skills/common-media-library/SKILL.md:16`, `skills/common-media-library/references/iso-bmff.md:14`, `libs/iso-bmff/package.json:3`, `libs/iso-bmff/CHANGELOG.md:16`, `README.md:54`

**Evidence.** SKILL.md:218 names `readInt64AsBigInt` and `createInt64OverflowReader`. SKILL.md:221 names `readMoov` and `writeMoov`. All four are under `## [Unreleased]` in the changelog (CHANGELOG.md:9, 16, 17, 22). `package.json` has `"version": "1.0.7"`, and `npm view @svta/cml-iso-bmff version` returned 1.0.7. SKILL.md:16 tells the agent: "install it and import the named exports". SKILL.md:17 sends the agent to the reference file when the package is not installed, and that file contains the API report of `main` (references/iso-bmff.md:629). The root README installs the skill from the repository: `npx skills add streaming-video-technology-alliance/common-media-library` (README.md:54). After the 2.0 implementation merges, the skill will describe cursors while npm still has the view classes of version 1.

**Proposal of the finder.** Make the generator state the version. Either write "Describes version X. Exports marked unreleased are not on npm yet" at the top of each reference file and mark each bullet whose identifiers are missing from the published API, or regenerate `skills/` only in the release-prep pull request. For 2.0, merge the implementation and publish in one release step, or keep the skill at the last published version until the publish.

**Proposal after verification.** Keep the generator and the CI gate as they are. Add one hand-written sentence to the "Before you write code" section of skills/common-media-library/SKILL.md, outside the generated markers: "The package index describes the `main` branch. An export in the index can be newer than the version on npm. If an import fails, read the installed `dist/index.d.ts` and the changelog of the package, and use the exports of the installed version." This sentence needs no registry access, keeps the output deterministic, and also covers the opposite case: a project that pins version 1 after the skill describes version 2. For 2.0, treat the gap as a release-order rule and not as a generator feature: merge the implementation PR, the release-prep PR, and run the Publish workflow in one session, and add a "Migrate from version 1" guide under libs/iso-bmff/docs so that the reference file serves projects on both versions. File the item as a separate repository issue, because it applies to every package.

**Prior decision.** PR 557 (commit 1a376dc59, "feat: add When to use sections, an agent skill, and llms.txt for coding agents"): the root build regenerates skills/ from the README and API report of the current tree, and the CI step "Generated skill files are current" (.github/workflows/ci.pr.yml:40-41) fails a PR with stale files. The decision covers the mechanism. It does not state that the version gap is wanted.

## G478: Three workarounds in the consumers have no effect with the current types, so they hide which casts the API still requires.

Severity low. Category consistency. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/c2pa/src/emsg/extractVsiEmsgBox.ts:22`, `libs/drm/src/ensureEncryptedInit.ts:125`, `libs/drm/src/ensureEncryptedInit.ts:22`, `libs/iso-bmff/src/IsoBoxType.ts:6`

**Evidence.** `const emsg = box as EventMessageBox` (extractVsiEmsgBox.ts:22): a type check of the same loop with no cast and `return box` passed, because `box.type !== 'emsg'` narrows the result. `if (stsd?.type !== 'stsd')` (ensureEncryptedInit.ts:125) follows `findIsoBox(boxes, box => box.type === 'stsd')`: a type check with `if (!stsd) return` and `stsd.entries.length` passed, because the callback is an inferred type predicate. `const audioTypes: IsoBoxType[] = ['mp4a', 'ac-3', ...]` (line 22): `IsoBoxType` is `${string}${string}${string}${string}` (IsoBoxType.ts:6), and the same code with `string[]` passed the type check. The casts that the API does require are in the findings on `uuid`, on `IsoBoxReaderMap`, and on the sample entry types.

**Proposal of the finder.** Remove the cast and the repeated test during the 2.0 migration of the two packages. Keep the `IsoBoxType[]` annotation only if 2.0 gives `IsoBoxType` a checked form.

**Proposal after verification.** Correct the evidence: the cast in extractVsiEmsgBox.ts:22 is an upcast from `ParsedBox<EventMessageBox>` to `EventMessageBox`, not a cast with no effect. It is redundant only because the return type does the same upcast. Corrected proposal: when the 2.0 migration edits the two files, remove the cast (`if (box.schemeIdUri === VSI_SCHEME_URI) return box`) and replace `stsd?.type !== 'stsd'` with `!stsd`. Keep the `IsoBoxType[]` annotations: PR 585 added them on purpose, they name the key type of the readers map, and they become useful with no edit if a separate finding gives `IsoBoxType` a checked form. Do not track this as a 2.0 API item. It is a cleanup of internal consumer code and can ship in any release.

**Prior decision.** PR 585 (commit facd7ba42, "chore: enable the typescript-eslint recommended type-aware lint rules") added the `IsoBoxType[]` annotations and the `IsoBoxReaderMap` / `IsoBoxWriterMap` locals on purpose, to replace `as any`. The same PR ran `no-unnecessary-type-assertion` and kept the `as EventMessageBox` cast, because the cast changes the static type. No prior decision covers the repeated `stsd?.type` test (PR 292).

## G477: dev/isobmff.html imports a file and seven names that do not exist, and it contains a commented media URL of a private host.

Severity low. Category dead-code. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `dev/isobmff.html:7`, `dev/isobmff.html:17`, `dev/isobmff.html:18`, `dev/isobmff.html:25`

**Evidence.** `import { findBoxByType, filterBoxesByType, parseBoxes, ftyp, mvhd, sidx, styp } from '../lib/src/isobmff.ts'` (lines 7-15). The repository has no `lib` folder, and a search of `libs/iso-bmff/src` found none of the seven names. `const url = '../lib/test/isobmff/fixtures/test_frag.mp4'` (line 18): the fixture is at `libs/iso-bmff/test/fixtures/test_frag.mp4`. `const config = { parsers: { ftyp, styp, mvhd, sidx }, recursive: true }` (line 25): the options `parsers` and `recursive` do not exist. Line 17 is a commented URL on the host `(host removed)` with a production title in the path. `dev/dev.ts` uses only `@svta/cml-cmcd` and `dev/index.html` does not link the file. The lint ignores `dev/`, so no check finds the dead imports.

**Proposal of the finder.** Delete `dev/isobmff.html`, or rewrite it with the 2.0 API as the manual benchmark page for `seekIsoBox` and `readIsoBoxes`. Remove the commented URL in both cases.


## G474: The skill and the README send an agent to two packages for pssh parsing, and the two parsers have different rules and result types.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `skills/common-media-library/SKILL.md:163`, `skills/common-media-library/SKILL.md:219`, `libs/drm/src/cenc/parsePsshList.ts:62`, `libs/iso-bmff/src/readers/readPssh.ts:18`

**Evidence.** drm section: "Parse the pssh boxes in init data and find the one for a key system: `parsePsshList`, `getPsshForKeySystem`, `getPsshData`" and "Do not write your own pssh parser" (SKILL.md:163-168). iso-bmff section: "Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`" (SKILL.md:219). drm does not import `readPssh`. Differences: drm skips a box whose version is not 0 or 1 (`if (version !== 0 && version !== 1)`, parsePsshList.ts:64) and iso-bmff reads any version. drm returns the system ID as a UUID string with dashes and the complete box as a buffer. iso-bmff returns `systemId: number[]` and `data: number[]`.

**Proposal of the finder.** After the 2.0 pssh type has byte views, build the drm functions on `readPssh` and the flat function. Change the iso-bmff bullet to state its purpose: "Read the fields of one pssh box". Keep the task "find the pssh box for a key system" only in the drm section.

**Proposal after verification.** Keep only the documentation change, and make it in the source. Edit libs/iso-bmff/README.md:13 to state the purpose and point to drm, for example: "Read the fields of a pssh, tenc, or schm box: `readPssh`, `readTenc`, `readSchm`. To find the pssh box for a key system, use `@svta/cml-drm`." Then run the root build so that skills/common-media-library regenerates, and commit the result. Do this edit in the 2.0 README rewrite, because line 16 of the same section names `IsoBoxReadView` and `IsoBoxWriteView`, which the cursor RFC removes. Do not put the drm rebuild in the iso-bmff 2.0 scope. If the maintainers want it, file a drm issue that requires a bundle measurement for an adopter who imports only `parsePsshList`, keeps the version 0 or 1 filter, and covers the possible size 0 loop in parsePsshList.ts.


## G479: The 608 package asks the caller for the position and the size of each sample, and its tests parse moof, traf and trun by hand to get them.

Severity low. Category tests. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/608/src/extractCta608DataFromSample.ts:13`, `libs/608/test/utils/helpers.ts:6`, `libs/608/test/utils/helpers.ts:72`, `libs/608/README.md:64`

**Evidence.** `extractCta608DataFromSample(raw: DataView, startPos: number, sampleSize: number)` (extractCta608DataFromSample.ts:13-17). The test helper reads the boxes itself: `parseTrunSamples(view, trunOffset)` with the flag bits as numbers (helpers.ts:6-34), then `const moof = findBox(view, 'moof', 0, view.byteLength)` and `const mdatBodyStart = moof.offset + dataOffset` (helpers.ts:72-80). The helper needs the byte position of `moof`, which a parsed box will not have after the RFC. The README states "Only `lengthSizeMinusOne` in the `avcC` or `hvcC` config gives that width" (README.md:64), and no CML package reads `avcC` or `hvcC`. 608 does not depend on iso-bmff. These lines are in-repo evidence for three known gaps: no byte position, no function that resolves the samples of a fragment, and no reader for a codec configuration box.

**Proposal of the finder.** When 2.0 has the sample function and box positions, replace `findBox` and `parseTrunSamples` in the 608 tests with them, and show the same calls in the 608 README. Use this test as the acceptance case for the sample function: it needs `{ offset, size }` for each sample relative to the input buffer.

**Proposal after verification.** Do not treat this finding as a 2.0 task. Fold it into the gap findings for the sample function and the codec configuration reader as a use case. If the sample function ships: (1) test it inside libs/iso-bmff with a fragment fixture, and require `{ offset, size }` for each sample relative to the input buffer. (2) Add one example to libs/608/README.md that imports the function from `@svta/cml-iso-bmff` and passes the result to `extractCta608DataFromSample`. That example answers the adopter question "where do `startPos` and `sampleSize` come from", and it is the only part with value for adopters. It needs iso-bmff as a devDependency of 608 for the README type check only. (3) Keep `findBox` and `parseTrunSamples` in libs/608/test/utils/helpers.ts, so the 608 tests stay independent of iso-bmff. Also correct the gap statement: the cursor from `seekIsoBox` already gives the byte position of a box. Only a box from `readIsoBoxes` has no position after the RFC.

