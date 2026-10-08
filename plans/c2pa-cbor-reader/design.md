# Native CBOR reader for `@svta/cml-c2pa`

## Summary and sequencing

The c2pa package replaces cbor-x with its own CBOR reader in `libs/c2pa/src/cbor/`. The reader is `@internal`, and the package exports nothing new, so this is a plan and not an RFC. cbor-x moves from `peerDependencies` to `devDependencies` for the test encoders.

Two public values change shape. Each gets one changelog line:

1. An integer with a magnitude up to 2^53 - 1 is a `number`. cbor-x returns a `BigInt` from 2^32.
2. A tag other than 0 and 1 is a plain object `{ tag, value }`. cbor-x returns a `Tag` instance, or a special value for a few tags.

Only `C2paAssertion.data` and the first argument of `ManifestBoxContinuityValidator` expose decoded CBOR.

Two accepted inputs change, each with a changelog entry and a migration line: a byte string with CBOR tag 64 no longer passes as a `bstr`, and a `COSE_Sign1` without CBOR tag 18 no longer passes (Decisions 2 and 3).

The reader enforces the CDDL types of C2PA 2.4, not the encoding forms of RFC 8949 section 4.2.1: indefinite lengths, non-shortest integers, duplicate keys, and unsorted keys stay accepted. Section 18.1 requires that encoding, so a later RFC can enforce it, as any public export or further shape change would need.

Sequence: PR 503 and its follow-up fix PRs merge, then the PRs of `steps.md`. The next c2pa release, a minor, ships all of it with the other pending fixes, so adopters update once.

## The problem

cbor-x returns a lossy projection of the bytes. Five fix PRs each patched one symptom:

| PR | Symptom | Patch |
| --- | --- | --- |
| 498 | The encoder adds tag 64 to every `Uint8Array` by default, so the signer binding payload carried it. | `cose/verifySignerBinding.ts:45` encodes the byte string by hand. |
| 501, 502 | The decoder returns a `BigInt` from 2^32. | `utils.ts:95-98` converts it, for `vsi/decodeVsiMap.ts:29-32` and `manifestbox/validateC2paManifestBoxSegment.ts:56`. |
| 507 | Tag 0 collapses into a `Date`. The RFC 3339 text is gone. | `init/validateC2paInitSegment.ts:61-93` is a second decoder that keeps tags. `claim/InternalManifestData.ts:13` carries the bytes to it. |
| 508 | The decoder allocates the declared length of an array before it reads the items. Tags 28, 51, 259, and 0xdff9 and above read with cbor-x logic. | `cbor/decodeCbor.ts:29-61` walks every item before the decode and rejects those tags. |

`init/validateC2paInitSegment.ts:23-43` and `cose/decodeCoseSign1.ts:18-22` handle tags by hand for the same reason. One reader replaces the three decoders of the session keys assertion.

## Value model

Public shapes next to cbor-x 1.6.6 with default options. "Same" means the reader matches cbor-x.

| Input | Reader | cbor-x 1.6.6 |
| --- | --- | --- |
| Integer, magnitude up to 2^53 - 1 | `number` | `number` below 2^32, then `BigInt` |
| Integer, magnitude 2^53 or more | `BigInt` | Same |
| Non-shortest integer encoding | Accepted | Same |
| Byte string | `Uint8Array` view of the input, no copy | Same |
| Text string | `string`, invalid UTF-8 becomes U+FFFD | Same |
| Array | `Array` | Same |
| Map with text or integer keys | Plain object with string keys | Same |
| Map with a duplicate key | The last value is kept | Same |
| Map with a `__proto__` key | Own property, prototype unchanged | Key renamed to `__proto_` |
| Map with a boolean, null, or float key | Property named `String(key)` | Same |
| Map with a byte string, array, or map key | `RangeError` | `Error` |
| Float 16, 32, 64 | `number` | Same |
| `false`, `true`, `null`, `undefined` | Same values | Same |
| Other simple values | `RangeError` | `Error` |
| Tag 0 with text, tag 1 with a number | `Date` | Same |
| Tag 0 or tag 1 with other content | `{ tag, value }` | A `Date` with a wrong time |
| Tag 64 around a byte string | `{ tag, value }`, so a `bstr` field fails its type check | The byte string |
| Tags 2, 3, 65 to 87, 258, 55799 | `{ tag, value }` | `BigInt`, typed arrays, `Set`, the content |
| Every other tag, including the four rejected since PR 508 | `{ tag, value }` | `Tag` instance |
| Indefinite array or map | Accepted | Same |
| Indefinite byte or text string | `RangeError` | `Error` |
| Stray break, or break in map value position | `RangeError` | `{}`, rejected since PR 508 |
| Trailing bytes after the item | `RangeError` from `decodeCbor` | `Error` |
| Incomplete item | `RangeError` | `Error` |
| Additional information 28 to 30 | `RangeError` | `Error` |
| Nesting deeper than 128 levels | `RangeError` | Stack overflow near 10,000 levels |

The deepest item in the three fixtures has 7 levels. The reader is recursive, so a fixed limit of 128 replaces an engine-dependent stack overflow.

Half floats decode by hand, because TV browsers lack `DataView.getFloat16`.

## Internal and public trees

`readCborItem(bytes, offset)` returns `{ value, end }`, and `decodeCbor(bytes)` rejects trailing bytes after it. Every tag is a `CborTag` instance with `tag`, `value`, and `bytes` (a view of the whole tagged item), so a tag stays distinct from a CBOR map with `tag` and `value` keys.

`projectCborTags(value)` copies arrays and maps. It turns tag 0 and tag 1 into a `Date` and every other `CborTag` into `{ tag, value }`.

| Consumer | Tree |
| --- | --- |
| `C2paAssertion.data`, the claim fields, `validateC2paManifestBoxSegment`, the bmff hash assertion | Public |
| Session key validator: `createdAt` must be a `CborTag` with tag 0 and exact RFC 3339 text, `signerBinding` (an inline `COSE_Sign1` per section 18.25.3) goes to `decodeCoseSign1` as `CborTag.bytes` | Internal, from `InternalAssertionData.taggedData` |
| `decodeCoseSign1`, `decodeVsiMap`, `validateC2paMerkleSegment` | Internal, read directly. `decodeCoseSign1` requires a `CborTag` with tag 18. The other type checks reject a `CborTag` as they reject a `Tag` today. |

`InternalAssertionData.taggedData` replaces `cborBytes`. `validateActionIngredients` keeps reading the public `data`.

## Deletions

| Item | Location | Replacement |
| --- | --- | --- |
| `decodeWithTags`, `CBOR_TAG`, `readTaggedKeyEntries` | `init/validateC2paInitSegment.ts:55-93, 224-230` | `taggedData` |
| `extractCborTaggedValue`, `CBOR_TAGGED_KEY`, the re-encode in `normalizeToUint8Array`, the `cbor-x/encode` import | `init/validateC2paInitSegment.ts:2, 23-43` | `CborTag.bytes` |
| `readCborItemEnd`, `decodeCbor`, `isReservedCborTag` | `cbor/decodeCbor.ts` | `readCborItem`, native `decodeCbor` |
| `InternalAssertionData.cborBytes` | `claim/InternalManifestData.ts:13` | `taggedData` |
| `decodeFirstCbor` | `merkle/validateC2paMerkleSegment.ts:60-66` | `readCborItem(payload).value` in a try block |
| `stripCoseTag` and its two tag constants | `cose/decodeCoseSign1.ts:4-6, 18-22` | The tag 18 check on the `CborTag` |
| The `BigInt` branch of `asUnsignedInteger` | `utils.ts:96` | The `number` check alone |
| `cbor-x` peer dependency and README note | `package.json:62`, `README.md:18` | Dev dependency |

## Bounded work

The guarantee of PR 508 holds. Every item consumes at least one byte, and the reader never allocates a container with a declared length. An incomplete item, a stray break, and trailing bytes throw `RangeError`. `validateC2paMerkleSegment` reads padded boxes through `end`.

## Bytes

Measured with `npx rolldown <entry> --format esm --minify` and `gzip -9`:

| Bundle | Minified | Gzip |
| --- | --- | --- |
| Prototype reader with projection | 2,161 | 1,105 |
| Prototype with a short ASCII string fast path | 2,299 | 1,186 |
| `cbor-x/decode`, bundled the same way | 14,243 | 5,271 |
| `cbor-x/dist/index.min.js` | 31,261 | 10,929 |

Decode time per CBOR item, average over the 12 fixture items:

| Decoder | Microseconds |
| --- | --- |
| cbor-x | 2.67 |
| cbor-x with the PR 508 walk, today | 2.88 |
| Prototype | 4.74 |
| Prototype with the ASCII fast path | 3.10 |

The prototype, on branch `scratch/c2pa-cbor-reader-prototype`, matched cbor-x on the 19 CBOR items of the three fixtures.

## Risks

- Signers that emit tags 2, 3, 65 to 87, or 258 get a different public shape, and signers that emit tag 64 or an untagged `COSE_Sign1` fail validation. No real fixture and no known signer does either.
- Code that matches cbor-x error messages breaks.
- The reader is slower per item. The difference for one init segment is about 5 microseconds.

## Decisions

1. A `__proto__` key becomes an own property. No C2PA field has this name.
2. Tag 64 is a tag like any other, because the CDDL declares `bstr`. The only known emitter is the cbor-x encoder in Node with `tagUint8Array` unset. `validateC2paManifestBoxSegment` must report an unreadable `hash` as `ASSERTION_BMFFHASH_MALFORMED` instead of skipping the check (`manifestbox/validateC2paManifestBoxSegment.ts:82, 213`).
3. `decodeCoseSign1` requires tag 18 in any encoding length and deletes `stripCoseTag`. C2PA section 14 requires `COSE_Sign1_Tagged` for every signature, and section 19.4.2 for the VSI. Every real fixture uses the one-byte form.
4. The nesting cap of 128 levels stays.
