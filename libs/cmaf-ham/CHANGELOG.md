# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- `Track.url` is optional. An HLS audio rendition without a `URI` attribute maps to a track without a URL, and the HLS writer already falls back to `<id>.m3u8` for that case. TypeScript consumers that read `track.url` as a `string` need to handle `undefined`.
- `addMetadataToHls` stores `version` and `mediaSequence` as strings when the parsed HLS manifest has them. Before, an inverted check stored the value only when it was missing. Nothing in the package reads these entries.
- The HLS mapper types describe the fields the mapper reads. `PlayList.attributes` adds `LANGUAGE` and `FRAME-RATE`, the `MediaGroups` items add an optional `uri`, and `HlsManifest` adds `version` and `mediaSequence`. `audioGroupsToSwitchingSets` and `subtitleGroupsToSwitchingSets` take the typed media groups instead of `any`. `Mapper.getManifestMetadata` and `HlsMapper.getManifestMetadata` return `JSON | undefined`, the type that `DashMapper` and `MapperContext` already declare.
- The README now has a When to use section. The section names the tasks that the package covers and the entry point of each task.
- The overview in `src/README.md` links the documentation at https://cml.svta.org/.
- `getUrlFromTemplate` and `getInitializationUrl` resolve the segment URL templates with `processUriTemplate` from `@svta/cml-dash`, a new peer dependency. The templates now resolve `$Bandwidth$`, `$Time$`, `$$`, and a `%0<width>d` tag of any width, so `$Number%05d$` gives `00001` instead of `1`. A token outside the template grammar, such as `$Number%d$`, stays in the URL unchanged instead of becoming the plain number.

### Fixed

- `iso8601DurationToNumber` adds the days of a duration and reads the minutes after the `T` designator. Before, `P1DT1H` gave 3600 and `P0Y0M0DT0H1M30.000S` gave 30. The function ignores the years and months of a duration.

## [0.24.8] - 2026-10-18

### Changed

- `@svta/cml-drm` is now a declared peer dependency.
- README: a usage example replaces the empty code block. The examples in `src/README.md` import from `@svta/cml-cmaf-ham` and compile. The sample README gives the correct folder and run command.
- The `parseByteRangeString` and `byteRangeToHlsString` docs now format `length@offset` as code.
- Peer dependency ranges are now caret ranges, for example `^1.6.2` instead of `1.6.2`. A later patch or minor release of a peer no longer requires a new release of this package.

### Fixed

- The conversion sample resolves its input and output folders from the script location, so `npm run dev -w libs/cmaf-ham` works from any directory. It no longer fails on an HLS ancillary playlist with an empty file name.

## [0.24.7] - 2026-09-15

### Changed

- Update `@svta/cml-utils` to 1.6.1

## [0.24.6] - 2026-07-28

### Changed

- Update `@svta/cml-utils` to 1.6.0

## [0.24.5] - 2026-07-21

### Fixed

- The ISO 8601 duration regexes in the DASH converter no longer rescan quadratically on long digit runs (CodeQL polynomial ReDoS); matches and captures are unchanged ([#388](https://github.com/streaming-video-technology-alliance/common-media-library/issues/388))

## [0.24.4] - 2026-05-13

### Changed

- Update `@svta/cml-utils` to 1.5.0

## [0.24.3] - 2026-02-11

### Changed

- Update `@svta/cml-utils` to 1.4.0

## [0.24.2] - 2026-02-04

### Changed

- Update `@svta/cml-utils` to 1.3.0

## [0.24.1] - 2026-02-03

### Changed

- Update `@svta/cml-utils` to 1.2.0

## [0.24.0] - 2025-01-07

### Changed

- Update CMAF HAM model types

## [0.23.2] - 2025-12-26

### Changed

- Update `@svta/cml-utils` to 1.1.0 ([#279](https://github.com/streaming-video-technology-alliance/common-media-library/issues/279))

## [0.23.1] - 2025-12-22

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [0.23.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.8...HEAD
[0.24.8]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.7...cmaf-ham-v0.24.8
[0.24.7]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.6...cmaf-ham-v0.24.7
[0.24.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.5...cmaf-ham-v0.24.6
[0.24.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.4...cmaf-ham-v0.24.5
[0.24.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.3...cmaf-ham-v0.24.4
[0.24.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.2...cmaf-ham-v0.24.3
[0.24.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.1...cmaf-ham-v0.24.2
[0.24.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.24.0...cmaf-ham-v0.24.1
[0.24.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.23.2...cmaf-ham-v0.24.0
[0.23.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.23.1...cmaf-ham-v0.23.2
[0.23.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/cmaf-ham-v0.23.0...cmaf-ham-v0.23.1
[0.23.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/cmaf-ham-v0.23.0
