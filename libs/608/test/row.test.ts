import { Row, type PenState } from '@svta/cml-608'
import { deepEqual, equal, notDeepEqual } from 'node:assert'
import { beforeEach, describe, it } from 'vite-plus/test'

type RowInternals = {
	pos: number
	currPenState: PenState
}

describe('Row Tests', () => {
	const minCursorPosition = 0
	const maxCursorPosition = 100

	let row: Row
	let internals: RowInternals

	beforeEach(() => {
		row = new Row()
		internals = row as unknown as RowInternals
	})

	it('should initialize with empty characters and default state', () => {
		for (const char of row.chars) {
			equal(char.isEmpty(), true)
		}
		equal(internals.pos, 0)
	})

	it('equals method', () => {
		const defaultRow = new Row()
		deepEqual(row, defaultRow)

		internals.pos = 1

		notDeepEqual(row, defaultRow)
	})

	it('copy method', () => {
		const newRow = new Row()

		row.chars[0].setChar('A', internals.currPenState)
		row.chars[1].setChar('B', internals.currPenState)
		row.chars[2].setChar('C', internals.currPenState)

		newRow.copy(row)

		for (let i = 0; i < newRow.chars.length; i++) {
			equal(newRow.chars[i].equals(row.chars[i]), true)
		}
	})

	it('isEmpty method', () => {
		equal(row.isEmpty(), true)

		row.chars[0].setChar('A', internals.currPenState)
		equal(row.isEmpty(), false)
	})

	it('setCursor method, negative position', () => {
		row.setCursor(-1)
		equal(internals.pos, minCursorPosition)
	})

	it('setCursor method, big position', () => {
		row.setCursor(1000)
		equal(internals.pos, maxCursorPosition)
	})

	it('insertChar method', () => {
		const keyChar = 0x2a
		const valueChar = 'á'
		row.insertChar(keyChar)
		equal(row.chars[0].uchar, valueChar)
		equal(internals.pos, 1)
	})
})
