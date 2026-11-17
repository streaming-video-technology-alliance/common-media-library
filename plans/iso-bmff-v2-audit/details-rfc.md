# Corrections to the cursor RFC: details

The audit agents wrote this text. The index is in `findings.md`.

## G462: The raw box of the RFC has no header size, so the four c2pa call sites that read the body of a box with no reader must parse the header by hand.

Severity high. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:87`, `rfc/iso-bmff-cursor-api.md:159`, `rfc/iso-bmff-cursor-api.md:238`, `libs/c2pa/src/jumbf/parseJumbfBoxes.ts:21`, `libs/c2pa/src/readC2paManifest.ts:234`, `libs/c2pa/src/extractManifestCertificate.ts:71`, `libs/c2pa/src/merkle/validateC2paMerkleSegment.ts:47`, `libs/c2pa/src/bmff/readRootBoxes.ts:11`

**Evidence.** RFC line 87: "The `bytes` field is a view of the complete box, with its header." RFC line 159: `type IsoRawBox = { type: IsoBoxType; bytes: Uint8Array }`. RFC line 238 is the only migration text: "An adopter who needs the bytes of a box omits its reader and uses the raw box." All four c2pa sites need the body, not the complete box: `data: box.view.readData(box.view.bytesRemaining)` (parseJumbfBoxes.ts:21) and `uuidBox.view.readData(uuidBox.view.bytesRemaining)` (the other three). In version 1 the view starts after the header, after `largesize`, and after the `usertype` of a `uuid` box. With `{ type, bytes }` the consumer must read the size field again to know if the header has 8 or 16 bytes. c2pa already has its own type with that field: `readonly headerSize: number` (readRootBoxes.ts:17).

**Proposal of the finder.** Change the RFC type to `type IsoRawBox = { type: IsoBoxType; bytes: Uint8Array; headerSize: number }`, where `headerSize` is 8 or 16. Add one migration line to the RFC: `box.view.readData(box.view.bytesRemaining)` becomes `box.bytes.subarray(box.headerSize)`. State in the same line that a `uuid` raw box keeps its 16 bytes of user type in the body.

**Proposal after verification.** Add `headerSize` to the raw box that `readIsoBoxes` returns, with the spec definition of the header: 8, 16 with `largesize`, and 16 more for a `uuid` box (24 or 32). Then `box.view.readData(box.view.bytesRemaining)` becomes `box.bytes.subarray(box.headerSize)` for all four c2pa sites with the same bytes as version 1. The user type of a `uuid` raw box is `box.bytes.subarray(box.headerSize - 16, box.headerSize)`, which replaces `box.usertype`. Keep the field off the writer input: `writeIsoBoxes` accepts `{ type, bytes }` and ignores `headerSize` (declare it optional on the input type, or use a separate output type). Add both migration lines to the Drawbacks section of the RFC. Alternative for the three `uuid` sites, which the RFC already allows: a custom reader `readers: { uuid: cursor => ({ type: 'uuid', usertype: readBytes(cursor, 16), data: readBytes(cursor, cursor.end - cursor.pos) }) }`. Only parseJumbfBoxes, which reads arbitrary box types, has no reader-map solution and needs the field. Rate the finding medium.

**Prior decision.** No decision about the raw box. Related and binding for the definition of the header: PR 664 (commit 9103e4548, issue 660, closed) states in IsoBoxReadView.ts:355 and CHANGELOG.md:120 that the header of a `uuid` box has 16 more bytes for the `usertype` field. That matches ISO/IEC 14496-12:2015 clause 4.2.

**Result.** Decided on 2026-11-17 in PR 682 (b6b0c4296): a raw box has `headerSize`.

## F240: The RFC contract writes any box with a `boxes` field and no writer as a container, which reverses the tested rule of version 1 and would write a `meta` box or a sample entry with no fields.

Severity high. Category behavior. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:200`, `rfc/iso-bmff-cursor-api.md:201`, `libs/iso-bmff/src/utils/writeBox.ts:30`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:298`, `libs/iso-bmff/docs/writing-boxes.md:18`, `libs/iso-bmff/CHANGELOG.md:49`

**Evidence.** RFC: `A container box with no map entry is read and written through its boxes field.` and `writeIsoBoxes throws for a box that has no writer, no boxes field, and no bytes field.` Version 1 uses the type list: `else if (CONTAINERS.includes(type)) { view = writeContainerBox(...) }`. The test `should throw for a box that code builds with no view and no writer` passes `{ type: 'meta', version: 0, flags: 0, boxes: [] }` and expects `No writer found for box type: meta`. The guide says `The function does not write a box of another type as a container, even if the box has a boxes field.` The changelog entry for issue 651 records the defect that this rule fixed. Types with a `boxes` field and other fields: `meta`, `prsl`, and every sample entry.

**Proposal of the finder.** Change the two RFC sentences: `writeIsoBoxes` writes a box as a container only when its type is in `CONTAINERS`. `writeIsoBoxes` throws for every other box that has no writer and no `bytes` field, even if the box has a `boxes` field. Keep the existing test.

**Proposal after verification.** Replace RFC lines 200 and 201 with three rules. (1) Automatic container handling does not change: `readIsoBoxes` and `writeIsoBoxes` read and write a box as a container with no map entry only when its type is in `CONTAINERS`. (2) `writeIsoBoxes` throws `No writer found for box type` for every other box that has no writer and no `bytes` field, even if the box has a `boxes` field. Examples are `meta`, `prsl`, and the sample entries. (3) State the one change from version 1 in the costs section: a parsed box of a type outside `CONTAINERS` that has a reader and no writer wrote its `view` bytes in version 1. In version 2 the box has no source bytes, so the write throws. The adopter adds the writer, or removes the reader so the box stays a raw box. Keep the existing test at writeIsoBoxes.test.ts:298 and add a test for rule 3.

**Prior decision.** Issue 651 (closed) and PR 673, commit d395df3ce "fix(iso-bmff): write a box with a boxes field and no writer from its view", merged 2026-11-16. The maintainer chose the first option of issue 651: the container form only for a type in `CONTAINERS`, and `No writer found for box type` for a box that code builds with a `boxes` field and no writer. The prior decision supports the finding and contradicts the RFC text at lines 200 and 201.

**Result.** Done in PR 682 (8435c2ae0). The contract states the rule of PR 673. Question 10 covers a parsed box.

## G480: The RFC cursor type is invariant in `V`, so a reader of either mode accepts no cursor and the accepted `int64` rule fails to compile.

Severity high. Category type-design. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:142`, `rfc/iso-bmff-cursor-api.md:146`, `rfc/iso-bmff-cursor-api.md:157`, `rfc/iso-bmff-cursor-api.md:241`, `rfc/uint64-reader-config.md:370`, `rfc/uint64-reader-config.md:244`, `libs/iso-bmff/src/IsoBoxReadView.ts:40`, `libs/iso-bmff/src/IsoInt64Reader.ts:22`

**Evidence.** RFC line 146 puts `readers?: IsoBoxReaderMap<V>` on the public cursor, and line 157 makes a reader `(cursor: IsoBoxReadCursor<V>) => B`. `V` is then in a parameter position and in a return position (`int64?: IsoInt64Reader<V>`). The accepted RFC names this exact problem at line 370: "The view therefore stores its readers as `IsoBoxReaderMap`, the default instantiation ... If the private field were `IsoBoxReadViewConfig<V>`, the readers would put `V` in a parameter position and make the view invariant." The source follows that rule: `private config: { readers?: IsoBoxReaderMap; int64?: IsoInt64Reader<V> }`. I compiled a model of RFC lines 142 to 159 with TypeScript 6.0.3 in strict mode. Results: `IsoBoxReadCursor<bigint>` and `IsoBoxReadCursor<number>` are both not assignable to `IsoBoxReadCursor<IsoInt64>` (TS2322). A reader `(cursor: IsoBoxReadCursor<IsoInt64>) => ...` is not assignable to `IsoBoxReaderMap<bigint>` or `IsoBoxReaderMap<number>`. `cursor.int64(cursor, 8, false)` inside a generic field function is TS2345. The 54 readers that "accept a view of either mode" (uint64 RFC line 244) and both exported `int64` functions depend on that assignment. RFC line 241 states that "the names and the rules of both RFCs do not change".

**Proposal of the finder.** Type the field as `readers?: IsoBoxReaderMap` (the default instantiation, as the private field does today), or keep the readers map out of the public cursor type. The same model compiles with no error after that one change. Add the three assignments above to the type tests, as `test/int64.types.test.ts` does for the view.

**Proposal after verification.** Keep the problem statement. Change the proposal. `readers?: IsoBoxReaderMap` on a public cursor fixes the three assignments. That type also states a wrong reader type for the `bigint` mode, rejects a custom `bigint` reader in a cursor literal, and needs a cast in `readChildBoxes` and in `createIsoBoxReadCursor`.

Better options, in order of preference:
1. Declare the entries of the cursor field with a method signature, so TypeScript compares the cursor parameter in both directions: `readers?: Record<IsoBoxType, { r(cursor: IsoBoxReadCursor<V>): unknown }['r']>`. The model compiles with no error and no cast. The two modes stay apart. `IsoBoxReaderMap<V>` on the config type does not change.
2. If the maintainers reject that form, use `readers?: IsoBoxReaderMap` as the finding proposes. Document the two internal casts in the RFC, and state that adopters create a cursor with `createIsoBoxReadCursor` and do not write a cursor literal.

In both cases, add a "Variance of the cursor" paragraph to the RFC that carries over line 370 of uint64-reader-config.md. Add these type tests for the cursor: both either-mode assignments, both mode-mix `@ts-expect-error` lines, an either-mode reader in a map of each mode, a custom reader of each mode, and the generic `int64` call. Test 15 of test/int64.types.test.ts is the model.

**Prior decision.** The accepted RFC rfc/uint64-reader-config.md line 370, "Variance of the view" (PR 613, commit 9bc54be04, implemented in PR 645, commit 2aca3e3e9) requires a read handle that is covariant in `V`. That decision supports the finding. No decision supports the invariant cursor: the cursor RFC exists only in the unpushed commit 8ce63c212.

**Result.** Confirmed with a TypeScript 6.0.3 model (8 errors). Decided on 2026-11-17 in PR 682 (b6b0c4296): a method signature for the readers map. The model of the decided types passes 16 cases.

## G482: A write cursor replaces `view` and `bytes` when the buffer grows, and a read cursor is shared by all boxes, but every cursor field is public and mutable and the contract does not warn about either case.

Severity high. Category type-design. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:142`, `rfc/iso-bmff-cursor-api.md:150`, `rfc/iso-bmff-cursor-api.md:203`, `rfc/iso-bmff-cursor-api.md:249`, `libs/iso-bmff/src/IsoBoxReadView.ts:38`, `libs/iso-bmff/src/readers/readSidx.ts:19`, `libs/iso-bmff/src/readers/readAudioSampleEntryBox.ts:21`, `libs/iso-bmff/test/readWideUint.test.ts:95`, `.claude/rules/code-quality.md:30`

**Evidence.** RFC lines 150 to 155: `view: DataView`, `bytes: Uint8Array<ArrayBuffer>`, `pos: number`, `writers?`, with no `readonly`. Line 203: "The write cursor doubles its buffer when a field does not fit." A fixed `ArrayBuffer` cannot grow, so both fields must point to a new buffer after a growth. The RFC does not name a resizable buffer. The code of version 1 destructures the view in the first line of a reader: `const { readUint, readWideUint } = view` and `const { readArray, readUint, readTemplate, readBoxes } = view`. A custom writer that follows this habit with `const { view } = cursor` writes into the old buffer after a growth, with no error. RFC line 249: "The tree reader uses one read cursor for all boxes and changes `pos` and `end` for each box." In version 1 each box has its own view with private fields (`private dataView`, `private offset`), and the view stays valid after the read: `const child = box.view.readBox()`. A custom reader that keeps the cursor for a later read gets the state of another box. The project rule: "Prefer `readonly` properties on types where mutation is not intended."

**Proposal of the finder.** Mark `view`, `end`, `readers`, `int64`, `bytes` and `writers` as `readonly` in the public types. Leave `pos` writable. Add two contract lines: a writer must read `cursor.view` and `cursor.bytes` again after each field function, and a reader must not keep the cursor after it returns. If the growth uses a resizable `ArrayBuffer`, state that and the runtime it needs.

**Proposal after verification.** Amend the RFC before acceptance as follows.

Types:
- Read cursor: `readonly view`, `readonly end`, `readonly readers?`, `readonly int64?`. `pos` stays writable (RFC line 197 tells the caller to move `cursor.pos`).
- Write cursor: `readonly view`, `readonly bytes`, `readonly writers?`. `pos` stays writable.
- The package functions that change `end`, `view`, and `bytes` take an internal type without `readonly`. TypeScript accepts a `readonly` property where a mutable one is expected, so this needs no cast and no runtime code.
- Add TSDoc on `view` and `bytes` of the write cursor: "The package replaces this field when the buffer grows. Do not store it in a variable."

Contract lines:
- Write cursor: "A custom writer writes through the field functions. A growth replaces `cursor.view` and `cursor.bytes`. A writer that stores either field in a variable writes into the old buffer after a growth." Do not tell writers to read the fields again after each field function, unless the RFC also exports a function that reserves bytes. `writeBytes` already covers a field with no field function, so the extra export is not needed. Add it as an unresolved question if direct writes are a goal.
- Read cursor: "The cursor that a reader receives is valid only until the reader returns. The tree reader uses the same object for the next box. A reader that needs a later read copies the cursor (`{ ...cursor }`) or keeps the bytes from `readBytes`." A cursor that `seekIsoBox` or `createIsoBoxReadCursor` returns belongs to the caller and has no such limit.

Growth: state that the growth allocates a new fixed `ArrayBuffer` and copies the bytes. Add a resizable `ArrayBuffer` to the rejected alternatives. It is an ES2024 feature, the repo compiles to ES2019, and older television browsers may not have it.

Severity: medium. The hazard needs a custom writer that bypasses the field functions, or a custom reader that stores the cursor.

**Prior decision.** None for the missing contract text. The mechanisms are intentional design choices of the draft RFC: rfc/iso-bmff-cursor-api.md:249 (one shared read cursor, one allocation) and lines 203 and 240 (buffer doubles, each growth copies). The RFC status is draft, "Pending review" (line 285).

**Result.** Done in PR 682 (b6b0c4296). Decided on 2026-11-17: `readonly` fields except `pos`.

## F273: The RFC states that isIsoBoxType does not change, but its first overload takes `{ view: IsoBoxReadView<V> }`, a class that the RFC removes.

Severity medium. Category api-surface. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The parameter type of a public overload must change when IsoBoxReadView and the `view` field are removed.

**Files.** `libs/iso-bmff/src/isIsoBoxType.ts:21`, `libs/iso-bmff/src/isIsoBoxType.ts:3`, `rfc/iso-bmff-cursor-api.md:191`

**Evidence.** isIsoBoxType.ts:21 `box: IsoBox<V> | { view: IsoBoxReadView<V> } | null | undefined`. The `view` member is the source from which TypeScript infers `V` for a parsed box. rfc/iso-bmff-cursor-api.md:191 says "`findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`, and `isIsoBoxType` do not change." and line 197 removes `view` from parsed boxes.

**Proposal of the finder.** Amend the RFC: the first overload becomes `box: IsoBox<V> | IsoRawBox | null | undefined`, and `V` is inferred from `IsoBox<V>` only. Add a type test that a box read with `readInt64AsBigInt` still narrows to `bigint` fields without the `view` member.

**Proposal after verification.** Amend rfc/iso-bmff-cursor-api.md:191. Remove `isIsoBoxType` from the "do not change" list and state: the runtime behavior and the narrowing rule of `isIsoBoxType` do not change, and the first signature becomes `box: IsoBox<V> | { type: string } | null | undefined`. Do not use `IsoBox<V> | IsoRawBox`: a union that holds the return type of a custom reader then goes to the `unknown` signature and narrows a 64-bit field to `number` in bigint mode, with no compile error (probed with TypeScript 6.0.3). Keep the `unknown` signature. Add type tests for: a box of each mode, a union with a custom box type, a union where a custom reader replaces a built-in type, `null` and `undefined`, and the children of `traf`. Run the tests under TypeScript 5.7 as well, the documented minimum.

**Prior decision.** rfc/uint64-reader-config.md:231-240 and PR 645 (2aca3e3e9), with CHANGELOG.md:37, added the first overload with `{ view: IsoBoxReadView<V> }` on purpose for version 1. The decision is the rule that the guard keeps the field type of the box. It does not require the `view` member, so it does not block the change.

**Result.** Done in PR 682 (8435c2ae0), section "Result type".

## G463: A container box never becomes a raw box under the RFC, so the migration text "omit the reader and use the raw box" is false for the 19 container types.

Severity medium. Category api-surface. Breaking: no. Fact check: confirmed. Value check: partly. Merged duplicates: G495.

**Files.** `rfc/iso-bmff-cursor-api.md:200`, `rfc/iso-bmff-cursor-api.md:238`, `libs/iso-bmff/src/IsoBoxReadView.ts:401`, `libs/iso-bmff/src/IsoBoxReadView.ts:470`, `libs/c2pa/src/bmff/computeBmffHash.ts:61`, `libs/c2pa/src/init/validateC2paInitSegment.ts:83`

**Evidence.** RFC line 200: "A container box with no map entry is read and written through its `boxes` field." RFC line 238: "An adopter who needs the bytes of a box omits its reader and uses the raw box." The two statements conflict for `moov`, `moof`, `traf` and the other types in `CONTAINERS`: with no reader the box is `{ type, boxes }` and has no `bytes`. In version 1 every box has `box.view = this.slice(offset, actualSize)` (IsoBoxReadView.ts:401), and a container also gets `boxes` (line 470). A probe on the source returned the keys `size, type, view, boxes` for a `udta` box. c2pa needs the complete bytes of `moov`: `for (const box of readRootBoxes(bytes))` then `box.bytes.length` (computeBmffHash.ts:61) and `readRootBoxes(bytes).find(box => box.type === 'moov')` (validateC2paInitSegment.ts:83).

**Proposal of the finder.** Correct the RFC text: state that a container box is never a raw box in the result of `readIsoBoxes`. Name the supported way to get the bytes of a container box. The flat function of the next finding gives that way: it returns a raw box for every type and does not descend.

**Proposal after verification.** Change three places in rfc/iso-bmff-cursor-api.md. Line 87: "A box with no reader in the map and a type outside `CONTAINERS` becomes a raw box." Line 200: add "A container box is never a raw box in the result of `readIsoBoxes`." Line 238: limit the advice to non-container types and name one way for a container. The RFC as written gives only the body range of a container (`seekIsoBox` returns `pos` after the header and `end`). The complete bytes need one addition: either a flat function that returns a raw box for every type and does not descend (the next finding), or a `start` field on the read cursor. If neither is accepted, add the choice to "Unresolved questions" instead of stating a way that does not exist. Drop the claim that c2pa depends on this: `readRootBoxes` is c2pa's own reader (libs/c2pa/src/bmff/readRootBoxes.ts:79), so cite it as evidence of the need, not of a regression. Optional in the same edit: state in line 201 how `writeIsoBoxes` treats a box with a `boxes` field, no writer, and a type outside `CONTAINERS`, so the rule of PR 673 (issue 651) is not lost.

**Prior decision.** None for the conflict itself: the RFC text is a single draft commit (8ce63c212). The container half is intentional: rfc/iso-bmff-container-readers-writers.md lines 42 and 148 keep automatic container handling (RFC PR 622, implementation PR 654), so a container with no map entry stays `{ type, boxes }`.

**Result.** Done in PR 682 (8435c2ae0). The Drawbacks limit the raw box advice to types outside `CONTAINERS` and name question 13.

## G470: Under the RFC the user type of a uuid box moves into a reader, but the package has no uuid reader and no uuid box type, so c2pa keeps a local type and a double cast.

Severity medium. Category api-surface. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/c2pa/src/utils.ts:119`, `libs/c2pa/src/utils.ts:135`, `libs/c2pa/src/merkle/validateC2paMerkleSegment.ts:42`, `libs/c2pa/src/utils.ts:1`, `rfc/iso-bmff-cursor-api.md:199`, `libs/iso-bmff/src/ParsedBox.ts:17`

**Evidence.** c2pa defines `export type UuidParsedBox = { type: string; usertype?: number[]; view: IsoBoxReadView; size: number }` (utils.ts:119-124) with the comment "`ParsedIsoBox` does not include 'uuid' in its type union". It casts twice: `(boxes as UuidParsedBox[]).find(box => box.type === 'uuid' && isC2paUuid(box.usertype ?? []))` (utils.ts:135-137) and `const uuidBox = box as unknown as UuidParsedBox` (validateC2paMerkleSegment.ts:42). A type check of `box.type === 'uuid'` on the default result gave TS2367 ("have no overlap"), although every parsed box has `usertype?: number[]` (ParsedBox.ts:17). The local type imports `IsoBoxReadView` (utils.ts:1), which the RFC removes. RFC line 199: "The fields `view`, `size`, `largesize`, and `usertype` do not exist. A reader for a `uuid` box reads the 16 bytes of the user type." The RFC names no such reader, so each adopter writes it. ISO/IEC 14496-12 clause 4.2 defines the field: `unsigned int(8)[16] usertype = extended_type`.

**Proposal of the finder.** Export `readUuid` in 2.0 with the result `{ type: 'uuid'; usertype: Uint8Array; data: Uint8Array }`, where both arrays are views of the input. Add the type as `UuidBox` to `IsoBoxMap`. c2pa then passes `{ readers: { uuid: readUuid } }`, deletes `UuidParsedBox` and both casts, and reads `box.data`. Add the two c2pa lines to the migration text of the RFC as the example.

**Proposal after verification.** Ship the pair in 2.0, not the reader alone: `readUuid` and `writeUuid`, plus `UuidBox = { type: 'uuid'; usertype: <16 bytes>; data: Uint8Array }` in `IsoBoxMap`. `data` is a view of the input (return type `Uint8Array`, per the AGENTS.md rule for views). Give `usertype` the same type that 2.0 uses for the other 16-byte identifiers (`systemId` of pssh, `defaultKid` of tenc). Those are `number[]` today. If another finding moves them to `Uint8Array`, use `Uint8Array` here too. Do not mix the two types. Without `writeUuid`, `writeIsoBoxes` throws for a parsed `UuidBox` under RFC line 201. State in the RFC contract that the cursor position for a `uuid` reader is before the 16 bytes of the user type, and name `readUuid` and `writeUuid` there. In c2pa, `matchesUuid` takes `readonly number[]` (utils.ts:79), so its parameter type changes to `ArrayLike<number>` if `usertype` becomes a `Uint8Array`. Use the c2pa change as the migration example in the RFC.


**Result.** Decided on 2026-11-17 in PR 682 (b6b0c4296): no `uuid` reader in the package. Issue 694 tracks a helper after 2.0.0.

## G483: The RFC states that each method of the two view classes becomes a field function, but the table has no row and no stated fate for 11 members of the read view and 9 members of the write view.

Severity medium. Category api-surface. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Each missing member is a public member of version 1 that an adopter can call. Its removal with no replacement is a break that the Drawbacks section does not list.

**Files.** `rfc/iso-bmff-cursor-api.md:176`, `rfc/iso-bmff-cursor-api.md:191`, `libs/iso-bmff/src/IsoBoxReadView.ts:107`, `libs/iso-bmff/src/IsoBoxReadView.ts:128`, `libs/iso-bmff/src/IsoBoxReadView.ts:135`, `libs/iso-bmff/src/IsoBoxReadView.ts:142`, `libs/iso-bmff/src/IsoBoxReadView.ts:152`, `libs/iso-bmff/src/IsoBoxReadView.ts:347`, `libs/iso-bmff/src/IsoBoxReadView.ts:362`, `libs/iso-bmff/src/IsoBoxReadView.ts:414`, `libs/iso-bmff/src/IsoBoxReadView.ts:456`, `libs/iso-bmff/src/readers/readFtyp.ts:19`, `libs/iso-bmff/src/readers/readSdtp.ts:19`, `libs/iso-bmff/src/readers/readTenc.ts:40`, `libs/iso-bmff/src/readers/readDref.ts:19`, `libs/iso-bmff/src/readers/readStsd.ts:28`, `libs/iso-bmff/src/IsoBoxWriteView.ts:30`, `libs/iso-bmff/src/IsoBoxWriteView.ts:226`, `libs/iso-bmff/src/IsoBoxWriteView.ts:242`, `libs/iso-bmff/src/IsoBoxWriteView.ts:255`, `libs/iso-bmff/src/IsoBoxWriteView.ts:268`, `libs/iso-bmff/src/IsoBoxWriteView.ts:288`, `libs/iso-bmff/src/IsoBoxWriteView.ts:322`

**Evidence.** RFC line 176: "Each method of the two view classes becomes a field function." The table at lines 178 to 189 has 10 rows. Read view members with no row: the getters `buffer`, `byteOffset`, `byteLength`, `cursor`, `done`, `bytesRemaining`, and the methods `slice`, `jump`, `readBox`, the `length` parameter of `readBoxes`, and `[Symbol.iterator]`. Built-in readers use three of them: `view.bytesRemaining / size` (readFtyp), `view.readArray(UINT, 1, view.bytesRemaining)` (readSdtp), `!view.done` (readTenc). `readDref` and `readStsd` call `view.readBoxes(entryCount)`, and the row `view.readBoxes()` to `readChildBoxes` shows no count. The iterator and `readBox` are the only way to read boxes one at a time, and no function replaces them. Write view members with no row: `buffer`, `byteLength`, `byteOffset`, `writeString`, `writeTerminatedString`, `writeUtf8TerminatedString`, the array form of `writeBytes`, `writeArray` with its rule `data[i] ?? 0`, and the `largesize` branch of `writeBoxHeader`. RFC line 191 says only: "The write cursor has the same field functions with the `write` prefix." That rule gives `writeUtf8` and `writeChildBoxes`, which do not exist in version 1, and gives no function for a null terminator. The sentence at line 176 also says that "a method with a `size` parameter becomes one function for each size", but `readWideUint(size)`, `readString(size)`, `readUtf8(size)` and `readData(size)` each become one function.

**Proposal of the finder.** Add a second table with one row for each public member of the two classes and one of three fates: a named field function, an expression on the cursor (`cursor.end - cursor.pos` for `bytesRemaining`, `cursor.pos += n` for `jump`), or removed with the reason. Add a full table of the write functions with their signatures. State whether `readChildBoxes` takes a count, and name the function that iterates the boxes of a cursor one at a time.

**Proposal after verification.** Do not add a second table. The repo writing rules ask for one place per fact and a shorter document. Extend the existing table at rfc/iso-bmff-cursor-api.md:178 and replace the sentence at line 191.

1. Rename the first column to "Version 1 member". Add one row for the state getters: `buffer`, `byteOffset`, `byteLength`, `cursor`, `done`, `bytesRemaining` become expressions on the cursor fields (`cursor.view`, `cursor.pos`, `cursor.pos >= cursor.end`, `cursor.end - cursor.pos`). Add one row for `jump(n)`: `cursor.pos += n`. Add one row for `slice`: `createIsoBoxReadCursor` or a copy of the cursor with a new `pos` and `end`.
2. Add a write column or write rows with signatures in place of line 191. State the fate of `writeArray` (a loop in the writer, and say that the `?? 0` default goes away or stays), the array form of `writeBytes`, and `writeBoxHeader` (replaced by `beginIsoBox` and `endIsoBox`).
3. Four items are API decisions, not documentation. Decide them in the RFC or list them under Unresolved questions:
   - Null-terminated strings. Version 1 uses `readUtf8(-1)` in 13 built-in readers and `writeTerminatedString` / `writeUtf8TerminatedString` on the write side. State the signatures of `readString`, `readUtf8`, `writeString`, `writeUtf8`, and which function reads or writes the terminator.
   - The count of `readChildBoxes`. `readDref` and `readStsd` pass `entryCount` today, and PR 672 made that count a limit on purpose.
   - Reading one box at a time. `readBox` and `[Symbol.iterator]` have no replacement. Name a function, or state that `seekIsoBox` and `readIsoBoxes` are the only entry points and that the two members are removed.
   - `largesize` on write. `endIsoBox` writes a size into a header that `beginIsoBox` already wrote with 8 bytes. State that a box above 2^32 - 1 bytes throws a `RangeError`, or how the header grows.
4. Correct line 176. "A method with a `size` parameter becomes one function for each size" is true only for fixed-width integers and `readTemplate`. `readWideUint`, `readWideInt`, `readString`, `readUtf8`, and `readData` each become one function.
5. Do not mark the fix as breaking. If the decisions in item 3 remove a member with no replacement, add that member to Drawbacks.


**Result.** Not done. Question 11 of the RFC covers four members.

## G493: The RFC drops two documented inputs of `writeIsoBoxes` without a line in Drawbacks: a bare `Uint8Array` in the list, and the result of a direct writer call.

Severity medium. Category api-surface. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A list with a `Uint8Array` or with the result of a writer call compiles and works in version 1, and throws or does not compile under the RFC contract.

**Files.** `rfc/iso-bmff-cursor-api.md:158`, `rfc/iso-bmff-cursor-api.md:201`, `rfc/iso-bmff-cursor-api.md:239`, `libs/iso-bmff/src/IsoBoxStreamable.ts:15`, `libs/iso-bmff/src/utils/writeBox.ts:41`, `libs/iso-bmff/docs/writing-boxes.md:11`, `libs/iso-bmff/docs/writing-boxes.md:67`, `libs/iso-bmff/docs/writing-boxes.md:208`, `rfc/iso-bmff-container-readers-writers.md:80`, `libs/iso-bmff/test/containerWriters.test.ts:178`

**Evidence.** Version 1 accepts raw bytes as a list item: the union has `| ArrayBufferView`, and `writeBox` has `if ('buffer' in box) { view = box }`. The writing guide documents the input: "ArrayBufferViews such as `Uint8Array` and `DataView`", with an example that puts `new Uint8Array([...])` between two box objects. RFC line 201: "`writeIsoBoxes` throws for a box that has no writer, no `boxes` field, and no `bytes` field." A bare `Uint8Array` has none of the three. The RFC never defines the input type of `writeIsoBoxes`. Motivation names the `IsoBoxStreamable` union as a cost, and the Reference section does not name its replacement. Version 1 also lets an adopter call a writer and use the result: the guide says "The view implements `ArrayBufferView`. Pass the view to `writeIsoBoxes` in the same list", the container RFC shows `const moof = writeMoof({...}, { writers: { mfhd: writeMfhd } })` and `assert(moof.byteLength === 24)`, and a test does the same. RFC line 158 makes a writer return `void`. The RFC names no function that returns the written bytes of a cursor: `bytes` has the capacity of the buffer, not the written length.

**Proposal of the finder.** Define the input type in the Types block, for example `type IsoBoxInput<V> = IsoBox<V> | IsoRawBox`, and state that a bare `ArrayBufferView` is no longer an input (wrap it as `{ type, bytes }`) or that it stays. Add a function for a direct call, for example `finishIsoBoxWriteCursor(cursor): Uint8Array<ArrayBuffer>`, or state that `writeIsoBox(box, { writers })` is the only direct form. List both changes under Drawbacks.

**Proposal after verification.** Edit the draft RFC before review. Four changes:

1. Add the input type to the Types block and use it in the Functions table for `writeIsoBoxes`, `writeIsoBox`, and `createIsoBoxReadableStream`. Keep the name `IsoBoxStreamable`, because CHANGELOG.md:39 and rfc/uint64-reader-config.md:385 already tell adopters to use that name. Proposed: `type IsoBoxStreamable<V extends IsoInt64 = number> = IsoBox<V> | IsoRawBox | ArrayBufferView`.

2. Keep a bare `ArrayBufferView` as a list item, and state it in the Contract: "`writeIsoBoxes` copies an `ArrayBufferView` item unchanged." Reasons: version 2 returns one array, so an adopter can no longer insert own bytes between the results without a second copy. The cost is one `ArrayBuffer.isView` branch for each item. The wrapper `{ type, bytes }` needs a type, and that type is false when the bytes hold several boxes. Then line 68 stays true, and line 201 needs the words "a box object". If the maintainer prefers removal, replace line 68, add a Drawbacks line, and give the migration `{ type, bytes }`.

3. Do not add `finishIsoBoxWriteCursor`. State in the Contract that `cursor.bytes.subarray(0, cursor.pos)` is the written bytes of a cursor, and that `cursor.bytes` has the capacity of the buffer. Name `writeIsoBox(box, { writers })` as the direct form that returns a copy with the exact size.

4. Add one Drawbacks line: "A writer returns no value. The result of a direct writer call is no longer an item for `writeIsoBoxes`. Put the box object in the list with its writer in the map, or call `writeIsoBox`." Reference the direct call section of the container RFC there, because line 241 says only that the signatures take a cursor.

**Prior decision.** None that chose to remove either input. The current state of version 1 is intentional: commit d615e5bf0 ("feat: add iso box writers", issue 269) created `IsoBoxStreamable = IsoBox | Box | ArrayBufferView`, PR 583 added the SharedArrayBuffer copy rule for a view in the list (CHANGELOG.md:111, tests at test/writeIsoBoxes.test.ts:217 and :229), and the accepted RFC rfc/iso-bmff-container-readers-writers.md:80 to 91 (PR 622, PR 654) documents the direct writer call. The cursor RFC is a draft in commit 8ce63c212 and is not pushed. `gh issue list` for "IsoBoxStreamable iso-bmff" and "writeIsoBoxes ArrayBufferView iso-bmff" returned no issue.

**Result.** Not done. Open for the RFC review.

## G500: The RFC lists four functions that do not change and gives no fate for the other public exports outside the two view classes, among them the stream API and the sample entry helpers that take a view.

Severity medium. Category api-surface. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** Each export below takes or returns a view, a view configuration or a per-box chunk, so its public type must change in version 2.

**Files.** `rfc/iso-bmff-cursor-api.md:191`, `rfc/iso-bmff-cursor-api.md:281`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:28`, `libs/iso-bmff/src/IsoBoxReadableStream.ts:48`, `libs/iso-bmff/src/createIsoBoxReadableStream.ts:19`, `libs/iso-bmff/src/readers/readAudioSampleEntryBox.ts:17`, `libs/iso-bmff/src/readers/createAudioSampleEntryReader.ts:31`, `libs/iso-bmff/src/utils/isContainer.ts:29`, `libs/iso-bmff/src/utils/index.ts:1`, `libs/iso-bmff/config/cml-iso-bmff.api.md:146`

**Evidence.** Line 191: "`findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`, and `isIsoBoxType` do not change." No line names these exports. (1) `IsoBoxReadableStream` and `createIsoBoxReadableStream`: the stream sends one chunk for each box with `controller.enqueue(writeIsoBox(next.value, cfg))`. With one growing buffer, the RFC does not say whether each box gets its own cursor and its own copy. Future possibilities mentions "A `ReadableStream` writer that writes a large `mdat` payload without a copy" and does not mention the existing class. (2) `readAudioSampleEntryBox(type: T, view: IsoBoxReadView<IsoInt64>)`, `readVisualSampleEntryBox`, and the two write forms: public functions with a view parameter and a type argument. (3) `createAudioSampleEntryReader` and `createVisualSampleEntryReader`, which return `(view: IsoBoxReadView<IsoInt64>) => ...`. (4) `defaultReaderConfig` and `defaultWriterConfig`, which return the view configuration types. (5) The four exports of `src/utils/index.ts`: `CONTAINERS`, `fourCcToUint32`, `isContainer`, `isFullBox`. `isContainer` returns `'boxes' in box || CONTAINERS.includes(box.type)`, and the RFC does not say what it returns for a raw box. `seekIsoBox` "compares the 4-byte type codes", which is the purpose of `fourCcToUint32`, and the RFC does not say whether a path may hold a number. (6) The types `IsoBoxData`, `IsoBoxReaderReturn`, and `TraverseIsoBoxesConfig`.

**Proposal of the finder.** Add a table "Other exports" with one row for each export of `config/cml-iso-bmff.api.md` that is not a box type, a reader or a writer. Each row has one of: no change, new signature (shown), or removed. For the stream, state the chunk rule: one `Uint8Array<ArrayBuffer>` for each top-level box, written with one cursor that the stream reuses.

**Proposal after verification.** Add the "Other exports" table before the RFC leaves draft, with these changes to the proposal:

1. Correct line 191. `isIsoBoxType` changes: the first signature drops `{ view: IsoBoxReadView<V> }` (src/isIsoBoxType.ts:21). State the replacement that lets TypeScript infer `V` for a box from `readIsoBoxes`.
2. Add rows for `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox`, and `IsoBoxReaderReturn`. Without `view`, `size`, `largesize`, `usertype`, `ParsedBox<T>` adds nothing to `T`. State whether the three types are removed or kept as aliases, and what `readIsoBoxes` returns (box union plus `IsoRawBox`).
3. Add rows for `IsoBoxReadViewConfig` and `IsoBoxWriteViewConfig`. Either keep the names or rename them (for example `IsoBoxReadConfig`, `IsoBoxWriteConfig`), because no view exists in version 2. Then line 168 ("The signature does not change") needs the same correction. `defaultReaderConfig` and `defaultWriterConfig` return these types.
4. Sample entry helpers: show the new signatures. Decide the argument order of `readAudioSampleEntryBox` and `readVisualSampleEntryBox` (cursor first matches the field functions and `IsoBoxWriter`). The factories return `IsoBoxReader<AudioSampleEntryBox<T>, IsoInt64>`. The two write forms follow `IsoBoxWriter`.
5. Stream: do not prescribe a reused cursor. State the public rule only: one chunk for each item of the iterable, and each structured box is written to a `Uint8Array<ArrayBuffer>` of its exact size. State whether a bytes item and a raw box still pass through with no copy, as writeBox.ts:41-55 does today. If they do, remove or reword the line 281 item in Future possibilities. If they do not, list the copy in Drawbacks. Also type the stream as `ReadableStream<Uint8Array<ArrayBuffer>>`.
6. `CONTAINERS`, `isContainer`, `isFullBox`, `fourCcToUint32`, `IsoBoxData`, `TraverseIsoBoxesConfig`: one row each with "no change", plus one sentence for `isContainer` on a hand-built raw box of a container type. Drop the question about a number in the `seekIsoBox` path. Line 276 already states the path form.

**Prior decision.** rfc/iso-bmff-cursor-api.md:241 ("The names and the rules of both RFCs do not change. The signatures take a cursor.") together with rfc/uint64-reader-config.md:227 and :246 implicitly keeps the names `defaultReaderConfig`, `createAudioSampleEntryReader` and `createVisualSampleEntryReader`. rfc/iso-bmff-container-readers-writers.md:162 keeps `defaultReaderConfig()` and `defaultWriterConfig()` without the container functions. No prior decision covers the stream, the utils exports or the three types.

**Result.** Not done. Open for the RFC review.

## G509: Version 1 uses two position systems in public members (`cursor` is relative to the view, `slice(offset, size)` takes an offset from the start of the buffer and documents only `size`), and the RFC cursor type does not state which system `pos` and `end` use.

Severity medium. Category api-surface. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:90`, `libs/iso-bmff/src/IsoBoxReadView.ts:128`, `libs/iso-bmff/src/IsoBoxReadView.ts:146`, `libs/iso-bmff/src/IsoBoxReadView.ts:152`, `libs/iso-bmff/src/utils/readUint.ts:2`, `libs/iso-bmff/config/cml-iso-bmff.api.md:524`, `rfc/iso-bmff-cursor-api.md:142`, `rfc/iso-bmff-cursor-api.md:166`

**Evidence.** IsoBoxReadView.ts:90 is `this.offset = this.dataView.byteOffset` (buffer position). Line 129 is `return this.offset - this.dataView.byteOffset` (view position). Line 152-153 is `slice = (offset: number, size: number) ... new DataView(this.dataView.buffer, offset, size)`, and its TSDoc at 146-151 has `@param size` and no `@param offset`. Each helper converts back, for example readUint.ts:2 `const cursor = offset - dataView.byteOffset`. Run on a view over `subarray(5, ...)`: `slice(0, 12)` returns a view with `byteOffset` 0, which covers 5 bytes before the input, and moves the outer cursor to 7. `slice(view.byteOffset, 12)` gives the expected result. The RFC removes the class, but its replacement is `type IsoBoxReadCursor = { view: DataView; pos: number; end: number; ... }` (lines 142-148) with no statement on the origin of `pos`. A custom reader will write `cursor.view.getUint8(cursor.pos)`, which is correct only if `pos` counts from the start of `view`. Line 166 says "`data` is bytes or a read cursor" and gives no type.

**Proposal of the finder.** Add three statements to the Contract section of the RFC. First: `pos` and `end` count from the first byte of `cursor.view`, never from the start of `view.buffer`. Second: `readBytes` and the `bytes` field of a raw box are views at `view.byteOffset + pos` that share memory with the input. Third: `data` has the type `IsoBoxData` (`ArrayBufferLike | ArrayBufferView`), and a view input keeps its `byteOffset` and `byteLength`. Add tests that read the same segment as a `Uint8Array` with a non-zero `byteOffset`, as a Node `Buffer` from the pool, and as a `DataView` over a part, and compare the results with the plain `ArrayBuffer` read. `seekIsoBox` needs the same tests, because it returns a cursor into the input.

**Proposal after verification.** Keep the proposal, with four changes.

1. Add to the Contract section of rfc/iso-bmff-cursor-api.md: `pos` and `end` count from the first byte of `cursor.view`, never from the start of `view.buffer`. `end` is the position after the last byte of the box (exclusive). State the same origin for the write cursor: `pos` counts from the first byte of `view` and `bytes`, and both cover the same buffer.

2. Do not repeat the raw box statement. Line 87 already says that `bytes` is a view of the complete box. Add only the missing half: `readBytes` returns a view that shares memory with the input, as `readData` does in version 1 (PR 644, test/readData.test.ts:82-89). A caller that needs a copy calls `slice()`.

3. Do not restate the type for `readIsoBoxes`. Line 168 already keeps the signature. Give the type only where it is missing: `createIsoBoxReadCursor(data: IsoBoxData, config?)` and `seekIsoBox(data: IsoBoxData | IsoBoxReadCursor<V>, path, config?)`. State that a view input keeps its `byteOffset` and `byteLength`, so `pos` starts at 0 for it. Also state whether `seekIsoBox` moves a cursor that the caller passes or returns a new cursor, because line 197 tells the caller to pass one.

4. The tests are work for the implementation PR, not RFC text. Add them there: read one segment as an `ArrayBuffer`, as a `Uint8Array` with a non-zero `byteOffset`, as a Node `Buffer` from the pool, and as a `DataView` over a part, for `readIsoBoxes`, `seekIsoBox`, and `readBytes`, and compare the results.

No change to version 1 is needed. If a 1.x release ships before 2.0.0, the only cheap fix is the missing `@param offset` line in the TSDoc of `slice` (IsoBoxReadView.ts:146-151), with the statement that the offset counts from the start of the buffer.


**Result.** Done in PR 682 (8435c2ae0). The contract states the origin of `pos` and `end`.

## G485: The RFC keeps a `size` parameter for `readString`, `readUtf8` and `readBytes` with no rule for -1, 0 or no size, and its new rule for a read past the end contradicts the limit that version 1 applies.

Severity medium. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A `RangeError` for a size past the end changes the returned value of `readData` and `readUtf8` for the same input. The built-in readers pass -1 at 26 places.

**Files.** `rfc/iso-bmff-cursor-api.md:185`, `rfc/iso-bmff-cursor-api.md:186`, `rfc/iso-bmff-cursor-api.md:195`, `libs/iso-bmff/src/IsoBoxReadView.ts:22`, `libs/iso-bmff/src/IsoBoxReadView.ts:191`, `libs/iso-bmff/src/IsoBoxReadView.ts:203`, `libs/iso-bmff/src/IsoBoxReadView.ts:304`, `libs/iso-bmff/src/readers/readEmsg.ts:37`, `libs/iso-bmff/src/readers/readMdat.ts:17`, `libs/iso-bmff/src/readers/readVttC.ts:17`, `libs/iso-bmff/CHANGELOG.md:55`, `libs/iso-bmff/CHANGELOG.md:59`

**Evidence.** RFC rows: "`view.readString(size)`, `view.readUtf8(size)` | `readString`, `readUtf8`" and "`view.readData(size)` | `readBytes`". No text states the meaning of the size. RFC line 195: "A field function that reads past `cursor.end` throws a `RangeError`." Version 1 does the reverse for two methods: `limitSize(size, this.bytesRemaining)` limits `readData` and `readUtf8` to the end, `size === -1` reads to a null byte or to the end, and `readUtf8 = (size: number = Infinity)` reads to the end with no size. The unreleased changelog documents these rules as fixes: "`IsoBoxReadView.readData(size)` now stops at the end of the view when `size` exceeds the bytes that remain." The built-in readers depend on the rules: `schemeIdUri: readUtf8(-1)`, `data: view.readData(-1)`, `config: view.readUtf8()`. The audit of version 1 already found four different size rules. The RFC does not choose one.

**Proposal of the finder.** Remove the magic sizes from the field functions. Proposed set: `readBytes(cursor, size)` and `readUtf8(cursor, size)` take an exact size and throw past the end. `readBytesToEnd(cursor)` and `readUtf8ToEnd(cursor)` read to `cursor.end`. `readTerminatedUtf8(cursor)` reads to the null byte, with a stated result for a string with no null byte. Give each write function the same three forms.

**Proposal after verification.** Change the RFC text, not the direction. Proposed rules:

1. Exact size: `readString(cursor, size)`, `readUtf8(cursor, size)`, `readBytes(cursor, size)`. The size is required. A size of 0 reads nothing. A size past `cursor.end` throws a `RangeError` and does not move the cursor. No -1, no default.
2. Terminated: `readTerminatedUtf8(cursor)` reads to the null byte and moves past it. With no null byte, the function reads to `cursor.end` and does not throw (PR 639, issue 636). No Latin-1 terminated form: no built-in reader calls `readString(-1)`.
3. To the end: either two exports, `readUtf8ToEnd(cursor)` and `readBytesToEnd(cursor)`, or no export and the expression `cursor.end - cursor.pos` as the size. The cursor is a plain object, so the expression works with rule 1. Eight built-in call sites need this form (`mdat`, `free`, `imda`, four in `emsg`, `vttC`). The maintainer decides. The expression keeps the export count lower.
4. Writes: `writeString(cursor, value)`, `writeUtf8(cursor, value)`, `writeTerminatedUtf8(cursor, value)`, `writeBytes(cursor, bytes)`. A write has no size and no to-end form. `writeTerminatedString` (one byte for each character) has no built-in caller and can go.

Also correct RFC line 176 and the rows at lines 185 and 186 with the migration: `readUtf8(-1)` becomes `readTerminatedUtf8`, `readUtf8()` and `readData(-1)` become the to-end form, and a positive size keeps `readUtf8` or `readBytes` with the throw. State in the Drawbacks section that a custom reader that relied on the limit of `readData(size)` or `readUtf8(size)` now gets a `RangeError`.

**Prior decision.** Version 1 rules were chosen on purpose: PR 639 (issue 635) set "-1 reads to the null byte or to the end of the view". PR 642 set the limit and the 0 rule for `readUtf8` and states that `readString(size)` still throws a `RangeError`. PR 644 set the same limit for `readData`. Issue 636 keeps the tolerant read of a null byte in `iden`, `payl`, `sttg` and `vlab`. Issue 668 was closed as not planned: a `RangeError` from a custom reader with bad input goes to the caller. None of these decides the version 2 field functions. The null-or-end rule is the one decision that version 2 must keep.

**Result.** Not done. Open for the RFC review.

## G491: The RFC removes the `type` argument of a reader and does not say who sets `type` on the box, what happens when a reader reads fewer bytes than the box has, or whether a reader may keep the cursor.

Severity medium. Category behavior. Breaking: yes. Fact check: partly. Value check: partly. Merged duplicates: G469.

**Why it breaks.** A custom reader that uses its second argument, or that returns no `type` field, gets a different box in version 2. The Drawbacks section does not list either change.

**Files.** `rfc/iso-bmff-cursor-api.md:91`, `rfc/iso-bmff-cursor-api.md:157`, `rfc/iso-bmff-cursor-api.md:199`, `rfc/iso-bmff-cursor-api.md:237`, `libs/iso-bmff/src/IsoBoxReader.ts:12`, `libs/iso-bmff/src/IsoBoxReadView.ts:158`, `libs/iso-bmff/src/IsoBoxReadView.ts:466`, `rfc/uint64-reader-config.md:225`

**Evidence.** Version 1: `IsoBoxReader<B = unknown, T extends IsoBoxType = IsoBoxType, V extends IsoInt64 = number> = (view: IsoBoxReadView<V>, type: T) => B`, and the iterator calls `Object.assign(box, parser(view as IsoBoxReadView, type))`. The reader gets the box type, and the result is merged into a box that already has `type`. RFC line 157: `IsoBoxReader<B = unknown, V extends IsoInt64 = number> = (cursor: IsoBoxReadCursor<V>) => B`, and line 91: "A reader takes the read cursor and returns the box." The cursor has no type field, and the position is after the header, so one reader for several box types cannot learn the type. The second type parameter also changes meaning, so `IsoBoxReader<X, 'tfdt'>` no longer compiles, and the accepted RFC text "`IsoBoxReader` (third parameter)" becomes wrong. The RFC does not say whether `readIsoBoxes` sets `type` on a result that has none. Line 195 covers a reader that reads too far. No line covers a reader that stops early. In version 1 that case is harmless, because `slice` moves the parent by the body size: `this.offset += bodySize`. With one shared cursor, the tree reader must move `pos` to the end of the box after each reader, and the contract does not say so. The drawback at line 237 calls the change "mechanical" and lists only `view.readUint(4)`.

**Proposal of the finder.** Add four contract lines. (1) `readIsoBoxes` sets `type` from the header on each box, and a reader may omit it. Or: a reader must return `type`, and a result with another type throws. (2) After a reader returns, the tree reader sets the position to the end of the box. (3) A reader must not keep the cursor. (4) The reader gets the box type as a second argument, or the RFC lists the removal under Drawbacks with the factory pattern as the replacement.

**Proposal after verification.** Add these lines to the RFC and select one option for each. Do not leave alternatives in the contract.

1. `type`: A reader returns the complete box, with its `type` field. `readIsoBoxes` uses the returned object. The function does not merge and does not check the type. This rule removes the second object and the `Object.assign` call of version 1. Every built-in reader already follows the rule. Enforce the rule at compile time: the value type of `IsoBoxReaderMap` requires a result with `type: IsoBoxType`. Add no runtime throw.

2. Position: After a reader returns, `readIsoBoxes` and `readChildBoxes` set `pos` to the end of the box and restore `end` to the end of the parent box. A reader may stop before the end of the box. A reader that the caller calls directly after `seekIsoBox` leaves the cursor where the reader stopped.

3. Lifetime: A cursor that the tree reader passes is valid only during the call. A reader must not store the cursor on the box. To keep bytes, the reader calls `readBytes`. Also state whether `seekIsoBox` with a cursor argument returns that cursor or a new one (lines 166 and 197 do not say).

4. `type` argument: Do not add the second argument. Add a Drawbacks entry: the reader no longer receives the box type (added in PR 290), and one reader for several box types becomes a factory such as `createVisualSampleEntryReader`. In the same entry, state that `IsoBoxReader<B, T, V>` becomes `IsoBoxReader<B, V>`, so `IsoBoxReader<X, 'tfdt'>` is a compile error. Extend the line 241 entry to say that the `V` parameter of `IsoBoxReader` is now the second parameter, which changes the text "third parameter" of rfc/uint64-reader-config.md:225. Add a Drawbacks entry that a custom reader with no `type` in its result is now a compile error.

**Prior decision.** PR 290 (commit d429da2d2, version 1.0.0-alpha.8, CHANGELOG.md line 213: "Updated box reader functions to allow a type parameter to be passed in") added the second argument `type` on purpose. The RFC removes it without a note, so the Drawbacks section must name the removal. The factory replacement already exists since 1.0.0-alpha.4 (`createAudioSampleEntryReader`, `createVisualSampleEntryReader`, CHANGELOG.md line 248). rfc/iso-bmff-container-readers-writers.md:144 and docs/reading-boxes.md:275 already show a reader that returns `type`. Issue 668 (closed as not planned, 2026-11-16) is the precedent against a runtime check for a custom reader. No prior decision covers the three missing contract lines. The gh search for "IsoBoxReader type argument" and "custom reader" found no other issue.

**Result.** Done in PR 682 (b6b0c4296). Decided on 2026-11-17: a reader returns the complete box with `type`.

## G492: The RFC does not say what a writer that never calls `endIsoBox` produces, and a size of 0 is a legal size that means the box extends to the end of the file.

Severity medium. Category behavior. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:170`, `rfc/iso-bmff-cursor-api.md:172`, `rfc/iso-bmff-cursor-api.md:117`, `libs/iso-bmff/src/IsoBoxReadView.ts:383`, `libs/iso-bmff/src/IsoBoxWriteView.ts:323`

**Evidence.** RFC: "`beginIsoBox(cursor, type)` | Writes a box header with no size. Returns the start position." and "`endIsoBox(cursor, start)` | Writes the size into the header at `start`." The link between the two calls is a bare number that the writer must keep. ISO/IEC 14496-12:2015 clause 4.2 has `else if (size==0) { // box extends to end of file }`, and the reader of this package follows it: `} else if (size === 0) { actualSize = bytesRemaining }`. A custom writer that omits `endIsoBox`, or passes the `start` of another box, produces bytes that read back as one box that contains every later box, with no error. In version 1 a wrong size ends in a `RangeError` from the `DataView` or in visible zero bytes. The RFC also does not state the result for a box above 2^32 - 1 bytes. The header has 8 bytes when the box begins, and `largesize` needs 8 more bytes before the body. Version 1 has that branch: `const isLarge = size > 0xffffffff`.

**Proposal of the finder.** State in the contract that `writeIsoBoxes` and `writeIsoBox` check each box after its writer returns and throw when the size field at the start of the box is still 0. State the rule for a box above 2^32 - 1 bytes: either `endIsoBox` moves the body and writes `largesize`, or it throws a `RangeError` with the box type and the size.

**Proposal after verification.** Change the RFC text before acceptance, in two places.

1. Contract, missing or wrong `endIsoBox`. State that a writer must call `endIsoBox` one time with the value that `beginIsoBox` returned. Have the caller of the writer compare the size field with the bytes written, not with 0: after the writer returns, `writeIsoBoxes`, `writeIsoBox`, and the child-box function check `view.getUint32(start) === cursor.pos - start` and throw an `Error` with the box type. The cost is one read and one comparison for each box. This check finds an omitted call and a wrong `start` for that box. If the maintainers prefer no check (the rule of issue 668: a defect of custom code), the contract must still state that the result is a box with size 0, which a reader treats as "extends to the end of the data". Add this choice as unresolved question 7.

2. Contract, box above 2^32 - 1 bytes. State that `endIsoBox` throws a `RangeError` with the box type and the size. Do not move the body and do not write `largesize`. Record a `largesize` writer under "Future possibilities", next to the `ReadableStream` writer for a large `mdat`. Also correct the comparison with version 1 in any migration note: version 1 has the `isLarge` branch at IsoBoxWriteView.ts:323, but no writer reserves the 8 extra bytes, so version 1 also fails with a `RangeError`.


**Result.** Decided on 2026-11-17 in PR 682 (b6b0c4296): `endIsoBox` throws a `RangeError` above 4 GiB. The check for a missing `endIsoBox` call is not done.

## G487: `seekIsoBox` returns `null`, and the first example of the RFC converts that `null` to `undefined`.

Severity medium. Category consistency. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:28`, `rfc/iso-bmff-cursor-api.md:31`, `rfc/iso-bmff-cursor-api.md:166`, `rfc/iso-bmff-cursor-api.md:196`, `libs/iso-bmff/config/cml-iso-bmff.api.md:253`

**Evidence.** RFC line 166: "Returns a read cursor for the first box at the path, or `null`." The Summary example has the return type `number | undefined` and the body `return cursor ? readTfdt(cursor).baseMediaDecodeTime : undefined`. The second example at line 62 repeats the conversion. `findIsoBox` returns `S | null` today, and the audit already reports that `null` as a difference from the platform and from other CML lookup functions. Line 196 also gives one result for two causes: "The function returns `null` for a missing box and for a truncated box." A player that reads partial data cannot tell "wait for more bytes" from "this segment has no such box".

**Proposal of the finder.** Return `undefined` for a missing box, and apply the same change to `findIsoBox` in the same major version. For a truncated box in the path, throw the error type that the package chooses for a truncated box, or document a second result that the caller can test.

**Proposal after verification.** 1. Use one "not found" value for `seekIsoBox` and `findIsoBox`, and decide it in the RFC before 2.0.0. Option A (no break): keep null in both, and change the two RFC examples to `number | null` / `bigint | null` with `: null`. Option B (break, 2.0.0 only): return undefined from both, as Array.prototype.find does. Then change RFC line 166, line 196, and line 191 (which says `findIsoBox` does not change), update findIsoBox.ts and its tests that compare with null, and add a changelog migration note that `=== null` checks must become `== null` or a truthiness check. Do not change only one of the two functions.
2. Do not throw for a truncated box and do not add a second result type. Keep one "not found" result, consistent with `readIsoBoxes`. Add one sentence to the RFC contract: the caller knows whether the data is complete, and a "not found" result on partial data means "try again with more bytes".
3. Make line 196 exact about which truncation gives "not found": a truncated target box only, or also a truncated ancestor when the target box itself is complete. hls.js `findBox` returns the complete child of a truncated parent, which suits partial segment data. The RFC does not state this case.

**Prior decision.** For the truncated-box half: PR 661 (7d67e217a) and PR 662 (6c788e430), issues 650 and 663, documented in libs/iso-bmff/docs/reading-boxes.md:89 and kept by rfc/iso-bmff-cursor-api.md:198. The read stops before an incomplete box and does not throw. For null against undefined: none found.

**Result.** Done in PR 682 (8435c2ae0). The examples return `null`.

## G489: The RFC has three rules for an optional configuration, and its writer signature brings back an alternative that the accepted container RFC rejected.

Severity medium. Category consistency. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:154`, `rfc/iso-bmff-cursor-api.md:158`, `rfc/iso-bmff-cursor-api.md:169`, `rfc/iso-bmff-cursor-api.md:173`, `rfc/iso-bmff-cursor-api.md:174`, `rfc/iso-bmff-container-readers-writers.md:145`, `rfc/iso-bmff-container-readers-writers.md:217`, `libs/iso-bmff/src/IsoBoxWriteViewConfig.ts:12`, `libs/iso-bmff/src/IsoBoxWriter.ts:8`, `libs/iso-bmff/src/IsoBoxReader.ts:13`

**Evidence.** The function table has `writeIsoBoxes(boxes, config)` with a required argument, `writeIsoBox(box, config?)` with an optional one, and `createIsoBoxWriteCursor(config?)` with an optional one. The cursor has `writers?: IsoBoxWriterMap`, optional, while version 1 has `writers: IsoBoxWriterMap`, required. The accepted container RFC states at line 145: "`config` is a required argument, as for `writeMeta`", and rejects at line 217: "An optional `config` argument for the writers. A call of `writeMoov` with one argument then compiles. That call fails at run time for a typed child box." With `IsoBoxWriter<B> = (cursor: IsoBoxWriteCursor, box: B) => void`, `writeMoov(createIsoBoxWriteCursor(), moov)` compiles and has no writer for a child box. The RFC also uses `IsoBoxWriterMap` and never defines it. `IsoBoxWriter<B>` has no default, while `IsoBoxReader<B = unknown, ...>` has one, as in version 1.

**Proposal of the finder.** Choose one rule and state it in the RFC. Proposed: `config` is optional in `writeIsoBox`, `writeIsoBoxes` and `createIsoBoxWriteCursor`, and a box that needs a missing writer throws the documented error. Define `IsoBoxWriterMap` in the Types block, and give `IsoBoxWriter` the default `B = never` or `B = unknown` with a stated reason. Amend line 145 and line 217 of the container RFC.

**Proposal after verification.** State one rule in rfc/iso-bmff-cursor-api.md: the `writers` map is required wherever a write function takes a configuration. Concretely: `writeIsoBoxes(boxes, config)`, `writeIsoBox(box, config)`, and `createIsoBoxWriteCursor(config)` take a required `config` with a required `writers: IsoBoxWriterMap` and an optional `capacity`. `IsoBoxWriteCursor.writers` is required, as `IsoBoxWriteViewConfig.writers` is in version 1. An adopter who writes only raw boxes or one leaf box passes `{ writers: {} }`, as issue 298 proposes. Then `writeMoov(createIsoBoxWriteCursor(), moov)` does not compile, and lines 145 and 217 of the container RFC stay valid with "cursor" in place of "config". The only change against version 1 is that `writeIsoBox(box)` with one argument no longer compiles. Add that change to the Drawbacks section. Add `IsoBoxWriterMap` and `IsoBoxReaderMap<V>` to the Types block with the new function types. Do not add a default to `IsoBoxWriter<B>`. If the author prefers an optional `config` for `createIsoBoxWriteCursor` because a leaf writer needs no map, the RFC must state that exception and its reason as an unresolved question, and must not change the two tree functions.

**Prior decision.** Issue 298 ("Optional configuration footgun?") and PR 301 (commit a31419299, CHANGELOG 1.0.0-beta.1: "Made `IsoBoxWriteViewConfig` required in `writeIsoBoxes` function") made the writer configuration and the `writers` map required on purpose. The accepted RFC rfc/iso-bmff-container-readers-writers.md (PR 622, lines 145 and 217) repeats the decision for the container writers and rejects an optional `config`. The optional `config` of `writeIsoBox` is not covered by either decision. PR 301 did not change that function.

**Result.** Not done. Open for the RFC review.

## G496: The RFC states twice that `readIsoBoxes` keeps its signature and that only the return type of `writeIsoBoxes` changes, but the source shows that the return type, both configuration types and both map value types change.

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:46`, `rfc/iso-bmff-cursor-api.md:68`, `rfc/iso-bmff-cursor-api.md:168`, `rfc/iso-bmff-cursor-api.md:199`, `libs/iso-bmff/src/readIsoBoxes.ts:29`, `libs/iso-bmff/src/readIsoBoxes.ts:63`, `libs/iso-bmff/src/ParsedBox.ts:14`, `libs/iso-bmff/src/IsoBoxReaderReturn.ts:39`, `libs/iso-bmff/src/IsoBoxStreamable.ts:13`, `libs/iso-bmff/test/writeIsoBoxes.test.ts:188`

**Evidence.** Line 168: "`readIsoBoxes(data, config?)` | Returns the boxes as a tree. The signature does not change." Line 68: "The two calls have the same arguments as in version 1. Only the return type of `writeIsoBoxes` changes." The source signatures are `readIsoBoxes(raw: IsoBoxData, config: IsoBoxReadViewConfig<V> & { readers: R }): IsoBoxReaderReturn<R, V>[]` and `readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[]`. `IsoBoxReaderReturn` wraps each result in `ParsedBox<...>`, and `ParsedBox` adds `view: IsoBoxReadView<V>` and `size: number`. Line 199 of the same RFC removes those fields, so the return type changes. The `readers` values change from `(view, type) => B` to `(cursor) => B`, and the `writers` values from `(box, config) => ArrayBufferView` to `(cursor, box) => void`, so a call with a custom map does not have "the same arguments". The first parameter is `raw` in the source and `data` in the RFC. Line 46 says: "The result of `readIsoBoxes` is also not the input of `writeIsoBoxes`." The union has `| ParsedIsoBox<V>`, and a test passes the result directly: `writeIsoBoxes(boxes, defaultWriterConfig())`.

**Proposal of the finder.** Replace line 168 with: "The call form does not change. The return type has no `view` and no `size`, and a box with no reader is an `IsoRawBox`." Replace line 68 with a list of the four type changes. Reword line 46: "The type of the result of `readIsoBoxes` has fields that a box written by hand does not have." Show the three overloads of version 2 in the Reference section.

**Proposal after verification.** Apply the fix on the head of PR 682 (f40e351ec), not on local commit 8ce63c212. Keep the fix to three edits:

1. Line 168, table cell: "Returns the boxes as a tree. The call form does not change. The result type changes: a parsed box has no `view` and no `size`, and a box with no reader is an `IsoRawBox`."
2. Line 46: "The result type of `readIsoBoxes` also differs from the type of a box that a caller builds." The next sentence already names `view`, `size`, and the union of four types.
3. Line 68 on the PR head is already correct for the built-in maps. Add one sentence: "A custom reader or writer in a map has the new signature."

Drop the `raw` to `data` point. Do not add the three overloads yet. First add one unresolved question: which names replace `IsoBoxReadViewConfig` and `IsoBoxWriteViewConfig`, because both names contain the name of a removed class. After that decision, state in the Reference section that the three signatures of `readIsoBoxes` stay and that `Parameters<typeof readIsoBoxes>` and `ReturnType<typeof readIsoBoxes>` change. Severity is low: the Drawbacks section already states the costs.

**Prior decision.** None for the current wording. Related: PR 682 (open, head f40e351ec) already reworded line 68. rfc/uint64-reader-config.md lines 202-209 and 387 (PR 645, merged) keep `Parameters<typeof readIsoBoxes>` and `ReturnType<typeof readIsoBoxes>` stable on purpose, which shows that the maintainers treat the exact signature as public contract.

**Result.** Done in PR 682 (8435c2ae0).

## G497: The Summary states that the trial build is faster in every scenario, but the second table of the RFC shows a slower row, and the only faster row for a large payload uses a behavior that the contract excludes.

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:35`, `rfc/iso-bmff-cursor-api.md:169`, `rfc/iso-bmff-cursor-api.md:203`, `rfc/iso-bmff-cursor-api.md:222`, `rfc/iso-bmff-cursor-api.md:223`, `rfc/iso-bmff-cursor-api.md:224`, `rfc/iso-bmff-cursor-api.md:240`

**Evidence.** Line 35: "A trial build of six boxes was faster and smaller than version 1 in every scenario." The second table: "| 1 | 60 µs |" and "| Trial build, first buffer of 1 KB | 126 µs |". The default configuration is about two times slower for a `moof` box with an `mdat` box of 1 MB. The faster row is "Trial build, `capacity` of the full size, no final copy | 48 µs". The contract at line 203 says: "`writeIsoBoxes` returns a copy with the exact size." No function or option in the RFC returns the buffer without that copy, so the 48 µs result is not available through the proposed API. The table has no row for `capacity` with the final copy. Line 169 defines `config.capacity` only for `createIsoBoxWriteCursor`. The drawback at line 240 ("A large payload without a `capacity` value is slower") implies the option for `writeIsoBoxes`, and the function table does not show it there.

**Proposal of the finder.** Change line 35 to: "faster and smaller in the three scenarios of the first table. A large payload with the default buffer is slower." Add the row "`capacity` of the full size, with the final copy". State in the function table that the `config` of `writeIsoBoxes` and `writeIsoBox` takes `capacity`, and either add the option that skips the final copy or remove the 48 µs row.

**Proposal after verification.** Keep the Summary and table fixes, and change the part about the 48 µs row.

1. Line 35: write "faster and smaller than version 1 in the three scenarios of the first table. A write of a large payload with the default buffer was slower." Keep the link to the results section.
2. Do not add a row "`capacity` of the full size, with the final copy" with an invented number. The trial build is not in the repo. Either measure that row again, or state that the row was not measured.
3. Label the 48 µs row with the route that the trial build used. If the trial build used the cursor directly (`createIsoBoxWriteCursor({ capacity })`, the writers, then `cursor.bytes`), say so. That route exists in the proposed API, so the row can stay.
4. State in the function table whether the `config` of `writeIsoBoxes` and `writeIsoBox` takes `capacity`. Line 240 and Unresolved question 2 assume that the option exists there.
5. Decide the copy rule in the contract at line 203. The cheapest rule: `writeIsoBoxes` returns the buffer itself when `pos` equals the buffer length, and a copy with the exact size otherwise. A `capacity` of the full size then gives the 48 µs path through `writeIsoBoxes` with no new option. If the author rejects that rule, add the question to Unresolved question 2 and do not add a "skip the copy" option without review.


**Result.** Done in PR 682 (8435c2ae0). Question 2 asks for the copy rule and `capacity`.

## G499: The RFC states that the names and the rules of the two accepted RFCs do not change, but it reverses one recorded decision and makes about 75 lines of those RFCs wrong, with no plan to amend them.

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:241`, `rfc/uint64-reader-config.md:454`, `rfc/uint64-reader-config.md:424`, `rfc/uint64-reader-config.md:458`, `rfc/uint64-reader-config.md:462`, `rfc/uint64-reader-config.md:181`, `rfc/uint64-reader-config.md:211`, `rfc/uint64-reader-config.md:375`, `rfc/iso-bmff-container-readers-writers.md:31`, `rfc/iso-bmff-container-readers-writers.md:91`, `rfc/iso-bmff-container-readers-writers.md:113`, `rfc/iso-bmff-container-readers-writers.md:145`, `rfc/README.md:62`

**Evidence.** Cursor RFC line 241: "The names and the rules of both RFCs do not change. The signatures take a cursor." The `int64` RFC records at line 454: "**Wide write methods.** The two wide write methods are fields of `IsoBoxWriteView`, so the read view and the write view have the same API." It rejects at line 424: "**Wide write functions outside the view.** Two exported functions, `writeWideUint(writer, value, size)` and `writeWideInt(writer, value, size)`". The cursor RFC adopts the rejected form. Other lines of the `int64` RFC that become wrong: line 458 ("The view methods are `readWideUint`, ..."), line 462 ("Each takes `IsoBoxReadView<IsoInt64>`"), line 181 (`view: IsoBoxReadView<IsoInt64>` in `IsoInt64Reader`), line 211 ("The function reads the field with `readUint`, `readInt`, or `readUint64`"), line 375 (the subclass rule), and the sections "New view methods", "Where the branch lives" and "Variance of the view". A search finds 66 lines of that RFC that name a view class or a view method. The container RFC has 9 such lines: line 91 ("A container writer returns an `IsoBoxWriteView`"), the four signatures at lines 113 to 117, line 145 ("`config` is a required argument"), and the return type `Uint8Array<ArrayBuffer>[]` of `copySegment` at lines 31 and 65. `rfc/README.md` has the status `superseded` and no rule for a partial change of an accepted RFC.

**Proposal of the finder.** Add a section "Changes to accepted RFCs" to the cursor RFC. List each reversed decision with its date: the wide write methods, the `config` argument of a container writer, the view parameter of `IsoInt64Reader`, and the return type of a writer. Reword line 241 to "The option, the exported names and the type rules do not change. The four view methods become functions." Plan one amendment of each accepted RFC in the pull request that implements the cursor, with a dated line in its Final Decision section, as the `int64` RFC already does.

**Proposal after verification.** Keep the proposal with these changes.

1. Add the section "Changes to accepted RFCs" to rfc/iso-bmff-cursor-api.md before the RFC PR opens. List four changes: (a) the wide write methods become functions, and the reason of the 2026-11-10 decision still holds because the read side also becomes functions, (b) a container writer takes no `config` argument and reads the writers from the cursor, which brings back the run-time failure that the container RFC rejected, so state the new rule (the cursor RFC contract already says that `writeIsoBoxes` throws for a box with no writer), (c) the first parameter of `IsoInt64Reader` becomes a read cursor of either mode and the function calls `readUint32`, `readInt32`, or `readUint64`, (d) a writer returns `void` and `writeIsoBoxes` returns one array.

2. Do not write "the type rules do not change" yet. The cursor type of line 146 (`readers?: IsoBoxReaderMap<V>`) is invariant in `V`, so a reader typed `IsoBoxReadCursor<IsoInt64>` rejects a cursor of either mode. Either change the field to `readers?: IsoBoxReaderMap` (the default instantiation, as IsoBoxReadView.ts line 40 does today) and repeat the type spike of the int64 RFC for the cursor, or add the variance of the cursor to Unresolved questions. Reword line 241 to: "The option and the exported names do not change. The four view methods become functions. Section Changes to accepted RFCs lists each rule that changes."

3. Amend the two accepted RFCs in the pull request that implements the cursor, with a dated "Amended on" line in each Final Decision section. This timing matches uint64-reader-config.md line 465. Do not amend earlier, because both RFCs describe the code on main today.

4. Link the amendment plan to Unresolved question 1 (release order). If version 2.0.0 replaces the view methods before any release, `implemented-in` of both accepted RFCs names a version whose API differs from the RFC text, so the amendments are required in that case.

5. Optional: add one sentence to rfc/README.md under Status Lifecycle that a later RFC records a partial change of an accepted RFC with a dated line in its Final Decision section.


**Result.** Done in PR 682 (8435c2ae0), section "Changes to accepted RFCs".

## G502: The RFC has no migration guide, no deprecation release, no list of the dependent packages in this repository, and no decision on the two open items that the accepted RFCs left for a major version.

Severity medium. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:35`, `rfc/iso-bmff-cursor-api.md:271`, `rfc/iso-bmff-cursor-api.md:274`, `rfc/iso-bmff-cursor-api.md:275`, `libs/iso-bmff/CHANGELOG.md:9`, `libs/c2pa/package.json:60`, `libs/drm/package.json:57`, `libs/c2pa/src/utils.ts:122`, `libs/drm/src/ensureEncryptedInit.ts:183`, `rfc/uint64-reader-config.md:442`, `rfc/iso-bmff-container-readers-writers.md:188`, `AGENTS.md:71`

**Evidence.** AGENTS.md: "Avoid breaking changes. If one is unavoidable, provide migration guidance in the changelog and the docs." The RFC has one line on migration, question 4: "Should version 2.0.0 export a function that adapts a version 1 custom reader? The default answer is no." No section plans a migration guide. (1) Release order, question 1: "The `[Unreleased]` section has additions to the view classes, such as `readWideUint`." The section has 104 entries, 33 of them name a view class or the `view` field, and about 50 are under `### Fixed`. If version 2.0.0 is the next release, every fix reaches an adopter only with the full migration, and those 33 entries describe an API that no release contains. (2) No step marks `IsoBoxReadView`, `IsoBoxWriteView` and the view methods as `@deprecated` in a 1.x release. (3) Two packages of this repository have the peer dependency `"@svta/cml-iso-bmff": "*"`. `@svta/cml-c2pa` declares `view: IsoBoxReadView` and reads `usertype`. `@svta/cml-drm` joins the per-box result by hand: `const chunks = writeIsoBoxes(boxes, { writers })`. A major version needs a code change and a peer range change in both. (4) The `int64` RFC lists for a major version: "A major release could make `readInt64AsBigInt` the default." The cursor RFC does not record a yes or a no. (5) The container RFC lists the drawback "`readVttc` and `readVttC` differ in one letter", kept only to avoid a break. The cursor RFC says at line 35 "The built-in readers and writers keep their names", and question 5 asks only about the new names.

**Proposal of the finder.** Add a section "Migration" with four items: a guide `docs/migrating-to-v2.md` with one row for each removed member, a 1.x release that ships the unreleased fixes and marks the removed API as `@deprecated`, the changes for `@svta/cml-c2pa` and `@svta/cml-drm` with their version bumps, and the test files that move from view methods to field functions. Add two unresolved questions: the default of the `int64` option in version 2, and whether version 2 renames built-in functions such as `readVttc` and `readVttC`.

**Proposal after verification.** Make four small edits to the RFC, with no "Migration" section of four items.

1. Add one sentence to the reference-level text: version 2.0.0 ships `docs/migrating-to-v2.md` with one row for each removed class member and each removed box field, and the changelog links to it. AGENTS.md requires that guidance for a breaking change.
2. Add one Drawbacks entry for the dependent packages. `@svta/cml-c2pa` reads `view` and `usertype` of a `uuid` box, and `@svta/cml-drm` joins the result of `writeIsoBoxes`. Both change in the same PR. Their published peer range is `^1.0.7`, so `npm run prepare-release` gives each a patch bump with the range `^2.0.0`. An adopter who uses c2pa or drm together with iso-bmff 1 must upgrade both. Name the c2pa `uuid` read as the test case for the "no `view`, no `usertype`" contract.
3. Add the changelog numbers to question 1 (104 unreleased entries, 48 under Fixed, 33 that name a view class) and link PR 681. Add one new question: is a patch the right bump for c2pa and drm when the peer range moves to a new major version?
4. Extend question 5 (Names): does version 2 rename `readVttc`, `readVttC`, `writeVttc`, and `writeVttC`, which differ only in case?

Drop three items. Drop the `@deprecated` 1.x release, or defer it to a 1.x patch that ships after 2.0.0 and links to the guide. Move the test file list to `plans/`. Do not add an `int64` default question. Instead, state the answer in one sentence next to line 241: the default of the `int64` option stays `number` in version 2.

**Prior decision.** No decision makes the gaps intentional. Three related records: (1) RFC question 1 and the open PR 681 (release prep of iso-bmff 1.1.0, created 2026-11-17 UTC) already handle the release order. PR 616, an earlier 1.1.0 release prep, closed without a merge on 2026-11-10. (2) rfc/uint64-reader-config.md, accepted 2026-11-11 (PR 613), keeps `number` as the default of the `int64` option and lists a `bigint` default only under Future possibilities. (3) rfc/iso-bmff-container-readers-writers.md, accepted 2026-11-12 (PR 622, implementation PR 654), kept `readVttc` and `readVttC` and recorded the one-letter difference as a drawback.

**Result.** Done in PR 682 (8435c2ae0): Migration section, a drawback, numbers in question 1, names in question 5.

## G484: The RFC has no field function that reads or writes an 8-byte field as a `number`, and `readUint64` returns a `bigint` in a family of functions that return a `number`.

Severity medium. Category naming. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A custom reader, a custom `int64` function, or a custom writer that calls `readUint(8)`, `readInt(8)`, `writeUint(value, 8)` or `writeInt(value, 8)` has no replacement in the table.

**Files.** `rfc/iso-bmff-cursor-api.md:180`, `rfc/iso-bmff-cursor-api.md:181`, `rfc/iso-bmff-cursor-api.md:182`, `libs/iso-bmff/src/utils/readUint.ts:27`, `libs/iso-bmff/src/utils/readInt.ts:18`, `libs/iso-bmff/src/createInt64OverflowReader.ts:24`, `libs/iso-bmff/src/IsoBoxReadView.ts:99`, `libs/iso-bmff/src/IsoBoxReadView.ts:240`, `libs/iso-bmff/src/IsoBoxWriteView.ts:90`, `libs/iso-bmff/src/IsoBoxWriteView.ts:152`, `libs/iso-bmff/src/IsoInt64Reader.ts:11`

**Evidence.** RFC rows: `view.readUint(size)` becomes `readUint8`, `readUint16`, `readUint24`, `readUint32`. `view.readInt(size)` becomes `readInt8`, `readInt16`, `readInt32`. `view.readUint64()` becomes `readUint64`. In the source, `readUint` and `readInt` both have `case 8:` and return a `number`. `createInt64OverflowReader` needs that path: `const value = signed ? view.readInt(size) : view.readUint(size)` with a size of 8. The default path needs the same read: `this.readWideUint = this.readUint`. The TSDoc of `IsoInt64Reader` says: "The function must not call `readWideUint` or `readWideInt`", so a custom `int64` function cannot use the wide functions for a `number`. `readUint64 = (): bigint` returns a `bigint`. In the RFC it stands next to `readUint32`, which returns a `number`, and the name shows no difference. The write side has the same gap: `writeUint` has `case 8:` with the all-bits-set rule, and `writeInt` has `case 8:`. The table has no signed 64-bit function.

**Proposal of the finder.** Add `readUint64AsNumber` and `readInt64AsNumber` (and the two write functions), or name the `bigint` functions `readBigUint64` and `readBigInt64` after the `DataView` methods `getBigUint64` and `getBigInt64` and give `readUint64` and `readInt64` the `number` result. State in the table which function `createInt64OverflowReader` calls.

**Proposal after verification.** Use the second proposal only, and drop `readUint64AsNumber` and `readInt64AsNumber`. In the cursor RFC table: `view.readUint(8)` becomes `readUint64` and `view.readInt(8)` becomes `readInt64`, both return a `number` with the same rounding as today. `view.readUint64()` becomes `readBigUint64`, and the planned signed partner is `readBigInt64`. The write side gets `writeUint64(cursor, value: number)` with the all-bits-set rule, `writeInt64(cursor, value: number)`, and `writeBigUint64(cursor, value: bigint)` with the `RangeError`. Add three statements to the RFC. First, `createInt64OverflowReader` and the default path of `readWideUint` and `readWideInt` call `readUint64` and `readInt64`. Second, an `int64` function reads with `readUint32`, `readInt32`, `readUint64`, `readInt64`, or `readBigUint64`, never with the wide functions. Third, a custom reader that follows the option calls `readWideUint(cursor, 8)`, and `writeWideUint` and `writeWideInt` keep the `number | bigint` value. The TSDoc of `readUint64` and `readInt64` must state the 2^53 limit and name `readBigUint64` and `readWideUint`. Amend the future possibility at rfc/uint64-reader-config.md:443 to the name `readBigInt64`. If version 1.1.0 publishes `view.readUint64(): bigint` first (unresolved question 1 of the cursor RFC), the migration table must show that the name changes to `readBigUint64`. TypeScript reports the type difference at compile time.

**Prior decision.** Issue 611 and PR 612 (cf6add83e) chose `readUint64(): bigint` and `writeUint64(value: bigint)` on purpose, and the accepted RFC rfc/uint64-reader-config.md (lines 263 and 443) keeps the name and plans `readInt64` as the signed `bigint` partner. The decision covers the class API, where `readUint(8)` is the `number` form. The methods are unreleased, and the draft cursor RFC lists its sized names as open (unresolved question 5). No prior decision covers the missing 8-byte `number` field functions.

**Result.** Not done. Open for the RFC review.

## G486: The RFC adds 32 exports with generic names and no `Iso` token, next to 6 new functions that have the token.

Severity medium. Category naming. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:180`, `rfc/iso-bmff-cursor-api.md:187`, `rfc/iso-bmff-cursor-api.md:191`, `rfc/iso-bmff-cursor-api.md:275`, `libs/iso-bmff/src/utils/readString.ts:3`, `libs/iso-bmff/src/utils/readUint.ts:1`, `libs/iso-bmff/src/utils/writeChildBoxes.ts:16`

**Evidence.** The table gives 16 read names: `readUint8`, `readUint16`, `readUint24`, `readUint32`, `readInt8`, `readInt16`, `readInt32`, `readUint64`, `readWideUint`, `readWideInt`, `readTemplate16`, `readTemplate32`, `readString`, `readUtf8`, `readBytes`, `readChildBoxes`. Line 191 adds the same 16 with the `write` prefix. The structural functions of the same RFC have the token: `seekIsoBox`, `beginIsoBox`, `endIsoBox`, `createIsoBoxReadCursor`. Unresolved question 5 lists the names as proposals and does not mention the token. The names collide in practice. The package has internal functions with the same names and other signatures: `readString(dataView: DataView, offset: number, length: number)`, `readUint(dataView, offset, size)`, `writeChildBoxes(boxes, config)`. The local hls.js checkout declares `readUint16`, `readUint32`, `readUint64` and `writeUint32` with the signature `(buffer, offset)` in `src/utils/mp4-tools.ts` (lines 77, 82, 91, 121), which is the file that would import the CML functions. The audit of version 1 already reports generic export names as a defect.

**Proposal of the finder.** Add the token to every field function: `readIsoUint32`, `writeIsoUint32`, `readIsoBytes`, `readIsoChildBoxes`. A bundler shortens the names, so the bundle size does not change. If the short names stay, record that decision and its reason under Unresolved question 5.

**Proposal after verification.** Do not rename all 32 names in the audit. Extend Unresolved question 5 of rfc/iso-bmff-cursor-api.md so that the maintainer decides the token before version 2.0.0 is published (after that, a rename breaks adopters). The question must state three facts: (a) the collision with player helpers, with hls.js mp4-tools.ts as the example and the error-codes RFC as the precedent, (b) the settled names `readInt64AsBigInt`, `createInt64OverflowReader`, `readWideUint`, and `readWideInt` have no token, so a token on the other names needs either an exception for those names or a change to the accepted int64 RFC, (c) the about 170 box functions (`readTfdt`) have no token. Options to list: keep the short names and document the alias or `import * as iso` form in the README, or add the token to all field functions including the wide functions (`readIsoUint32`, `readIsoWideUint`) and keep `readInt64AsBigInt` as a named exception. My recommendation is the short names: the cursor argument already ties each function to the package, the collision fails at compile time, and custom readers stay short. Record the reason in the RFC in both cases.

**Prior decision.** Partial only. rfc/uint64-reader-config.md:458 (accepted RFC, PR 613, implemented in PR 645) settles `readWideUint`, `readWideInt`, `writeWideUint`, `writeWideInt`, `readInt64AsBigInt`, and `createInt64OverflowReader` without the `Iso` token. rfc/iso-bmff-cursor-api.md:241 states that those names do not change. No decision covers the other 28 field function names. rfc/error-codes.md:140 is a precedent in the other direction (prefix to avoid collisions with player identifiers).

**Result.** Done in PR 682 (8435c2ae0). Question 5 asks for the `Iso` token.

## G490: The cursor field names `pos` and `end` are abbreviations with no stated origin, and the RFC gives the words `view`, `bytes` and `cursor` meanings that differ from version 1.

Severity medium. Category naming. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:143`, `rfc/iso-bmff-cursor-api.md:144`, `rfc/iso-bmff-cursor-api.md:145`, `rfc/iso-bmff-cursor-api.md:152`, `rfc/iso-bmff-cursor-api.md:159`, `rfc/iso-bmff-cursor-api.md:197`, `libs/iso-bmff/src/IsoBoxReadView.ts:90`, `libs/iso-bmff/src/IsoBoxReadView.ts:128`, `libs/iso-bmff/src/utils/readUint.ts:2`, `libs/iso-bmff/src/ParsedBox.ts:14`

**Evidence.** RFC: `pos: number`, `end: number`. The public members of version 1 use full words: `byteOffset`, `byteLength`, `bytesRemaining`. The RFC does not state the origin of `pos`: the start of `view`, or the start of the `ArrayBuffer`. Version 1 has both forms and converts between them: `this.offset = this.dataView.byteOffset` (absolute), `return this.offset - this.dataView.byteOffset` (the public `cursor`, relative), and `const cursor = offset - dataView.byteOffset` in each read helper. Line 197 tells the caller to change the value: "The caller moves `cursor.pos` past the fields." A caller with a `Uint8Array` that has a byte offset needs the origin. Three words change meaning. `cursor` is a `number` getter in version 1 and an object in the RFC. `view` is an `IsoBoxReadView` on a parsed box (`view: IsoBoxReadView<V>`) and a `DataView` on the cursor, in the same RFC that says the field `view` "does not exist". `bytes` is the complete box in `IsoRawBox` and the output buffer with unused capacity in `IsoBoxWriteCursor`. The project prose rule is one name for one thing.

**Proposal of the finder.** Name the fields `offset` and `endOffset` (or `position` and `endPosition`), and state that both count from the start of `view`. Name the write buffer `buffer` and keep `bytes` for a complete box. Add the row "`view.cursor` becomes `cursor.offset`" to the method table.

**Proposal after verification.** Keep `pos`, `end` and `view`. Edit the RFC text before acceptance (PR 682), with no code change:

1. State the origin in the Contract section: "`pos` and `end` count bytes from the start of `cursor.view`, not from the start of the `ArrayBuffer`. `cursor.view.getUint8(cursor.pos)` reads the next byte." State also that `end` is exclusive.
2. State the write cursor fields: "`bytes` and `view` cover the complete buffer, with unused capacity. The written bytes are `bytes.subarray(0, pos)`. Both fields change when the buffer grows, so a writer must not keep a reference to them." If the maintainers want a different name for the write field, use a name that states capacity and is not `buffer`, because `buffer` is an `ArrayBufferLike` on every platform view. Add the field names to unresolved question 5 so that reviewers decide them once.
3. Add the state members of version 1 to the method table: `view.cursor` becomes `cursor.pos`. `view.bytesRemaining` becomes `cursor.end - cursor.pos`. `view.done` becomes `cursor.pos >= cursor.end`. `view.jump(size)` becomes `cursor.pos += size`. State the replacement for `view.slice`, `view.readBox`, `byteLength`, `byteOffset` and `buffer`, or state that they have none. `readFtyp`, `readTenc` and four files of `@svta/cml-c2pa` use these members today.
4. Add one sentence to the Drawbacks or the migration text: a version 1 reader names its parameter `view` (an `IsoBoxReadView`), and in version 2.0.0 `cursor.view` is a `DataView`.

If the maintainers still want longer names, `position` is better than `offset`, and the size cost of the longer property name in every field function needs a measurement first.


**Result.** Not done. Open for the RFC review.

## G471: The RFC does not list the two CML packages that depend on iso-bmff, and the release script gives them a patch version whose peer range moves to a new major.

Severity medium. Category package-config. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A release of drm and c2pa that requires `@svta/cml-iso-bmff` 2 rejects an installed version 1. An adopter who uses drm or c2pa together with version 1 code gets a peer conflict.

**Files.** `libs/drm/package.json:57`, `libs/c2pa/package.json:60`, `scripts/publish.ts:74`, `scripts/prepareRelease.ts:147`, `rfc/iso-bmff-cursor-api.md:237`, `rfc/iso-bmff-cursor-api.md:243`

**Evidence.** Both packages declare `"@svta/cml-iso-bmff": "*"` (drm/package.json:57, c2pa/package.json:60). The publish script writes a caret range: ``peerDependencies[dep] = `^${packages[dep][2].version}` `` (publish.ts:74). The release script bumps a dependent with `npm --no-git-tag-version version ${isPrerelease ? 'prerelease' : 'patch'}` and the changelog line ``Update `${dep}` to ${newVersion}`` (prepareRelease.ts:132-147). So drm 1.1.12 becomes 1.1.13 and c2pa 1.7.0 becomes 1.7.1, each with the peer range `^2.0.0`. Both packages also need code changes. c2pa: 4 uses of `box.view.readData`, 2 uses of `usertype`, 1 direct `writeEmsg` call in a test. drm: the result of `writeIsoBoxes` (ensureEncryptedInit.ts:183-192) and 16 factory calls. The RFC Drawbacks (lines 237-243) count "87 readers" and "85 writers" and name no dependent package. A search of the RFC for `drm` and `c2pa` found no match.

**Proposal of the finder.** Add a section "Packages in this repository" to the RFC with the call sites above and their 2.0 form. State the version rule for drm and c2pa in the RFC: a minor or a major version with a changelog entry that names the new peer major, set with `npm run ver` before `npm run prepare-release`, so the automatic patch does not apply. The workspace link makes the 2.0 pull request change both packages in any case.

**Proposal after verification.** Do not add a call-site section to the RFC. Add one bullet to Drawbacks in rfc/iso-bmff-cursor-api.md: "Two packages in this repository change with the release: `@svta/cml-drm` and `@svta/cml-c2pa`. Their next release requires `@svta/cml-iso-bmff` 2 and rejects version 1. Their public API does not change." Add one item to Unresolved questions: which version level drm and c2pa get. Option A is the automatic patch of `prepare-release` (PR 531). An adopter with `^1` ranges for drm or c2pa and for iso-bmff then gets a peer conflict on the next update. Option B is a major version of drm and c2pa, set with `npm run ver` before `npm run prepare-release` (prepareRelease.ts:115 then skips them), with a changelog entry that names the new peer major. Option B also gives cmaf-ham a cascade patch for the drm peer. A minor version is not an option, because a `^1` range accepts it. Recommendation: option B. Put the call sites (c2pa: four `view.readData` uses, two `usertype` uses, one `writeEmsg` test call. drm: ensureEncryptedInit.ts:183-192) in the plan files and the description of the 2.0 pull request.

**Prior decision.** PR 531 (commit 673e33b3a, "chore(release): publish caret peer ranges instead of exact pins"): "A dependent gets a cascade bump only when the published range rejects the new peer version, such as a major bump." AGENTS.md:34 documents the same rule. Precedent: c2pa 1.4.1 released a peer range change as a patch (libs/c2pa/CHANGELOG.md:82). These show that the patch cascade is intentional. None of them decides the version level for a dependent whose own code must change with the peer major.

**Result.** Done in PR 682 (b6b0c4296). Decided on 2026-11-17: a major version for drm and c2pa.

## G494: The `uuid` contract contradicts the reader contract of the same RFC, and the RFC states no rule for the `usertype` of a `uuid` box with no reader or for a `uuid` writer.

Severity medium. Category spec-compliance. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** A parsed `uuid` box loses the `usertype` field, and a `uuid` reader starts 16 bytes earlier than in version 1.

**Files.** `rfc/iso-bmff-cursor-api.md:91`, `rfc/iso-bmff-cursor-api.md:170`, `rfc/iso-bmff-cursor-api.md:199`, `libs/iso-bmff/src/IsoBoxReadView.ts:355`, `libs/iso-bmff/src/IsoBoxReadView.ts:388`, `libs/iso-bmff/src/IsoBoxReadView.ts:397`, `libs/iso-bmff/docs/reading-boxes.md:91`, `libs/iso-bmff/test/incompleteBoxHeader.test.ts:267`, `libs/c2pa/src/utils.ts:136`

**Evidence.** RFC line 91: "The position of the cursor is the first byte after the box header." RFC line 199: "A reader for a `uuid` box reads the 16 bytes of the user type." ISO/IEC 14496-12:2015 clause 4.2 puts the field inside `class Box`: `if (boxtype=='uuid') { unsigned int(8)[16] usertype = extended_type; }`. The package uses the same definition: "The header of a `uuid` box has 16 more bytes for the `usertype` field" (TSDoc and reading guide), and `const headerSize = box?.type === 'uuid' ? cursor + 16 : cursor`. Under that definition, line 91 places the cursor after `usertype`, and line 199 places it before. Version 1 reads the field into the box (`box.usertype = this.readArray('uint', 1, 16)`) and gives the reader a view after it. A test asserts the field for a box with no reader: `assert.deepStrictEqual(boxes[0]?.usertype, Array.from(usertype))`. `@svta/cml-c2pa` selects its box with that field: `box.type === 'uuid' && isC2paUuid(box.usertype ?? [])`. Under the RFC, a `uuid` box with no reader is `{ type, bytes }` with no user type. `beginIsoBox(cursor, type)` has no parameter for the user type, and no line states who writes it. The RFC also does not keep the version 1 rule that a `uuid` box shorter than its header plus 16 bytes is truncated.

**Proposal of the finder.** State one rule. Proposed: the box header in the reader contract ends after `size`, `type` and `largesize`. A `uuid` reader reads `usertype` first. A raw `uuid` box is `{ type: 'uuid', usertype: Uint8Array, bytes }`. `beginIsoBox(cursor, 'uuid', usertype)` writes the field. A `uuid` box with fewer than 16 bytes after the header is truncated.

**Proposal after verification.** Keep the spec definition of the box header. Do not define the header as the bytes up to `largesize`: clause 4.2 and PR 664 include `usertype`, and reading-boxes.md:91 states it. Write an explicit exception in the RFC contract instead. (1) Reader: "For a `uuid` box, the position of the cursor is the first byte of `usertype`. The reader reads the 16 bytes with `readBytes(cursor, 16)`." The cursor then needs no extra field, and other boxes pay no cost. (2) Truncation: keep the PR 664 rule in the contract. `readIsoBoxes` and `seekIsoBox` treat a `uuid` box with a size below its header plus 16 bytes as truncated. (3) Raw box: `IsoRawBox = { type: IsoBoxType; bytes: Uint8Array; usertype?: Uint8Array }`. The tree reader sets `usertype` only for a `uuid` box, as a 16-byte view into `bytes` (not `number[]`). `writeIsoBoxes` copies `bytes` and ignores `usertype`, and the RFC states that. This keeps the version 1 pattern `box.type === 'uuid' && match(box.usertype)` of `@svta/cml-c2pa` and hides the `largesize` offset. (4) Writer: no third parameter on `beginIsoBox`. A `uuid` writer calls `beginIsoBox(cursor, 'uuid')` and then `writeBytes(cursor, box.usertype)`. This form mirrors the reader, adds no export, and adds no branch to a function that every box calls. (5) Add `uuid` to the migration notes: `usertype` changes from `number[]` on every parsed `uuid` box to `Uint8Array` on a raw `uuid` box, and a custom `uuid` reader starts 16 bytes earlier.

**Prior decision.** PR 664 (commit 9103e4548, issue 660, closed as completed 2026-11-16) is a decision for version 1: the header of a `uuid` box includes the 16 bytes of `usertype`, and `readIsoBoxes` stops before a `uuid` box with a size below 24, or below 32 with `largesize`. That decision supports the finding: the RFC must keep the rule or state the change. No decision covers the RFC text. rfc/iso-bmff-cursor-api.md has `status: draft`, and its line 230 says the trial build has no `uuid` user type.

**Result.** Done in PR 682 (b6b0c4296). Decided on 2026-11-17: the `uuid` rules of the contract.

## G481: The RFC cursor makes `int64` optional for `bigint` fields, which drops the accepted rule that a type with `bigint` fields always has the function.

Severity medium. Category type-design. Breaking: no. Fact check: confirmed. Value check: confirmed.

**Files.** `rfc/iso-bmff-cursor-api.md:147`, `rfc/uint64-reader-config.md:200`, `libs/iso-bmff/src/IsoBoxReadViewConfig.ts:18`, `libs/iso-bmff/src/IsoBoxReadView.ts:80`

**Evidence.** RFC line 147: `int64?: IsoInt64Reader<V>` for every `V`. The accepted RFC line 200: "`new IsoBoxReadView<bigint>(buffer)` are compile errors, so a type that promises `bigint` fields always has the function that produces them." The source has the conditional `[V] extends [bigint] ? { int64: IsoInt64Reader<V> } : { int64?: ... }` and the constructor rest parameter `...config: [V] extends [bigint] ? [config: ...] : [config?: ...]`. The cursor is a plain object, so an adopter can write it by hand. In my TypeScript 6.0.3 model, `const c: IsoBoxReadCursor<bigint> = { view, pos: 0, end: 0 }` compiles. `readTfdt(c).baseMediaDecodeTime` then has the type `bigint` and the value is a `number`.

**Proposal of the finder.** Use the same conditional in the cursor type: `& ([V] extends [bigint] ? { int64: IsoInt64Reader<V> } : { int64?: IsoInt64Reader<V> })`. State the same rule for the `config` argument of `seekIsoBox` and `createIsoBoxReadCursor`.


**Result.** Done in PR 682 (8435c2ae0). A `bigint` cursor requires `int64`.

## F433: Gap: a parsed box will have no byte position after the RFC, and all three players need the position and the size of a box.

Severity low. Category api-surface. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/iso-bmff/src/ParsedBox.ts:14`, `libs/iso-bmff/src/IsoBoxReadView.ts:401`, `rfc/iso-bmff-cursor-api.md:181`

**Evidence.** Today the position is available only through `box.view.byteOffset` and `box.size` (`box.view = this.slice(offset, actualSize)`). The RFC contract says "A parsed box has only `type` and its fields." This finding does not ask to keep `view` or `size`. It states the use cases that then have no API. (1) sidx: the first referenced byte is the end of the sidx box plus `first_offset`. hls.js: `startByte = sidx.length + firstOffset` (src/utils/mp4-tools.ts:526). shaka-player: `anchorOffset + box.size + firstOffset` (lib/dash/mp4_segment_index_parser.js:130). dash.js: `sidx.offset + sidx.first_offset + sidx.size` (src/dash/SegmentBaseLoader.js:298). (2) trun: `data_offset` is relative to the moof box. dash.js: `moofBox.offset + dataOffset` (src/streaming/utils/BoxParser.js). hls.js stores `moofOffset` for each traf (src/utils/mp4-tools.ts:1170). (3) Init range: dash.js findInitRange uses `moov.offset + moov.size - 1`. (4) EME needs the complete bytes of a pssh box (shaka-player lib/util/pssh.js:74). (5) Patches in place: shaka-player content_workarounds.js and hls.js mp4-tools.ts:311 to 382 write at `box.start` offsets.

**Proposal of the finder.** Decide the replacement in the RFC. Lowest cost: an opt-in config flag that adds `offset` and `size` (numbers, relative to the input) to each box of readIsoBoxes, and `pos` and `end` of the cursor from seekIsoBox documented as the position of the box body. Document how to get the bytes of a parsed pssh box.

**Proposal after verification.** No config flag and no `offset` or `size` field on parsed boxes. Amend the RFC before acceptance:

1. Contract: state the coordinates of the read cursor. `pos` and `end` are byte offsets in `cursor.view`. `createIsoBoxReadCursor` builds the view over the input, so the offsets are relative to the input (version 1 `view.byteOffset` is relative to the ArrayBuffer). For the cursor that a reader receives and for the cursor from `seekIsoBox`, `end` is the first byte after the box. That value is the sidx anchor point.

2. Add `start` to `IsoBoxReadCursor`: the first byte of the box header. `pos - 8` is not reliable, because a header has 8, 16, 24, or 32 bytes (largesize, uuid). The cost is one assignment for each box. `start` gives the moof base for trun and the complete pssh bytes: `new Uint8Array(view.buffer, view.byteOffset + start, end - start)`. If the maintainers reject `start`, list the question under Unresolved questions.

3. Guide: show that an adopter keeps a position by wrapping a reader, with the capture before the read: `sidx: c => { const end = c.end; return { ...readSidx(c), end } }`. Show the same for `moof` with `start`, and the pssh bytes case. Only the adopter who needs a position pays for it, and the built-in readers and box types do not change.

4. Drawbacks line 238: name this replacement for `view.byteOffset` and `size`, and note that a raw box already has `bytes.byteOffset` and `bytes.byteLength`.

The change is additive to the RFC design, so it breaks no adopter beyond the removal that the RFC already declares. It can ship after 2.0.0 as well, but the migration text of 2.0.0 needs it.

**Prior decision.** None found that makes the missing position intentional. The RFC at rfc/iso-bmff-cursor-api.md:238 records the removal of `view` and `size` as a known drawback and names the raw box as the path for the bytes of a box. The RFC is a draft (commit 8ce63c212), not accepted.

**Result.** Partly done by question 13 of the RFC (the `start` field).

## G476: The RFC has no migration text for a direct call of a built-in writer, and the only in-repo direct call depends on the `buffer` of the write view.

Severity low. Category docs. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `libs/c2pa/test/vsi/vsiTestUtils.ts:316`, `rfc/iso-bmff-cursor-api.md:158`, `rfc/iso-bmff-cursor-api.md:237`, `libs/iso-bmff/src/IsoBoxWriteView.ts:30`

**Evidence.** `return new Uint8Array(writeEmsg({ type: 'emsg', ... }).buffer)` (vsiTestUtils.ts:316-329). The call works because the view owns a buffer of the exact box size (`new DataView(new ArrayBuffer(size))`, IsoBoxWriteView.ts:20). The type of `buffer` is `ArrayBufferLike` (line 30), so the result is not a `Uint8Array<ArrayBuffer>`: a type check gave TS2322 for that assignment. RFC line 158: `type IsoBoxWriter<B> = (cursor: IsoBoxWriteCursor, box: B) => void`. RFC line 237 covers only custom readers and writers: "Every custom reader and custom writer changes." A direct call in 2.0 needs a cursor, the writer call, and a slice of `cursor.bytes` to `cursor.pos`. The RFC shows none of these steps.

**Proposal of the finder.** Add to the RFC and to the writing guide the one supported form for "one box, one writer": `writeIsoBox(box, { writers: { emsg: writeEmsg } })`. State that a direct writer call is for use inside another writer. Change the c2pa test helper to that form now, because it also compiles in version 1.

**Proposal after verification.** Add one bullet to the Drawbacks section of rfc/iso-bmff-cursor-api.md: "A direct call of a built-in writer changes. In version 1 the call returns an `IsoBoxWriteView`. In version 2.0.0 the writer takes a cursor and returns nothing." Show the two supported forms next to the bullet, and do not call the direct call unsupported. Simple form: `writeIsoBox(box, { writers: { emsg: writeEmsg } })`, which also compiles in version 1. Cursor form for callers that want no final copy: `const cursor = createIsoBoxWriteCursor({ capacity })`, `writeEmsg(cursor, box)`, `cursor.bytes.subarray(0, cursor.pos)`. In the 2.0 rewrite of libs/iso-bmff/docs/writing-boxes.md, replace the section at lines 193-208 (a writer result passed to `writeIsoBoxes`) with the same two forms. Change libs/c2pa/test/vsi/vsiTestUtils.ts:316-330 to `writeIsoBox({ type: 'emsg', ... }, { writers: { emsg: writeEmsg } })` now. That change is test-only and gives the same bytes.


**Result.** Done in PR 682 (8435c2ae0). A drawback shows two forms.

## G498: The RFC counts 87 readers and 85 writers, but the package has 84 reader functions and 84 writer functions, and two other statements in Motivation do not match the source.

Severity low. Category docs. Breaking: no. Fact check: confirmed. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:41`, `rfc/iso-bmff-cursor-api.md:44`, `rfc/iso-bmff-cursor-api.md:243`, `libs/iso-bmff/src/readers/index.ts:1`, `libs/iso-bmff/src/writers/index.ts:1`, `libs/iso-bmff/src/IsoBoxReadView.ts:99`, `libs/iso-bmff/src/IsoBoxReadView.ts:167`, `libs/iso-bmff/src/readIsoBoxes.ts:65`, `libs/iso-bmff/config/cml-iso-bmff.api.md:500`

**Evidence.** Line 243: "The change touches 87 readers. The change also touches 85 writers." `src/readers` has 88 files: `index.ts`, `defaultReaderConfig.ts`, the two factory files, and 84 `read*.ts` files. `src/writers` has 86 files: `index.ts`, `defaultWriterConfig.ts`, and 84 `write*.ts` files. The API report has 84 `read` functions besides `readIsoBoxes` and `readInt64AsBigInt`, and 84 `write` functions besides `writeIsoBox` and `writeIsoBoxes`. The numbers 87 and 85 are the file counts without `index.ts`. The accepted RFCs agree with 84: 65 readers plus 19 container readers. Line 41: "The class has 16 methods that are arrow function fields. As a result, each box allocates 16 functions." The class body has 15 arrow fields (14 public and the private `read`). With no `int64` option the two wide fields are aliases and allocate nothing: `this.readWideUint = this.readUint as ...`. Each view therefore allocates 15 functions with no option and 17 with the option. Line 44: "`readIsoBoxes` is the only entry point." `IsoBoxReadView` is a public class with a public constructor, `readBox`, `readBoxes` and an iterator, and `readIsoBoxes` is one line over it: `return new IsoBoxReadView(raw, config).readBoxes<ParsedIsoBox>()`.

**Proposal of the finder.** Write "84 readers, 84 writers, two reader factories and the two default configurations". Write "15 functions for each view, or 17 with the `int64` option". Write "`readIsoBoxes` and the `IsoBoxReadView` iterator both create a view for every box".

**Proposal after verification.** Fix the text in the open RFC PR 682 before the Final Decision, in four places.

1. Drawbacks: "The change touches 84 readers, two reader factories, and 84 writers." Name defaultReaderConfig and defaultWriterConfig only if the change edits them.
2. Motivation item 1: "The class has 16 public methods. Each view allocates 15 functions and a `DataView`, or 17 functions with the `int64` option."
3. Rejected alternatives, prototype item: replace "the 16 functions for each view" with "the 15 to 17 functions for each view".
4. Motivation item 4: replace "`readIsoBoxes` is the only entry point, and it creates a view for every box that it passes" with "Every entry point (`readIsoBoxes`, `IsoBoxReadView.readBoxes`, the iterator, and `readBox`) creates a view for every box that it passes." Also review the heading "A read decodes by default": with no `readers` in the configuration, a read decodes no leaf box. A heading such as "A read visits every box" matches the source.


**Result.** Done in PR 682 (8435c2ae0).

## G501: The RFC gives the writer a helper for the full box header and the box type, and gives the reader neither, so 41 readers repeat two bit operations.

Severity low. Category reader-writer-asymmetry. Breaking: no. Fact check: partly. Value check: partly.

**Files.** `rfc/iso-bmff-cursor-api.md:171`, `rfc/iso-bmff-cursor-api.md:188`, `rfc/iso-bmff-cursor-api.md:104`, `rfc/iso-bmff-cursor-api.md:128`, `libs/iso-bmff/src/IsoBoxReadView.ts:313`, `libs/iso-bmff/src/IsoBoxWriteView.ts:340`

**Evidence.** Write side: "`beginIsoFullBox(cursor, type, version, flags)` | Does the same and writes the version and the flags." Read side: "`view.readFullBox()` | `readUint32` and two bit operations", shown in the example as `const header = readUint32(cursor)`, `version: header >>> 24`, `flags: header & 0xffffff`. Version 1 has one method on each side: `readFullBox = (): FullBox` and `writeFullBox(version: number, flags: number)`. In the source, 41 reader files call `readFullBox` and 41 writer files call `writeFullBox`. Each of the 41 readers and each custom reader would repeat the shift and the mask. A wrong mask (`0xffff`) or a signed shift (`>>`) gives wrong flags with no error. The two sides also start at different places: a reader starts after the header (line 91), and a writer writes the header and the type (line 128).

**Proposal of the finder.** Keep the allocation-free form and name it. Export `readIsoVersion(header)` and `readIsoFlags(header)`, or export two constants for the shift and the mask. Or state in the RFC that a reader may call a helper `readIsoFullBoxHeader(cursor)` that returns the 32-bit value, and show the two expressions once in the guide as the rule.

**Proposal after verification.** Add no export. Change the RFC text before acceptance:
1. Line 188: map `view.readFullBox()` to "`readUint8` for the version and `readUint24` for the flags".
2. Lines 104 to 109: write the custom reader example as `version: readUint8(cursor), flags: readUint24(cursor), sequenceNumber: readUint32(cursor)`. Adopters copy this example, so it should contain no hand-written shift or mask.
3. Optional: state in one sentence that a built-in reader may read the two fields as one `readUint32` when a measurement shows a gain. That form stays internal and the round-trip fixture test covers it.
4. Optional: add one sentence to "Write a custom writer" that explains why the writer writes the header and the reader does not (the tree reader needs the type to select a reader).


**Result.** Done in PR 682 (8435c2ae0). The example reads `readUint8` and `readUint24`.
