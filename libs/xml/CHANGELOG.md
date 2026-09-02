# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `parseXml` no longer hangs on an attribute with no quoted value, such as `<a b>`, `<a b=c/>`, or input truncated mid-attribute. It now throws an error that names the attribute and reports the line and column, matching the XML 1.0 `Attribute ::= Name Eq AttValue` production.
- `parseXml` no longer hangs on input that ends inside the XML declaration, such as `<?xml version="1.0"`. Parsing stops at the end of the input.
- `parseXml` no longer hangs (or, inside nested elements, overflows the call stack) on input that ends inside a matching close tag, such as `<MPD><Period></Period`. The element keeps the children parsed so far.
- `parseXml` throws `Unexpected close tag` when a close tag's name only starts with the open tag's name, such as `<ab>text</abc>` or `</ab>` closing `<a>`, and when a close tag appears at the document level with no open element. Previously both were accepted. A close tag whose exact name is followed by whitespace, such as `</a >`, still closes the element (XML 1.0 `ETag ::= '</' Name S? '>'`).

### Changed

- `parseXml` throws on a quoted attribute value with no `=` (`<a b "c"/>`), which previously parsed leniently as `b="c"`.

## [1.1.6] - 2026-07-28

### Changed

- Update `@svta/cml-utils` to 1.6.0

## [1.1.5] - 2026-07-21

### Changed

- Update `@svta/cml-utils` to 1.5.1

## [1.1.4] - 2026-05-13

### Changed

- Update `@svta/cml-utils` to 1.5.0

## [1.1.3] - 2026-02-11

### Changed

- Update `@svta/cml-utils` to 1.4.0

## [1.1.2] - 2026-02-04

### Changed

- Re-export `XmlNode` type from `@svta/cml-utils`
- Update `@svta/cml-utils` to 1.3.0

## [1.1.1] - 2026-02-03

### Changed

- Update `@svta/cml-utils` to 1.2.0

## [1.1.0] - 2026-01-20

### Added

- Add `includeParentElement` option to `parseXml()` that adds `parentElement` property to each node following DOM spec

### Changed

- Improve `parseXml()` performance by moving constants to module scope, using `Set` for delimiter lookups, and optimizing bounds checks

## [1.0.2] - 2025-12-26

### Changed

- Update `@svta/cml-utils` to 1.1.0 ([#279](https://github.com/streaming-video-technology-alliance/common-media-library/issues/279))

## [1.0.1] - 2025-12-22

### Fixed

- Use fixed version numbers for all CML peer dependencies ([#277](https://github.com/streaming-video-technology-alliance/common-media-library/issues/277))

## [1.0.0] - 2025-10-24

### Changed

- Remove CommonJS exports ([#192](https://github.com/streaming-video-technology-alliance/common-media-library/issues/192))
- Convert to mono-repo ([#238](https://github.com/streaming-video-technology-alliance/common-media-library/issues/238))
- Produce single bundled export for each package ([#260](https://github.com/streaming-video-technology-alliance/common-media-library/issues/260))

[Unreleased]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.6...HEAD
[1.1.6]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.5...xml-v1.1.6
[1.1.5]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.4...xml-v1.1.5
[1.1.4]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.3...xml-v1.1.4
[1.1.3]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.2...xml-v1.1.3
[1.1.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.1...xml-v1.1.2
[1.1.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.1.0...xml-v1.1.1
[1.1.0]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.0.2...xml-v1.1.0
[1.0.2]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.0.1...xml-v1.0.2
[1.0.1]: https://github.com/streaming-video-technology-alliance/common-media-library/compare/xml-v1.0.0...xml-v1.0.1
[1.0.0]: https://github.com/streaming-video-technology-alliance/common-media-library/tree/xml-v1.0.0
