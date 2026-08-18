---
status: draft
---

# RFC: SVTA Standardized Error Codes — `@svta/cml-error-codes`

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-08-18 |
| **Package** | `@svta/cml-error-codes` (new) |
| **Breaking change** | No (new package) |

## Summary

A new package, `@svta/cml-error-codes`, ships the reference implementation of the *SVTA Standardized Error Codes* specification (Player Working Group, original publication July 8, 2026): every named code as typed constants, the spec's category/index arithmetic, HTTP and VAST embedding, and an opt-in human-readable dictionary. The spec's own objectives include "Error codes referenced in the Common Media Library via SVTA's Player Working Group"; this package is that deliverable.

```ts
import { getSvtaErrorCategory, httpStatusToSvtaErrorCode, SvtaErrorCategory, SvtaPlaybackErrorCode } from '@svta/cml-error-codes'

const code = SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN // 2001

getSvtaErrorCategory(code) // SvtaErrorCategory.PLAYBACK (2)
httpStatusToSvtaErrorCode(404) // 3404, an HTTP 404 embedded in the Network category
```

A complete reference implementation exists on branch [`claude/svta-error-codes-cml-d0ad01`](https://github.com/streaming-video-technology-alliance/common-media-library/tree/claude/svta-error-codes-cml-d0ad01/libs/error-codes), with implementation artifacts in `plans/error-codes/`. The full generated API surface is reviewable in [`cml-error-codes.api.md`](https://github.com/streaming-video-technology-alliance/common-media-library/blob/claude/svta-error-codes-cml-d0ad01/libs/error-codes/config/cml-error-codes.api.md).

## Motivation

Every player ships its own error vocabulary: hls.js uses string type/detail pairs, dash.js integer codes, Shaka severity/category/code triples, AVFoundation negative integers. A Publisher running several players cannot triage failures without per-player decoder rings, and resolutions learned on one player do not transfer to another. The SVTA spec fixes the vocabulary: codes are short integers whose thousands digits identify the category (`Math.floor(code / 1000)`) and whose last three digits identify the specific error (`code % 1000`), with externally maintained standards (HTTP, VAST) embedded rather than reclassified.

The spec is only useful if players and QoE vendors reference the same constants instead of hand-copying magic numbers from a PDF. That shared artifact belongs in CML, next to the other SVTA/CTA spec implementations players already consume.

## Guide-level explanation

Codes are grouped into one `as const` catalog per spec category, so autocomplete guides adopters to valid values and each import costs only the categories used:

```ts
import assert from 'node:assert'
import { getSvtaErrorCategory, SvtaErrorCategory, SvtaPlaybackErrorCode } from '@svta/cml-error-codes'

const code = SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN

assert(code === 2001)
assert(getSvtaErrorCategory(code) === SvtaErrorCategory.PLAYBACK)
```

HTTP response statuses embed into the Network category and IAB VAST error codes embed into the Advertising category, composed at runtime from the values ad SDKs and network stacks already provide:

```ts
import assert from 'node:assert'
import { httpStatusToSvtaErrorCode, vastErrorToSvtaErrorCode } from '@svta/cml-error-codes'

assert(httpStatusToSvtaErrorCode(404) === 3404)
assert(vastErrorToSvtaErrorCode(301) === 7301)
```

Human-readable descriptions ship in their own module for dashboards and log lines, and add nothing to bundles that do not use them:

```ts
import assert from 'node:assert'
import { getSvtaErrorDescription, SvtaPlaybackErrorCode } from '@svta/cml-error-codes'

assert(getSvtaErrorDescription(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN) === 'Video buffer underrun')
assert(getSvtaErrorDescription(3404) === 'Received an HTTP 404 response')
```

## Reference-level explanation

### Code model

- Codes are integers. Category = `Math.floor(code / 1000)`; index = `code % 1000`, per the spec's normative arithmetic.
- Native indices occupy 0–99; embedded external codes occupy 100–999 (HTTP in Network, VAST in Advertising).
- `999` is the only code below 1000 and means "entirely unknown". Index 0 of every other category is that category's "known category, no further detail" code, so every catalog's `UNKNOWN` member equals `category * 1000`.
- Categories: 0 Unknown, 1 Media Content, 2 Playback, 3 Network, 4 Content Protection, 5 Accessibility, 6 Remote Play, 7 Advertising, 99 Custom (Publisher-defined; 99001–99999 reserved for bespoke use).

### Export surface

All runtime exports use the repo's const enum pattern (`as const` object + merged `ValueOf` type), one export per file behind an alphabetical barrel. The only dependency is a type-only peer on `@svta/cml-utils`.

| Export | Kind | Contents |
| --- | --- | --- |
| `SvtaErrorCategory` | catalog | 9 categories (values 0–7, 99) |
| `SvtaUnknownErrorCode` | catalog | `UNKNOWN: 999` |
| `SvtaMediaContentErrorCode` | catalog | 10 codes, 1000–1009 |
| `SvtaPlaybackErrorCode` | catalog | 42 codes, 2000–2041 |
| `SvtaNetworkErrorCode` | catalog | 12 codes, 3000–3011 |
| `SvtaContentProtectionErrorCode` | catalog | 22 codes, 4000–4021 |
| `SvtaAccessibilityErrorCode` | catalog | 5 codes, 5000–5004 |
| `SvtaRemotePlayErrorCode` | catalog | 10 codes, 6000–6009 |
| `SvtaAdvertisingErrorCode` | catalog | 34 codes: 7000–7001 native, 7100–7999 VAST embeds (no 7404; VAST defines no 404) |
| `SvtaCustomErrorCode` | catalog | `UNKNOWN: 99000` |
| `SvtaErrorCode` | type | union of the nine catalog value types |
| `getSvtaErrorCategory(code: number): SvtaErrorCategory \| undefined` | function | `floor(code / 1000)`; `undefined` for unassigned categories (8–98, >99, negatives, `NaN`), future-proofing the spec's planned width growth |
| `getSvtaErrorIndex(code: number): number` | function | `code % 1000` |
| `httpStatusToSvtaErrorCode(status: number): number` | function | `3000 + status` for integer statuses 100–599, else `3000` |
| `vastErrorToSvtaErrorCode(vastError: number): number` | function | `7000 + vastError` for integer VAST codes 100–999, else `7000` |
| `getSvtaErrorDescription(code: number): string \| undefined` | function | spec description for every named code; synthesizes `Received an HTTP <n> response` for un-enumerated HTTP embeds; `undefined` otherwise |

The 137 member names derive from the spec descriptions as UPPER_SNAKE, kept consistent within each category (`MANIFEST_PARSE_ERROR` mirrors `SEGMENT_PARSE_ERROR`) and IAB-recognizable for VAST members (`WRAPPER_TIMEOUT`, `VPAID_ERROR`). The full name-to-value listing is the generated [`cml-error-codes.api.md`](https://github.com/streaming-video-technology-alliance/common-media-library/blob/claude/svta-error-codes-cml-d0ad01/libs/error-codes/config/cml-error-codes.api.md); member-level TSDoc carries the spec description verbatim.

### Semantics and edge cases

- The embedding helpers never throw. Out-of-range input returns the target category's `UNKNOWN` code (3000 / 7000), because error-reporting paths must not themselves fail.
- `SvtaErrorCode` is a closed union of the *named* codes. Spec-valid codes exist outside it (un-enumerated HTTP embeds 3100–3599, custom 99001–99999), so open-ended APIs should accept `number`. This caveat is documented on the type.
- Helpers do not import the catalogs (a consumer of `httpStatusToSvtaErrorCode` does not pay for the Network catalog); they compose codes from `SvtaErrorCategory` arithmetic. The one exception is `getSvtaErrorDescription`, whose purpose is the dictionary; its `ReadonlyMap` is `/* @__PURE__ */`-annotated per the repo's module-scope table rule, keyed by the catalog constants themselves so a name typo fails typecheck.
- Data integrity: tests assert per-catalog invariants (unique integer values, `floor(v / 1000)` equals the category, `UNKNOWN === category * 1000`, exact member counts), pin every code the spec uses in its own examples, and sweep all 137 members through `getSvtaErrorDescription`.

### Spec errata handled during transcription

The tables are treated as normative where the document disagrees with itself; these should go back to the Player Working Group before IANA registration:

1. Design prose says "3008 means … resource not found"; the table defines 3004 Resource not found, 3008 Max retries exceeded.
2. Stacking Example 2 labels 2018 "Video track load error"; the table defines 2018 Unable to parse secondary manifest / asset list (2020 is Track load error).
3. 6002 omits "to" ("Sender unable to make a connection the receiver"); the description is corrected in this package.
4. The "native codes are four digits, external five" prose only holds for zero-padded string rendering ("03404"); as integers both are four digits. The package exposes integers and relies on the ÷1000 / mod 1000 arithmetic.
5. The Network table's `500` row ("Received an HTTP 500 response: system Error - official definition") is treated as the exemplar of the embed range, not a named member; descriptions for all embedded statuses are synthesized in that row's format. Each category's index-0 "Unknown" description is disambiguated as "Unknown <category> error".

### Packaging

Scaffold mirrors `libs/cmsd` / the c2pa scaffold commit: version 0.0.1, `files: ["dist/**/*", "NOTICE.md"]`, tsdown zero-config build, api-extractor report, typedoc auto-discovery. The package is registered in the root build script but deliberately **not** in `scripts/projects.ts`; publish-list registration happens in the first release-prep PR (c2pa precedent), preventing accidental publication before this RFC settles.

## Drawbacks

- The dictionary is hand-transcribed and must track spec revisions by hand; there is no machine-readable upstream source yet (IANA registration is planned by the spec but not live).
- Description strings duplicate the member TSDoc (one is runtime data, one is comments); a drift between them is only caught by review, though tests pin one exact string per category.
- A player importing a catalog pays for that whole category (~1 KB minified for the largest); this is the chosen granularity trade-off (see alternatives).
- `@see` links point at the SVTA Google Doc until the spec lands at IANA, then need a one-time swap.

## Rationale and alternatives

- **Per-category catalogs** (chosen) vs **one flat 137-member object**: flat needs category prefixes on every name anyway (nine `UNKNOWN`s collide), renders one unnavigable typedoc page, and makes every importer pay for the full dictionary. Per-category mirrors the spec's tables 1:1 and tree-shakes per category. vs **individual constants + collector objects** (the `CmsdHeaderField` pattern): maximum granularity but ~137 files and a doubled public namespace; that pattern exists for 2–3 values, not 137.
- **`Svta` prefix on every export** vs bare `ErrorCode` names: player codebases universally have their own `ErrorCode`/`getErrorCategory` identifiers; the prefix prevents collisions and matches how engineers will refer to the standard.
- **Descriptions included** vs codes-only: the spec's objectives explicitly include human-readable descriptions; isolating them in one module makes them free for non-users. Dropping them would push every QoE vendor to re-transcribe the dictionary.
- **Numbers, not strings**: the spec defines integer codes; string variants would be an invention.

## Prior art

- In-repo: `C2paStatusCode` and `LiveVideoStatusCode` in `@svta/cml-c2pa` are spec-defined error-code catalogs using the same const enum idiom.
- The spec's appendix surveys the player landscape this replaces: hls.js string type/detail pairs, dash.js integer codes, Shaka severity/category/code, THEOplayer category+code, JW Player, Bitmovin, AVFoundation, ExoPlayer. The category-times-1000 shape closely matches how Shaka and THEOplayer already structure codes, which should ease translation-layer adoption.

## Unresolved questions

1. Are the 137 derived member names right? Naming is the main review surface; the full listing is in the linked api.md. Bikeshedding individual names is in scope for this RFC and cheap before first publish.
2. Should `getSvtaErrorDescription` ship in v1, or should the package stay codes-only until the IANA registry exists?
3. Do the five errata get fixed in the spec before IANA registration, and does the package track the corrected text or the published text verbatim?
4. Does the Working Group want a `@svta/cml-error-codes` docs page enumerating the full dictionary (typedoc renders the nine catalogs already)?

## Future possibilities

- Feeding SVTA codes into CMCD v2's `ec` (error code) key via `@svta/cml-cmcd`.
- Per-player translation-table helpers (the spec's "translation sub-component"), as a separate package or adopter recipes.
- Swapping `@see` links to the IANA registry once the spec is registered, and generating the dictionary from the registry if a machine-readable form appears.

## Final Decision

Pending community review.
