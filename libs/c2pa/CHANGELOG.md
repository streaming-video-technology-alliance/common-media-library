# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `validateC2paManifestBoxSegment` now enforces the 8-byte box-offset prefix (C2PA §18.6.2) when verifying the flat `c2pa.hash.bmff.v3` assertion hash, matching c2pa-rs; unprefixed flat hashes are no longer accepted. The VSI path (§19.7.3) keeps dual-mode validation since its hash comes from the VSI map, not a §18.6.2 assertion.
- `validateC2paInitSegment` now enforces the 8-byte box-offset prefix (C2PA §18.6.2) when verifying the flat `c2pa.hash.bmff.v3` assertion hash, matching c2pa-rs; unprefixed flat hashes are no longer accepted
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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.0.1...HEAD
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v1.0.0...c2pa-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/c2pa-v1.0.0
