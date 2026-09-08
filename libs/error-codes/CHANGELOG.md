# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial implementation of SVTA2070: Standardized Error Codes, per [`rfc/error-codes.md`](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/rfc/error-codes.md)
- `SvtaErrorCategory` and one code catalog per category: `SvtaUnknownErrorCode`, `SvtaMediaContentErrorCode`, `SvtaPlaybackErrorCode`, `SvtaNetworkErrorCode`, `SvtaContentProtectionErrorCode`, `SvtaAccessibilityErrorCode`, `SvtaRemotePlayErrorCode`, `SvtaAdvertisingErrorCode`, and `SvtaCustomErrorCode`
- Every code and category as an individual `SVTA_*` constant, and the `SvtaErrorCode` union type
- `getSvtaErrorCategory` and `getSvtaErrorIndex` for the category and index arithmetic of the specification
- `httpStatusToSvtaErrorCode` and `vastErrorToSvtaErrorCode` to embed HTTP response statuses and IAB VAST error codes. `vastErrorToSvtaErrorCode(1009)` returns 7999

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/main...HEAD
