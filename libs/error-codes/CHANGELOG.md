# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.

## [0.1.2] - 2026-10-18

### Changed

- Update `@svta/cml-utils` to 1.6.2
- Peer dependency ranges are now caret ranges, for example `^1.6.2` instead of `1.6.2`. A later patch or minor release of a peer no longer requires a new release of this package.

## [0.1.1] - 2026-09-15

### Changed

- Update `@svta/cml-utils` to 1.6.1

## [0.1.0] - 2026-09-07

### Added

- Initial implementation of SVTA2070: Standardized Error Codes, per [`rfc/error-codes.md`](https://github.com/streaming-video-technology-alliance/common-media-library/blob/main/rfc/error-codes.md)
- `SvtaErrorCategory` and one code catalog per category: `SvtaUnknownErrorCode`, `SvtaMediaContentErrorCode`, `SvtaPlaybackErrorCode`, `SvtaNetworkErrorCode`, `SvtaContentProtectionErrorCode`, `SvtaAccessibilityErrorCode`, `SvtaRemotePlayErrorCode`, `SvtaAdvertisingErrorCode`, and `SvtaCustomErrorCode`
- Every code and category as an individual `SVTA_*` constant, and the `SvtaErrorCode` union type
- `getSvtaErrorCategory` and `getSvtaErrorIndex` for the category and index arithmetic of the specification
- `httpStatusToSvtaErrorCode` and `vastErrorToSvtaErrorCode` to embed HTTP response statuses and IAB VAST error codes. `vastErrorToSvtaErrorCode(1009)` returns 7999

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/error-codes-v0.1.2...HEAD
[0.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/error-codes-v0.1.1...error-codes-v0.1.2
[0.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/error-codes-v0.1.0...error-codes-v0.1.1
[0.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/error-codes-v0.1.0
