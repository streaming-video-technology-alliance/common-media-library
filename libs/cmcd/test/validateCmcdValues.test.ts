import { validateCmcdValues } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdValues', () => {
	it('provides a valid example', () => {
		// #region example
		const result = validateCmcdValues({ br: 3000, ot: 'v', bs: true })
		equal(result.valid, true)
		// #endregion example
	})

	it('reports error for integer key with NaN', () => {
		const result = validateCmcdValues({ d: NaN })
		equal(result.valid, false)
		equal(result.issues[0].key, 'd')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for integer key with Infinity', () => {
		const result = validateCmcdValues({ d: Infinity })
		equal(result.valid, false)
		equal(result.issues[0].key, 'd')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for integer key with float', () => {
		const result = validateCmcdValues({ d: 4.5 })
		equal(result.valid, false)
		equal(result.issues[0].key, 'd')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for boolean key with string value', () => {
		const result = validateCmcdValues({ bs: 'true' })
		equal(result.valid, false)
		equal(result.issues[0].key, 'bs')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for string key exceeding length limit', () => {
		const result = validateCmcdValues({ sid: 'a'.repeat(65) })
		equal(result.valid, false)
		equal(result.issues[0].key, 'sid')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for token key with invalid value', () => {
		const result = validateCmcdValues({ ot: 'invalid' })
		equal(result.valid, false)
		equal(result.issues[0].key, 'ot')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts valid token value', () => {
		const result = validateCmcdValues({ ot: 'v', sf: 'd', st: 'l' })
		equal(result.valid, true)
	})

	it('warns when bl is not a multiple of 100 (v1)', () => {
		const result = validateCmcdValues({ bl: 150 })
		equal(result.valid, true)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'bl')
		equal(result.issues[0].severity, 'warning')
	})

	it('does not warn when bl is a multiple of 100 (v1)', () => {
		const result = validateCmcdValues({ bl: 200 })
		equal(result.valid, true)
		equal(result.issues.length, 0)
	})

	it('reports error for list key with non-array in v2', () => {
		const result = validateCmcdValues({ bl: 200, v: 2 })
		equal(result.valid, false)
		equal(result.issues[0].key, 'bl')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts list key with plain number in v1', () => {
		const result = validateCmcdValues({ bl: 200 })
		equal(result.valid, true)
	})

	it('reports error for v key with value 3', () => {
		const result = validateCmcdValues({ v: 3 })
		equal(result.valid, false)
		equal(result.issues[0].key, 'v')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts v key with value 1', () => {
		const result = validateCmcdValues({ v: 1 })
		equal(result.valid, true)
	})

	it('accepts v key with value 2', () => {
		const result = validateCmcdValues({ v: 2 })
		equal(result.valid, true)
	})

	it('warns when br is not an integer (v1)', () => {
		const result = validateCmcdValues({ br: 3000.5 })
		equal(result.valid, true)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'br')
		equal(result.issues[0].severity, 'warning')
	})

	it('reports error for custom key with non-string value', () => {
		const result = validateCmcdValues({ 'com.example-key': 123 })
		equal(result.valid, false)
		equal(result.issues[0].key, 'com.example-key')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for custom key value exceeding 64 characters', () => {
		const result = validateCmcdValues({ 'com.example-key': 'a'.repeat(65) })
		equal(result.valid, false)
		equal(result.issues[0].key, 'com.example-key')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts valid custom key with string value', () => {
		const result = validateCmcdValues({ 'com.example-key': 'hello' })
		equal(result.valid, true)
	})

	it('reports error for string key with wrong type (smrt)', () => {
		const result = validateCmcdValues({ smrt: 123, v: 2 })
		equal(result.valid, false)
		equal(result.issues[0].key, 'smrt')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts string key with correct type (smrt)', () => {
		const result = validateCmcdValues({ smrt: 'base64data', v: 2 })
		equal(result.valid, true)
	})
})
