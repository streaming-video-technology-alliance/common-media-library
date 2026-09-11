# CMCD session API: bundle size analysis

Design record for [`rfc/cmcd-session-api.md`](../../rfc/cmcd-session-api.md). It explains why the implementation in [PR #460](https://github.com/streaming-video-technology-alliance/common-media-library/pull/460) missed the bundle size goal of the RFC, and what can change. It extends the Size table of [`comparison.md`](./comparison.md). All numbers were measured on 2026-09-11 at commit `1f4fbac2`, the head of PR #460.

## Summary

The RFC targeted parity with `CmcdReporter`. The PR reports 26.4 KB minified for the `createCmcdSession` entry against 18.7 KB for the `CmcdReporter` entry. This record reproduces those numbers and attributes the difference to source modules.

The difference has no single cause. The session API's own code is 1.9 times the size of the reporter's own code. The session API drops the structured-field decoder, and that 3 KB saving hides part of the growth in the totals. The growth comes from many small features that `CmcdReporter` leaves to the player, plus a second copy of the key metadata.

Parity is not reachable with the feature set the RFC accepted. The record measured one fix and estimated three more. Together they bring the entry to about 24 KB minified. That is still 25 percent over the reporter entry. The recommendation is to restate the goal as the adopter's total bytes, to budget bytes per feature, and to keep one key table.

## Method

Two probes, both from a build of `libs/utils`, `libs/structured-field-values`, and `libs/cmcd`:

- The probe of Task 13 in [`steps.md`](./steps.md). `tsdown` minifies one entry at a time from the built `dist`. It inlines the two peer packages, so its numbers are the whole cost of one import.
- An `esbuild` bundle of the same exports from the TypeScript sources, with a metafile. The metafile gives the minified bytes of each source module inside the output. Appendix B has the script.

The `esbuild` output is about 4 percent larger than the `tsdown` output for the same entry. Compare numbers within one probe only. "Own code" means the bytes of `libs/cmcd` modules. "Shared" means the bytes that both entries contain.

## Results

### The two entries

| Entry | Recorded in the PR | `tsdown` probe, minified | `tsdown` probe, gzip | `esbuild`, minified | `esbuild`, gzip |
|---|---|---|---|---|---|
| `createCmcdSession` | 26.4 KB, 8.9 KB gzip | 27,278 B | 9,124 B | 28,444 B | 9,757 B |
| `CmcdReporter` | 18.7 KB, 7.1 KB gzip | 19,142 B | 7,252 B | 19,882 B | 7,591 B |
| `encodeCmcd` alone | 6.3 KB | 6,665 B | 2,885 B | 7,005 B | 3,005 B |
| both reporters in one bundle | not recorded | not measured | not measured | 43,867 B | 14,771 B |

The session entry contains no `CmcdReporter` code. The "both" row is the cost during a migration, when a player bundles the old and the new API at the same time.

### Own code against shared code

`esbuild`, minified bytes.

| Part | `createCmcdSession` entry | `CmcdReporter` entry |
|---|---|---|
| `@svta/cml-structured-field-values` | 2,406 | 5,397 |
| `@svta/cml-utils` | 1,141 | 1,216 |
| `libs/cmcd` modules in both entries | 1,112 | 1,103 |
| `libs/cmcd` modules in this entry only | 23,893 | 12,272 |
| Own code, the two `libs/cmcd` rows | 25,005 | 13,375 |

The session API pulls only the structured-field encoder. `CmcdReporter` also pulls the decoder, for the provenance snapshot. That difference of 2,991 bytes is the one real saving of the new design at the package level. The own code grew by 11,630 bytes at the same time.

### The session entry by feature group

`esbuild`, minified bytes of the modules only the session entry contains. Total 23,893.

| Group | Modules | Bytes | Share |
|---|---|---|---|
| Report preparation | `CMCD_KEY_SPECS` 3,019, `normalizeValue` 1,703, `formatNor` 762, `filterReport` 554, `normalizeReport` 335, `getKeySpec` 104 | 6,477 | 27% |
| Reporter facade | `createSessionReporter` 2,791, `emitResponse` 288, `copyPlaybackData` 200, `getTargetEntry` 88, `emitEvent` 59 | 3,426 | 14% |
| Assembly and commit | `emitReport` 1,431, `assembleReport` 1,363 | 2,794 | 12% |
| Configuration | `normalizeSessionConfig` 1,566, `checkRequestSettings` 900, `configureSession` 265 | 2,731 | 11% |
| Event-mode delivery | `processQueue` 1,291, `disposeSession` 353, `tickTarget` 284, `emitToEventTargets` 252, `flushSession` 158, `defaultRequester` 143, `armTimers` 139, `reportSessionError` 92 | 2,712 | 11% |
| Derivations | `pruneSpans` 900, `deriveStateEvents` 569, `trackTransition` 525, `observeVisibility` 259, `emitBackgroundChange` 220 | 2,473 | 10% |
| Session lifecycle | `rotateSession` 638, `createCmcdSession` 513, `createSidState` 268, `createTargetState` 165, `CMCD_REQUEST_ORIGINS` 19 | 1,603 | 7% |
| Responses | `toResponseKeys` 805, `readHeader` 185, `getTimeOrigin` 132 | 1,122 | 5% |
| Request placement | `placeRequestReport` 555 | 555 | 2% |

### What the session entry drops

`esbuild`, minified bytes of the modules only the reporter entry contains. Total 12,272, plus 2,991 bytes of the structured-field decoder.

| Module | Bytes |
|---|---|
| `CmcdReporter` class | 7,920 |
| `prepareCmcdData` | 1,895 |
| `CMCD_FORMATTER_MAP` | 614 |
| `decodeCmcd` and `upConvertToV2` | 523 |
| The key sets and predicates of the encoder path, 15 modules | 1,266 |
| `CMCD_REQUEST_PROVENANCE` | 54 |

The retention ledger, the eviction pass, and the provenance record live inside the 7,920 bytes of the class. The `customData` type parameter is type-only and costs nothing.

### The key metadata, two forms

The session API adds `CMCD_KEY_SPECS`, one record per key. The package already ships the same facts as one set or map per attribute. The encoder and the validators read those.

| Form | Minified | Gzip |
|---|---|---|
| `CMCD_KEY_SPECS`, one record per key | 3,044 B | 659 B |
| The nine existing tables together | 1,740 B | 810 B |

A record per key repeats every attribute name for every key. The minifier cannot rename those attribute names. Gzip removes the repetition, so the table costs little on the wire. The existing tables are the reverse. They are short after minification and compress less.

### Source lines

Runtime files only, without comments and blank lines. The reporter graph is `CmcdReporter.ts` and the fifteen modules of the preparation path.

| Measure | Session API | `CmcdReporter` graph |
|---|---|---|
| Runtime modules | 38 | 16 |
| Non-comment lines | 1,533 | 1,028 |
| Non-comment lines in the main unit | 218 in `createSessionReporter` | 598 in `CmcdReporter` |
| Test lines | 1,707 | 4,753 |

The complexity goal of the RFC was also missed by this measure. The code moved from one class into 38 functions. Most of those functions take the session, the `sid` state, the target, and the reporter as positional parameters. `emitToEventTargets` takes nine.

## Why the goal was missed

1. **The size argument counted concepts, not bytes.** The RFC lists what goes away: the ledger, the eviction pass, the dirty set, the provenance record, and the generics. It lists what arrives: the derivations and the key table. It then asserts parity. The removed concepts are worth about 1.5 KB of class code plus the 3 KB decoder. The added groups are worth about 10 KB. Nobody priced either side before the RFC was accepted.
2. **The design record predicted the growth.** The Size table of `comparison.md` estimated 1,500 to 1,700 reporter lines against 1,318, and 400 to 550 preparation lines against about 570. Both estimates already exceeded the baseline. The parity target and the estimates were never reconciled.
3. **The features are net additive.** `CmcdReporter` sends what the player gives it. The session API derives `msd`, `bs`, `bsa`, `bsda`, `bsd`, `su`, `dl`, `h`, and `bg`. It reads Resource Timing and the CMSD headers. It validates its configuration with actionable messages and backs off exponentially. It listens to document visibility, and it supports rotation and `configure()`. Each of those is small. Together they are 11 KB.
4. **Two copies of the key metadata.** The key table was meant to replace the encoder tables. The replacement is a later plan, so the package now ships both forms. The session entry pays 3 KB for the new form. A player that also imports the validators or `encodeCmcd` pays for both forms.
5. **Measurement came last, as one total.** The probe ran in Task 13 of 14. It reports one number per entry with the peer packages inlined. The review could not see that a 3 KB decoder saving hid 11.6 KB of growth in the package's own code. No task had a byte budget.

## Options

Measured means built and tested at `1f4fbac2` with the cmcd suite of 698 tests passing. Estimate means read from the attribution table without a prototype.

| Option | Status | Session entry, minified | Session entry, gzip | Contract change |
|---|---|---|---|---|
| A. One key table. `getKeySpec` derives each spec from the nine existing tables. `CMCD_KEY_SPECS` is deleted. | measured | -1,196 B | +294 B | none |
| A, for a player that also imports `validateCmcdEvents` | measured | -2,245 B | -198 B | none |
| B. One pending `bsd` list per target entry instead of session-wide samples with per-target cursors, pruning, and the cap of 100 | estimate | about -1,200 B | about -300 B | `bsd` samples are no longer shared across destinations |
| C. Table-driven configuration checks with the same messages | estimate | about -800 B | about -200 B | none |
| D. Event targets as factory functions, so a request-only player drops delivery | estimate | -3,400 B for request-only players, 0 for the others | | configuration shape |
| A plus B plus C | estimate | about 24 KB | about 8.7 KB | |

Option A shows that the key table is a minified-size problem and not a transfer-size problem. The derived specs are shorter after minification and compress less, so the session entry alone gains nothing on the wire. The gain is one source of truth. The `h` event token had to be added in two places in this PR, and the `sf` token list already differs between the two forms. Appendix A has the prototype.

Option D is the alternative the RFC rejected as unmeasured. The measure is 3,400 bytes, 12 percent of the entry, for a player with no collector. No known adopter is in that position.

Option E is a different goal. `CmcdReporter` is small because hls.js and dash.js compute `msd`, `bs`, `su`, `dl`, `bsd`, and the CMSD base64 by hand. The RFC's Motivation table lists that code. Bytes that move from the player into the library are not a cost to the adopter. The right measure is the library entry plus the player glue it deletes. This record could not measure the two players, because the session had access to this repository only.

## Recommendation

1. Replace the parity goal in the RFC with the adopter's total. Measure the hls.js and dash.js code that the session API deletes, and make "the adopter's total does not grow" the acceptance criterion. Until that number exists, the RFC should state the per-group costs from this record instead of a parity claim.
2. Give each feature group a byte budget in `architecture.md`, and run the size probe in the test suite with a threshold. Drift then fails a task instead of surfacing at Task 13.
3. Ship one key table. Either derive the session specs from the existing tables now, as in Appendix A. Or move the validators and `encodeCmcd` onto `CMCD_KEY_SPECS` in the same release. Do not ship two forms.
4. Decide on options B and C as a pair. Together they are worth about 2 KB minified and 0.5 KB gzipped. Option B trades the per-destination `bsd` semantics the review accepted in disposition 6 and 14 of PR #455.
5. Do not pursue option D now.

## Proposed text for the RFC section "Bundle and performance"

Replace the sentence "The session API is the larger of the two" and the sentences after it with:

> The session entry is 42 percent larger after minification and 26 percent larger after gzip. Its own code is 1.9 times the reporter's own code. It drops the structured-field decoder, the retention ledger, and the provenance record, which are worth about 4.5 KB. It adds the derivations, the configuration checks, exponential back-off, the response timing rules, visibility tracking, rotation, and the key table. Those are worth about 11 KB. The design record `plans/cmcd-session-api/bundle-size.md` lists the cost per feature group. Parity with `CmcdReporter` is not a goal of this API. The goal is that a player's total bytes do not grow. The player deletes the code that computes `msd`, `bs`, `su`, `dl`, `bsd`, and the CMSD values today.

## Appendix A: the one-table prototype

`getKeySpec.ts` builds a spec from the existing tables on first use and caches it. `CMCD_KEY_SPECS.ts` is deleted. `checkRequestSettings.ts` reads the event tokens from `CMCD_TOKEN_VALUES`. `CMCD_TOKEN_VALUES.sf` gains the `e` token, which the key table already had. The cmcd suite passes with 698 tests.

```ts
import { CMCD_AGGREGATE_BITRATE_KEYS } from './CMCD_AGGREGATE_BITRATE_KEYS.ts'
import { CMCD_KEY_OBJECT_TYPES } from './CMCD_KEY_OBJECT_TYPES.ts'
import { CMCD_KEY_TYPE_NUMBER, CMCD_KEY_TYPE_NUMBER_LIST, CMCD_KEY_TYPE_STRING_LIST, CMCD_KEY_TYPES } from './CMCD_KEY_TYPES.ts'
import { CMCD_REQUEST_KEYS } from './CMCD_REQUEST_KEYS.ts'
import { CMCD_RESPONSE_KEYS } from './CMCD_RESPONSE_KEYS.ts'
import { CMCD_STATE_EVENT_FIELDS } from './CMCD_STATE_EVENT_FIELDS.ts'
import { CMCD_CUSTOM_KEY_VALUE_MAX_LENGTH, CMCD_STRING_LENGTH_LIMITS } from './CMCD_STRING_LENGTH_LIMITS.ts'
import { CMCD_TOKEN_VALUES } from './CMCD_TOKEN_VALUES.ts'
import { CMCD_V1_KEYS } from './CMCD_V1_KEYS.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { isCmcdCustomKey } from './isCmcdCustomKey.ts'

const CUSTOM_SPEC: CmcdKeySpec = { type: 'custom', modes: 'both', max: CMCD_CUSTOM_KEY_VALUE_MAX_LENGTH }

/** The keys rounded to the nearest 100. Every other numeric key rounds to the nearest integer. */
const ROUND_100 = ['bl', 'dl', 'mtp', 'rtp', 'tbl']

/** The events that require a key, next to the state-change fields of `CMCD_STATE_EVENT_FIELDS`. */
const REQUIRED_ON: Record<string, string> = { e: 'always', ts: 'always', v: 'always', ec: 'e', cen: 'ce', h: 'h', url: 'rr' }

/** The spec types whose name differs from the `CMCD_KEY_TYPES` name. */
const TYPES: Record<string, CmcdKeySpec['type']> = {
	[CMCD_KEY_TYPE_NUMBER_LIST]: 'ot-list',
	[CMCD_KEY_TYPE_STRING_LIST]: 'string-list',
	[CMCD_KEY_TYPE_NUMBER]: 'decimal',
}

let cache: Map<string, CmcdKeySpec> | undefined

function stateEventOf(key: string): string | undefined {
	for (const [event, field] of CMCD_STATE_EVENT_FIELDS) {
		if (field === key) {
			return event
		}
	}
	return undefined
}

/** Builds the spec of one reserved key from the package's key tables. `cdn` is not a CTA-5004-B key. */
function buildSpec(key: string): CmcdKeySpec | undefined {
	if (!Object.hasOwn(CMCD_KEY_TYPES, key) || key === 'cdn') {
		return undefined
	}
	const keyType = CMCD_KEY_TYPES[key]
	const type = key === 'nor' ? 'nor' : TYPES[keyType] ?? keyType as CmcdKeySpec['type']
	const numeric = type === 'integer' || type === 'ot-list'
	return {
		type,
		modes: key === 'nrr' || (CMCD_REQUEST_KEYS as readonly string[]).includes(key) ? 'both' : 'event',
		round: numeric ? ROUND_100.includes(key) ? 100 : 1 : undefined,
		ot: CMCD_KEY_OBJECT_TYPES[key],
		supersededBy: CMCD_AGGREGATE_BITRATE_KEYS[key],
		onlyOn: (CMCD_RESPONSE_KEYS as readonly string[]).includes(key) ? 'rr' : key === 'cen' ? 'ce' : undefined,
		requiredOn: REQUIRED_ON[key] ?? stateEventOf(key),
		omitDefault: type === 'boolean' ? false : key === 'pr' || key === 'v' ? 1 : undefined,
		max: CMCD_STRING_LENGTH_LIMITS[key],
		v1: key === 'v' || !(CMCD_V1_KEYS as readonly string[]).includes(key) ? 'absent' : type === 'ot-list' ? 'scalar' : type === 'nor' ? 'string' : undefined,
		tokens: CMCD_TOKEN_VALUES[key],
	}
}

/** The spec of a reserved key, the custom spec for a valid custom key, else `undefined`. */
export function getKeySpec(key: string): CmcdKeySpec | undefined {
	cache ??= new Map()
	let spec = cache.get(key)
	if (spec === undefined && !cache.has(key)) {
		spec = buildSpec(key)
		cache.set(key, spec as CmcdKeySpec)
	}
	return spec ?? (isCmcdCustomKey(key as CmcdKey) ? CUSTOM_SPEC : undefined)
}
```

## Appendix B: the attribution script

Run from a folder with `esbuild` installed. `<worktree>` is a checkout with `libs/utils`, `libs/structured-field-values`, and `libs/cmcd` built. The script bundles one export from the TypeScript sources and prints the bytes of each source module in the minified output.

```js
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const [worktree, exportName, file] = process.argv.slice(2) // example: createCmcdSession createCmcdSession.ts
const entry = `${worktree}/libs/cmcd/temp/${exportName}.entry.ts`
writeFileSync(entry, `export { ${exportName} } from '../src/${file}'\n`)
const result = await build({
	entryPoints: [entry],
	bundle: true,
	minify: true,
	format: 'esm',
	target: 'es2019',
	metafile: true,
	outfile: `${worktree}/libs/cmcd/temp/${exportName}.js`,
	absWorkingDir: worktree,
})
const code = readFileSync(`${worktree}/libs/cmcd/temp/${exportName}.js`)
console.log(`minified ${code.length}, gzip ${gzipSync(code).length}`)
const [output] = Object.values(result.metafile.outputs)
for (const [path, { bytesInOutput }] of Object.entries(output.inputs).sort((a, b) => b[1].bytesInOutput - a[1].bytesInOutput)) {
	console.log(`${bytesInOutput}\t${path}`)
}
```
