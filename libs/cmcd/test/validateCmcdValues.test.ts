import { validateCmcdValues } from '@svta/cml-cmcd'
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import { deepEqual, equal, match } from 'node:assert'
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

	it('reports error when bl is not a multiple of 100 (v1)', () => {
		const result = validateCmcdValues({ bl: 150 })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'bl')
		equal(result.issues[0].severity, 'error')
	})

	it('does not warn when bl is a multiple of 100 (v1)', () => {
		const result = validateCmcdValues({ bl: 200 })
		equal(result.valid, true)
		equal(result.issues.length, 0)
	})

	it('reports error when dl, mtp, or rtp is not a multiple of 100 (v1)', () => {
		const result = validateCmcdValues({ dl: 150, mtp: 150, rtp: 150 })
		equal(result.valid, false)
		deepEqual(result.issues.map(i => [i.key, i.severity]), [['dl', 'error'], ['mtp', 'error'], ['rtp', 'error']])
	})

	it('reports error with the unit and the received value when dl is not a multiple of 100 (v2)', () => {
		const result = validateCmcdValues({ dl: 150, v: 2 })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'dl')
		equal(result.issues[0].severity, 'error')
		match(result.issues[0].message, /must be rounded to the nearest 100 ms/)
		match(result.issues[0].message, /150/)
	})

	it('reports error when rtp is not a multiple of 100 (v2)', () => {
		const result = validateCmcdValues({ rtp: 150, v: 2 })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'rtp')
		equal(result.issues[0].severity, 'error')
		match(result.issues[0].message, /nearest 100 kbps/)
	})

	it('reports error for each mtp element that is not a multiple of 100 (v2)', () => {
		const result = validateCmcdValues({ mtp: [150, new SfItem(1200, { v: true }), new SfItem(250, { a: true })], v: 2 })
		equal(result.valid, false)
		deepEqual(result.issues.map(i => [i.key, i.severity]), [['mtp', 'error'], ['mtp', 'error']])
		match(result.issues[0].message, /element \[0\] must be rounded to the nearest 100 kbps/)
		match(result.issues[1].message, /element \[2\] must be rounded to the nearest 100 kbps/)
	})

	it('warns when bl or tbl is not a multiple of 100 (v2)', () => {
		const result = validateCmcdValues({ bl: [150], tbl: [new SfItem(250, { v: true })], v: 2 })
		equal(result.valid, true)
		deepEqual(result.issues.map(i => [i.key, i.severity]), [['bl', 'warning'], ['tbl', 'warning']])
		match(result.issues[0].message, /should be rounded to the nearest 100 ms/)
		match(result.issues[1].message, /should be rounded to the nearest 100 ms/)
	})

	it('accepts list elements that are multiples of 100 (v2)', () => {
		const result = validateCmcdValues({ bl: [21300, new SfItem(200, { a: true })], mtp: [48100], tbl: [new SfItem(30000, { v: true })], v: 2 })
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

	it('reports error when br is not an integer (v1)', () => {
		const result = validateCmcdValues({ br: 3000.5 })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'br')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error when tb is not an integer (v1)', () => {
		const result = validateCmcdValues({ tb: 3000.5 })
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'tb')
		equal(result.issues[0].severity, 'error')
	})

	it('reports error for a list element that is not an integer (v2)', () => {
		const result = validateCmcdValues({ br: [3000.5], lb: [new SfItem(1.5, { v: true })], v: 2 })
		equal(result.valid, false)
		deepEqual(result.issues.map(i => [i.key, i.severity]), [['br', 'error'], ['lb', 'error']])
		match(result.issues[0].message, /element \[0\] must be a finite integer/)
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

	it('accepts a token field wrapped in an SfItem', () => {
		const result = validateCmcdValues({ ot: new SfItem('m', { 'com.example-p': 1 }) })
		equal(result.valid, true)
	})

	it('accepts a token field decoded as a registry Symbol', () => {
		const result = validateCmcdValues({ ot: Symbol.for('m') })
		equal(result.valid, true)
	})

	it('accepts a token field decoded as an SfToken', () => {
		const result = validateCmcdValues({ sf: new SfToken('d') })
		equal(result.valid, true)
	})

	it('reports the token text of an invalid wrapped token value', () => {
		const result = validateCmcdValues({ ot: new SfItem('zzz', { 'com.example-p': 1 }) })
		equal(result.valid, false)
		equal(result.issues[0].key, 'ot')
		match(result.issues[0].message, /"zzz"/)
	})
})
