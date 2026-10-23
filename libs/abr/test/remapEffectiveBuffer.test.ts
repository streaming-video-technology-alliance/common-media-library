import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import type { BolaParams } from '../src/BolaParams.ts'
import { BOLA_DEFAULT_BUFFER_TARGET } from '../src/BOLA_DEFAULT_BUFFER_TARGET.ts'
import { createBolaParams } from '../src/createBolaParams.ts'
import { remapEffectiveBuffer } from '../src/remapEffectiveBuffer.ts'
import { selectRungByBuffer } from '../src/selectRungByBuffer.ts'
import { closeTo } from './helpers/closeTo.ts'
import { L1, L1_BANDWIDTHS, L2, withoutRung, withRung } from './helpers/ladders.ts'

const GRID_STEP = 0.0125
const GRID_END = 30
const IDENTITY_TOLERANCE = 1e-9
const TARGET = BOLA_DEFAULT_BUFFER_TARGET
const NEW_TOP_BANDWIDTH = 12_000_000
const NEW_MIDDLE_BANDWIDTH = 2_200_000
const [LOWEST, SECOND, MIDDLE, FOURTH, TOP] = L1_BANDWIDTHS
const TARGET_CHANGES = [
	[20, 40],
	[40, 24],
	[TARGET, 45],
]

function pickBandwidth(params: BolaParams, effectiveBuffer: number): number {
	return params.rungs[selectRungByBuffer(params, effectiveBuffer)].bandwidth
}

// Calls `check` with the bandwidth picked before and after the conversion, for every buffer level of the grid.
// The converted buffer can be negative. The selector keeps the placeholder at 0 or more, so the effective buffer is too.
function forEachLevel(
	previous: BolaParams,
	next: BolaParams,
	check: (before: number, after: number) => void,
): void {
	for (let effectiveBuffer = 0; effectiveBuffer <= GRID_END; effectiveBuffer += GRID_STEP) {
		const converted = Math.max(0, remapEffectiveBuffer(previous, next, effectiveBuffer))

		check(pickBandwidth(previous, effectiveBuffer), pickBandwidth(next, converted))
	}
}

describe('remapEffectiveBuffer', () => {
	it('returns the same buffer when nothing changed', () => {
		const params = createBolaParams(L1, TARGET)

		for (const effectiveBuffer of [0, 4.5, 11, 25]) {
			closeTo(
				remapEffectiveBuffer(params, params, effectiveBuffer),
				effectiveBuffer,
				IDENTITY_TOLERANCE,
			)
		}
	})

	// A large target clamps the threshold of the second rung to 0. Then the lowest rung is unreachable.
	// No conversion can keep the decision of a lowest rung there. The targets below stay clear of that limit.
	it('keeps every decision when only the buffer target changes', () => {
		for (const ladder of [L1, L2]) {
			for (const [from, to] of TARGET_CHANGES) {
				const previous = createBolaParams(ladder, from)
				const next = createBolaParams(ladder, to)

				forEachLevel(previous, next, (before, after) => equal(after, before))
			}
		}
	})

	it('changes decisions only where a rung is added at the top', () => {
		forEachLevel(
			createBolaParams(L1, TARGET),
			createBolaParams(withRung(L1, NEW_TOP_BANDWIDTH), TARGET),
			(before, after) => {
				if (before === TOP) {
					ok(after === TOP || after === NEW_TOP_BANDWIDTH)
				} else {
					equal(after, before)
				}
			},
		)
	})

	it('changes decisions only where the top rung is removed', () => {
		forEachLevel(
			createBolaParams(L1, TARGET),
			createBolaParams(withoutRung(L1, L1.length - 1), TARGET),
			(before, after) => {
				if (before === TOP) {
					equal(after, FOURTH)
				} else {
					equal(after, before)
				}
			},
		)
	})

	it('changes decisions only where the lowest rung is removed', () => {
		forEachLevel(
			createBolaParams(L1, TARGET),
			createBolaParams(withoutRung(L1, 0), TARGET),
			(before, after) => {
				if (before === LOWEST) {
					equal(after, SECOND)
				} else {
					equal(after, before)
				}
			},
		)
	})

	it('changes decisions only next to a rung that is added in the middle', () => {
		const neighbours = [MIDDLE, FOURTH]

		forEachLevel(
			createBolaParams(L1, TARGET),
			createBolaParams(withRung(L1, NEW_MIDDLE_BANDWIDTH), TARGET),
			(before, after) => {
				if (neighbours.includes(before)) {
					ok(after === before || after === NEW_MIDDLE_BANDWIDTH)
				} else {
					equal(after, before)
				}
			},
		)
	})

	it('changes decisions only where a rung is removed from the middle', () => {
		forEachLevel(
			createBolaParams(L1, TARGET),
			createBolaParams(withoutRung(L1, 2), TARGET),
			(before, after) => {
				if (before === MIDDLE) {
					ok(after === SECOND || after === FOURTH)
				} else {
					equal(after, before)
				}
			},
		)
	})
})
