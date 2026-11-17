# Rows that conflict with a recorded decision: details

The audit agents wrote this text. The index is in `findings.md`.

## F223: A bad box size stops the read silently, but a box that is too short for its fields throws a native RangeError and returns no boxes.

Severity medium. Category errors. Breaking: yes. Fact check: partly. Value check: partly.

**Why it breaks.** The error message changes, and the caller gets new information about the stop position.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:390`, `libs/iso-bmff/src/readIsoBoxes.ts:15`, `libs/iso-bmff/src/readers/readFtyp.ts:19`, `libs/iso-bmff/docs/reading-boxes.md:89`, `libs/iso-bmff/test/incompleteBoxHeader.test.ts:74`

**Evidence.** `if (!box || actualSize < headerSize || actualSize > bytesRemaining) { ... throw new Error('Truncated box') }` uses one message for three cases. A size below the header size is a corrupt size, not a cut box. The guide says `readIsoBoxes` stops and `The function does not throw.` Probe with defaultReaderConfig(): an `mvhd` box with a 6-byte body, and a version 1 `tfdt` box with a 4-byte time, each throw `RangeError: Offset is outside the bounds of the DataView`. An `ftyp` box with a 10-byte body throws the same error, because `const length = view.bytesRemaining / size` is 0.5 and the loop reads one more brand. The message names no box, no field and no offset. The caller also loses the boxes before that box. In the silent case, the caller cannot learn that the read stopped, or at which byte. A player with a partial download needs that offset.

**Proposal of the finder.** Write one rule in the RFC contract. (1) `readIsoBoxes` keeps the stop for a cut or bad box size. The read cursor reports the stop: after `readChildBoxes(cursor)`, `cursor.pos` is the first byte that was not read, so `cursor.pos < cursor.end` means an incomplete read. Document that pattern. (2) A field function that reads past `cursor.end` throws a RangeError with the function name, the offset and the bytes that remain. (3) Document in the guide that a box with a valid size and short fields throws.

**Proposal after verification.** Keep both rules and do three small things.
1. Now, in any release: add one sentence to the section "Incomplete boxes" of libs/iso-bmff/docs/reading-boxes.md and to the TSDoc of `readIsoBoxes`. Text: a box with a valid size whose fields need more bytes than the box has makes the reader throw a `RangeError`, and the caller then gets no boxes.
2. In the RFC contract: add one line. After `readChildBoxes(cursor)` on a cursor from `createIsoBoxReadCursor`, `cursor.pos` is the start of the first top-level box that was not read, or `cursor.end`. `cursor.pos < cursor.end` then means an incomplete read. This line keeps what `IsoBoxReadView.cursor` gives in version 1. A stop inside a child container does not change the position of the parent.
3. In the RFC implementation: the bounds check against `cursor.end` is library code, so the message is a free choice. Use one shared internal function that throws a `RangeError` with the offset and the bytes that remain. Do not put the function name in the message. The stack already has the name, and one literal for each field function adds bundle bytes.
Drop the point about one message for three cases: `readBox` does not exist in version 2. For `ftyp`, the version 2 reader becomes a loop, so write it as `while (cursor.end - cursor.pos >= 4)`. That loop reads no partial brand and costs nothing.

**Prior decision.** PR 662 (merged as 6c788e430, fixes issue 663): open decision "Stop or throw" resolved as stop, with the one message `Truncated box`. PR 661 (7d67e217a, issue 650) and PR 664 (9103e4548, issue 660) apply the same stop. PR 658: a reader throws a `RangeError` when the box ends inside a counted field (test/readers/readTenc.test.ts:184). Issue 668 closed as not planned: the error already goes to the caller. rfc/iso-bmff-cursor-api.md lines 195 and 198 already state the RangeError rule and the stop rule for version 2.

## G446: A number that does not fit its field is written with no error and with three different results, and a bigint in the same field throws a RangeError.

Severity medium. Category errors. Breaking: yes. Fact check: partly. Value check: partly. Merged duplicates: G524.

**Why it breaks.** A fix adds a thrown RangeError for a number, or changes the written bytes.

**Files.** `libs/iso-bmff/src/IsoBoxWriteView.ts:87`, `libs/iso-bmff/src/IsoBoxWriteView.ts:95`, `libs/iso-bmff/src/IsoBoxWriteView.ts:153`, `libs/iso-bmff/src/IsoBoxWriteView.ts:179`, `libs/iso-bmff/src/writers/writeSidx.ts:53`, `libs/iso-bmff/docs/writing-boxes.md:173`

**Evidence.** Run with defaultWriterConfig. `{type:'tfdt',version:0,baseMediaDecodeTime:2**32+5}` writes `00000010746664740000000000000005`, and a read returns 5. The same box with `2n**32n+5n` throws `RangeError: writeWideUint: value must be in the range 0 to 2^32 - 1`. Result 1, modulo: `dataView.setUint32(cursor, value)` (mfhd sequenceNumber 2**32 reads back 0, elst v0 mediaTime 2**31 reads back -2147483648). Result 2, all bits set: `if (s1 > 0xffffffff) { s1 = s2 = 0xffffffff }` (tfdt v1 with 2**65 or with -1 writes ffffffffffffffff). Result 3, mask: `ref.referencedSize & 0x7fffffff` (sidx referencedSize 2**31 reads back 0, ssix rangeSize 2**24 reads back 0). writeInt with 8 bytes has no limit: elst v1 mediaTime 2**63 reads back -9223372036854776000. The guide states the rule (`A writer does not check the range of a number`), so the behavior is documented. The error message of the bigint case names the internal method and not the box or the field.

**Proposal of the finder.** State one overflow rule in the contract of rfc/iso-bmff-cursor-api.md. Minimum: `writeWideUint` and `writeWideInt` throw the same RangeError for a `number` as for a `bigint`, because the version of the box decides the width of these fields. The message names the box type, the field, the range and the received value. For the fixed-size functions, document the modulo result of DataView in the TSDoc of each function.

**Proposal after verification.** Do not add a throw for a `number`. Keep the rule of PR 669 and RFC 613, and state it where adopters read it:
1. Add one line to the Contract section of rfc/iso-bmff-cursor-api.md: "A write field function does not check the range of a `number`. A 4-byte field keeps the low 32 bits. An unsigned 8-byte field writes all bits set for 2^64 or more. A `bigint` that does not fit the field throws a `RangeError`."
2. Add the same rule to the TSDoc of the fixed-size write functions and of the wide write functions (today IsoBoxWriteView.ts:57-65, 130-135, 164-177, 194-203).
3. Keep the `bigint` message as it is. In the cursor API the name in the message (`writeWideUint`) is a public export, and the message already has the range and the received value. Do not add the box type or the field name, because the strings cost bytes at 20 call sites.
4. Keep the mask in writeSidx.ts:53 and the equal masks in the other packed fields. A mask in a packed word is not an overflow rule.
If the maintainer wants a guard for the version 0 case (a `tfdt` time above 2^32 - 1 in a 4-byte field), raise it as a separate question with a measured size. The guard must be `value > 0xffffffff` only, so that `undefined` and `NaN` still write as today, and the 8-byte result of PR 669 must stay.

**Prior decision.** PR 669 (commit 67bd8d7af, merged 2026-11-16, fixes issue 653): "The number path still has no range check", chosen by the maintainer from three measured options, with the rule written in libs/iso-bmff/docs/writing-boxes.md:173. Accepted RFC 613, rfc/uint64-reader-config.md:260: a `number` goes to `writeUint(value, size)`, and only a `bigint` that does not fit throws a RangeError.

## G453: readHdlr returns the count byte of a QuickTime counted string as the first character of `name`.

Severity low. Category behavior. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** The returned `name` changes for a handler box with a counted string.

**Files.** `libs/iso-bmff/src/readers/readHdlr.ts:22`, `libs/iso-bmff/test/fixtureRoundTrip.test.ts:30`

**Evidence.** `name: view.readUtf8(-1)`. The three hdlr boxes of test/fixtures/240fps_go_pro_hero_4.mp4 return '\tGoPro AVC', '\tGoPro AAC' and '\tGoPro SOS'. The first character is the count 9. mp4dump of Bento4 returns 'GoPro AVC' for the same boxes. This was the only difference in a comparison of 2807 fields of the 15 fixtures with Bento4. The fixture test lists these boxes only as a byte exception (`writeHdlr adds a null byte to a name that has none`). ISO/IEC 14496-12 clause 8.4.3.3 defines `name` as a null-terminated UTF-8 string, so the input breaks the spec.

**Proposal of the finder.** In readHdlr, if the name has no null terminator and the first byte equals the count of the bytes after it, return the name without the first byte. If the project rejects this input, state the result in the QuickTime paragraph of docs/reading-boxes.md.

**Proposal after verification.** Keep the proposal with these changes. (1) State the exact condition: the name field has at least 1 byte, its last byte is not 0, and its first byte equals the count of the bytes after it. Then `name` is the UTF-8 text of the bytes after the first byte. A conforming box always ends with a null byte, so its result never changes. Do not use `pre_defined == 'mhlr'` as the condition. (2) The writer does not change (issue 647): it writes the name and a null byte. The written box then has the source size, and the moov box does not grow for a counted name. The EXCEPTIONS line `'240fps_go_pro_hero_4.mp4/hdlr/bytes': 3` stays, because the bytes still differ, and its comment needs a new text. Add a values test for the three names. (3) Add the result to the QuickTime paragraph of docs/reading-boxes.md in both cases, and a changelog entry. The docs sentence alone is do-anytime. An hdlr box with no name bytes still grows by 1 byte on a write. That case is out of scope and stays as issue 647 decided.

**Prior decision.** Issue 647 (closed as not planned, 2026-11-13): `writeHdlr` conforms to clause 8.4.3.3 and keeps the null byte. The issue body lists the count byte in `name` as an effect, but the closing comment decides only the writer. No decision on the reader exists.

## F27: Writers handle a missing field in three different ways: 0 for a number, an empty string for text, and a TypeError for an array or bytes

Severity low. Category errors. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A call that throws a TypeError today would write an empty field instead.

**Files.** `libs/iso-bmff/src/writers/writeEmsg.ts:31`, `libs/iso-bmff/src/writers/writeEmsg.ts:52`, `libs/iso-bmff/src/writers/writeEmsg.ts:57`, `libs/iso-bmff/src/writers/writeFree.ts:17`, `libs/iso-bmff/src/writers/writeSkip.ts:17`, `libs/iso-bmff/src/writers/writeFtyp.ts:19`, `libs/iso-bmff/src/writers/writeElst.ts:34`, `libs/iso-bmff/src/IsoBoxWriteView.ts:298`

**Evidence.** A probe against src shows: writeElng with no `extendedLanguage` writes an empty string. writeEmsg version 1 with no numeric field writes zeros. writeEmsg with no `messageData` throws `TypeError: Cannot read properties of undefined (reading 'length')` from `let contentSize = box.messageData.length`. writeFree with no `data` and writeFtyp with no `compatibleBrands` throw the same TypeError. writeElst with no `entries` throws `TypeError: box.entries is not iterable`. writeEmsg has `box.presentationTimeDelta ?? 0` and `box.presentationTime ?? 0`, although both fields are required in the types and the write of `undefined` already gives 0. The types mark all these fields as required, so only JavaScript callers and casts reach the difference. The settled rule says that a writer does not throw for a missing field.

**Proposal of the finder.** State one rule in the writing guide and apply it: a missing array or byte field is empty, as a missing number is 0. Remove the two `?? 0` defaults, or add the default to every field. The cursor API is the cheap moment for this change, because every writer is rewritten.

**Proposal after verification.** Do not add defaults for required fields. Replace the proposal with three steps:
1. State the rule once in docs/writing-boxes.md: the flags and the version decide which fields a writer writes. For a field that a flag declares and the type marks optional, a missing value is written as 0, an empty string, or an empty list. A field that the type marks required is the contract of the caller, and the result for a missing required field is not defined.
2. Remove the dead defaults on required fields: `?? 0` in writeEmsg.ts:52 and :57, and in writeSidx.ts:48. This changes no bytes and does not break adopters.
3. In the cursor rewrite, keep defaults only where the type has `?:`, and leave the list and count behavior to issue 625.

**Prior decision.** PR 626 (issue 623, commit 35a770189), PR 627 (issue 624, commit 5e3a42c9d) and PR 640 (issue 628, commit a720337f5) set the rule for fields that a flag declares and that the type marks optional: the flag decides, and a missing value is written as empty. No decision covers a missing required field. Issue 668 was closed as not planned on 2026-11-16 with no comment on the issue; it is a similar case, because only input that breaks the contract reaches the error and the error already goes to the caller. Issue 625 (open) owns the rule for count fields against list length.

## G460: A child box with `size` 0 extends to the end of its parent, but ISO/IEC 14496-12 defines `size` 0 only for the last box in the file.

Severity low. Category spec-compliance. Breaking: yes. Fact check: confirmed. Value check: partly.

**Why it breaks.** A fix changes the returned boxes for a container that holds a child with `size` 0 and is not the last box of the data: the child is no longer returned, or the read reports an error.

**Files.** `libs/iso-bmff/src/IsoBoxReadView.ts:383`, `libs/iso-bmff/docs/reading-boxes.md:91`

**Evidence.** `} else if (size === 0) { actualSize = bytesRemaining` (IsoBoxReadView.ts:383-384). `bytesRemaining` is the rest of the current view, which is the parent body for a child box. The guide says: "A `size` of 0 is valid and means that the box extends to the end of the data." (reading-boxes.md:91).

Spec text (14496-12:2015, clause 4.2, line 941 of the text file): "if size is 0, then this box is the last one in the file, and its contents extend to the end of the file (normally only used for a Media Data Box)".

Measured: a 24-byte `moov` that holds a `free` child with size 0 and then an 8-byte `free` sibling, followed by a top-level `free` box. The result is `moov.boxes: [{size: 0, type: "free", data: u8(8)}]`. The child takes the sibling as its data, with no error, although the `moov` box is not the last box. `writeIsoBoxes` then writes different bytes (the child gets size 16). A box with a `size` of 2 to 7 in the same position stops the read of the parent.

**Proposal of the finder.** Accept `size` 0 only when the box ends at the end of the complete input, which is the case for a top-level box and for a child whose ancestors all end there. Treat `size` 0 in any other position by the rule for a bad size. Correct the sentence in the guide to say "the end of the file" and to name the rule for a child box.

**Proposal after verification.** Keep the reader behavior. Do not add an end-of-input check. Change only the guide (libs/iso-bmff/docs/reading-boxes.md:91) and the TSDoc of `readBox`: "ISO/IEC 14496-12 defines a `size` of 0 only for the last box of a file. The reader accepts a `size` of 0 in any position. The box then extends to the end of the data, or to the end of the parent box for a child box." Do not write "the end of the file", because the reader does not know where the file ends. Optionally add one test that pins the child case. This change does not break adopters and can ship in any version.

**Prior decision.** PR 662 (commit 6c788e430, fixes issue 663, merged 2026-11-13) states "A `size` of 0 stays valid" and "The same rule applies to a child box of a container". The PR added the guide sentence and the tests "should read a last box with the size 0 to the end of the data". The PR did not discuss a `size` 0 child inside a parent that is not the last box, so the decision covers the leniency in general and not this exact case. Issue 668 (closed as not planned, 2026-11-16) sets the related rule: no change for a case that only bad input reaches.
