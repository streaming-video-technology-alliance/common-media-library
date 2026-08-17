# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial implementation of the SVTA Standardized Error Codes specification: `SvtaErrorCategory`, per-category error code catalogs (`SvtaUnknownErrorCode`, `SvtaMediaContentErrorCode`, `SvtaPlaybackErrorCode`, `SvtaNetworkErrorCode`, `SvtaContentProtectionErrorCode`, `SvtaAccessibilityErrorCode`, `SvtaRemotePlayErrorCode`, `SvtaAdvertisingErrorCode`, `SvtaCustomErrorCode`), the `SvtaErrorCode` union type, and the helpers `getSvtaErrorCategory`, `getSvtaErrorIndex`, `httpStatusToSvtaErrorCode`, `vastErrorToSvtaErrorCode`, and `getSvtaErrorDescription`; every code and category is also exported as an individual `SVTA_*` constant

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/main...HEAD
