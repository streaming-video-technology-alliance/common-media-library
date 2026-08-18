# SVTA Error Codes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@svta/cml-error-codes`, the reference implementation of the SVTA Standardized Error Codes spec dictionary and arithmetic.

**Architecture:** Nine per-category `as const` code catalogs plus a category enum, a type-only aggregate union, and five pure helper functions, one export per file behind a barrel. No runtime dependencies beyond a type-only `@svta/cml-utils` peer.

**Tech Stack:** TypeScript (repo root tsconfig: `isolatedDeclarations`, `erasableSyntaxOnly`, `verbatimModuleSyntax`), tsdown zero-config build, api-extractor report, `node:test`/`node:assert`.

## Global Constraints

- Design source: `rfc/error-codes.md` (the original `plans/error-codes/design.md` was converted to an RFC for community review). Spec tables in this plan are authoritative for names/values/descriptions.
- Never use the `enum` keyword; use `as const` object + `export type X = ValueOf<typeof X>` merged alias.
- One public export per file; filename = export name; explicit return types everywhere (`isolatedDeclarations`).
- Relative imports carry `.ts` extensions; `import type` for type-only imports.
- Code style: tabs, single quotes, no semicolons on statements (match `libs/cmsd/src`); run `npm run format` before each commit.
- No code execution at module scope (declarations only).
- Tests import from `@svta/cml-error-codes` (never relative), use `node:test` + `node:assert`, first `it` is `'provides a valid example'` wrapped in `//#region example` / `//#endregion example`.
- Tests run against `dist`: always `npm run build -w libs/error-codes` before `npm test -w libs/error-codes`.
- Every commit: `git commit -s`, conventional-commit subject, body trailer `Co-authored-by: Claude claude-fable-5 <noreply@anthropic.com>`.
- TSDoc on every export: `@public`; catalogs also get `@enum` and `@see {@link https://docs.google.com/document/d/1UckqiXlx1c0Ay039qrqxfDO3JoelyfwjCe_dvqMCznQ | SVTA Standardized Error Codes}` (swap for the IANA URL when registered).
- Bracket notation for index-signature access (`noPropertyAccessFromIndexSignature`).
- Helpers must NOT import catalog objects (bundle discipline); compose codes from `SvtaErrorCategory` arithmetic. Exception: `getSvtaErrorDescription`, whose whole point is the dictionary.

## File template for catalogs

Every catalog file is this template applied to its table (shown filled for Media Content; `<DESCRIPTION>` becomes each member's TSDoc):

```ts
import type { ValueOf } from '@svta/cml-utils'

/**
 * SVTA standardized error codes in the Media Content category (1xxx):
 * issues with the content itself.
 *
 * @see {@link https://docs.google.com/document/d/1UckqiXlx1c0Ay039qrqxfDO3JoelyfwjCe_dvqMCznQ | SVTA Standardized Error Codes}
 *
 * @enum
 *
 * @public
 */
export const SvtaMediaContentErrorCode = {
	/** Unknown media content error */
	UNKNOWN: 1000,

	/** Media unavailable */
	MEDIA_UNAVAILABLE: 1001,
} as const

/**
 * Union type of all {@link (SvtaMediaContentErrorCode:variable)} values.
 *
 * @public
 */
export type SvtaMediaContentErrorCode = ValueOf<typeof SvtaMediaContentErrorCode>
```

Catalog test template (shown for Media Content; adjust example member, category, size, and spot checks per task):

```ts
import { SvtaErrorCategory, SvtaMediaContentErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaMediaContentErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaMediaContentErrorCode.UNSUPPORTED_VIDEO_FORMAT

		assert(code === 1004)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaMediaContentErrorCode, SvtaErrorCategory.MEDIA_CONTENT, 10)
	})

	it('matches the spec table', () => {
		strictEqual(SvtaMediaContentErrorCode.UNKNOWN, 1000)
		strictEqual(SvtaMediaContentErrorCode.MISALIGNED_TRACK_DURATION, 1009)
	})
})
```

---

### Task 1: Package scaffold + `SvtaErrorCategory`

**Files:**
- Create: `libs/error-codes/package.json`, `libs/error-codes/tsconfig.json`, `libs/error-codes/tsdoc.json`, `libs/error-codes/config/api-extractor.json`, `libs/error-codes/LICENSE` (copy `libs/cmsd/LICENSE`), `libs/error-codes/NOTICE.md`, `libs/error-codes/CHANGELOG.md`, `libs/error-codes/README.md` (skeleton), `libs/error-codes/src/SvtaErrorCategory.ts`, `libs/error-codes/src/index.ts`, `libs/error-codes/test/SvtaErrorCategory.test.ts`
- Modify: root `package.json` (append `-w=libs/error-codes` to `scripts.build`), `tsconfig.typedoc.json` (add `"@svta/cml-error-codes": ["./libs/error-codes/src/index.ts"]`), root `README.md` (add `@svta/cml-error-codes` bullet)
- Generated: `libs/error-codes/config/cml-error-codes.api.md`, `package-lock.json`

**Interfaces:**
- Produces: `SvtaErrorCategory` const + type (`UNKNOWN: 0`, `MEDIA_CONTENT: 1`, `PLAYBACK: 2`, `NETWORK: 3`, `CONTENT_PROTECTION: 4`, `ACCESSIBILITY: 5`, `REMOTE_PLAY: 6`, `ADVERTISING: 7`, `CUSTOM: 99`). Every later task depends on it.

- [ ] **Step 1:** Copy `libs/cmsd/package.json` → `libs/error-codes/package.json`; set name `@svta/cml-error-codes`, version `0.0.1`, description `SVTA standardized streaming error codes`, homepage `.../tree/main/libs/error-codes`, `files: ["dist/**/*", "NOTICE.md"]`, keywords `["Common Media Library", "CML", "SVTA", "Error Codes", "Streaming"]`, `peerDependencies: { "@svta/cml-utils": "*" }`. Copy `tsconfig.json`, `tsdoc.json`, `config/api-extractor.json` verbatim from cmsd; copy `LICENSE`; write 2-line `NOTICE.md` (SVTA copyright, per c2pa scaffold); CHANGELOG with Keep-a-Changelog preamble, `## [Unreleased]` + `### Added` bullet, and `[Unreleased]: .../compare/main...HEAD` link; README skeleton (H1 npm name, description, Installation).
- [ ] **Step 2:** Write `src/SvtaErrorCategory.ts` (catalog template, member TSDoc = category descriptions from the spec's category table) and `src/index.ts` barrel with `@packageDocumentation` TSDoc (`A collection of standardized streaming error codes defined by the Streaming Video Technology Alliance (SVTA).`) exporting `./SvtaErrorCategory.ts`.
- [ ] **Step 3:** Write failing test `test/SvtaErrorCategory.test.ts`: example region (`SvtaErrorCategory.NETWORK === 3`), spot checks (`UNKNOWN === 0`, `CUSTOM === 99`, 9 members).
- [ ] **Step 4:** `npm install` at root (creates workspace symlink), then `npm test -w libs/error-codes` → expect FAIL (no dist yet).
- [ ] **Step 5:** `npm run build -w libs/error-codes` then `npm test -w libs/error-codes` → expect PASS. Then root `npm run build` → expect all packages build (verifies build-script edit).
- [ ] **Step 6:** `npm run format`, commit everything (including generated `config/cml-error-codes.api.md`): `feat(error-codes): scaffold @svta/cml-error-codes package`.

### Task 2: Invariants helper + Unknown, Media Content, Custom catalogs

**Files:**
- Create: `libs/error-codes/test/data/assertCatalogInvariants.ts`, `src/SvtaUnknownErrorCode.ts`, `src/SvtaMediaContentErrorCode.ts`, `src/SvtaCustomErrorCode.ts`, tests `test/SvtaUnknownErrorCode.test.ts`, `test/SvtaMediaContentErrorCode.test.ts`, `test/SvtaCustomErrorCode.test.ts`
- Modify: `src/index.ts` (keep alphabetical)

**Interfaces:**
- Consumes: `SvtaErrorCategory`
- Produces: `assertCatalogInvariants(catalog: Record<string, number>, category: number, size: number): void`; catalogs `SvtaUnknownErrorCode` (`UNKNOWN: 999`), `SvtaCustomErrorCode` (`UNKNOWN: 99000`), `SvtaMediaContentErrorCode` (table below)

Test helper (complete):

```ts
import { ok, strictEqual } from 'node:assert'

export function assertCatalogInvariants(catalog: Record<string, number>, category: number, size: number): void {
	const values = Object.values(catalog)
	strictEqual(values.length, size)
	strictEqual(new Set(values).size, values.length)
	for (const value of values) {
		ok(Number.isInteger(value))
		strictEqual(Math.floor(value / 1000), category)
	}
	strictEqual(catalog['UNKNOWN'], category === 0 ? 999 : category * 1000)
}
```

Media Content table (base doc comment: "issues with the content itself"):

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 1000 | Unknown media content error |
| MEDIA_UNAVAILABLE | 1001 | Media unavailable |
| INVALID_MANIFEST | 1002 | Invalid manifest |
| TRACK_NOT_AVAILABLE | 1003 | Track not available |
| UNSUPPORTED_VIDEO_FORMAT | 1004 | Unsupported video format |
| UNSUPPORTED_AUDIO_FORMAT | 1005 | Unsupported audio format |
| UNSUPPORTED_TEXT_FORMAT | 1006 | Unsupported text format |
| INVALID_COMPOSITION_TRACK_SEGMENT_TIME | 1007 | Invalid composition track segment time |
| SEGMENT_EXCEEDS_TRACK_BITRATE | 1008 | Segment exceeds specified bitrate for track |
| MISALIGNED_TRACK_DURATION | 1009 | Misaligned track duration |

`SvtaUnknownErrorCode`: single member `UNKNOWN: 999`, TSDoc "Unknown error"; file doc notes it is the only code below 1000 and the spec's fully-unknown code. `SvtaCustomErrorCode`: single member `UNKNOWN: 99000`, TSDoc "Unknown custom error"; file doc notes 99001–99999 are reserved for publisher-defined codes.

- [ ] **Step 1:** Write the three failing tests (template above; Unknown: category `SvtaErrorCategory.UNKNOWN`, size 1, example `UNKNOWN === 999`; Custom: category `SvtaErrorCategory.CUSTOM`, size 1, example `UNKNOWN === 99000`).
- [ ] **Step 2:** `npm run build -w libs/error-codes && npm test -w libs/error-codes` → FAIL (missing exports).
- [ ] **Step 3:** Implement the three catalog files from the tables; add to barrel.
- [ ] **Step 4:** Build + test → PASS. `npm run format`.
- [ ] **Step 5:** Commit: `feat(error-codes): add unknown, media content, and custom error code catalogs`.

### Task 3: Playback catalog

**Files:** Create `src/SvtaPlaybackErrorCode.ts`, `test/SvtaPlaybackErrorCode.test.ts`; modify `src/index.ts`.

**Interfaces:** Produces `SvtaPlaybackErrorCode` (42 members).

File doc: "the player is unable to sustain the playback experience". Table:

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 2000 | Unknown playback error |
| VIDEO_BUFFER_UNDERRUN | 2001 | Video buffer underrun |
| AUDIO_BUFFER_UNDERRUN | 2002 | Audio buffer underrun |
| VIDEO_BUFFERING_TIMEOUT | 2003 | Video buffering timeout |
| AUDIO_BUFFERING_TIMEOUT | 2004 | Audio buffering timeout |
| MANIFEST_PARSE_ERROR | 2005 | Unable to parse manifest |
| SEGMENT_PARSE_ERROR | 2006 | Segment parse error |
| VIDEO_DECODE_ERROR | 2007 | Unable to decode video |
| AUDIO_DECODE_ERROR | 2008 | Unable to decode audio |
| VIDEO_DROPPED_FRAMES_EXCEEDED | 2009 | Video dropped frame count exceeds threshold |
| PLAYHEAD_EXCEEDS_CONTENT_DURATION | 2010 | Playhead exceeds content duration |
| NO_SUPPORTED_VIDEO_TRACK | 2011 | No supported video track |
| NO_SUPPORTED_AUDIO_TRACK | 2012 | No supported audio track |
| NO_MATCHING_CODEC | 2013 | No matching codec / profile / level |
| PRIMARY_MANIFEST_LOAD_ERROR | 2014 | Primary manifest load error |
| PRIMARY_MANIFEST_LOAD_TIMEOUT | 2015 | Primary manifest load timeout |
| MANIFEST_TRACK_PARSE_ERROR | 2016 | Unable to parse track from manifest |
| SECONDARY_MANIFEST_LOAD_ERROR | 2017 | Secondary manifest / asset list load error |
| SECONDARY_MANIFEST_PARSE_ERROR | 2018 | Unable to parse secondary manifest / asset list |
| TRACK_SWITCH_ERROR | 2019 | Unable to switch tracks |
| TRACK_LOAD_ERROR | 2020 | Track load error |
| REMUX_ERROR | 2021 | Remux issue |
| BUFFER_INITIALIZATION_ERROR | 2022 | Buffer initialization error |
| BUFFER_APPEND_ERROR | 2023 | Buffer append error |
| BUFFER_REMOVE_ERROR | 2024 | Buffer remove error |
| BUFFER_FULL_ERROR | 2025 | Buffer full error |
| BUFFER_SEEK_OVER_HOLE | 2026 | Buffer seek over hole |
| BUFFER_NUDGE_ON_STALL | 2027 | Buffer nudge on stall |
| OUT_OF_MEMORY | 2028 | Out of memory |
| SEGMENT_LOAD_ERROR | 2029 | Segment load error |
| SEGMENT_TIMEOUT_ERROR | 2030 | Segment timeout error |
| INITIALIZATION_SEGMENT_ERROR | 2031 | Initialization segment error |
| TIME_SYNC_ERROR | 2032 | Time sync failed error |
| FRAGMENT_LOAD_ERROR | 2033 | Fragment load error |
| FRAGMENT_TIMEOUT_ERROR | 2034 | Fragment timeout error |
| LIVE_TIMESHIFT_OUT_OF_BOUNDS | 2035 | Live timeshifting content out of bounds |
| SWITCHED_TO_HIGHER_LATENCY | 2036 | Switched to higher latency |
| FULLSCREEN_ERROR | 2037 | Unable to switch to fullscreen |
| PICTURE_IN_PICTURE_ERROR | 2038 | Unable to present picture-in-picture |
| MANIFEST_FEATURE_UNSUPPORTED | 2039 | Manifest feature unsupported |
| CONTENT_STEERING_MANIFEST_LOAD_ERROR | 2040 | Content steering manifest load error |
| CONTENT_STEERING_MANIFEST_PARSE_ERROR | 2041 | Unable to parse content steering manifest |

Spot checks in test: `VIDEO_BUFFER_UNDERRUN === 2001`, `AUDIO_BUFFER_UNDERRUN === 2002` (the spec's buffer-event signalling codes), `CONTENT_STEERING_MANIFEST_PARSE_ERROR === 2041`. Example region: `VIDEO_BUFFER_UNDERRUN`. Add a doc note on 2001/2002: the spec designates 2001 as the default when the stalled track is unknown.

- [ ] **Step 1:** Failing test → **Step 2:** build+test FAIL → **Step 3:** implement + barrel → **Step 4:** build+test PASS, format → **Step 5:** commit `feat(error-codes): add playback error code catalog`.

### Task 4: Network + Content Protection catalogs

**Files:** Create `src/SvtaNetworkErrorCode.ts`, `src/SvtaContentProtectionErrorCode.ts`, tests for both; modify `src/index.ts`.

**Interfaces:** Produces `SvtaNetworkErrorCode` (12), `SvtaContentProtectionErrorCode` (22).

Network (file doc: "issues on the network, including unavailable resources"; note in doc comment: HTTP response codes embed at indices 100–599, e.g. `3404` = HTTP 404 — see `httpStatusToSvtaErrorCode`):

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 3000 | Unknown network error |
| NO_NETWORK_CONNECTION | 3001 | No network connection |
| HTTP_TIMEOUT | 3002 | HTTP timeout |
| HOST_RESOLUTION_ERROR | 3003 | Unable to resolve host |
| RESOURCE_NOT_FOUND | 3004 | Resource not found |
| INVALID_URI | 3005 | Invalid URI |
| UNSUPPORTED_URI_SCHEME | 3006 | Unsupported URI scheme |
| DOWNLOAD_ERROR | 3007 | Download error |
| MAX_RETRIES_EXCEEDED | 3008 | Max retries have been exceeded |
| INSUFFICIENT_BANDWIDTH | 3009 | Insufficient bandwidth to support playback of current presentation |
| RESOURCE_DENIED | 3010 | Resource denied |
| INVALID_HTTP_CONTENT_TYPE | 3011 | Invalid HTTP content type value |

Content Protection (file doc: "security related errors, including authentication and entitlement issues"):

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 4000 | Unknown content protection error |
| CONCURRENT_STREAM_LIMIT_EXCEEDED | 4001 | Concurrent stream limit exceeded |
| ENTITLEMENT_REFUSED | 4002 | Entitlement refused |
| LICENSE_EXPIRED | 4003 | License expired |
| BAD_LICENSE_REQUEST | 4004 | Bad license request |
| LICENSE_SERVER_TIMEOUT | 4005 | License server timeout |
| INSUFFICIENT_DRM_ROBUSTNESS | 4006 | Insufficient DRM robustness level |
| INSUFFICIENT_OUTPUT_PROTECTION | 4007 | Insufficient output protection |
| UNSUPPORTED_DRM_SYSTEM | 4008 | Unsupported or unavailable DRM system |
| GEO_RESTRICTED | 4009 | Access restricted due to unsupported geo |
| DRM_INITIALIZATION_ERROR | 4010 | DRM initialization error |
| CDN_UNAUTHORIZED | 4011 | CDN unauthorized |
| INVALID_ACCESS_TOKEN | 4012 | Invalid access token |
| DRM_CERTIFICATE_ERROR | 4013 | DRM certificate error |
| DRM_SESSION_ERROR | 4014 | DRM session error |
| DRM_CONFIGURATION_MISSING | 4015 | DRM initialization data or configuration missing |
| LICENSE_RESPONSE_REJECTED | 4016 | DRM license response rejected |
| PERSISTENT_SESSION_ERROR | 4017 | Persistent session DRM error |
| PERMISSION_REJECTED | 4018 | Required permission rejected |
| KEY_LOAD_ERROR | 4019 | Failed to load decryption key |
| SEGMENT_DECRYPTION_ERROR | 4020 | Failed to decrypt segment |
| LICENSE_REQUEST_GENERATION_ERROR | 4021 | Failed to generate DRM license request |

Spot checks: `RESOURCE_NOT_FOUND === 3004`, `MAX_RETRIES_EXCEEDED === 3008`, `INSUFFICIENT_BANDWIDTH === 3009`, `NO_NETWORK_CONNECTION === 3001` (spec Example 1/2 codes); `GEO_RESTRICTED === 4009` (spec Example 3), `LICENSE_REQUEST_GENERATION_ERROR === 4021`.

- [ ] Steps 1–5 as Task 3; commit `feat(error-codes): add network and content protection error code catalogs`.

### Task 5: Accessibility + Remote Play catalogs

**Files:** Create `src/SvtaAccessibilityErrorCode.ts`, `src/SvtaRemotePlayErrorCode.ts`, tests; modify `src/index.ts`.

**Interfaces:** Produces `SvtaAccessibilityErrorCode` (5), `SvtaRemotePlayErrorCode` (10).

Accessibility (file doc: "defective captions or audio description"):

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 5000 | Unknown accessibility error |
| TIMED_TEXT_PARSE_ERROR | 5001 | Unable to parse timed text |
| TIMED_TEXT_RENDER_ERROR | 5002 | Unable to render timed text |
| TIMED_TEXT_EXCEEDS_CONTENT_DURATION | 5003 | Timed text exceeds content duration |
| AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION | 5004 | Audio description exceeds content duration |

Remote Play (file doc: "the framework supporting play out of the stream on a second device"):

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 6000 | Unknown remote play error |
| SENDER_INITIALIZATION_ERROR | 6001 | Sender unable to initialize remote play |
| SENDER_CONNECTION_ERROR | 6002 | Sender unable to make a connection to the receiver |
| RECEIVER_UNAVAILABLE | 6003 | Receiver does not exist or is unavailable |
| RECEIVER_CONNECTION_REFUSED | 6004 | Receiver refused remote play connection |
| RECEIVER_CONNECTION_LOST | 6005 | Connection to the receiver lost |
| SENDER_CONNECTION_LOST | 6006 | Connection to the sender lost |
| RECEIVER_UNSUPPORTED_STREAM | 6007 | Receiver is not supported to playback this stream |
| RECEIVER_ALREADY_IN_REMOTE_PLAY | 6008 | Receiver is already in remote play |
| RECEIVER_PLAYBACK_ERROR | 6009 | Receiver terminated playback because of an error |

- [ ] Steps 1–5 as Task 3; commit `feat(error-codes): add accessibility and remote play error code catalogs`.

### Task 6: Advertising catalog

**Files:** Create `src/SvtaAdvertisingErrorCode.ts`, `test/SvtaAdvertisingErrorCode.test.ts`; modify `src/index.ts`.

**Interfaces:** Produces `SvtaAdvertisingErrorCode` (34 members). File doc notes: VAST error codes embed at indices 100–999 per IAB VAST 4.x §2.3.6.3 — see `vastErrorToSvtaErrorCode`.

| Member | Code | TSDoc / description |
| --- | --- | --- |
| UNKNOWN | 7000 | Unknown advertising error |
| AD_BLOCKER_DETECTED | 7001 | Ad blocker detected |
| VAST_PARSE_ERROR | 7100 | Unable to parse VAST XML |
| VAST_SCHEMA_VALIDATION_ERROR | 7101 | Invalid VAST schema |
| VAST_VERSION_UNSUPPORTED | 7102 | VAST response version not supported |
| AD_TYPE_MISMATCH | 7200 | Video player expected different ad type |
| LINEARITY_MISMATCH | 7201 | Creative has different linearity than player expected (non-fatal) |
| DURATION_MISMATCH | 7202 | Creative has different duration than player expected (non-fatal) |
| SIZE_MISMATCH | 7203 | Creative has different size than player expected (non-fatal) |
| WRAPPER_ERROR | 7300 | Wrapper failed to deliver VAST response for unknown reason |
| WRAPPER_TIMEOUT | 7301 | VAST response redirect timed out |
| WRAPPER_LIMIT_REACHED | 7302 | Wrapper limit reached (e.g. too many redirects) |
| EMPTY_WRAPPER_RESPONSE | 7303 | VAST response was empty |
| LINEAR_AD_ERROR | 7400 | Unable to display linear ad |
| MEDIA_FILE_NOT_FOUND | 7401 | Media file not found |
| MEDIA_FILE_UNAVAILABLE | 7402 | Media file unavailable |
| NO_SUPPORTED_MEDIA_TYPE | 7403 | VAST response contained no supported MIME types |
| MEDIA_FILE_DISPLAY_ERROR | 7405 | Unable to display media file |
| MEZZANINE_MISSING | 7406 | Required mezzanine file missing |
| MEZZANINE_DOWNLOADING | 7407 | Mezzanine file was downloaded for the first time |
| REJECTED_AD | 7408 | VAST response contained rejected ad |
| INTERACTIVE_CREATIVE_ERROR | 7409 | Could not execute creative defined in interactiveCreativeFile |
| VERIFICATION_ERROR | 7410 | Could not execute code in verification node |
| NONLINEAR_AD_ERROR | 7500 | Video player unable to display non-linear ad for unknown reason |
| NONLINEAR_DIMENSION_MISMATCH | 7501 | Non-linear ad dimensions did not match display area |
| NONLINEAR_AD_FETCH_ERROR | 7502 | Unable to fetch non-linear ad resource |
| UNSUPPORTED_NONLINEAR_AD | 7503 | Non-linear ad did not contain a supported type |
| COMPANION_AD_ERROR | 7600 | Could not display companion ad (non-fatal) |
| COMPANION_DIMENSION_MISMATCH | 7601 | Companion ad dimensions did not match display area |
| REQUIRED_COMPANION_AD_ERROR | 7602 | Unable to display required companion ad |
| COMPANION_AD_FETCH_ERROR | 7603 | Unable to fetch companion ad resource |
| UNDEFINED_VAST_ERROR | 7900 | Undefined VAST error |
| VPAID_ERROR | 7901 | Unknown VPAID error |
| EMPTY_VAST_RESPONSE | 7999 | VAST response document was empty |

Note: `assertCatalogInvariants` still applies (all values floor to category 7). VAST members are `7000 + <VAST code>`; there is deliberately no 7404 (VAST defines no 404). Spot checks: `AD_BLOCKER_DETECTED === 7001`, `WRAPPER_TIMEOUT === 7301`, `EMPTY_VAST_RESPONSE === 7999`, and no `7404`-valued member (`ok(!Object.values(SvtaAdvertisingErrorCode).includes(7404))`).

- [ ] Steps 1–5 as Task 3; commit `feat(error-codes): add advertising error code catalog`.

### Task 7: `SvtaErrorCode` type + category/index helpers

**Files:** Create `src/SvtaErrorCode.ts` (type-only), `src/getSvtaErrorCategory.ts`, `src/getSvtaErrorIndex.ts`, tests `test/getSvtaErrorCategory.test.ts`, `test/getSvtaErrorIndex.test.ts`; modify `src/index.ts` (`export type *` for `SvtaErrorCode.ts`).

**Interfaces:**
- Consumes: all nine catalogs' types, `SvtaErrorCategory`
- Produces: `type SvtaErrorCode` (union of the nine catalog types); `getSvtaErrorCategory(code: number): SvtaErrorCategory | undefined`; `getSvtaErrorIndex(code: number): number`

`SvtaErrorCode.ts` (complete; TSDoc caveat that spec-valid codes exist outside the union — un-enumerated HTTP embeds 3100–3599 and custom 99001–99999 — so open-ended APIs should accept `number`):

```ts
import type { SvtaAccessibilityErrorCode } from './SvtaAccessibilityErrorCode.ts'
import type { SvtaAdvertisingErrorCode } from './SvtaAdvertisingErrorCode.ts'
import type { SvtaContentProtectionErrorCode } from './SvtaContentProtectionErrorCode.ts'
import type { SvtaCustomErrorCode } from './SvtaCustomErrorCode.ts'
import type { SvtaMediaContentErrorCode } from './SvtaMediaContentErrorCode.ts'
import type { SvtaNetworkErrorCode } from './SvtaNetworkErrorCode.ts'
import type { SvtaPlaybackErrorCode } from './SvtaPlaybackErrorCode.ts'
import type { SvtaRemotePlayErrorCode } from './SvtaRemotePlayErrorCode.ts'
import type { SvtaUnknownErrorCode } from './SvtaUnknownErrorCode.ts'

/**
 * Union of every named SVTA standardized error code. ...
 *
 * @public
 */
export type SvtaErrorCode =
	| SvtaAccessibilityErrorCode
	| SvtaAdvertisingErrorCode
	| SvtaContentProtectionErrorCode
	| SvtaCustomErrorCode
	| SvtaMediaContentErrorCode
	| SvtaNetworkErrorCode
	| SvtaPlaybackErrorCode
	| SvtaRemotePlayErrorCode
	| SvtaUnknownErrorCode
```

`getSvtaErrorCategory.ts` (complete):

```ts
import { SvtaErrorCategory } from './SvtaErrorCategory.ts'

/**
 * Get the {@link (SvtaErrorCategory:variable)} of an SVTA error code, per the
 * spec's `code / 1000` rule. Returns `undefined` for codes whose derived
 * category is not assigned by the spec (categories 8–98 and above 99 are
 * reserved for future use).
 *
 * @param code - An SVTA error code.
 * @returns The error category, or `undefined` if the code does not map to an assigned category.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/getSvtaErrorCategory.test.ts#example}
 */
export function getSvtaErrorCategory(code: number): SvtaErrorCategory | undefined {
	const category = Math.floor(code / 1000)

	if ((category >= SvtaErrorCategory.UNKNOWN && category <= SvtaErrorCategory.ADVERTISING) || category === SvtaErrorCategory.CUSTOM) {
		return category as SvtaErrorCategory
	}

	return undefined
}
```

`getSvtaErrorIndex.ts` (complete):

```ts
/**
 * Get the error index of an SVTA error code, per the spec's
 * `code mod 1000` rule. The index identifies the specific error within
 * its category: native indices are 0–99, embedded external codes
 * (HTTP, VAST) are 100–999.
 *
 * @param code - An SVTA error code.
 * @returns The error index within the code's category.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/getSvtaErrorIndex.test.ts#example}
 */
export function getSvtaErrorIndex(code: number): number {
	return code % 1000
}
```

Tests: example regions (`getSvtaErrorCategory(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN) === SvtaErrorCategory.PLAYBACK`; `getSvtaErrorIndex(SvtaNetworkErrorCode.RESOURCE_NOT_FOUND) === 4`). Category edge cases: `999 → UNKNOWN (0)`, `99000 → CUSTOM`, `8000 → undefined`, `100000 → undefined`, `-1 → undefined`, `NaN → undefined`, every catalog member maps to its category. Index: `3404 → 404`, `999 → 999`, `2000 → 0`.

- [ ] Steps 1–5 as Task 3; commit `feat(error-codes): add SvtaErrorCode type and category/index helpers`.

### Task 8: HTTP + VAST embedding helpers

**Files:** Create `src/httpStatusToSvtaErrorCode.ts`, `src/vastErrorToSvtaErrorCode.ts`, tests for both; modify `src/index.ts`.

**Interfaces:**
- Consumes: `SvtaErrorCategory`
- Produces: `httpStatusToSvtaErrorCode(status: number): number`; `vastErrorToSvtaErrorCode(vastError: number): number`

`httpStatusToSvtaErrorCode.ts` (complete; VAST helper is identical shape with `ADVERTISING`, range 100–999, and VAST wording):

```ts
import { SvtaErrorCategory } from './SvtaErrorCategory.ts'

/**
 * Embed an HTTP response status code into the SVTA Network error category,
 * per the spec's external-code embedding rule (e.g. HTTP 404 becomes 3404).
 * Statuses outside the valid HTTP range (integers 100–599) return the
 * unknown network error code (3000). Never throws: error reporting paths
 * must not fail.
 *
 * @param status - An HTTP response status code (100–599).
 * @returns The SVTA network error code embedding the status.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/httpStatusToSvtaErrorCode.test.ts#example}
 */
export function httpStatusToSvtaErrorCode(status: number): number {
	const base = SvtaErrorCategory.NETWORK * 1000

	if (!Number.isInteger(status) || status < 100 || status > 599) {
		return base
	}

	return base + status
}
```

Tests: examples (`httpStatusToSvtaErrorCode(404) === 3404`; `vastErrorToSvtaErrorCode(301) === 7301`, matching `SvtaNetworkErrorCode`/`SvtaAdvertisingErrorCode` members where applicable via `strictEqual(vastErrorToSvtaErrorCode(301), SvtaAdvertisingErrorCode.WRAPPER_TIMEOUT)`). Bounds: 100/599 valid, 99/600 → 3000; VAST 100/999 valid, 99/1000 → 7000; non-integer and NaN → unknown base.

- [ ] Steps 1–5 as Task 3; commit `feat(error-codes): add HTTP and VAST embedding helpers`.

### Task 9: `getSvtaErrorDescription`

**Files:** Create `src/getSvtaErrorDescription.ts`, `test/getSvtaErrorDescription.test.ts`; modify `src/index.ts`.

**Interfaces:**
- Consumes: all nine catalogs, `SvtaErrorCategory`
- Produces: `getSvtaErrorDescription(code: number): string | undefined`

- [ ] **Step 1:** Check house style for deferred tables: `git show 9011dca11 --stat` and one changed file; mirror its lazy-init/PURE pattern.
- [ ] **Step 2:** Failing test: example region (`getSvtaErrorDescription(2001) === 'Video buffer underrun'`); every member of every catalog returns a string (loop over all nine catalogs); exact strings for one member per category (use the spec descriptions from the tables in Tasks 2–6); HTTP synthesis `getSvtaErrorDescription(3404) === 'Received an HTTP 404 response'`; `undefined` for unassigned codes (`1999`, `8000`, `99001`, `3404.5`).
- [ ] **Step 3:** Implement: module-scope `let table: Map<number, string> | undefined` + `createTable()` (not invoked at module scope) + exported function that lazily initializes, then falls back to HTTP synthesis for integer network embeds (index 100–599), else `undefined`. Map keys are the catalog constants themselves (e.g. `[SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN, 'Video buffer underrun']`); description strings come verbatim from the task tables (which fix the spec's 6002 grammar and normalize each category's `UNKNOWN` description as "Unknown <category> error").
- [ ] **Step 4:** Build + test PASS, format.
- [ ] **Step 5:** Commit: `feat(error-codes): add getSvtaErrorDescription`.

### Task 10: README, changelog, api review, full validation

**Files:** Modify `libs/error-codes/README.md`, `libs/error-codes/CHANGELOG.md`, `plans/error-codes/design.md` (record the 3500-row decision as erratum 5: the spec's `500 | Received an HTTP 500 response: system Error - official definition` row is treated as the exemplar of the embed range, not a named catalog member; descriptions for all embeds are synthesized). Review `libs/error-codes/config/cml-error-codes.api.md`.

- [ ] **Step 1:** Finish README: description (match package.json), Installation (note `@svta/cml-utils` peer), Usage sections — quick start (catalog + `getSvtaErrorCategory`), embedding HTTP/VAST, descriptions. All snippets must be complete and runnable; mirror the test example regions.
- [ ] **Step 2:** Confirm CHANGELOG `### Added` bullet lists the final export surface.
- [ ] **Step 3:** Read the generated `config/cml-error-codes.api.md` end-to-end against the plan tables (names + values). This is the human data-entry review.
- [ ] **Step 4:** Root `npm test` (lint, build all, typecheck, all package tests) → expect PASS everywhere.
- [ ] **Step 5:** `git status` clean-up check, commit remaining docs: `docs(error-codes): add README usage and changelog entry`, then push branch. Do NOT create a PR (user-invocation-only).

## Self-review notes

- Spec coverage: category table → Task 1; index tables → Tasks 2–6; ÷1000 and mod 1000 → Task 7; HTTP/VAST embedding → Task 8; human-readable dictionary → Task 9; "referenced in CML" objective → the package itself. Severity/metadata/translation-layer: out of scope per design non-goals.
- Type consistency: helper names (`getSvtaErrorCategory`, `getSvtaErrorIndex`, `httpStatusToSvtaErrorCode`, `vastErrorToSvtaErrorCode`, `getSvtaErrorDescription`) and catalog names are identical across Tasks 1–10 and match `design.md`.
- Counts: 1+10+42+12+22+5+10+34+1 = 137 named codes.
