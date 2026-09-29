# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
