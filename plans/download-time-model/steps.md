# Download-time model implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Both selectors of `@svta/cml-abr` bound every throughput-based pick by the download time of one segment, the time to first byte plus the transfer at the safe throughput, and gain an `ignoreTimeToFirstByte` option.

**Architecture:** One internal function, `downloadTime`, already serves the starvation guard. A second internal function, `findSustainableRung`, walks the ladder from the top and keeps the first rung whose download time fits in `segmentDuration / playbackRate`. Without a segment duration it falls back to `findRung`. The throughput selector calls it for the safety pick and the upgrade pick. BOLA calls it for the startup pick and the oscillation cap. The guard does not change.

**Tech Stack:** TypeScript, Vite+ (`vp test`, `vp lint`, `vp fmt`), Node 24. The spec is `rfc/download-time-model/index.md` on branch `rfc/download-time-model`.

## Global constraints

- Branch: `feat/download-time-model`, stacked on `issue/587-transfer-duration` (PR 588). Rebase on `main` when PR 588 merges.
- Build before tests of exported members: `npm run build -w libs/abr`. Tests of exported members import `@svta/cml-abr` (the `dist/`). Tests of internal members import `../src/<file>.ts`.
- Run one test file: `npm test -w libs/abr -- <name>`, where `<name>` is a substring of the file name.
- Before every commit: `npm run format`. Commit with `git commit -s`. Conventional Commits. End the body with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Code rules: one export per file, `type` not `interface`, no `any`, no `console` in library code, TSDoc on every export, `@beta` on public exports, tabs.
- Prose rules (TSDoc, README, changelog, commit bodies): sentences under 20 words, active voice, no semicolons, no em dashes, no idioms, one name per thing. The name of the quantity is "time to first byte". Never write "first-byte wait".
- Public API: only `ignoreTimeToFirstByte?: boolean` on `ThroughputSelectorOptions` and `BolaSelectorOptions`. `libs/abr/config/cml-abr.api.md` must show no other change.
- Every change gets a line under `## [Unreleased]` in `libs/abr/CHANGELOG.md`. No version bump in this branch.
- The root `npm test` must pass before the PR. It regenerates `skills/common-media-library/`. Commit that output.
- Delete `plans/download-time-model/` before the PR merges. The implementation PR opens only after the RFC PR is accepted.

---

### Task 1: Move `downloadTime` into its own file

**Files:**
- Create: `libs/abr/src/downloadTime.ts`
- Modify: `libs/abr/src/applyStarvationGuard.ts` (remove the local `downloadTime`, import the new file)
- Test: `libs/abr/test/downloadTime.test.ts`

**Interfaces:**
- Produces: `downloadTime(rung: LadderRung, segmentDuration: number, safeThroughput: number, timeToFirstByte: number): number`, seconds.

- [ ] **Step 1: Write the failing test**

```ts
// libs/abr/test/downloadTime.test.ts
import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { downloadTime } from '../src/downloadTime.ts'

describe('downloadTime', () => {
	it('adds the time to first byte to the transfer of one segment', () => {
		// 3 Mbps for 2 seconds is 6 Mbit. At 12.6 Mbps the transfer takes 0.476 s.
		equal(downloadTime({ bandwidth: 3_000_000 }, 2, 12_600_000, 0.8), 0.8 + 6_000_000 / 12_600_000)
	})

	it('is infinite at a safe throughput of 0', () => {
		equal(downloadTime({ bandwidth: 3_000_000 }, 2, 0, 0), Infinity)
	})
})
```

- [ ] **Step 2: Run the test and confirm the failure**

Run: `npm test -w libs/abr -- downloadTime`
Expected: FAIL, the module `../src/downloadTime.ts` does not exist.

- [ ] **Step 3: Create the file and point the guard at it**

```ts
// libs/abr/src/downloadTime.ts
import type { LadderRung } from './LadderRung.ts'

/**
 * Returns the seconds that one segment of `rung` takes to download.
 * The time is the time to first byte plus the transfer of `segmentDuration` seconds of media at `safeThroughput`.
 *
 * @param rung - The rung
 * @param segmentDuration - The media duration of the segment, in seconds
 * @param safeThroughput - The bits per second that the download may use
 * @param timeToFirstByte - The time to first byte of the download, in seconds
 * @returns The download time in seconds
 */
export function downloadTime(
	rung: LadderRung,
	segmentDuration: number,
	safeThroughput: number,
	timeToFirstByte: number,
): number {
	return timeToFirstByte + (rung.bandwidth * segmentDuration) / safeThroughput
}
```

In `libs/abr/src/applyStarvationGuard.ts`, add `import { downloadTime } from './downloadTime.ts'` after the `LadderRung` import, and delete the local `function downloadTime(...)` at the end of the file. The body of `applyStarvationGuard` does not change.

- [ ] **Step 4: Run the abr tests**

Run: `npm run build -w libs/abr && npm test -w libs/abr`
Expected: PASS. The guard tests pass unchanged.

- [ ] **Step 5: Commit**

```bash
npm run format
git add libs/abr/src/downloadTime.ts libs/abr/src/applyStarvationGuard.ts libs/abr/test/downloadTime.test.ts
git commit -s -m "refactor(abr): move downloadTime into its own file" -m "The starvation guard and the sustainable rung search share the function." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: `findSustainableRung`

**Files:**
- Create: `libs/abr/src/findSustainableRung.ts`
- Test: `libs/abr/test/findSustainableRung.test.ts`

**Interfaces:**
- Consumes: `downloadTime` from Task 1, `findRung(ladder, bandwidth)`, `isPositiveFinite(value)`.
- Produces: `findSustainableRung(ladder: readonly LadderRung[], safeThroughput: number, playbackRate: number, segmentDuration: number | undefined, timeToFirstByte: number): number`, a position in `ladder`.

- [ ] **Step 1: Write the failing tests**

```ts
// libs/abr/test/findSustainableRung.test.ts
import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { findRung } from '../src/findRung.ts'
import { findSustainableRung } from '../src/findSustainableRung.ts'
import { L1, rungs } from './helpers/ladders.ts'

// 0.9 times 6 Mbps. Rung 3 of L1 (3 Mbps) transfers one 2 second segment in 1.11 s at this throughput.
const SAFE_THROUGHPUT = 5_400_000
const SEGMENT_DURATION = 2
const NORMAL_RATE = 1
const NO_TIME_TO_FIRST_BYTE = 0

describe('findSustainableRung', () => {
	it('falls back to findRung without a segment duration', () => {
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, undefined, 0.8), findRung(L1, SAFE_THROUGHPUT))
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, 2, undefined, 0.8), findRung(L1, SAFE_THROUGHPUT / 2))
	})

	it('matches findRung with a time to first byte of 0', () => {
		for (const safeThroughput of [500_000, 1_000_000, 2_000_000, 4_000_000, 8_000_000]) {
			equal(
				findSustainableRung(L1, safeThroughput, NORMAL_RATE, 4, NO_TIME_TO_FIRST_BYTE),
				findRung(L1, safeThroughput),
				`safe throughput ${safeThroughput}`,
			)
		}
	})

	it('lowers the rung when the time to first byte does not leave room for the transfer', () => {
		// Rung 3 needs 1.11 s of transfer. With a wait of 1 s the download takes 2.11 s, more than one segment.
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, SEGMENT_DURATION, NO_TIME_TO_FIRST_BYTE), 3)
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, SEGMENT_DURATION, 1), 2)
	})

	it('returns 0 when the time to first byte reaches the budget', () => {
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, NORMAL_RATE, SEGMENT_DURATION, SEGMENT_DURATION), 0)
	})

	it('returns the highest position among equal bandwidths', () => {
		const ladder = rungs(300_000, 750_000, 750_000, 1_500_000)

		equal(findSustainableRung(ladder, 1_000_000, NORMAL_RATE, 4, NO_TIME_TO_FIRST_BYTE), 2)
	})

	it('divides the budget by the playback rate', () => {
		// At 2x the segment must arrive in 1 s. Rung 3 needs 1.11 s, rung 2 needs 0.56 s.
		equal(findSustainableRung(L1, SAFE_THROUGHPUT, 2, SEGMENT_DURATION, NO_TIME_TO_FIRST_BYTE), 2)
	})
})
```

- [ ] **Step 2: Run the tests and confirm the failure**

Run: `npm test -w libs/abr -- findSustainableRung`
Expected: FAIL, the module `../src/findSustainableRung.ts` does not exist.

- [ ] **Step 3: Create the function**

```ts
// libs/abr/src/findSustainableRung.ts
import { downloadTime } from './downloadTime.ts'
import { findRung } from './findRung.ts'
import { isPositiveFinite } from './isPositiveFinite.ts'
import type { LadderRung } from './LadderRung.ts'

/**
 * Returns the position of the highest rung whose download fits in one segment.
 *
 * The download time of a rung comes from `downloadTime` with `safeThroughput` and `timeToFirstByte`.
 * A rung fits when that time is at most `segmentDuration / playbackRate`.
 * Without a positive finite `segmentDuration`, the function returns `findRung(ladder, safeThroughput / playbackRate)`.
 * When no rung fits, the position is 0.
 *
 * @param ladder - The rungs in ascending order of bandwidth
 * @param safeThroughput - The bits per second that the download may use
 * @param playbackRate - The playback rate. 1 is normal speed.
 * @param segmentDuration - The media duration of the next segment, in seconds, or `undefined`
 * @param timeToFirstByte - The time to first byte of the download, in seconds
 * @returns The position in `ladder`
 */
export function findSustainableRung(
	ladder: readonly LadderRung[],
	safeThroughput: number,
	playbackRate: number,
	segmentDuration: number | undefined,
	timeToFirstByte: number,
): number {
	if (!isPositiveFinite(segmentDuration)) {
		return findRung(ladder, safeThroughput / playbackRate)
	}

	const budget = segmentDuration / playbackRate

	for (let i = ladder.length - 1; i >= 0; i--) {
		if (downloadTime(ladder[i], segmentDuration, safeThroughput, timeToFirstByte) <= budget) {
			return i
		}
	}

	return 0
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -w libs/abr -- findSustainableRung`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
npm run format
git add libs/abr/src/findSustainableRung.ts libs/abr/test/findSustainableRung.test.ts
git commit -s -m "feat(abr): add findSustainableRung" -m "The highest rung whose download, time to first byte plus transfer, fits in one segment. Without a segment duration the function returns the rate-based pick." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The `ignoreTimeToFirstByte` option

**Files:**
- Modify: `libs/abr/src/ThroughputSelectorOptions.ts` (add the field after `starvationTolerance`)
- Modify: `libs/abr/src/BolaSelectorOptions.ts` (add the field after `starvationSafetyFactor`)
- Modify: `libs/abr/src/createThroughputSelector.ts` (read the option, skip `recordTimeToFirstByte`)
- Modify: `libs/abr/src/createBolaSelector.ts` (read the option, skip `recordTimeToFirstByte`)
- Test: `libs/abr/test/createThroughputSelector.test.ts`, `libs/abr/test/createBolaSelector.test.ts`

**Interfaces:**
- Produces: `ignoreTimeToFirstByte?: boolean` on both option types, default `false`. When `true`, `timeToFirstByteSamples` stays empty, so `averageTimeToFirstByte` returns 0 everywhere.

- [ ] **Step 1: Write the failing tests**

In `libs/abr/test/createThroughputSelector.test.ts`, inside `describe('starvation guard', ...)`, after the test `forgets the time to first byte samples after a reset`:

```ts
		it('ignores the time to first byte when ignoreTimeToFirstByte is set', () => {
			// Without the option, four samples with a 1 s time to first byte lower the pick at a buffer of 3 s to rung 2.
			const selector = createThroughputSelector({ ignoreTimeToFirstByte: true })
			const input = { ladder, throughput: 6_000_000, now: 0, segmentDuration: 4 }

			for (let i = 0; i < 4; i++) {
				loadWithTimeToFirstByte(selector, 1000)
			}

			equal(selector.select({ ...input, bufferLevel: 3 }).index, 3)
		})
```

In `libs/abr/test/createBolaSelector.test.ts`, inside `describe('starvation guard', ...)`, after the test `forgets the time to first byte samples after a reset`:

```ts
		it('ignores the time to first byte when ignoreTimeToFirstByte is set', () => {
			// Without the option, the same samples lower the pick to rung 2.
			const selector = createEmptyPlaceholderSelector(L1, { ignoreTimeToFirstByte: true })

			loadTimeToFirstByteSamples(selector)

			const elapsed = GUARD_BUFFER_LEVEL - TIME_TO_FIRST_BYTE_BUFFER_LEVEL
			const decision = selector.select({
				ladder: L1,
				bufferLevel: TIME_TO_FIRST_BYTE_BUFFER_LEVEL,
				throughput: throughputFor(3),
				now: requestEnd(0) + elapsed * MILLISECONDS_PER_SECOND,
				segmentDuration: SEGMENT_DURATION,
			})

			equal(decision.index, 3)
		})
```

- [ ] **Step 2: Run the tests and confirm the failure**

Run: `npm run build -w libs/abr && npm test -w libs/abr -- createThroughputSelector && npm test -w libs/abr -- createBolaSelector`
Expected: the two new tests FAIL. The build reports a type error first, because the option field does not exist. Add the fields in Step 3 and rerun.

- [ ] **Step 3: Add the option fields**

Append to `ThroughputSelectorOptions` in `libs/abr/src/ThroughputSelectorOptions.ts`, after `starvationTolerance?: number`:

```ts

	/**
	 * When `true`, the selector ignores the time to first byte of every sample.
	 * The pick and the starvation guard then count the transfer only.
	 * Set the option when the time to first byte is not time that a download loses.
	 * Examples: the player requests the next segment before the current download ends, `responseStart` does not mark
	 * the first byte of the body, or the server sends the response headers before the body exists.
	 *
	 * @defaultValue `false`
	 */
	ignoreTimeToFirstByte?: boolean
```

Append the same block to `BolaSelectorOptions` in `libs/abr/src/BolaSelectorOptions.ts`, after `starvationSafetyFactor?: number`.

- [ ] **Step 4: Read the option in both selectors**

In `libs/abr/src/createThroughputSelector.ts`, after `const starvationTolerance = ...`:

```ts
	const ignoreTimeToFirstByte = options?.ignoreTimeToFirstByte ?? false
```

In the `sample` method, replace:

```ts
			currentBandwidth = segment.bandwidth
			recordTimeToFirstByte(timeToFirstByteSamples, segment.timing)
```

with:

```ts
			currentBandwidth = segment.bandwidth

			if (!ignoreTimeToFirstByte) {
				recordTimeToFirstByte(timeToFirstByteSamples, segment.timing)
			}
```

In `libs/abr/src/createBolaSelector.ts`, after `const starvationSafetyFactor = ...`:

```ts
	const ignoreTimeToFirstByte = options?.ignoreTimeToFirstByte ?? false
```

In `recordFinishedSample`, replace:

```ts
		recordTimeToFirstByte(timeToFirstByteSamples, segment.timing)
```

with:

```ts
		if (!ignoreTimeToFirstByte) {
			recordTimeToFirstByte(timeToFirstByteSamples, segment.timing)
		}
```

Update the `@param options` line of both factory TSDocs. Throughput: `@param options - The safety factor, the upgrade factor, the starvation tolerance, and the time to first byte switch`. BOLA: `@param options - The safety factor, the starvation safety factor, and the time to first byte switch`.

- [ ] **Step 5: Run the tests**

Run: `npm run build -w libs/abr && npm test -w libs/abr`
Expected: PASS. Check `git diff libs/abr/config/cml-abr.api.md`: the only change is one `ignoreTimeToFirstByte?: boolean;` line in each options type.

- [ ] **Step 6: Commit**

```bash
npm run format
git add libs/abr
git commit -s -m "feat(abr): add the ignoreTimeToFirstByte option" -m "When set, a selector records no time to first byte, so the starvation guard counts the transfer only." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The throughput selector bounds its picks

**Files:**
- Modify: `libs/abr/src/createThroughputSelector.ts` (the `select` method and the TSDoc)
- Test: `libs/abr/test/createThroughputSelector.test.ts`

**Interfaces:**
- Consumes: `findSustainableRung` from Task 2, `averageTimeToFirstByte(samples)` from PR 588.

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block in `libs/abr/test/createThroughputSelector.test.ts`, after `describe('starvation guard', ...)` and before `describe('reset', ...)`:

```ts
	describe('sustainability bound', () => {
		// Rungs between 7.56 Mbps and 12.6 Mbps show the bound of issue 587: 14 Mbps, 800 ms, 2 second segments.
		const wideLadder = rungs(1_500_000, 3_000_000, 6_000_000, 9_000_000, 12_000_000)

		// Records a 2 second segment of 12 Mbps that waited `timeToFirstByteMs` for its first byte and transferred at 14 Mbps.
		function loadWideSegment(selector: BitrateSelector, timeToFirstByteMs: number): void {
			selector.sample({
				timing: {
					startTime: 0,
					responseStart: timeToFirstByteMs,
					duration: timeToFirstByteMs + 1700,
					encodedBodySize: 3_000_000,
				},
				bandwidth: 12_000_000,
				duration: 2,
				bufferLevel: 8,
			})
		}

		const input = { ladder: wideLadder, bufferLevel: 8, throughput: 14_000_000, now: 10_000 }

		it('keeps the highest rung whose download fits in one segment', () => {
			// 9 Mbps needs 0.8 + 18 / 12.6 = 2.23 s. 6 Mbps needs 0.8 + 12 / 12.6 = 1.75 s.
			const selector = createThroughputSelector()

			for (let i = 0; i < 4; i++) {
				loadWideSegment(selector, 800)
			}

			equal(selector.select({ ...input, segmentDuration: 2 }).index, 2)
		})

		it('picks as before with a time to first byte of 0', () => {
			const selector = createThroughputSelector()

			for (let i = 0; i < 4; i++) {
				loadWideSegment(selector, 0)
			}

			equal(selector.select({ ...input, segmentDuration: 2 }).index, 4)
		})

		it('picks as before without segmentDuration', () => {
			const selector = createThroughputSelector()

			for (let i = 0; i < 4; i++) {
				loadWideSegment(selector, 800)
			}

			equal(selector.select(input).index, 4)
		})

		it('bounds the upgrade pick', () => {
			// The current rung is 1.5 Mbps and the estimate is 6 Mbps. The upgrade pick at 4.2 Mbps bounds rung 3:
			// 0.6 + 6 / 4.2 = 2.03 s, more than one segment. Without the time to first byte the upgrade pick is rung 3.
			const selector = createThroughputSelector()

			selector.sample({
				timing: { startTime: 0, responseStart: 600, duration: 1100, encodedBodySize: 375_000 },
				bandwidth: 1_500_000,
				duration: 2,
				bufferLevel: 6,
			})

			equal(selector.select({ ladder, bufferLevel: 6, throughput: 6_000_000, now: 1100, segmentDuration: 2 }).index, 2)
		})

		it('picks as before when ignoreTimeToFirstByte is set', () => {
			const selector = createThroughputSelector({ ignoreTimeToFirstByte: true })

			for (let i = 0; i < 4; i++) {
				loadWideSegment(selector, 800)
			}

			equal(selector.select({ ...input, segmentDuration: 2 }).index, 4)
		})
	})
```

The file already imports `BitrateSelector` as a type. Add `rungs` to the test file if it is not there: the file defines its own `rungs` helper at the top, so use that one.

- [ ] **Step 2: Run the tests and confirm the failure**

Run: `npm run build -w libs/abr && npm test -w libs/abr -- createThroughputSelector`
Expected: FAIL. `keeps the highest rung whose download fits in one segment` returns 4, and `bounds the upgrade pick` returns 3.

- [ ] **Step 3: Replace the two picks**

In `libs/abr/src/createThroughputSelector.ts`, add the import after the `findRung` import:

```ts
import { findSustainableRung } from './findSustainableRung.ts'
```

In `select`, replace:

```ts
			const effectiveThroughput = throughput / playbackRate

			let index = findRung(ladder, effectiveThroughput * safetyFactor)

			if (hasCurrent && index > current) {
				index = Math.max(current, findRung(ladder, effectiveThroughput * upgradeFactor))
			}

			if (isPositiveFinite(segmentDuration)) {
				const budget = bufferLevel / playbackRate
				const tolerance = Math.min(segmentDuration, starvationTolerance)

				index = applyStarvationGuard(
					ladder,
					index,
					segmentDuration,
					throughput * safetyFactor,
					averageTimeToFirstByte(timeToFirstByteSamples),
					budget,
					tolerance,
				)
			}
```

with:

```ts
			const timeToFirstByte = averageTimeToFirstByte(timeToFirstByteSamples)

			let index = findSustainableRung(
				ladder,
				throughput * safetyFactor,
				playbackRate,
				segmentDuration,
				timeToFirstByte,
			)

			if (hasCurrent && index > current) {
				index = Math.max(
					current,
					findSustainableRung(
						ladder,
						throughput * upgradeFactor,
						playbackRate,
						segmentDuration,
						timeToFirstByte,
					),
				)
			}

			if (isPositiveFinite(segmentDuration)) {
				const budget = bufferLevel / playbackRate
				const tolerance = Math.min(segmentDuration, starvationTolerance)

				index = applyStarvationGuard(
					ladder,
					index,
					segmentDuration,
					throughput * safetyFactor,
					timeToFirstByte,
					budget,
					tolerance,
				)
			}
```

`findRung` stays imported for the current rung.

- [ ] **Step 4: Update the TSDoc of `createThroughputSelector`**

Replace the first paragraph of the doc comment:

```
 * The selector divides the throughput by the playback rate to get the effective throughput.
 * It picks the highest rung at or below `effectiveThroughput * safetyFactor`, or rung 0 when no rung fits.
 * Two rules refine the pick:
```

with:

```
 * The selector picks the highest rung whose download fits in one segment.
 * The download time of a rung is the time to first byte plus the transfer of one segment at `throughput * safetyFactor`.
 * The download fits when that time is at most `segmentDuration / playbackRate`. Rung 0 is the pick when no rung fits.
 * Without `segmentDuration`, the pick is the highest rung at or below `throughput * safetyFactor / playbackRate`.
 * The time to first byte is the mean of the last four samples, from `responseStart` of their timing.
 * Two rules refine the pick:
```

In the hysteresis bullet, replace "recomputes the pick with `upgradeFactor`" with "recomputes the pick with `throughput * upgradeFactor`".

- [ ] **Step 5: Run the tests and fix boundary flips**

Run: `npm run build -w libs/abr && npm test -w libs/abr -- createThroughputSelector`
Expected: PASS. If an existing test fails by one rung and its throughput sits on a rung boundary times a factor, add 1 bps to that throughput and note the margin in the test comment. Do not change the implementation for such a failure.

- [ ] **Step 6: Commit**

```bash
npm run format
git add libs/abr
git commit -s -m "feat(abr): bound the throughput selector picks by the download time of one segment" -m "The safety pick and the upgrade pick keep the highest rung whose time to first byte plus transfer fits in one segment. A call without segmentDuration picks as before." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: BOLA bounds its startup pick and its oscillation cap

**Files:**
- Modify: `libs/abr/src/createBolaSelector.ts` (`selectInStartup`, `pickByBuffer`, their callers, the TSDoc)
- Test: `libs/abr/test/createBolaSelector.test.ts`

**Interfaces:**
- Consumes: `findSustainableRung` from Task 2, `averageTimeToFirstByte(samples)` from PR 588.

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block in `libs/abr/test/createBolaSelector.test.ts`, after `describe('starvation guard', ...)`:

```ts
	describe('sustainability bound', () => {
		// A time to first byte of 1 s. With 4 second segments, rung 3 of L1 needs 1 + 12 / 3 = 5 s at a safe throughput of 3 Mbps.
		const SLOW_TIME_TO_FIRST_BYTE_MS = 1000
		const input = { ladder: L1, throughput: throughputFor(3), segmentDuration: SEGMENT_DURATION }

		// Reports `count` finished segments of `bandwidth` with a time to first byte of `timeToFirstByteMs`.
		function loadSlowStarts(
			selector: BitrateSelector,
			bandwidth: number,
			bufferLevel: number,
			timeToFirstByteMs: number,
			count = FIRST_SAMPLE_COUNT,
		): void {
			for (let i = 0; i < count; i++) {
				load(selector, bandwidth, bufferLevel, 0, {
					timing: {
						startTime: 0,
						responseStart: timeToFirstByteMs,
						duration: DOWNLOAD_DURATION + timeToFirstByteMs,
						encodedBodySize: 1,
					},
				})
			}
		}

		it('bounds the startup pick', () => {
			const selector = createBolaSelector()

			selector.select({ ...input, bufferLevel: 0, throughput: NaN, now: 0 })
			// The buffer stays at 0, so the selector stays in the startup state.
			loadSlowStarts(selector, L1_BANDWIDTHS[0], 0, SLOW_TIME_TO_FIRST_BYTE_MS)

			const decision = selector.select({ ...input, bufferLevel: 0, now: requestEnd(SLOW_TIME_TO_FIRST_BYTE_MS) })

			equal(decision.state, BolaState.STARTUP)
			equal(decision.index, 2)
		})

		it('picks rung 0 at startup when the time to first byte reaches the segment duration', () => {
			const selector = createBolaSelector()

			selector.select({ ...input, bufferLevel: 0, throughput: NaN, now: 0 })
			loadSlowStarts(selector, L1_BANDWIDTHS[0], 0, SEGMENT_DURATION * MILLISECONDS_PER_SECOND)

			equal(selector.select({ ...input, bufferLevel: 0, now: requestEnd(SEGMENT_DURATION * MILLISECONDS_PER_SECOND) }).index, 0)
		})

		it('bounds the oscillation cap', () => {
			// The guard scenario: the current rung is 1, and the buffer picks rung 3. The throughput sustains rung 3 only without the wait.
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)

			loadSlowStarts(selector, L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL, SLOW_TIME_TO_FIRST_BYTE_MS)

			const decision = selector.select({
				...input,
				bufferLevel: GUARD_BUFFER_LEVEL,
				now: requestEnd(SLOW_TIME_TO_FIRST_BYTE_MS),
			})

			equal(decision.index, 2)
		})

		it('does not move the buffer-based pick', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL)

			loadSlowStarts(selector, L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL, SLOW_TIME_TO_FIRST_BYTE_MS)

			const decision = selector.select({
				...input,
				bufferLevel: GUARD_BUFFER_LEVEL,
				throughput: NaN,
				now: requestEnd(SLOW_TIME_TO_FIRST_BYTE_MS),
			})

			equal(decision.index, 3)
		})

		it('picks as before when ignoreTimeToFirstByte is set', () => {
			const selector = createSteadySelectorAt(L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL, { ignoreTimeToFirstByte: true })

			loadSlowStarts(selector, L1_BANDWIDTHS[1], GUARD_BUFFER_LEVEL, SLOW_TIME_TO_FIRST_BYTE_MS)

			const decision = selector.select({
				...input,
				bufferLevel: GUARD_BUFFER_LEVEL,
				now: requestEnd(SLOW_TIME_TO_FIRST_BYTE_MS),
			})

			equal(decision.index, 3)
		})
	})
```

Add the constant near the other test constants at the top of the file:

```ts
// The number of samples that fill the time to first byte window.
const FIRST_SAMPLE_COUNT = TIME_TO_FIRST_BYTE_SAMPLE_COUNT
```

`requestEnd(startTime)` returns `startTime + DOWNLOAD_DURATION`. The samples above start at 0 and last `DOWNLOAD_DURATION + timeToFirstByteMs`, so `requestEnd(timeToFirstByteMs)` is the end of each sample and the `now` of the next call. The call then adds no elapsed time to the placeholder.

- [ ] **Step 2: Run the tests and confirm the failure**

Run: `npm run build -w libs/abr && npm test -w libs/abr -- createBolaSelector`
Expected: FAIL. `bounds the startup pick` returns 3, `picks rung 0 at startup ...` returns 3, and `bounds the oscillation cap` returns 3. The other two pass already.

- [ ] **Step 3: Replace the two picks**

In `libs/abr/src/createBolaSelector.ts`, add the import after the `findRung` import:

```ts
import { findSustainableRung } from './findSustainableRung.ts'
```

Add a module constant after `const NO_TOLERANCE = 0` at the end of the file:

```ts
// The BOLA rules ignore the playback rate. The starvation guard reads it.
const BOLA_PLAYBACK_RATE = 1
```

Replace `selectInStartup`:

```ts
	function selectInStartup(
		rungParams: BolaParams,
		bufferLevel: number,
		safeThroughput: number,
	): BolaDecision {
		const position = Number.isNaN(safeThroughput) ? 0 : findRung(rungParams.rungs, safeThroughput)
```

with:

```ts
	function selectInStartup(
		rungParams: BolaParams,
		bufferLevel: number,
		safeThroughput: number,
		segmentDuration: number | undefined,
	): BolaDecision {
		const position = Number.isNaN(safeThroughput)
			? 0
			: findSustainableRung(
					rungParams.rungs,
					safeThroughput,
					BOLA_PLAYBACK_RATE,
					segmentDuration,
					averageTimeToFirstByte(timeToFirstByteSamples),
				)
```

Replace the call in `select`:

```ts
				? selectInStartup(rungParams, bufferLevel, throughput * safetyFactor)
```

with:

```ts
				? selectInStartup(rungParams, bufferLevel, throughput * safetyFactor, input.segmentDuration)
```

Replace `pickByBuffer`:

```ts
	function pickByBuffer(
		rungParams: BolaParams,
		effectiveBuffer: number,
		throughput: number,
	): number {
		const position = selectRungByBuffer(rungParams, effectiveBuffer)

		if (Number.isNaN(throughput)) {
			return position
		}

		return limitUpwardSwitch(
			position,
			currentPosition(rungParams),
			findRung(rungParams.rungs, throughput * safetyFactor),
		)
	}
```

with:

```ts
	function pickByBuffer(
		rungParams: BolaParams,
		effectiveBuffer: number,
		throughput: number,
		segmentDuration: number | undefined,
	): number {
		const position = selectRungByBuffer(rungParams, effectiveBuffer)

		if (Number.isNaN(throughput)) {
			return position
		}

		return limitUpwardSwitch(
			position,
			currentPosition(rungParams),
			findSustainableRung(
				rungParams.rungs,
				throughput * safetyFactor,
				BOLA_PLAYBACK_RATE,
				segmentDuration,
				averageTimeToFirstByte(timeToFirstByteSamples),
			),
		)
	}
```

Replace the call in `selectInSteadyState`:

```ts
		const pick = pickByBuffer(rungParams, effectiveBuffer, throughput)
```

with:

```ts
		const pick = pickByBuffer(rungParams, effectiveBuffer, throughput, input.segmentDuration)
```

`findRung` stays imported for `currentPosition` and `recordAbortedSample`.

- [ ] **Step 4: Update the TSDoc of `createBolaSelector`**

Replace the startup bullet:

```
 * - Startup. The selector picks the highest rung at or below `throughput * safetyFactor`.
```

with:

```
 * - Startup. The selector picks the highest rung whose download fits in one segment at `throughput * safetyFactor`.
 *   The download time counts the time to first byte of the last four samples. Without `segmentDuration`,
 *   the pick is the highest rung at or below `throughput * safetyFactor`.
```

Replace in the steady bullet:

```
 *   and above the rung that the throughput sustains. Then the guard keeps the higher of those two rungs.
```

with:

```
 *   and above the rung whose download fits in one segment at `throughput * safetyFactor`.
 *   Then the guard keeps the higher of those two rungs.
```

- [ ] **Step 5: Run the tests and fix boundary flips**

Run: `npm run build -w libs/abr && npm test -w libs/abr -- createBolaSelector`
Expected: PASS. The same margin rule as Task 4 applies to a boundary flip: add 1 bps to the throughput of that test.

- [ ] **Step 6: Commit**

```bash
npm run format
git add libs/abr
git commit -s -m "feat(abr): bound the BOLA startup pick and oscillation cap by the download time of one segment" -m "The buffer score, the placeholder, and the guard do not change. BOLA passes a playback rate of 1 to the search, as its rules ignore the rate." -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Simulation with a time to first byte, and the RFC analysis

**Files:**
- Modify: `libs/abr/test/helpers/simulatePlayback.ts` (`timeToFirstByte` option, `switchCount` result)
- Create: `libs/abr/test/helpers/timeToFirstByteReport.ts`
- Create: `libs/abr/test/timeToFirstByteSimulation.test.ts`
- Modify: `rfc/download-time-model/analysis.md` on branch `rfc/download-time-model` (the Results section)

**Interfaces:**
- Produces: `SimulationOptions.timeToFirstByte?: number` in seconds per download, `SimulationResult.switchCount: number`, and `renderTimeToFirstByteReport(seedCount: number): string`, a markdown table.

- [ ] **Step 1: Write the failing test**

```ts
// libs/abr/test/timeToFirstByteSimulation.test.ts
import type { BitrateSelector, LadderRung } from '@svta/cml-abr'
import { createBolaSelector, createThroughputSelector } from '@svta/cml-abr'
import { ok } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { L1, L2 } from './helpers/ladders.ts'
import { createRandomWalkTrace, simulatePlayback } from './helpers/simulatePlayback.ts'

const SEGMENT_COUNT = 75
const SEED_COUNT = 20
const MINIMUM_BANDWIDTH = 600_000
const MAXIMUM_BANDWIDTH = 9_000_000
const BUFFER_CAP = 18
// The high wait scenario of the RFC analysis: 800 ms before the first byte and 2 second segments.
const HIGH_WAIT = 0.8
const SHORT_SEGMENT = 2

type Totals = { stalls: number; switches: number; bandwidth: number }

const SELECTORS: [string, (ignoreTimeToFirstByte: boolean) => BitrateSelector][] = [
	['the BOLA selector', ignoreTimeToFirstByte => createBolaSelector({ ignoreTimeToFirstByte })],
	['the throughput selector', ignoreTimeToFirstByte => createThroughputSelector({ ignoreTimeToFirstByte })],
]

// The totals over the seeds. With `ignoreTimeToFirstByte` the selector picks as before this change.
function totals(
	createSelector: (ignoreTimeToFirstByte: boolean) => BitrateSelector,
	ladder: LadderRung[],
	ignoreTimeToFirstByte: boolean,
): Totals {
	const result: Totals = { stalls: 0, switches: 0, bandwidth: 0 }

	for (let seed = 1; seed <= SEED_COUNT; seed++) {
		const run = simulatePlayback(createSelector(ignoreTimeToFirstByte), {
			ladder,
			trace: createRandomWalkTrace(seed, MINIMUM_BANDWIDTH, MAXIMUM_BANDWIDTH),
			bufferCap: BUFFER_CAP,
			segmentCount: SEGMENT_COUNT,
			segmentDuration: SHORT_SEGMENT,
			timeToFirstByte: HIGH_WAIT,
		})

		result.stalls += run.stallCount
		result.switches += run.switchCount
		result.bandwidth += run.bandwidths.reduce((sum, value) => sum + value, 0) / run.bandwidths.length
	}

	return result
}

describe('time to first byte simulation', () => {
	it('stalls and switches no more with the bound than without it in the high wait scenario', () => {
		for (const [name, createSelector] of SELECTORS) {
			for (const ladder of [L1, L2]) {
				const bounded = totals(createSelector, ladder, false)
				const unbounded = totals(createSelector, ladder, true)
				const context = `${name}, ${ladder.length} rungs`

				ok(bounded.stalls <= unbounded.stalls, `${context}: stalls ${bounded.stalls} vs ${unbounded.stalls}`)
				ok(bounded.switches <= unbounded.switches, `${context}: switches ${bounded.switches} vs ${unbounded.switches}`)
			}
		}
	})
})
```

If this assertion fails after Step 3, do not loosen it. Record the numbers in the analysis and stop for review. The RFC says the measured direction goes into the document.

- [ ] **Step 2: Run the test and confirm the failure**

Run: `npm test -w libs/abr -- timeToFirstByteSimulation`
Expected: FAIL. The build fails first: `timeToFirstByte` is not a field of `SimulationOptions`, and `switchCount` is not a field of `SimulationResult`.

- [ ] **Step 3: Extend the simulation helper**

In `libs/abr/test/helpers/simulatePlayback.ts`, add to `SimulationOptions` after `omitSegmentDuration?: boolean`:

```ts
	/** The time to first byte of every download, in seconds. The player pays it before the transfer, and the sample timing records it. */
	timeToFirstByte?: number
```

Add to `SimulationResult` after `stallCount: number`:

```ts
	/** The decisions whose rung differs from the rung of the previous segment. */
	switchCount: number
```

In `simulatePlayback`, read the option and initialize the count:

```ts
	const { ladder, trace, bufferCap, segmentCount, segmentDuration, omitSegmentDuration } = options
	const timeToFirstByte = options.timeToFirstByte ?? 0
	const estimate = createThroughputEstimate()
	const result: SimulationResult = {
		bandwidths: [],
		delays: [],
		repeatedDelays: 0,
		stallCount: 0,
		switchCount: 0,
	}
```

Replace the body of `download` from `const bits = ...` through the `estimate.sample(...)` line:

```ts
		const bits = bandwidth * segmentDuration
		const transferSeconds = downloadSeconds(trace, time + timeToFirstByte, bits)
		const seconds = timeToFirstByte + transferSeconds
		const startTime = time * MILLISECONDS_PER_SECOND

		if (isPlaying) {
			if (seconds > buffer) {
				result.stallCount++
				buffer = 0
			} else {
				buffer -= seconds
			}
		}

		time += seconds

		const bufferLevel = buffer

		buffer += segmentDuration
		isPlaying = true
		// The estimate measures the transfer, as the estimators of @svta/cml-throughput do since PR 588.
		estimate.sample(transferSeconds, bits / transferSeconds)
```

Replace the returned `timing`:

```ts
			timing: {
				startTime,
				responseStart: startTime + timeToFirstByte * MILLISECONDS_PER_SECOND,
				encodedBodySize: bits / BITS_PER_BYTE,
				duration: seconds * MILLISECONDS_PER_SECOND,
			},
```

In the main loop, count the switches. Replace:

```ts
		const { bandwidth } = ladder[pickRung().index]

		selector.sample(download(bandwidth))
		result.bandwidths.push(bandwidth)
```

with:

```ts
		const { bandwidth } = ladder[pickRung().index]
		const previous = result.bandwidths[result.bandwidths.length - 1]

		if (previous !== undefined && previous !== bandwidth) {
			result.switchCount++
		}

		selector.sample(download(bandwidth))
		result.bandwidths.push(bandwidth)
```

- [ ] **Step 4: Run the simulation tests**

Run: `npm run build -w libs/abr && npm test -w libs/abr -- simulation`
Expected: PASS for both `simulation.test.ts` and `timeToFirstByteSimulation.test.ts`. The existing simulation tests run with a time to first byte of 0 and keep their results.

- [ ] **Step 5: Write the report helper**

```ts
// libs/abr/test/helpers/timeToFirstByteReport.ts
import type { BitrateSelector, LadderRung } from '@svta/cml-abr'
import { createBolaSelector, createThroughputSelector } from '@svta/cml-abr'
import { L1, L2 } from './ladders.ts'
import { createRandomWalkTrace, simulatePlayback } from './simulatePlayback.ts'

const SEGMENT_COUNT = 75
const MINIMUM_BANDWIDTH = 600_000
const MAXIMUM_BANDWIDTH = 9_000_000
const BITS_PER_MEGABIT = 1_000_000

type Setup = { name: string; ladder: LadderRung[]; bufferCap: number }
type Scenario = { name: string; timeToFirstByte: number; segmentDuration: number }

const SETUPS: Setup[] = [
	{ name: '5 rungs, 18 s', ladder: L1, bufferCap: 18 },
	{ name: '10 rungs, 18 s', ladder: L2, bufferCap: 18 },
	{ name: '10 rungs, 30 s', ladder: L2, bufferCap: 30 },
]

const SCENARIOS: Scenario[] = [
	{ name: 'Low wait, 100 ms, 4 s segments', timeToFirstByte: 0.1, segmentDuration: 4 },
	{ name: 'High wait, 800 ms, 2 s segments', timeToFirstByte: 0.8, segmentDuration: 2 },
]

const SELECTORS: [string, (ignoreTimeToFirstByte: boolean) => BitrateSelector][] = [
	['BOLA', ignoreTimeToFirstByte => createBolaSelector({ ignoreTimeToFirstByte })],
	['Throughput', ignoreTimeToFirstByte => createThroughputSelector({ ignoreTimeToFirstByte })],
]

/**
 * Renders the RFC analysis table: average Mbps, stalls per session, and switches per session,
 * for every setup, scenario, selector, and option state, averaged over `seedCount` traces.
 */
export function renderTimeToFirstByteReport(seedCount: number): string {
	const lines = [
		'| Ladder and buffer cap | Scenario | Selector | Time to first byte | Average Mbps | Stalls per session | Switches per session |',
		'|---|---|---|---|---|---|---|',
	]

	for (const setup of SETUPS) {
		for (const scenario of SCENARIOS) {
			for (const [selectorName, createSelector] of SELECTORS) {
				for (const ignoreTimeToFirstByte of [false, true]) {
					let bandwidth = 0
					let stalls = 0
					let switches = 0

					for (let seed = 1; seed <= seedCount; seed++) {
						const run = simulatePlayback(createSelector(ignoreTimeToFirstByte), {
							ladder: setup.ladder,
							trace: createRandomWalkTrace(seed, MINIMUM_BANDWIDTH, MAXIMUM_BANDWIDTH),
							bufferCap: setup.bufferCap,
							segmentCount: SEGMENT_COUNT,
							segmentDuration: scenario.segmentDuration,
							timeToFirstByte: scenario.timeToFirstByte,
						})

						bandwidth += run.bandwidths.reduce((sum, value) => sum + value, 0) / run.bandwidths.length
						stalls += run.stallCount
						switches += run.switchCount
					}

					lines.push(
						`| ${setup.name} | ${scenario.name} | ${selectorName} | ${ignoreTimeToFirstByte ? 'Ignored' : 'Counted'} | ` +
							`${(bandwidth / seedCount / BITS_PER_MEGABIT).toFixed(2)} | ${(stalls / seedCount).toFixed(2)} | ${(switches / seedCount).toFixed(1)} |`,
					)
				}
			}
		}
	}

	return lines.join('\n')
}
```

- [ ] **Step 6: Run the report and record the numbers**

Run from the repository root, after `npm run build -w libs/abr`:

```bash
node --input-type=module -e "import('./libs/abr/test/helpers/timeToFirstByteReport.ts').then(m => console.log(m.renderTimeToFirstByteReport(100)))"
```

Expected: a markdown table with 24 rows. Save the output. Then switch to the RFC branch and fill the Results section:

```bash
git stash push -u -m "download-time-model-report"
git checkout rfc/download-time-model
```

In `rfc/download-time-model/analysis.md`, replace the body of the Results section, "The implementation branch produces the results. This section receives the tables before the RFC PR opens.", with the table. Add one paragraph after the table that states the measured direction in each scenario in plain words. Where the table contradicts the Expected outcome section, say so in that paragraph. Also correct the Simulation method section: replace "comes from an `EwmaEstimator` fed with the same timings" with "comes from a local estimate with the half-lives of the README example, fed with the transfer of each download".

```bash
git add rfc/download-time-model/analysis.md
git commit -s -m "docs(rfc): add the simulation results to the download-time model analysis" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git checkout feat/download-time-model
git stash list --format='%H %gs' | grep download-time-model-report
git stash apply <sha from the previous line>
git stash drop stash@{<its index>}
```

- [ ] **Step 7: Run the abr tests and commit**

Run: `npm test -w libs/abr`
Expected: PASS.

```bash
npm run format
git add libs/abr/test
git commit -s -m "test(abr): simulate a time to first byte per download and report the scenarios of the RFC" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Package docs

**Files:**
- Modify: `libs/abr/README.md`
- Modify: `libs/abr/CHANGELOG.md`
- Regenerate: `libs/abr/config/cml-abr.api.md`, `skills/common-media-library/` (the root build writes both)

- [ ] **Step 1: The throughput selector section of the README**

Replace the opening paragraph of `## Throughput selector`:

```
The selector divides the throughput by `playbackRate` to get the effective throughput. It picks the highest rung at or below `effectiveThroughput * safetyFactor`. When no rung is at or below that value, the pick is rung 0. Two rules refine the pick:
```

with:

```
The selector picks the highest rung whose download fits in one segment. The download time of a rung is `timeToFirstByte + bandwidth * segmentDuration / (throughput * safetyFactor)`. The download fits when that time is at most `segmentDuration / playbackRate`. When no rung fits, the pick is rung 0. Without `segmentDuration`, the pick is the highest rung at or below `throughput * safetyFactor / playbackRate`. `timeToFirstByte` is the mean time to first byte, in seconds, over the last four samples that were not aborted. The time to first byte of a sample is `responseStart - startTime` of its `timing`. The selector ignores a sample whose `responseStart` is missing or outside the response. Without such samples, `timeToFirstByte` is 0. dash.js 4 scaled every pick the same way, and dash.js 5 dropped the rule. Two rules refine the pick:
```

In the hysteresis bullet, replace "recomputes the pick with `effectiveThroughput * upgradeFactor`" with "recomputes the pick with `throughput * upgradeFactor` as the safe throughput".

In the starvation guard bullet, delete the four sentences from "`timeToFirstByte` is the mean time to first byte" through "hls.js adds its own time to first byte estimate to the same check." and replace them with "hls.js adds its own time to first byte estimate to the same check." The definition of `timeToFirstByte` now sits in the opening paragraph. Delete the last sentence, "A live player omits `segmentDuration` to skip the guard, as hls.js skips the check near the live edge.", and replace it with "A call without `segmentDuration` skips the guard and the segment bound."

Add a row to the options table after `starvationTolerance`:

```
| `ignoreTimeToFirstByte` | `false` | When `true`, the selector ignores the time to first byte in the pick and in the guard. |
```

Add a paragraph after the options table:

```
Set `ignoreTimeToFirstByte` when the time to first byte is not time that a download loses. Examples: the player requests the next segment before the current download ends, `responseStart` does not mark the first byte of the body, or the server sends the response headers before the body exists.
```

Add a row to the player comparison table after `Starvation tolerance`:

```
| Segment bound on the pick | yes | no | no | dash.js 4 yes, dash.js 5 no |
```

- [ ] **Step 2: The BOLA sections of the README**

In the list of BOLA rules, replace:

```
- `segmentDuration` enables the starvation guard. The guard lowers the pick when the download of the next segment does not fit in the real buffer. A live player omits the field to skip the guard, as for the throughput selector.
```

with:

```
- `segmentDuration` enables the segment bound on the startup pick and the oscillation cap, and the starvation guard. The bound keeps the highest rung whose download fits in one segment, with the time to first byte of the last four finished samples. The guard lowers the pick when the download of the next segment does not fit in the real buffer. A call without the field skips both, as for the throughput selector.
```

In `### How it works`, the Startup row of the state table says "Picks the highest rung at or below `throughput * safetyFactor`". Replace that phrase with "Picks the highest rung whose download fits in one segment at `throughput * safetyFactor`". In the oscillation guard paragraph, replace "the rung that the throughput sustains" with "the rung whose download fits in one segment at `throughput * safetyFactor`".

Add a row to the BOLA options table after `starvationSafetyFactor`:

```
| `ignoreTimeToFirstByte` | `false` | When `true`, the selector ignores the time to first byte in the picks and in the guard. The throughput selector option has the same meaning. |
```

Add a row to the selector comparison table after `Starvation guard`:

```
| Segment bound | On the safety pick and the upgrade pick | On the startup pick and the oscillation cap |
```

- [ ] **Step 3: The simulation section of the README**

Replace the simulation paragraph and table with the rows of the report from Task 6 for the low wait scenario with the time to first byte counted, in the same six-row layout as today, and add one sentence before the table: `Every download waits 100 ms for its first byte, and the selectors count that wait.` After the table, add the high wait rows as a second table with the sentence `With 800 ms before the first byte and 2 second segments, the segment bound changes the picks:` and the six rows of the high wait scenario with the time to first byte counted. Keep the closing paragraph about the model being simple. Replace the percentage range in `BOLA picks higher rungs, and its average bitrate is 36% to 47% above the throughput selector.` with the range of the new low wait rows.

- [ ] **Step 4: The changelog**

Add under `## [Unreleased]` in `libs/abr/CHANGELOG.md`:

```
### Added

- `ThroughputSelectorOptions.ignoreTimeToFirstByte` and `BolaSelectorOptions.ignoreTimeToFirstByte`. When `true`, the selector ignores the time to first byte in every pick and in the starvation guard. Default `false`.

### Changed

- The throughput selector picks the highest rung whose download fits in one segment. The download time is the time to first byte plus the transfer at `throughput * safetyFactor`. Before, the pick was the highest rung at or below `throughput * safetyFactor / playbackRate`. A call without `segmentDuration` picks as before.
- The BOLA startup pick and oscillation cap use the same download time. The buffer score, the placeholder, and the delay do not change.
```

If the file already has a `### Changed` heading under Unreleased, add the two lines to that list instead of a second heading.

- [ ] **Step 5: Build, check the API report and the skill docs, and run the root check**

Run: `npm run build && npm run typecheck && git status --short`
Expected: `libs/abr/config/cml-abr.api.md` shows the two option lines and nothing else. `skills/common-media-library/SKILL.md` and `skills/common-media-library/references/abr.md` change.

Run: `npm test`
Expected: PASS end to end.

- [ ] **Step 6: Commit**

```bash
npm run format
git add libs/abr skills
git commit -s -m "docs(abr): describe the segment bound and the ignoreTimeToFirstByte option" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Finish the branch

**Files:**
- Delete: `plans/download-time-model/`

- [ ] **Step 1: Wait for the RFC**

The RFC PR from branch `rfc/download-time-model` must be accepted before the implementation PR opens. Record any change from the review in the code and the README first.

- [ ] **Step 2: Rebase and run the root check**

If PR 588 has merged: `git rebase main`. Then `npm ci && npm run build && npm test`.
Expected: PASS.

- [ ] **Step 3: Remove the plan and commit**

```bash
git rm -r plans/download-time-model
git commit -s -m "chore(abr): remove the download-time model plan" -m "Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

- [ ] **Step 4: Open the PR**

The maintainer opens the PR with `/create-pr main`. The description states: the model in one sentence, the four pick sites, the option, the API report diff, the simulation table of the high wait scenario, the link to the RFC, and that the abr version bump happens in the release-prep PR. Also report the gzip size of `libs/abr/dist/index.js` on `main` and on the branch, from `gzip -c libs/abr/dist/index.js | wc -c` after a build of each.
