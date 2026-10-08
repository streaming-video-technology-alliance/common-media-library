# Implementation steps

Each step writes its tests first. Run the tests of a step before and after the change. The design is in `design.md`.

Commands, from the repository root with Node 24 or later:

```bash
npm ci
npm run build -w libs/c2pa
npm test -w libs/c2pa
npm run typecheck
npm test
```

## Pull requests

| PR | Steps | Content |
| --- | --- | --- |
| A | 1, 2 | The reader and its tests. No call site changes, so no behavior change. |
| B | 3 to 7 | The switch, the deletions, and the dependency change. |

PR B must not split across a release. A release with both decoders would ship cbor-x and the reader to every adopter. Both PRs merge before the next c2pa release, which carries the reader, the two accepted-input changes, and the other pending fixes together (see the sequence in `design.md`).

## Step 1: the reader

Files: `libs/c2pa/src/cbor/readCborItem.ts` with `CborTag`, `readCborItem`, and `decodeCbor`. Tests: `libs/c2pa/test/cbor/readCborItem.test.ts`.

Tests, written first:

1. Every row of the value model table in `design.md`, with the hex bytes of the input in a comment.
2. Every test of `test/cbor/decodeCbor.test.ts`, carried over. The blocklist tests invert: tags 28, 51, 259, and 0xdfff decode to a `CborTag`.
3. `readCborItem` returns `end` before the padding of a merkle box.
4. A nesting of 128 levels decodes. A nesting of 129 levels throws `RangeError`.
5. `CborTag.bytes` of a tagged COSE_Sign1 inside a map equals the original bytes of that item.
6. The nested preallocation case of PR 508 throws `RangeError`.
7. Tag 64 around a byte string (`d8 40 43 01 02 03`) decodes to a `CborTag` with tag 64, not to the byte string.

Done when: the tests pass, the typecheck passes, and `cbor/decodeCbor.ts` is unchanged.

## Step 2: equivalence with cbor-x

Files: `libs/c2pa/src/cbor/projectCborTags.ts`. Tests: `libs/c2pa/test/cbor/cborEquivalence.test.ts`.

Tests, written first:

1. For each of the three fixtures, read the manifest with `readC2paManifest`. Decode the claim box, the signature box, and every CBOR assertion box with cbor-x and with the reader. Compare the projected reader tree with the normalized cbor-x value through `deepStrictEqual`. Normalize the cbor-x value first. A `BigInt` up to 2^53 - 1 becomes a `number`. A `Tag` becomes `{ tag, value }`.
2. Repeat the comparison for every byte string inside those items that both decoders accept. This covers the COSE protected headers, the COSE keys, and the signer bindings.
3. Both decoders accept or both reject each malformed input of step 1. Tag 64 is the one expected difference: cbor-x returns the byte string, the reader a tag. No fixture contains it.

The prototype compared 19 items this way. Done when: the test passes on all three fixtures and reports the item count.

## Step 3: the manifest reader

Files: `libs/c2pa/src/readC2paManifest.ts`, `libs/c2pa/src/claim/InternalManifestData.ts`.

Tests, written first, in `test/readC2paManifest.test.ts`:

1. `C2paAssertion.data` of the session keys assertion in `vsi_init_with_signer_binding.mp4` holds a `Date` in `createdAt`.
2. `InternalAssertionData.taggedData` of that assertion holds a `CborTag` with tag 0 in `createdAt`.
3. A JSON assertion and a binary assertion have no `taggedData`.

Change: decode each CBOR box once with `readCborItem`. Store the tree in `taggedData`. Store `projectCborTags(tree)` in `data`. Delete `cborBytes`.

Done when: the c2pa tests pass and the API report is unchanged.

## Step 4: the session key validator

Files: `libs/c2pa/src/init/validateC2paInitSegment.ts`.

Tests, written first, in `test/init/validateC2paInitSegment.test.ts`:

1. The existing `createdAt` tests still fail with `SESSIONKEY_INVALID`: tag 1, no tag, and a date that does not exist.
2. The existing tests with an inline tagged signer binding pass. No new test can observe the re-encode. The signature covers only the protected header bytes and the payload, and both survive a re-encode.

Change: read `createdAt` and `signerBinding` from `taggedData`. Delete `decodeWithTags`, `CBOR_TAG`, `readTaggedKeyEntries`, `extractCborTaggedValue`, `CBOR_TAGGED_KEY`, the re-encode in `normalizeToUint8Array`, and the `cbor-x/encode` import.

Done when: the tests pass and `grep -n "cbor-x" libs/c2pa/src/init` prints nothing.

## Step 5: COSE, VSI, merkle, and the manifest-box hash

Files: `libs/c2pa/src/cose/decodeCoseSign1.ts`, `libs/c2pa/src/vsi/decodeVsiMap.ts`, `libs/c2pa/src/merkle/validateC2paMerkleSegment.ts`, `libs/c2pa/src/manifestbox/validateC2paManifestBoxSegment.ts`, `libs/c2pa/src/utils.ts`, `libs/c2pa/src/cbor/decodeCbor.ts`.

Tests, updated first:

1. `test/segment/validateC2paSegment.test.ts:69-120`, `test/vsi/decodeVsiMap.test.ts:33-62`, `test/init/validateC2paInitSegment.test.ts:329-330, 458-459`, and `test/manifestbox/validateC2paManifestBoxSegment.test.ts:353-367` expect a `number` from 2^32. The cases at 2^53 and above still produce `null` or an error.
2. `test/cose/decodeCoseSign1.test.ts`: the two strip tests become one test per tag 18 form. The one-byte form `d2`, the two-byte form `d8 12`, and the three-byte form `d9 00 12` decode. An untagged structure throws. Tag 18 around a value that is not an array throws.
3. The 11 untagged `COSE_Sign1` literals gain a `0xd2` prefix: `test/cose/decodeCoseSign1.test.ts:17, 27, 34, 50`, `test/cose/verifyCoseSign1.test.ts:17, 101`, `test/cose/verifySignerBinding.test.ts:29, 39` (line 29 is the public example), `test/claim/validateManifestIntegrity.test.ts:81`, `test/claim/verifyClaimSignature.test.ts:16`, and `test/manifestbox/validateC2paManifestBoxSegment.test.ts:410`.
4. New in `test/manifestbox/validateC2paManifestBoxSegment.test.ts`: a `c2pa.hash.bmff.v3` assertion whose `hash` is a text string, and one whose `hash` carries tag 64, make the segment invalid with `C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED`. Today both segments pass, because `parseBmffHashAssertion` reads an unreadable `hash` as absent.
5. `test/merkle/` passes without change.

Change: import `decodeCbor` and `readCborItem` from `readCborItem.ts`. `decodeCoseSign1` requires a `CborTag` with tag 18 whose value is the four-element array, and deletes `stripCoseTag` with its two constants. `parseBmffHashAssertion` distinguishes an absent `hash` from an unreadable one and reports the unreadable one. Replace `decodeFirstCbor` with `readCborItem(payload).value` in a try block. Delete `cbor/decodeCbor.ts` and the `BigInt` branch of `asUnsignedInteger`.

Done when: `grep -rn "cbor-x" libs/c2pa/src` prints nothing, the build passes, the API report is unchanged, and the docs build renders the updated `verifySignerBinding` example.

## Step 6: package metadata and docs

Files: `libs/c2pa/package.json`, `libs/c2pa/README.md`, `libs/c2pa/CHANGELOG.md`, `package-lock.json`.

Change:

1. Move `cbor-x` from `peerDependencies` to `devDependencies` with the same range. Run `npm install` to update the lock file.
2. Remove `cbor-x` from the peer note near `README.md:18`.
3. Changelog, under Unreleased: a Removed entry for the peer dependency. A Changed entry for the two value changes, with the tag list from the design. Two Changed entries for the accepted-input changes, each with its migration line: a byte string with CBOR tag 64 is no longer accepted, so a signer that uses the cbor-x encoder in Node must set `tagUint8Array: false`. A `COSE_Sign1` structure must carry CBOR tag 18 (C2PA sections 14 and 19.4.2), so a signer that writes the bare array must write `COSE_Sign1_Tagged`.

Done when: `npm test` at the repository root passes and `npm ls cbor-x -w libs/c2pa` lists it under devDependencies only.

## Step 7: measure

Bundle `libs/c2pa/dist/index.js` with `npx rolldown --format esm --minify` before and after PR B. Keep the workspace packages external and bundle cbor-x. Record the minified and gzip sizes in the PR description, next to the table in `design.md`.

Done when: the PR description holds both numbers and the release notes link to it.

## Result

PR A is PR 510 and PR B is PR 511. Three things differed from the steps above.

1. Steps 3 and 4 landed in one commit. The projected public tree turns the inline signer binding into a plain `{ tag, value }` object, and the cbor-x re-encode in the validator would have written a map instead of a tag. The validator had to read the tagged tree in the same change.
2. The test builders emitted tag 64. The binary fixtures do not carry the tag, but the merkle, manifest box, VSI, and init segment tests encoded with the default cbor-x encoder, which wraps every byte string in Node. A shared plain encoder in `test/cborTestUtils.ts` replaced it.
3. The equivalence test compares the reader with the cbor-x decode function directly, because the wrapper of step 5 is gone. Raw cbor-x reads a stray break code as an empty map and throws on tag 1 with an integer above 2^53 - 1, so both cases joined the listed differences. Nested byte strings compare only when the reader accepts them.

The last done-when item of step 5 was empty. `verifySignerBinding` is not exported from the package, so the docs do not render its example.

The bundle of `libs/c2pa/dist/index.js` with rolldown 1.0.0-beta.44, `format: 'esm'` and `minify: true`, the workspace packages external, cbor-x bundled, and gzip -9 from stdin:

| Build | Minified | Gzip |
| --- | --- | --- |
| PR A head (c75a5ccf5) | 59,375 B | 19,954 B |
| PR B head | 32,283 B | 10,550 B |
| Difference | -27,092 B | -9,404 B |

cbor-x stays a dev dependency for the test encoders and for the oracle of the equivalence test. A follow-up can replace the encoders with a test encoder of about 120 lines and delete the equivalence test.
