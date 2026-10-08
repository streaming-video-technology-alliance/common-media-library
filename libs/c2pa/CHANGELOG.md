# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `C2paStatusCode` now has `CLAIM_CBOR_INVALID` (`claim.cbor.invalid`) for a claim box whose CBOR does not decode.
- `C2paStatusCode` now has `CLAIM_MALFORMED` (`claim.malformed`) for a claim box whose CBOR is not a map.

### Changed

- `C2paAssertion.data` now holds an unsigned integer up to `Number.MAX_SAFE_INTEGER` as a number instead of a BigInt. The same applies to the assertion data that a `ManifestBoxContinuityValidator` receives. See Working with Manifest Data in the Results and Error Codes guide.
- A CBOR tag other than tag 0 and tag 1 is now a plain `{ tag, value }` object in `C2paAssertion.data`. This includes tags 2, 3, 65 to 87, 258, and 55799, which were a BigInt, a typed array, a `Set`, or the tagged value. Tag 0 and tag 1 are still a `Date`.
- A map key `__proto__` in a CBOR assertion is now an own property of the decoded object.
- A byte string with CBOR tag 64 no longer counts as a byte string in any field, such as the `hash` of a `c2pa.hash.bmff.v3` assertion. If your signer uses the cbor-x encoder in Node.js, set `tagUint8Array: false`.
- A `COSE_Sign1` structure must now carry CBOR tag 18 (`COSE_Sign1_Tagged`). A claim signature without the tag fails with `C2paStatusCode.CLAIM_SIGNATURE_MISMATCH`, and a signer binding without the tag makes its session key invalid. If your signer writes the bare array, write `COSE_Sign1_Tagged` instead.
- `validateC2paSegment` now throws an error for a Verifiable Segment Info without CBOR tag 18.
- CBOR nested deeper than 128 levels of arrays, maps, and tags no longer decodes.
- A CBOR array of integers no longer counts as a byte string in any field, such as a `kid`, a `signerBinding`, or a hash.
- The VSI/EMSG Validation guide now describes the session key validity period, the accepted signer binding payloads with CBOR tag 18, and the sequence number range.
- The Results and Error Codes guide now has an Invalid Session Keys section and describes the value shapes of `C2paAssertion.data`. Its error code table now describes the validity period of session keys.
- The Manifest Box Validation guide now states when `sequenceNumber` is `null` and names the error code for a malformed hash.
- The examples in the README and the VSI/EMSG Validation guide now check `isValid` before they use `sessionKeys`. Do not use the session keys of a result with `isValid: false`.
- The code examples in the validation guides now typecheck.

### Removed

- The package no longer has the `cbor-x` peer dependency. If you installed `cbor-x` for this package only, remove it from your dependencies.

### Fixed

- `validateC2paInitSegment` now keeps a session key that is not yet active. Segments signed with that key no longer fail with `LiveVideoStatusCode.SEGMENT_INVALID`.
- The signer binding check now accepts the certificate itself or the certificate as a CBOR byte string as the signed payload.
- The payload field of a signer binding must now be nil, an empty byte string, or an exact copy of the signed payload. Other content makes the session key invalid.
- `validateC2paInitSegment` now reports `LiveVideoStatusCode.SESSIONKEY_INVALID` for an invalid session key in the `c2pa.session-keys` assertion. An expired session key does not count as invalid. The function does not check every rule of C2PA section 18.25.2.
- `validateC2paInitSegment` now reads the `kid` of a session key only from its COSE key.
- `minSequenceNumber` and `validityPeriod` must now be unsigned integers up to `Number.MAX_SAFE_INTEGER`, and `createdAt` must be CBOR tag 0 with an RFC 3339 date-time. A session key that breaks one of these rules is invalid. If an init segment now fails, check the fields of its session keys and the signer binding.
- `validateC2paInitSegment` now reports `SESSIONKEY_INVALID` for a session key that it cannot verify, such as an unsupported key type. It no longer throws an error in that case.
- `validateC2paInitSegment` now reports `SESSIONKEY_INVALID` when the `c2pa.session-keys` assertion has no session key or holds CBOR that does not decode. This also applies in VOD Merkle mode.
- `validateC2paSegment` now reports `LiveVideoStatusCode.SEGMENT_INVALID` for a segment whose session key is not yet active or has expired. It no longer reports `SESSIONKEY_INVALID` for such a segment. Handle `SEGMENT_INVALID` instead, and update dashboards that count `livevideo.sessionkey.invalid` for media segments.
- `validateC2paSegment` now accepts a `sequenceNumber` of 2^32 or more, up to `Number.MAX_SAFE_INTEGER`. A larger value, a negative value, or a fraction causes an error that names the supported range.
- `validateC2paManifestBoxSegment` now accepts a `sequenceNumber` of 2^32 or more, up to `Number.MAX_SAFE_INTEGER`. A larger value, or a value that is not an unsigned integer, counts as a missing value and yields `sequenceNumber: null`.
- The validation functions now fail fast on a CBOR item that declares more content than the input holds. Such a segment no longer costs seconds of processor time or gigabytes of memory.
- `validateC2paManifestBoxSegment` now reports `C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED` when the `hash` of the `c2pa.hash.bmff.v3` assertion is not a byte string.
- A `c2pa.hash.bmff.v3` exclusion must now have an `xpath` text string, and each `data` constraint must have an unsigned integer `offset` and a byte string `value`. `validateC2paManifestBoxSegment` reports `C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED` for an exclusion that breaks this rule. `validateC2paInitSegment` reports `ASSERTION_BMFFHASH_MALFORMED` for a Merkle assertion and `LiveVideoStatusCode.INIT_INVALID` for a flat hash, and `validateC2paSegment` throws an error.
- `validateC2paInitSegment` and `validateC2paManifestBoxSegment` now report `C2paStatusCode.CLAIM_CBOR_INVALID` for a claim box whose CBOR does not decode. Such a manifest no longer validates on the claim signature alone.
- `validateC2paInitSegment` and `validateC2paManifestBoxSegment` now report `C2paStatusCode.CLAIM_MALFORMED` for a claim box whose CBOR is not a map.
- A bundle that imports only a constant from the package no longer keeps a `TextDecoder` construction or the certificate and signature constants of the package.

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
