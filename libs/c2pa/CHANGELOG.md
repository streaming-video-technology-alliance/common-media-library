# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-26

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

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/c2pa-v0.1.0...HEAD
[0.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/c2pa-v0.1.0
