# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `validateC2paInitSegment` checks session keys more strictly (C2PA sections 18.25.2 and 19.7.3):
  - It keeps a session key that is not yet active. Each session key is valid from its own `createdAt`. An init segment can contain the next session key before that key becomes active. Before, `sessionKeys` did not include that key. Each segment signed with that key then failed with `LiveVideoStatusCode.SEGMENT_INVALID`.
  - It accepts the session keys of real signers. The signer binding check required the certificate with CBOR tag 64 as the signed payload. No known signer adds this tag, so `sessionKeys` was empty. The check now accepts the certificate itself, or the certificate as a CBOR byte string. The text of section 18.25.2 allows both forms.
  - It checks the payload field of the signer binding. The field must be nil, an empty byte string, or an exact copy of the signed payload. Other content makes the session key invalid. Before, the check ignored this field.
  - It fails with `LiveVideoStatusCode.SESSIONKEY_INVALID` if it finds an invalid session key in the `c2pa.session-keys` assertion. A session key is invalid if it does not conform to section 18.25.2, or if its signer binding fails verification. An expired session key does not count as invalid. Before, the function excluded the invalid key from `sessionKeys`. It returned `isValid: true` if another session key was valid.
  - It reads the `kid` only from the COSE key, as section 18.25.2 requires. Before, a `kid` field outside the COSE key also counted.
  - It checks the types of the session key fields. `minSequenceNumber` and `validityPeriod` must be unsigned integers up to `Number.MAX_SAFE_INTEGER` (2^53 - 1). `createdAt` must be CBOR tag 0 with an RFC 3339 date-time. A session key that breaks one of these rules is invalid. Before, a text string, a negative value, or a fraction in these fields caused no error code. A `createdAt` with CBOR tag 1, or a date that does not exist such as `2025-02-30`, also caused no error code. A `validityPeriod` such as `'one hour'` kept the key valid forever.
  - It reports `SESSIONKEY_INVALID` if it cannot verify a session key. An example is a key type that the library does not support. Before, it threw an error. If your code catches that error, check `errorCodes`.
  - It reports `SESSIONKEY_INVALID` if the `c2pa.session-keys` assertion has no session key, or if its CBOR does not decode. Before, the function threw an error for CBOR that does not decode. In VOD Merkle mode, an assertion without a session key caused no error code.
  - It does not check every rule of section 18.25.2.
  - If an init segment fails after this fix, the signer produced an invalid session key. Each session key needs a `kid` in its COSE key and the `minSequenceNumber`, `createdAt`, and `validityPeriod` fields. Its signer binding must verify. Also check how the signer encodes these fields.
- `validateC2paSegment` reports `LiveVideoStatusCode.SEGMENT_INVALID` when the matched session key is not yet active or has expired. C2PA section 19.7.3 requires this code for a segment outside the validity period of its key. Before, the function reported `LiveVideoStatusCode.SESSIONKEY_INVALID` for a session key that expired after init segment validation. If your code handles `SESSIONKEY_INVALID` from `validateC2paSegment`, handle `SEGMENT_INVALID` instead. Also update dashboards and alert rules that count `livevideo.sessionkey.invalid` for media segments. To check the validity period of a session key, see Session Key Lifecycle in the VSI/EMSG Validation guide.
- `validateC2paSegment` and `validateC2paManifestBoxSegment` accept a `sequenceNumber` of 2^32 or more. The library supports values up to `Number.MAX_SAFE_INTEGER`, because a JavaScript number cannot hold a larger value exactly:
  - Before, `validateC2paSegment` threw an error for such a value in the VSI map (C2PA section 19.4.2). A value above `Number.MAX_SAFE_INTEGER` causes an error. A value that is not an unsigned integer, such as a negative value or a fraction, also causes an error. The error message names the supported range and the received value.
  - Before, `validateC2paManifestBoxSegment` returned `sequenceNumber: null` for such a value in the `c2pa.livevideo.segment` assertion (C2PA section 19.3.2.1). If `state` had a previous sequence number, the result also included `LiveVideoStatusCode.ASSERTION_INVALID`. A value above `Number.MAX_SAFE_INTEGER`, or a value that is not an unsigned integer, now counts as a missing value.
- The validation functions decode CBOR with a reader of their own. The reader bounds its work by the length of the input and stops at 128 nested levels of arrays, maps, and tags. Before, the cbor-x decoder allocated the declared length of a CBOR array before it read the items. A short input that declares a huge array made the decoder use seconds of processor time and gigabytes of memory. A crafted segment or init segment could freeze or crash a player. A segment with such bytes now fails fast. The change covers `validateC2paInitSegment`, `validateC2paSegment`, `validateC2paManifestBoxSegment`, and `validateC2paMerkleSegment`.
- `validateC2paManifestBoxSegment` reports `C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED` if the `hash` of the `c2pa.hash.bmff.v3` assertion is not a byte string. Before, the function skipped the hash check for such an assertion.
- `validateC2paInitSegment` and `validateC2paManifestBoxSegment` report `C2paStatusCode.CLAIM_CBOR_INVALID` if the claim box holds CBOR that does not decode, and `C2paStatusCode.CLAIM_MALFORMED` if that CBOR is not a map (C2PA section 15.6.2). Before, the functions read no field from such a claim and skipped the assertion checks. If the claim signature verified, the result was `isValid: true`.
- `validateC2paInitSegment`, `validateC2paSegment`, and `validateC2paManifestBoxSegment` treat a `c2pa.hash.bmff.v3` exclusion that does not conform to C2PA section 18.6 as malformed input. Each exclusion needs an `xpath` text string. Each `data` constraint needs an unsigned integer `offset` and a byte string `value`. `validateC2paManifestBoxSegment` reports `C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED`. `validateC2paInitSegment` reports `ASSERTION_BMFFHASH_MALFORMED` for a Merkle assertion and `LiveVideoStatusCode.INIT_INVALID` for a flat hash. `validateC2paSegment` throws an error. Before, the functions dropped a constraint whose value was not a byte string and excluded every box that matched the `xpath` from the hash. A segment with changed content could pass validation.
- The package has no module-scope statement that a bundler keeps. Before, a bundle that imported only a constant from the package kept a `TextDecoder` construction. With rolldown or esbuild, it also kept four byte arrays and two lookup objects from the certificate and signature code.

### Changed

- VSI/EMSG Validation guide: the Session Key Lifecycle section describes the validity period of session keys. It also lists the accepted forms of the signed payload and the payload field of the signer binding. The Sequence Number Validation section states the unsigned integer rule and the supported range.
- Results and Error Codes guide: the error code table describes the validity period of session keys. The new Invalid Session Keys section describes invalid session keys and the supported range of their fields. The VSI/EMSG Validation guide links to that section.
- Manifest Box Validation guide: the Result Fields table states when `sequenceNumber` is `null`.
- README and VSI/EMSG Validation guide: the VSI/EMSG examples check `isValid` before they use `sessionKeys`. If `isValid` is `false`, `sessionKeys` can still contain session keys. Do not use these session keys.
- Validation guides: the code examples typecheck. Before, each line that read a `fetch` response failed with TypeScript error TS2769.
- `C2paAssertion.data`, and the assertion data that a `ManifestBoxContinuityValidator` receives, have new value shapes for CBOR assertions. An unsigned integer up to `Number.MAX_SAFE_INTEGER` (2^53 - 1) is a number. Before, a value of 2^32 or more was a BigInt. A CBOR tag other than tag 0 and tag 1 is a plain `{ tag, value }` object. Before, it was a cbor-x `Tag` instance, and cbor-x converted tags 2, 3, 65 to 87, 258, and 55799 to a BigInt, a typed array, a `Set`, or the tagged value. Tag 0 and tag 1 are still a `Date`. A map key `__proto__` is an own property of the decoded object. Before, the decoder renamed the key to `__proto_`. See Working with Manifest Data in the Results and Error Codes guide.
- A byte string with CBOR tag 64 no longer counts as a byte string. This rule applies to every field that the C2PA specification declares as a byte string, such as the `hash` of a `c2pa.hash.bmff.v3` assertion and the fields of a `COSE_Sign1`. Before, the decoder removed the tag. The cbor-x encoder in Node.js adds this tag to every `Uint8Array` unless the `tagUint8Array` option is `false`. If your signer uses that encoder, set `tagUint8Array: false`.
- A CBOR array of integers no longer counts as a byte string. This rule applies to every field that the C2PA specification declares as a byte string. Examples are the `kid`, the key coordinates, and the `signerBinding` of a session key, the fields of a `COSE_Sign1`, the hashes of a claim or a Merkle tree, and the `hash` of a `c2pa.hash.bmff.v3` assertion. Before, the library converted such an array to bytes.
- A `COSE_Sign1` structure must carry CBOR tag 18 (`COSE_Sign1_Tagged`). C2PA section 14 requires the tag for every signature, and section 19.4.2 for the Verifiable Segment Info. Before, the library also accepted the bare array. A claim signature without the tag fails with `C2paStatusCode.CLAIM_SIGNATURE_MISMATCH`. A signer binding without the tag makes its session key invalid. A Verifiable Segment Info without the tag makes `validateC2paSegment` throw an error. If your signer writes the bare array, write `COSE_Sign1_Tagged` instead.
- Results and Error Codes guide: the Working with Manifest Data section describes the value shapes of `C2paAssertion.data`. VSI/EMSG Validation guide: the signer binding description names CBOR tag 18. Manifest Box Validation guide: the result note names the error code for a malformed hash.

### Removed

- The `cbor-x` peer dependency. The package decodes CBOR with a reader of its own. If you installed `cbor-x` for this package only, remove it from your dependencies.

## [1.3.0] - 2026-09-29

### Fixed

- `C2paStatusCode.CLAIM_SIGNATURE_MISMATCH` now has the value `claimSignature.mismatch` from the C2PA specification ([#469](https://github.com/streaming-video-technology-alliance/common-media-library/issues/469)). The old value was `claim.signature.mismatch`. The constant name does not change. If your code compares `errorCodes` with the old value, compare with `C2paStatusCode.CLAIM_SIGNATURE_MISMATCH` instead. Also update logs, dashboards, and alert rules that store the old value.

## [1.2.0] - 2026-09-25

### Security

- `validateC2paManifestBoxSegment` and `validateC2paInitSegment` no longer return `isValid: true` for a manifest without a verifiable claim signature. An attacker who controlled the media bytes could forge provenance without a signing key. See [GHSA-h5r3-7p8g-g3q2](https://github.com/streaming-video-technology-alliance/common-media-library/security/advisories/GHSA-h5r3-7p8g-g3q2). A manifest without a `c2pa.signature` box now fails with `C2paStatusCode.CLAIM_SIGNATURE_MISSING`. A manifest whose claim signature has no certificate now fails with `C2paStatusCode.CLAIM_SIGNATURE_MISMATCH`. A manifest without a claim box now fails with `C2paStatusCode.CLAIM_MISSING`.

### Added

- `C2paStatusCode.CLAIM_SIGNATURE_MISSING` (`claimSignature.missing`) and `C2paStatusCode.CLAIM_MISSING` (`claim.missing`).
- `ManifestBoxValidationResult.certificate`: the DER-encoded end-entity certificate from the claim signature ([#468](https://github.com/streaming-video-technology-alliance/common-media-library/issues/468)). The value is `null` when the claim signature is absent or has no certificate. You can now compare this certificate with your trust list.

### Changed

- Validation guides and README: the library does not compare the certificate from the claim signature with a trust list. Check `isValid` before you use `merkleMaps`. See the new Signer Trust section of the Results and Error Codes guide.
- Validation guides and README: rewritten prose for readers who do not read English as a first language. The validation guides define the term Merkle tree at its first use. Empty table cells and a code comment in the validation guides no longer use an em dash.
- README: the code examples are complete. The code examples take the segment URLs as function parameters.

## [1.1.3] - 2026-09-15

### Changed

- Update `@svta/cml-iso-bmff` to 1.0.6
- Update `@svta/cml-utils` to 1.6.1

## [1.1.2] - 2026-08-11

### Changed

- Update `@svta/cml-iso-bmff` to 1.0.5

## [1.1.1] - 2026-07-28

### Changed

- Update `@svta/cml-iso-bmff` to 1.0.4
- Update `@svta/cml-utils` to 1.6.0

## [1.1.0] - 2026-07-21

### Added

- Custom continuity method support in manifest-box validation (C2PA §19.3.2 / §19.7.2): `validateC2paManifestBoxSegment` accepts an optional `continuityValidator` to verify implementer-defined continuity methods; segments declaring an unregistered method keep failing with `livevideo.continuityMethod.invalid` per spec
- `LiveVideoStatusCode.CONTINUITY_METHOD_UNSUPPORTED` (`livevideo.continuityMethod.unsupported`), emitted alongside `continuityMethod.invalid` so consumers can distinguish an unverifiable custom method from a broken chain
- `ManifestBoxValidationOptions` and `ManifestBoxContinuityValidator` types
- VOD Merkle validation (C2PA §15.12.2 / §18.6): `validateC2paMerkleSegment` verifies fragmented MP4 media segments against the merkle maps from the init manifest — per-track Merkle proof verification with `location` continuity enforced via caller-held state
- `MerkleMap`, `MerkleSegmentState`, and `MerkleSegmentValidation` types
- `validateC2paInitSegment` extracts merkle maps from the `c2pa.hash.bmff.v3` assertion, validates each entry's `initHash` binding, and returns them as `merkleMaps`
- `C2paStatusCode` entries `assertion.bmffHash.malformed` and `assertion.bmffHash.mismatch`

### Changed

- `InitSegmentValidation` gains a `merkleMaps` field; `SESSIONKEY_INVALID` is no longer raised for VOD Merkle streams

### Fixed

- `validateC2paManifestBoxSegment` now enforces the 8-byte box-offset prefix (C2PA §18.6.2) when verifying the flat `c2pa.hash.bmff.v3` assertion hash, matching c2pa-rs; unprefixed flat hashes are no longer accepted. The VSI path (§19.7.3) keeps dual-mode validation since its hash comes from the VSI map, not a §18.6.2 assertion.
- `validateC2paInitSegment` now enforces the 8-byte box-offset prefix (C2PA §18.6.2) when verifying the flat `c2pa.hash.bmff.v3` assertion hash, matching c2pa-rs; unprefixed flat hashes are no longer accepted
- The module-scope hex lookup table in `bytesToHex` is now marked side-effect free so consumer bundlers can drop it when unused (follow-up to the module-scope side-effect audit in [#382](https://github.com/streaming-video-technology-alliance/common-media-library/issues/382))
- Top-level `TextDecoder` and `TextEncoder` instantiations are now marked side-effect free so consumer bundlers can drop them when unused ([#382](https://github.com/streaming-video-technology-alliance/common-media-library/issues/382))

## [1.0.1] - 2026-05-13

### Changed

- Update `@svta/cml-iso-bmff` to 1.0.2
- Update `@svta/cml-utils` to 1.5.0

## [1.0.0] - 2026-04-14

### Added

- Package scaffold with core C2PA types (`C2paManifest`, `C2paAssertion`, `C2paSignatureInfo`)
- `LiveVideoStatusCode` — standardized C2PA §19.7 error code constants
- JUMBF box parsing (ISO 19566-5)
- COSE_Sign1 cryptographic support (RFC 9052): decoding, signature verification, key conversion, signer binding
- X.509 certificate parsing (issuer, validity period)
- BMFF content hash computation and validation
- EMSG box parsing (ISO 14496-12, v0 and v1)
- VSI (Verifiable Segment Info) CBOR map decoding
- Sequence number validation (monotonic, gap/duplicate detection)
- `validateC2paInitSegment(bytes)` — validate init segment: manifest, certificate, BMFF hash, session keys
- `validateC2paSegment(bytes, sessionKeys, state?)` — validate media segment via VSI/EMSG method (§19.7.3)
- `validateC2paManifestBoxSegment(bytes, lastId, state?)` — validate manifest-box segment (§19.7.2)
- All validation results return `isValid` + `errorCodes` with C2PA failure codes

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.3.0...HEAD
[1.3.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.2.0...c2pa-v1.3.0
[1.2.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.1.3...c2pa-v1.2.0
[1.1.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.1.2...c2pa-v1.1.3
[1.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.1.1...c2pa-v1.1.2
[1.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.1.0...c2pa-v1.1.1
[1.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.0.1...c2pa-v1.1.0
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.0.0...c2pa-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/c2pa-v1.0.0
