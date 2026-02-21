import { validateCmcdKeys } from '@svta/cml-cmcd'
import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdKeys', () => {
	it('provides a valid example', () => {
		// #region example
		const result = validateCmcdKeys({ br: 3000, bl: 21600, d: 4004 })
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
		// #endregion example
	})

	it('accepts a valid v1 payload', () => {
		const result = validateCmcdKeys({ br: 3000, bl: 21600, d: 4004, ot: 'v', sid: 'abc' })
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('accepts a valid v2 payload with v2-only keys', () => {
		const result = validateCmcdKeys({ br: 3000, sta: 'p', v: 2 })
		equal(result.valid, true)
	})

	it('reports error for v2-only key in v1 payload', () => {
		const result = validateCmcdKeys({ sta: 'p' })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'sta')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts custom keys in v1', () => {
		const result = validateCmcdKeys({ 'com.example-key': 'value' })
		equal(result.valid, true)
	})

	it('accepts custom keys in v2', () => {
		const result = validateCmcdKeys({ 'com.example-key': 'value', v: 2 })
		equal(result.valid, true)
	})

	it('reports error for unknown key', () => {
		const result = validateCmcdKeys({ xyz: 123, v: 2 })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'xyz')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts an empty payload', () => {
		const result = validateCmcdKeys({})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('respects version option override', () => {
		const result = validateCmcdKeys({ sta: 'p' }, { version: 2 })
		equal(result.valid, true)
	})
})
