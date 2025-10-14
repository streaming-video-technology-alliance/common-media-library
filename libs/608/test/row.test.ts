import { Row } from '@svta/cml-608'
import { deepEqual, equal, notDeepEqual } from 'node:assert'
import { beforeEach, describe, it } from 'node:test'

describe('Row Tests', () => {
	const minCursorPosition = 0
	const maxCursorPosition = 100

	let row: any

	beforeEach(() => {
		row = new Row()
	})

	it('should initialize with empty characters and default state', () => {
		for (let i = 0; i < row.chars.length; i++) {
			equal(row.chars[i].isEmpty(), true)
		}
		equal(row.pos, 0)
	})

	it('equals method', () => {
		const defaultRow = new Row()
		deepEqual(row, defaultRow)

		row.pos = 1

		notDeepEqual(row, defaultRow)
	})

	it('copy method', () => {
		const newRow = new Row()

		row.chars[0].setChar('A', row.currPenState)
		row.chars[1].setChar('B', row.currPenState)
		row.chars[2].setChar('C', row.currPenState)

		newRow.copy(row)

		for (let i = 0; i < newRow.chars.length; i++) {
			equal(newRow.chars[i].equals(row.chars[i]), true)
		}

	})

	it('isEmpty method', () => {
		equal(row.isEmpty(), true)

		row.chars[0].setChar('A', row.currPenState)
		equal(row.isEmpty(), false)
	})

	it('setCursor method, negative position', () => {
		row.setCursor(-1)
		equal(row.pos, minCursorPosition)
	})

	it('setCursor method, big position', () => {
		row.setCursor(1000)
		equal(row.pos, maxCursorPosition)
	})

	it('insertChar method', () => {
		const keyChar = 0x2a
		const valueChar = 'á'
		row.insertChar(keyChar)
		equal(row.chars[0].uchar, valueChar)
		equal(row.pos, 1)
	})
})
