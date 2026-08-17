# SVTA Standardized Error Codes — `@svta/cml-error-codes` design

Status: design authored autonomously (judgment calls listed at the bottom); implementation follows on `claude/svta-error-codes-cml-d0ad01`.

Source spec: *SVTA Standardized Error Codes* (Player Working Group, original publication July 8, 2026). The spec's stated objective includes "Error codes referenced in the Common Media Library via SVTA's Player Working Group", which is what this package delivers.

## Context

The spec defines a universal, player-agnostic error code scheme for streaming playback:

- Codes are short integers. `floor(code / 1000)` yields the **category**; `code % 1000` yields the **index** (the specific error within the category).
- Categories: 0 Unknown, 1 Media Content, 2 Playback, 3 Network, 4 Content Protection, 5 Accessibility, 6 Remote Play, 7 Advertising, 99 Custom (publisher-defined).
- `999` is the single fully-unknown code (the only code below 1000). Index `000` in every category is that category's "known category, no further detail" code (e.g. `3000` = unknown network error).
- Externally maintained standards embed into the index range: HTTP status codes embed into Network (`3404` = HTTP 404), VAST error codes embed into Advertising (`7301` = VAST 301). Native indices occupy 0–99; embedded external codes occupy 100–999.
- Severity and other metadata are explicitly out of scope of the spec.

## Goals

- Ship the complete spec dictionary as typed constants so players and QoE tooling reference codes by name instead of magic numbers.
- Provide the spec's arithmetic (category extraction, index extraction, HTTP/VAST embedding) as tiny helpers so adopters don't hand-roll them inconsistently.
- Optional human-readable descriptions for dashboards/log lines, isolated so they tree-shake away entirely when unused.

## Non-goals

- Error metadata (severity, pre/post state, viewer context) — out of scope in the spec.
- Player error translation/mapping layers (the spec's "translation sub-component") — that belongs to each player; this package is the vocabulary it maps into.
- Capturing or transporting errors (CMCD `ec` integration is a possible follow-up, not part of this package).

## API design

All runtime exports use the repo's const enum pattern (`as const` object + merged `ValueOf` type), one export per file, no module-scope side effects. Sole peer dependency: `@svta/cml-utils` (type-only, for `ValueOf`).

### Code catalogs (nine files, mirroring the spec's category tables)

| Export | Codes | Members |
| --- | --- | --- |
| `SvtaUnknownErrorCode` | 999 | 1 |
| `SvtaMediaContentErrorCode` | 1000–1009 | 10 |
| `SvtaPlaybackErrorCode` | 2000–2041 | 42 |
| `SvtaNetworkErrorCode` | 3000–3011 | 12 |
| `SvtaContentProtectionErrorCode` | 4000–4021 | 22 |
| `SvtaAccessibilityErrorCode` | 5000–5004 | 5 |
| `SvtaRemotePlayErrorCode` | 6000–6009 | 10 |
| `SvtaAdvertisingErrorCode` | 7000–7001, 7100–7999 (VAST subset) | 34 |
| `SvtaCustomErrorCode` | 99000 | 1 |

Every category object has an `UNKNOWN` member equal to `category * 1000` (`999` for category 0, per the spec). Each member carries the spec's description as its TSDoc.

### Category enum

`SvtaErrorCategory`: `UNKNOWN: 0`, `MEDIA_CONTENT: 1`, `PLAYBACK: 2`, `NETWORK: 3`, `CONTENT_PROTECTION: 4`, `ACCESSIBILITY: 5`, `REMOTE_PLAY: 6`, `ADVERTISING: 7`, `CUSTOM: 99`.

### Aggregate type

`SvtaErrorCode` (type-only): union of the nine catalog value types. Useful for exhaustive handling of *named* codes. Documented caveat: spec-valid codes exist outside this union (un-enumerated HTTP embeds `3100`–`3599`, publisher custom codes `99001`–`99999`), so open-ended APIs should accept `number`.

### Helpers (each in its own file)

- `getSvtaErrorCategory(code: number): SvtaErrorCategory | undefined` — `floor(code / 1000)`, returning `undefined` when the result is not an assigned category (guards against unassigned categories 8–98, >99, negatives, NaN; future-proofs the spec's planned width growth).
- `getSvtaErrorIndex(code: number): number` — the spec's `code % 1000` operation.
- `httpStatusToSvtaErrorCode(status: number): number` — `3000 + status` for integer statuses 100–599; anything else returns `SvtaNetworkErrorCode.UNKNOWN` (3000). Never throws: error-reporting paths must not fail.
- `vastErrorToSvtaErrorCode(vastError: number): number` — `7000 + code` for integer VAST codes 100–999; anything else returns `SvtaAdvertisingErrorCode.UNKNOWN` (7000). Exists because VAST codes arrive at runtime from ad SDK error events.
- `getSvtaErrorDescription(code: number): string | undefined` — spec description for every named code; synthesized `Received an HTTP <n> response` for un-enumerated HTTP embeds (matching the spec's own wording for its `500` exemplar row); `undefined` otherwise. Lives alone in its file so its string table tree-shakes away; the table must not be built eagerly at module scope (see #384 house style).

## Approaches considered

1. **One flat `SvtaErrorCode` object** (137 members, category-prefixed names). Simplest import; but a single import pays for the whole dictionary, one typedoc page for 137 members is unnavigable, and every name needs a category prefix anyway to disambiguate nine `UNKNOWN`s.
2. **Per-category objects** (chosen). Mirrors the spec's tables 1:1 (each file's `@see` targets its exact table), tree-shakes per category, keeps member names short, and renders as nine focused typedoc enum pages. Cost: adopters need to know an error's category to find its constant — which is the spec's own organizing principle.
3. **Individual constants + collector objects** (the `CmsdHeaderField` variant). Maximum granularity but ~137 files and a doubled public namespace; that pattern exists for 2–3 values, not 137.

## Naming rules

- All exports carry the `Svta` prefix. Player codebases universally have their own `ErrorCode`/`getErrorCategory` identifiers; the prefix prevents collisions and matches how engineers will refer to the standard ("the SVTA code").
- Member names are UPPER_SNAKE derivations of the spec descriptions, kept recognizable and consistent within a category (e.g. spec "Unable to parse manifest" → `MANIFEST_PARSE_ERROR`, mirroring `SEGMENT_PARSE_ERROR` for "Segment parse error").
- VAST members reuse IAB-recognizable terminology (`WRAPPER_TIMEOUT`, `VPAID_ERROR`) so ad engineers can map by sight.
- Helper names follow the repo's `<source>To<target>` converter convention (`hexToArrayBuffer` precedent).

## Data integrity strategy

The dictionary is hand-transcribed from the spec, which is the riskiest part of this package. Defenses:

- The source `as const` objects are the **single** transcription; descriptions live beside their codes in `getSvtaErrorDescription`'s table keyed by the constants themselves (no duplicated numbers).
- Tests assert structural invariants across every catalog: values unique, integer, `floor(v / 1000)` equals the category, `UNKNOWN === category * 1000`, exact member counts per table.
- Tests pin exact values for every code the spec itself uses in prose/examples (999, 2001, 2002, 3001, 3009, 3404-composition, 4009) plus spot checks per category.
- `getSvtaErrorDescription` must return a string for every member of every catalog (cross-checks the two datasets).
- Final human review: the api.md diff lists every name/value pair for side-by-side comparison with the spec tables.

## Package scaffold and wiring

Mirrors the c2pa scaffold commit (`22afe8877`) and `libs/cmsd` conventions:

- `libs/error-codes/`: `package.json` (name `@svta/cml-error-codes`, version 0.0.1, `files: ["dist/**/*", "NOTICE.md"]`, peer dep `@svta/cml-utils`), `tsconfig.json`, `tsdoc.json`, `config/api-extractor.json`, generated `config/cml-error-codes.api.md`, `LICENSE` (copy of cmsd's), `NOTICE.md`, `README.md`, `CHANGELOG.md` (Keep-a-Changelog preamble, `[Unreleased]` with `compare/main...HEAD` link, matching the c2pa scaffold), `src/`, `test/`.
- Root edits: append `-w=libs/error-codes` to root `package.json` `scripts.build`; add typedoc path mapping in `tsconfig.typedoc.json`; add the package to root `README.md`'s project list; `npm install` to refresh `package-lock.json`.
- **Not** added to `scripts/projects.ts` yet — matching c2pa, publish-list registration happens in the first release-prep PR, which prevents accidental 0.0.1 publication.

## Spec errata found during transcription

To be raised with the Player Working Group; the tables are treated as normative where prose disagrees:

1. Design prose says "3008 means … resource not found", but the index table defines 3004 = Resource not found and 3008 = Max retries exceeded. Implemented per the table.
2. Stacking Example 2 labels 2018 "Video track load error", but the table defines 2018 = Unable to parse secondary manifest / asset list (2020 is Track load error). Implemented per the table.
3. Grammar nits preserved-with-correction in descriptions: 6002 "Sender unable to make a connection **to** the receiver" (spec omits "to"); the category-1 description in the category table runs two sentences together ("…related error" / "Issues with the content itself").
4. The prose "native … four digits, external … five" only holds for the zero-padded string rendering ("03404"); as integers both are four digits. The package exposes integers and relies on the spec's normative arithmetic (÷1000, mod 1000), under which native indices are 0–99 and external embeds 100–999.
5. The Network table's explicit `500` row ("Received an HTTP 500 response: system Error - official definition") is treated as the exemplar of the HTTP embed range rather than a named catalog member; `getSvtaErrorDescription` synthesizes `Received an HTTP <n> response` for every embedded status. Each category's index-0 "Unknown" description is normalized to "Unknown <category> error" to disambiguate the nine identical "Unknown" table rows, and "Timed Text"/"Live Timeshifting Content" casing is normalized to sentence case.

## Open questions flagged for review (implemented with the stated defaults)

1. **Descriptions dictionary included** (`getSvtaErrorDescription`): delivers the spec's "human readable descriptions" objective at zero cost to non-users. Drop it if you want the package codes-only lean.
2. **`Svta` prefix on every export**: alternative was bare `ErrorCode` names scoped by the package; prefix chosen for collision safety.
3. **Per-category catalogs** over one flat object (see approaches).
4. **AGENTS.md flags new packages as RFC material.** The spec itself mandates CML residency and went through the SVTA working group, so this proceeded as a direct implementation; convert this design into `rfc/error-codes.md` if community sign-off is still wanted.
