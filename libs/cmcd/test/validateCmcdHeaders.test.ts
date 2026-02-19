import { validateCmcdHeaders } from '@svta/cml-cmcd'
import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdHeaders', () => {
	it('provides a valid example', () => {
		// #region example
		const result = validateCmcdHeaders({
			'CMCD-Object': { br: 3000, d: 4004 },
			'CMCD-Request': { bl: 21600 },
		})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
		// #endregion example
	})

	it('accepts all keys in correct shards', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': { br: 3000, d: 4004, ot: 'v', tb: 6000 },
			'CMCD-Request': { bl: 21600, dl: 18200, mtp: 48100, su: false },
			'CMCD-Session': { sid: 'abc', cid: 'xyz', sf: 'h', st: 'v', v: 2 },
			'CMCD-Status': { bs: true, rtp: 12000 },
		})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('reports error for key in wrong shard', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': { bl: 21600 },
		})
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].key, 'bl')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts custom keys in any shard', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': { 'com.example-key': 'value' },
			'CMCD-Session': { 'com.other-key': 42 },
		})
		equal(result.valid, true)
	})

	it('accepts empty headers', () => {
		const result = validateCmcdHeaders({})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})
})
