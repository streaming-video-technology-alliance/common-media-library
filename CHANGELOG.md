# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.17.1] - 2025-07-28

### Fixed

- CMCD encoder strips query params from nor field.
  ([#239](https://github.com/streaming-video-technology-alliance/common-media-library/issues/239))

## [0.17.0] - 2025-07-22

### Added

- Add CMCD config type and request builder
  ([#227](https://github.com/streaming-video-technology-alliance/common-media-library/issues/227))
- Add const for DASH thumbnail tile scheme ID URI
- Add UUID utilities for converting to and from hex strings and changing
  endianness

### Changed

- Convert `parseWebVtt` function to an `async` function.

## [0.16.0] - 2025-07-09

### Added

- Utility function for parsing DASH `frameRate` attributes
  ([#221](https://github.com/streaming-video-technology-alliance/common-media-library/issues/221))
- Add type definitions for content steering entities
  ([#176](https://github.com/streaming-video-technology-alliance/common-media-library/pull/176))

### Changed

- Update CMCD utilities to handle v2 rules, keys, and modes
  ([#223](https://github.com/streaming-video-technology-alliance/common-media-library/issues/223))

## [0.15.1] - 2025-06-27

### Fixed

- Typo in `isCmcdResponseKey` function name

## [0.15.0] - 2025-06-26

### Added

- Add new CMCD Version 2 Keys, Constants and Types
  ([#218](https://github.com/streaming-video-technology-alliance/common-media-library/issues/218))

## [0.14.0] - 2025-06-18

### Added

- Add map type for ISO BMFF boxes to their type properties
  ([#208](https://github.com/streaming-video-technology-alliance/common-media-library/issues/208))
- Added Zlema Throughput Estimator
  ([#212](https://github.com/streaming-video-technology-alliance/common-media-library/pull/212))

### Changed

- Update Node.js development version to 24
  ([#211](https://github.com/streaming-video-technology-alliance/common-media-library/issues/211))
- Consistently used function declaration across CML
  ([#213](https://github.com/streaming-video-technology-alliance/common-media-library/pull/213))

### Fixed

- Fixed TypeScript errors related to Boxes
  ([#214](https://github.com/streaming-video-technology-alliance/common-media-library/pull/214))

## [0.13.0] - 2025-06-09

### Added

- Add ISO BMFF `iden` box parser
  ([#197](https://github.com/streaming-video-technology-alliance/common-media-library/issues/197))
- Added EWMA Throughput Calculations
  ([#160](https://github.com/streaming-video-technology-alliance/common-media-library/pull/160))
- VTT Parsing Utilities
  ([#193](https://github.com/streaming-video-technology-alliance/common-media-library/issues/193))
- Added Harmonic Mean Throughput Estimator
  ([#199](https://github.com/streaming-video-technology-alliance/common-media-library/pull/199))
- Added Arithmetic Mean Throughput Estimator
  ([#201](https://github.com/streaming-video-technology-alliance/common-media-library/pull/201))

### Fixed

- The ISO BMFF utilities are not properly typed
  ([#202](https://github.com/streaming-video-technology-alliance/common-media-library/issues/202))

## [0.12.4] - 2025-05-16

### Fixed

- `processUriTemplate` cannot correctly resolve time values larger than
  `MAX_SAFE_INTEGER`
  ([#190](https://github.com/streaming-video-technology-alliance/common-media-library/issues/190))

## [0.12.3] - 2025-05-15

### Fixed

- The `parseXml` function does not decode HTML entities in attribute values
  ([#187](https://github.com/streaming-video-technology-alliance/common-media-library/issues/187))

## [0.12.2] - 2025-05-15

### Fixed

- Additional fixes for TS Error: Import path cannot end with a '.ts' extension
  ([#183](https://github.com/streaming-video-technology-alliance/common-media-library/issues/183))

## [0.12.1] - 2025-05-14

### Fixed

- TS Error: Import path cannot end with a '.ts' extension
  ([#183](https://github.com/streaming-video-technology-alliance/common-media-library/issues/183))

## [0.12.0] - 2025-05-08

### Added

- Added Throughput Calculation Interfaces
  ([#170](https://github.com/streaming-video-technology-alliance/common-media-library/pull/170))
- Add ID3 scheme ID URI
  ([#174](https://github.com/streaming-video-technology-alliance/common-media-library/pull/174))
- PlayReady DRM Utilities
  ([#172](https://github.com/streaming-video-technology-alliance/common-media-library/issues/172))

### Changed

- Ensure CML is compliant with the type annotations proposal
  ([#134](https://github.com/streaming-video-technology-alliance/common-media-library/issues/134))

### Fixed

- TSLib imported in version 0.11.0's utils.js.
  ([#177](https://github.com/streaming-video-technology-alliance/common-media-library/issues/177))

## [0.11.0] - 2025-04-03

### Added

- Common DRM Models and Constants
  ([#154](https://github.com/streaming-video-technology-alliance/common-media-library/issues/154))
- Core DRM Utilities - CommonEncryption, KeySystemUtils
  ([#156](https://github.com/streaming-video-technology-alliance/common-media-library/issues/156))

### Changed

- `CommonMediaRequest` / `CommonMediaResponse` Updates
  ([#163](https://github.com/streaming-video-technology-alliance/common-media-library/issues/163))

### Fixed

- The format command no longer works
  ([#166](https://github.com/streaming-video-technology-alliance/common-media-library/issues/166))

## [0.10.0] - 2025-03-10

### Added

- FairPlay Utilities
  ([#131](https://github.com/streaming-video-technology-alliance/common-media-library/issues/131))
- Add `prefix` and `localName` support to the XML types and utilities
  ([#145](https://github.com/streaming-video-technology-alliance/common-media-library/issues/145))
- Common DRM Models and Constants
  ([#154](https://github.com/streaming-video-technology-alliance/common-media-library/issues/154))

## [0.9.0] - 2025-02-21

### Added

- ISO BMFF parser and utilities
  ([#118](https://github.com/streaming-video-technology-alliance/common-media-library/issues/118))

## [0.8.0] - 2025-02-14

### Added

- Add DASH Segment Template Utility
  ([#129](https://github.com/streaming-video-technology-alliance/common-media-library/issues/129))
- Add XML parsing utils
  ([#125](https://github.com/streaming-video-technology-alliance/common-media-library/issues/125))

### Changed

- Updated `NOTICE` file to use Markdown formatting to preserve the text of
  included licenses.
- Export ISO 8601 duration utilities.

### Fix

- Corrected Changelog formatting.

## [0.7.4] - 2024-11-05

### Changed

- Replace Typescript enums with constants
  ([#103](https://github.com/streaming-video-technology-alliance/common-media-library/issues/103))
- Remove CMAF HAM dependencies
  ([#119](https://github.com/streaming-video-technology-alliance/common-media-library/issues/119))

## [0.7.3] - 2024-08-30

### Fix

- Cannot import library in jest tests
  ([#98](https://github.com/streaming-video-technology-alliance/common-media-library/issues/98))
- Replace `ts-node`
  ([#101](https://github.com/streaming-video-technology-alliance/common-media-library/issues/101))

## [0.7.2] - 2024-08-28

### Fix

- Cannot import library in jest tests
  ([#98](https://github.com/streaming-video-technology-alliance/common-media-library/issues/98))

## [0.7.1] - 2024-06-21

### Fix

- Missing dependencies in package.json
  ([#96](https://github.com/streaming-video-technology-alliance/common-media-library/issues/96))

## [0.7.0] - 2024-06-05

### Added

- Add CMAF-Ham types, mappers and services to convert and manipulate VOD HLS and
  VOD DASH manifests.
- Add cmaf-ham-converter sample to showcase the CMAF-Ham functions.
- Implement CEA 608/708 parser
  ([#62](https://github.com/streaming-video-technology-alliance/common-media-library/issues/62))

### Fix

- Integrate outstanding 608 PR
  ([#88](https://github.com/streaming-video-technology-alliance/common-media-library/issues/88))

## [0.6.4] - 2024-03-04

### Fixed

- Resolve module import error on id3 feature
  ([#83](https://github.com/streaming-video-technology-alliance/common-media-library/issues/83))

## [0.6.3] - 2024-03-01

### Added

- Unit tests for ID3 feature helper functions
  ([#74](https://github.com/streaming-video-technology-alliance/common-media-library/pull/74))
- ID3 APIC frame decode functionality, and it's respective unit tests
  ([#77](https://github.com/streaming-video-technology-alliance/common-media-library/issues/77))

## [0.6.2] - 2023-01-18

### Fixed

- Some imports are pulling in unnecessary files
  ([#64](https://github.com/streaming-video-technology-alliance/common-media-library/issues/64))

## [0.6.1] - 2023-12-14

### Fixed

- Incorrect return type for `decodeCmsdDynamic` function
  ([#55](https://github.com/streaming-video-technology-alliance/common-media-library/issues/55))

## [0.6.0] - 2023-11-29

### Added

- Add the ability to pass a base URL to all CMCD encode utilities to construct
  relative paths for `nor`
  ([#50](https://github.com/streaming-video-technology-alliance/common-media-library/issues/50))
- Export constants for CMCD and CMSD version numbers
  ([#44](https://github.com/streaming-video-technology-alliance/common-media-library/issues/44))

### Fixed

- CMCD does not protect against non-Finite numeric values
  ([#45](https://github.com/streaming-video-technology-alliance/common-media-library/issues/45))
- `appendCmcdQuery` does not account for existing CMCD query params
  ([#48](https://github.com/streaming-video-technology-alliance/common-media-library/issues/48))

## [0.5.1] - 2023-11-16

### Changed

- Remove `BigInt` notation

## [0.5.0] - 2023-11-14

### Added

- Implement Common Media Server Data (CMSD) utilities
  ([#35](https://github.com/streaming-video-technology-alliance/common-media-library/issues/35))
- Add request and response interceptors API

## [0.4.5] - 2023-10-12

### Fixed

- `CMCD_PARAM` constant does not match file name
  ([#27](https://github.com/streaming-video-technology-alliance/common-media-library/issues/27))
- lint errors when using typedoc specific tags
  ([#32](https://github.com/streaming-video-technology-alliance/common-media-library/issues/32))
- Allow imports with file extensions
  ([#26](https://github.com/streaming-video-technology-alliance/common-media-library/issues/26))

## [0.4.4] - 2023-10-11

### Fixed

- Module not found: Error: Default condition should be last one
  ([#22](https://github.com/streaming-video-technology-alliance/common-media-library/issues/22))

## [0.4.3] - 2023-07-25

### Added

- Add `NOTICE` file for attributions
- Export library in cjs format
  ([#11](https://github.com/streaming-video-technology-alliance/common-media-library/issues/11))

### Changed

- Switch to inline source maps

## [0.4.2] - 2023-05-25

### Changed

- The project has moved to a new NPM org. First release under
  `@svta/common-media-library`.

## [0.4.1] - 2023-05-25

### Changed

- The project has moved to a new NPM org. Last release under
  `@svta.org/common-media-library`.

## [0.4.0] - 2023-05-05

### Added

- Add ID3 APIs
  ([#16](https://github.com/streaming-video-technology-alliance/common-media-library/issues/16))

## [0.3.0] - 2023-05-04

### Added

- Add new decode APIs `fromCmcdHeaders` and `fromCmcdQuery`

## [0.2.6] - 2023-05-03

### Fixed

- Fix issue where `decodeCmcd` produces incorrect results for token values

## [0.2.5] - 2023-05-03

### Fixed

- Fix issue where `decodeCmcd` produces incorrect results for empty strings

## [0.2.4] - 2023-05-03

### Changed

- Update npm dependencies
- Improve `uuid` randomness
- Streamline build processes
- Update README

## [0.2.3] - 2023-05-03

### Added

- Export `CmcdParam`

## [0.2.2] - 2023-05-02

### Fixed

- Argument order mismatch in `appendCmcdQuery`

## [0.2.1] - 2023-05-02

### Added

- Additional formatting of CMCD integer values

## [0.2.0] - 2023-04-28

### Added

- Add namespaced exports

### Changed

- Update CMCD APIs

## [0.1.2] - 2023-04-28

### Fixed

- Republish of NPM package

## [0.1.1] - 2023-04-27

### Added

- Add CMCD encode and decode APIs
  ([#1](https://github.com/streaming-video-technology-alliance/common-media-library/issues/1))

## [0.1.0] - 2023-04-27

### Added

- Bootstrap project
  ([#2](https://github.com/streaming-video-technology-alliance/common-media-library/issues/2))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.17.1...HEAD
[0.17.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.15.1...v0.16.0
[0.15.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.12.4...v0.13.0
[0.12.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.12.3...v0.12.4
[0.12.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.12.2...v0.12.3
[0.12.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.12.1...v0.12.2
[0.12.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.12.0...v0.12.1
[0.12.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.7.4...v0.8.0
[0.7.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.4...v0.7.0
[0.6.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.5...v0.5.0
[0.4.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.6...v0.3.0
[0.2.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.0.0...v0.1.0
