# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `applyUriReplacement`, which builds a URI of a pathway clone from a URI of its base pathway ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
- `createSteeringEngine`, a content steering engine for HLS and DASH players. It implements the RFC in `rfc/content-steering-engine.md` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
- `SteeringProtocol`, `STEERING_PROTOCOL_HLS`, and `STEERING_PROTOCOL_DASH` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
- `SteeringErrorType`, `STEERING_ERROR_TYPE_LOAD`, `STEERING_ERROR_TYPE_PARSE`, and `STEERING_ERROR_TYPE_CALLBACK` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))

### Changed

- `UriReplacement` has the optional HLS keys `PER-VARIANT-URIS` and `PER-RENDITION-URIS` ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))
- The package has a peer dependency on `@svta/cml-utils`. The package imports only types from it ([#61](https://github.com/streaming-video-technology-alliance/common-media-library/issues/61))

## [0.23.1] - 2025-12-22

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [0.23.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/content-steering-v0.23.1...HEAD
[0.23.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/content-steering-v0.23.0...content-steering-v0.23.1
[0.23.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/content-steering-v0.23.0
