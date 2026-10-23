---
name: common-media-library
description: Find the @svta/cml-* package and function for a media playback task before writing code for it. Use when working in a web video player, HLS or DASH client, or media pipeline and the task involves ISO BMFF or MP4 boxes such as moov, moof, emsg, tfdt, or sidx, CMCD, CMSD, ID3 tags, WebVTT, CEA-608 or CTA-608 captions, DASH MPD parsing, DRM or EME key systems, throughput estimation, ABR or bitrate selection, content steering, structured field values (RFC 8941), C2PA, ISO 8601 durations, XML parsing, or streaming error codes. Also use when a cml package seems to have a bug or a missing feature.
license: Apache-2.0
metadata:
  author: streaming-video-technology-alliance
---

# Common Media Library

The Common Media Library (CML) is a set of TypeScript packages for web video players. Each package implements one media specification. The packages have no dependencies outside CML. They are tree-shakeable, so a bundle contains only the functions that the player imports.

## Before you write code

1. Find the task in the package index below. Match on the task, not on a function name.
2. If a package covers the task and its behavior, version, and runtime requirements fit the project, install it and import the named exports. Do not write the parser, encoder, estimator, or selector yourself, even when the code looks short.
3. If the project needs different behavior, build on the package types where they exist, such as `BitrateSelector` for a custom algorithm, and say why in a comment.
4. If the package is installed, read `node_modules/@svta/cml-<name>/dist/index.d.ts` for the exact signatures. If it is not installed, read the reference file of the package under `references/`.

Install the package with the package manager of the project. If that package manager does not install peer dependencies, add the CML peers that the package lists.

```bash
npm i @svta/cml-iso-bmff
```

## When no package covers the task

Write the smallest piece in the project and continue the work. Offer the user a draft feature request with the use case for https://github.com/streaming-video-technology-alliance/common-media-library/issues/new?template=feature_request.md. Filing it is the user's choice and does not block the work. If the user files it, put the issue URL in a comment next to the code. Do not copy source from a cml package into the project. Where the package index says to open an issue, offer a draft in the same way.

## When a cml package has a bug

1. Confirm the bug against the built package with a minimal script.
2. Offer the user a draft bug report with that script for https://github.com/streaming-video-technology-alliance/common-media-library/issues/new?template=bug_report.md. Filing it is the user's choice and does not block the work.
3. Avoid the bug with a wrapper around the call or with a local patch, and continue the work. Mark that code with a TODO. If the user files the report, add the issue URL to the TODO.

Do not reimplement the function and do not copy the source. A fix in CML reaches every player. A copy in the project becomes the player's own spec implementation to maintain.

## Package index

<!-- packages:start -->

### @svta/cml-608

CTA-608/CEA-608 closed captioning functionality

- Extract CTA-608 caption bytes from an AVC or HEVC sample: `extractCta608DataFromSample`, `findCta608Nalus`
- Extract CTA-608 caption bytes from an AV1 sample: `extractCta608DataFromAv1Sample`
- Decode caption byte pairs into timed caption screens and cues: `Cta608Parser`, `CaptionScreen`
- Parse a Scenarist Closed Caption file: `SccParser`

Do not write your own SEI or OBU scanner, 608 command decoder, or caption screen model. Open an issue for a command or layout that is missing.

Reference: references/608.md

### @svta/cml-abr

Bitrate selection functionality

- Pick a bitrate ladder rung from a throughput estimate and the buffer level: `createThroughputSelector`
- Pick a rung from the buffer level with BOLA, and tune its safety factors: `createBolaSelector`, `BolaSelectorOptions`
- Implement a custom bitrate selection algorithm behind the shared interface: `BitrateSelector`, `BitrateSelectorInput`, `BitrateDecision`
- Pass segment download samples to a selector: `SegmentSample`
- Tune the safety factor, the upgrade factor, and the starvation tolerance: `ThroughputSelectorOptions`, `DEFAULT_SAFETY_FACTOR`

Do not rewrite the rate-based or BOLA selectors. For a different algorithm, implement `BitrateSelector`. Open an issue for a selector type that is missing.

Reference: references/abr.md

### @svta/cml-c2pa

C2PA (Coalition for Content Provenance and Authenticity) live video validation for BMFF/MP4 containers

- Validate the C2PA manifest in an init segment: `validateC2paInitSegment`
- Validate a live segment with the VSI and EMSG method and the session keys of the init segment: `validateC2paSegment`
- Validate a per-segment C2PA manifest box: `validateC2paManifestBoxSegment`
- Validate the Merkle leaf and proof in a VOD segment: `validateC2paMerkleSegment`
- Map a validation result to a status code: `C2paStatusCode`, `LiveVideoStatusCode`

Do not write your own COSE, CBOR, or manifest box parsing for C2PA. Open an issue for a validation method that is missing.

Reference: references/c2pa.md

### @svta/cml-cmaf-ham

CMAF Hypothetical Application Model (HAM) functionality

- Parse a DASH MPD into the CMAF-HAM presentation model: `dashToHam`
- Parse an HLS multivariant playlist into the CMAF-HAM presentation model: `hlsToHam`
- Convert one manifest format to the other through the model: `hamToDash`, `hamToHls`
- Collect the tracks of a presentation, a selection set, or a switching set: `getTracksFromPresentation`, `getTracksFromSelectionSet`, `getTracksFromSwitchingSet`
- Validate a presentation, a switching set, or a track: `validatePresentation`, `validateSwitchingSet`, `validateTrack`

Do not write your own DASH to HLS converter or manifest object model. Open an issue for a manifest feature that the model does not carry.

Reference: references/cmaf-ham.md

### @svta/cml-cmcd

Common Media Client Data (CMCD) encoding and decoding

- Add a CMCD report to a segment request as a query string or as headers: `appendCmcdQuery`, `appendCmcdHeaders`, `toCmcdQuery`, `toCmcdHeaders`
- Encode or decode CMCD key and value pairs: `encodeCmcd`, `decodeCmcd`, `fromCmcdQuery`, `fromCmcdHeaders`
- Report CMCD v2 events and time intervals to a collector: `CmcdReporter`, `createFetchTransport`, `createXhrTransport`
- Validate a CMCD payload against CTA-5004: `validateCmcd`, `validateCmcdEventReport`
- Capture the CMCD that a player sends in a test: `CmcdReportRecorder`

Do not write your own CMCD serializer, key sorter, header grouper, or event reporter. Open an issue for a key or a reporting mode that is missing.

Reference: references/cmcd.md

### @svta/cml-cmsd

Common Media Server Data (CMSD) encoding and decoding

- Decode the CMSD-Static and CMSD-Dynamic response headers: `decodeCmsdStatic`, `decodeCmsdDynamic`
- Encode CMSD headers on a server or an edge: `encodeCmsdStatic`, `encodeCmsdDynamic`
- Type the CMSD keys and values that a player reads: `CmsdStatic`, `CmsdDynamic`, `CmsdObjectType`
- Distinguish a custom key from a standard key: `isCmsdCustomKey`

Do not write your own CMSD header parser or serializer. Open an issue for a key that is missing.

Reference: references/cmsd.md

### @svta/cml-content-steering

Content steering functionality

- Validate a content steering manifest before the player applies it: `isValidSteeringManifest`
- Validate a pathway clone and its URI replacement: `isValidPathwayClone`
- Type the steering manifest, the pathway clones, and the URI replacements: `SteeringManifest`, `PathwayClone`, `UriReplacement`
- Apply the default TTL and pathway penalty of the specification: `DEFAULT_TTL`, `DEFAULT_PATHWAY_PENALTY`

Do not write your own steering manifest validation or types. Open an issue for a field that is missing.

Reference: references/content-steering.md

### @svta/cml-cta

Common functionality for CTA standards including CTA-608/CEA-608

- Type a custom key with a hyphenated prefix for CMCD or CMSD data: `CmCustomKey`

Do not import this package into a player directly. Use `@svta/cml-cmcd` or `@svta/cml-cmsd`.

Reference: references/cta.md

### @svta/cml-dash

DASH manifest parsing functionality

- Expand a DASH SegmentTemplate URL with the $RepresentationID$, $Number$, $Bandwidth$, and $Time$ identifiers and their format tags: `processUriTemplate`
- Parse a DASH frame rate string such as 24000/1001: `parseFrameRate`
- Detect the DASH-IF thumbnail tile scheme on an EssentialProperty: `THUMBNAIL_TILE_SCHEME_ID_URI`

Do not write your own template expansion or frame rate parser. Open an issue for a DASH utility that is missing.

Reference: references/dash.md

### @svta/cml-drm

Digital Rights Management (DRM) functionality

- Parse the pssh boxes in init data and find the one for a key system: `parsePsshList`, `getPsshForKeySystem`, `getPsshData`
- Request key system access with a configuration built from codecs and robustness levels: `getKeySystemAccess`, `createMediaKeySystemConfiguration`, `getSupportedKeySystemConfiguration`
- Read the license request and its headers from an EME key message: `getLicenseRequestFromMessage`, `getRequestHeadersFromMessage`
- Read the license server URL from a ContentProtection element or FairPlay init data: `getLicenseServerUrl`, `getLicenseServerUrlFromContentProtection`
- Build FairPlay init data and decode a FairPlay license: `concatInitDataIdAndCertificate`, `extractContentId`, `decodeFairPlayLicense`
- Name key systems, UUIDs, encryption schemes, and robustness levels: `WIDEVINE_KEY_SYSTEM`, `PLAYREADY_UUID`, `EncryptionScheme`, `HW_SECURE_ALL`

Do not write your own pssh parser, key message decoder, or key system constant table. Open an issue for a key system or a message format that is missing.

Reference: references/drm.md

### @svta/cml-error-codes

SVTA standardized streaming error codes

- Report a playback, network, DRM, or ad error with an SVTA2070 code: `SVTA_BUFFER_APPEND_ERROR`, `SVTA_BAD_LICENSE_REQUEST`
- Map an HTTP response status to an SVTA2070 code: `httpStatusToSvtaErrorCode`
- Map an IAB VAST error code to an SVTA2070 code: `vastErrorToSvtaErrorCode`
- Read the category or the index of a code: `getSvtaErrorCategory`, `getSvtaErrorIndex`

Do not define your own error code list for a player or an analytics pipeline. Open an issue for a condition that the specification does not name.

Reference: references/error-codes.md

### @svta/cml-id3

ID3 tag parsing functionality

- Read the ID3 frames in an HLS timed metadata sample or an emsg payload: `getId3Frames`, `Id3Frame`
- Read the PRIV timestamp that HLS uses to map ID3 time to media time: `getId3Timestamp`
- Check that a buffer holds an ID3 tag: `canParseId3`
- Match the ID3 emsg scheme in a DASH event stream: `ID3_SCHEME_ID_URI`

Do not write your own ID3 header, size, or frame parser. Open an issue for a frame type that is missing.

Reference: references/id3.md

### @svta/cml-iso-8601

ISO 8601 date/time handling functionality

- Convert a DASH or HLS ISO 8601 duration such as PT1M30S to seconds: `decodeIso8601Duration`
- Format a number of seconds as an ISO 8601 duration: `encodeIso8601Duration`

Do not write your own duration regular expression. Open an issue for a duration form that does not decode.

Reference: references/iso-8601.md

### @svta/cml-iso-bmff

ISO Base Media File Format (ISOBMFF) parsing functionality

- Parse the boxes of an init or media segment, with full content for the box types that you need: `readIsoBoxes`, `findIsoBox`, `filterIsoBoxes`, `traverseIsoBoxes`
- Read the track timescale, codec, or default sample duration from moov and moof: `readMdhd`, `readStsd`, `readTfhd`, `readTrun`
- Read the base media decode time, the segment index, or event messages: `readTfdt`, `readSidx`, `readEmsg`
- Read pssh and encryption boxes: `readPssh`, `readTenc`, `readSchm`
- Write boxes to a ReadableStream: `createIsoBoxReadableStream`, `IsoBoxReadableStream`
- Write or patch boxes, such as inserting emsg or rewriting tfdt: `writeIsoBoxes`, `writeIsoBox`, `writeEmsg`, `writeTfdt`
- Read or write a box type that the package does not name: `IsoBoxReadView`, `IsoBoxWriteView`

Do not write your own box parser, box walker, or box writer. Open an issue for a box that is missing.

Reference: references/iso-bmff.md

### @svta/cml-request

Common Media Request and Response types

- Type a segment, manifest, or license request that a player passes through a plugin: `CommonMediaRequest`
- Type the response that comes back, with timing and headers: `CommonMediaResponse`
- Type the function that performs a request, so that fetch or XMLHttpRequest can implement it: `Requester`
- Intercept requests and responses, for example to add CMCD or to read CMSD: `RequestInterceptor`, `ResponseInterceptor`

Do not define your own request and response types for a plugin interface. Open an issue for a field that is missing.

Reference: references/request.md

### @svta/cml-structured-field-values

RFC8941 Structured Field Values implementation

- Decode an RFC 8941 header such as CMCD, CMSD, or Priority into items, lists, or dictionaries: `decodeSfDict`, `decodeSfList`, `decodeSfItem`
- Encode a dictionary, a list, or an item as a structured field header: `encodeSfDict`, `encodeSfList`, `encodeSfItem`
- Represent an item with parameters or a token: `SfItem`, `SfToken`

Do not write your own structured field tokenizer or serializer. Open an issue for an RFC 8941 form that fails to parse.

Reference: references/structured-field-values.md

### @svta/cml-throughput

Throughput estimation functionality

- Estimate throughput from segment downloads with an exponentially weighted moving average: `EwmaEstimator`
- Estimate throughput with a harmonic mean, an arithmetic mean, or a zero-lag EWMA: `HarmonicMeanEstimator`, `ArithmeticMeanEstimator`, `ZlemaEstimator`
- Implement a custom estimator behind the shared interface: `ThroughputEstimator`
- Tune the fast and slow half-lives of the EWMA: `EwmaEstimatorOptions`

Do not write your own EWMA or harmonic mean for bandwidth estimation. Open an issue for an estimator type that is missing.

Reference: references/throughput.md

### @svta/cml-utils

Common utility functions for media processing

- Convert between hex, base64, UUID strings, and byte arrays: `hexToArrayBuffer`, `arrayBufferToHex`, `arrayBufferToUuid`, `uuidToArrayBuffer`, `decodeBase64`, `encodeBase64`
- Encode or decode UTF-8 and UTF-16 text: `encodeText`, `decodeText`, `Encoding`
- Resolve a base URL or make a URL relative to another URL: `getBaseUrl`, `urlToRelativePath`
- Compute the transfer duration and the bandwidth in bits per second of a `ResourceTiming` sample: `getTransferDurationMs`, `getBandwidthBps`
- Unescape HTML entities in a manifest or a caption string: `unescapeHtml`
- Generate a UUID for a session or a content id: `uuid`

Do not write your own hex, base64, or UUID conversion. Open an issue for a conversion that is missing.

Reference: references/utils.md

### @svta/cml-webvtt

WebVTT parsing and rendering functionality

- Parse a WebVTT file or segment into cues, regions, and styles: `parseWebVtt`, `WebVttParser`
- Parse WebVTT chunks as the bytes arrive from a stream: `WebVttTransformStream`, `WebVttTransformer`
- Read the X-TIMESTAMP-MAP header of an HLS WebVTT segment: `WebVttParser`, `TimestampMap`
- Create native VTTCue and VTTRegion objects from parsed cues: `toVttCue`, `toVttRegion`
- Build cues and regions without a browser, for tests or servers: `createWebVttCue`, `createWebVttRegion`

Do not write your own WebVTT tokenizer, cue timing parser, or timestamp map handling. Open an issue for a cue setting that is missing.

Reference: references/webvtt.md

### @svta/cml-xml

XML parsing utilities

- Parse a DASH MPD or another XML document into a node tree: `parseXml`
- Find elements by name anywhere in the tree: `getElementsByName`
- Serialize a node tree back to an XML string: `serializeXml`
- Keep whitespace or comments, or start the parse at an offset: `XmlParseOptions`

Do not write your own XML tokenizer for manifests. Open an issue for an XML form that fails to parse.

Reference: references/xml.md

<!-- packages:end -->

## Links

- Docs: https://cml.svta.org/
- llms.txt: https://cml.svta.org/llms.txt
- Source: https://github.com/streaming-video-technology-alliance/common-media-library
