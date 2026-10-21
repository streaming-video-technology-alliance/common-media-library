import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { limitUpwardSwitch } from '../src/limitUpwardSwitch.ts'

const POSITIONS = [0, 1, 2, 3, 4, 5]

describe('limitUpwardSwitch', () => {
	it('keeps the higher of the current and the sustained rung when the pick is above both', () => {
		equal(limitUpwardSwitch(3, 1, 1), 1)
		equal(limitUpwardSwitch(3, 1, 2), 2)
		equal(limitUpwardSwitch(4, 3, 1), 3)
	})

	it('does not change a pick at or below the current rung', () => {
		equal(limitUpwardSwitch(1, 2, 0), 1)
		equal(limitUpwardSwitch(2, 2, 0), 2)
	})

	it('does not change a pick at or below the sustained rung', () => {
		equal(limitUpwardSwitch(2, 0, 3), 2)
		equal(limitUpwardSwitch(3, 0, 3), 3)
	})

	it('never raises a pick and never forces a downward switch', () => {
		for (const pick of POSITIONS) {
			for (const current of POSITIONS) {
				for (const sustained of POSITIONS) {
					const result = limitUpwardSwitch(pick, current, sustained)

					ok(result <= pick, `pick ${pick} current ${current} sustained ${sustained}`)
					ok(result >= Math.min(pick, current), `pick ${pick} current ${current} sustained ${sustained}`)
				}
			}
		}
	})
})
