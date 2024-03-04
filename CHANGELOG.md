# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
<!--
## [VERSION] - DATE
### Added
### Changed
### Deprecated
### Documentation
### Fixed
### Removed
### Security

[VERSION]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/PREVIOUS_TAG...VERSION_TAG
-->

## [Unreleased]


## [0.6.4] - 2024-03-04

### Fixed
-  Resolve module import error on id3 feature [#81](https://github.com/streaming-video-technology-alliance/common-media-library/issues/83)


## [0.6.3] - 2024-03-01

### Added
- Unit tests for ID3 feature helper functions [#74](https://github.com/streaming-video-technology-alliance/common-media-library/pull/74)
- ID3 APIC frame decode functionality, and it's respective unit tests [#77](https://github.com/streaming-video-technology-alliance/common-media-library/issues/77)


## [0.6.2] - 2023-01-18

### Fixed
- Some imports are pulling in unnecessary files [#64](https://github.com/streaming-video-technology-alliance/common-media-library/issues/64)


## [0.6.1] - 2023-12-14

### Fixed
- Incorrect return type for `decodeCmsdDynamic` function [#55](https://github.com/streaming-video-technology-alliance/common-media-library/issues/55)


## [0.6.0] - 2023-11-29

### Added
- Add the ability to pass a base URL to all CMCD encode utilities to construct relative paths for `nor` [#50](https://github.com/streaming-video-technology-alliance/common-media-library/issues/50)
- Export constants for CMCD and CMSD version numbers [#44](https://github.com/streaming-video-technology-alliance/common-media-library/issues/44)

### Fixed
- CMCD does not protect against non-Finite numeric values [#45](https://github.com/streaming-video-technology-alliance/common-media-library/issues/45)
- `appendCmcdQuery` does not account for existing CMCD query params [#48](https://github.com/streaming-video-technology-alliance/common-media-library/issues/48)


## [0.5.1] - 2023-11-16

### Changed
- Remove `BigInt` notation


## [0.5.0] - 2023-11-14

### Added
- Implement Common Media Server Data (CMSD) utilities [#35](https://github.com/streaming-video-technology-alliance/common-media-library/issues/35)
- Add request and response interceptors API


## [0.4.5] - 2023-10-12

### Fixed
- `CMCD_PARAM` constant does not match file name [#27](https://github.com/streaming-video-technology-alliance/common-media-library/issues/27)
- lint errors when using typedoc specific tags [#32](https://github.com/streaming-video-technology-alliance/common-media-library/issues/32)
- Allow imports with file extensions [#26](https://github.com/streaming-video-technology-alliance/common-media-library/issues/26)


## [0.4.4] - 2023-10-11

### Fixed
- Module not found: Error: Default condition should be last one [#22](https://github.com/streaming-video-technology-alliance/common-media-library/issues/22)


## [0.4.3] - 2023-07-25

### Added
- Add `NOTICE` file for attributions
- Export library in cjs format [#11](https://github.com/streaming-video-technology-alliance/common-media-library/issues/11)

### Changed
- Switch to inline source maps


## [0.4.2] - 2023-05-25

### Changed
- The project has moved to a new NPM org. First release under `@svta/common-media-library`.


## [0.4.1] - 2023-05-25

### Changed
- The project has moved to a new NPM org. Last release under `@svta.org/common-media-library`.


## [0.4.0] - 2023-05-05

### Added
- Add ID3 APIs [#16](https://github.com/streaming-video-technology-alliance/common-media-library/issues/16)


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
- Add CMCD encode and decode APIs [#1](https://github.com/streaming-video-technology-alliance/common-media-library/issues/1)


## [0.1.0] - 2023-04-27

### Added
- Bootstrap project [#2](https://github.com/streaming-video-technology-alliance/common-media-library/issues/2)


[Unreleased]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.4...HEAD  
[0.6.4]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.3...v0.6.4  
[0.6.3]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.2...v0.6.3  
[0.6.2]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.1...v0.6.2  
[0.6.1]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.6.0...v0.6.1  
[0.6.0]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.5.1...v0.6.0  
[0.5.1]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.5.0...v0.5.1  
[0.5.0]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.5...v0.5.0  
[0.4.5]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.4...v0.4.5  
[0.4.4]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.3...v0.4.4  
[0.4.3]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.2...v0.4.3  
[0.4.2]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.1...v0.4.2  
[0.4.1]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.4.0...v0.4.1  
[0.4.0]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.3.0...v0.4.0  
[0.3.0]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.6...v0.3.0  
[0.2.6]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.5...v0.2.6  
[0.2.5]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.4...v0.2.5  
[0.2.4]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.3...v0.2.4  
[0.2.3]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.2...v0.2.3  
[0.2.2]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.1...v0.2.2  
[0.2.1]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.2.0...v0.2.1  
[0.2.0]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.1.2...v0.2.0  
[0.1.2]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.1.1...v0.1.2  
[0.1.1]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.1.0...v0.1.1  
[0.1.0]\: https://github.com/streaming-video-technology-alliance/common-media-library/compare/v0.0.0...v0.1.0  
