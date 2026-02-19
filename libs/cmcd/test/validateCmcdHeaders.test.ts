import { validateCmcdHeaders } from '@svta/cml-cmcd'
import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdHeaders', () => {
	it('provides a valid example', () => {
		// #region example
		const result = validateCmcdHeaders({
			'CMCD-Object': 'br=3000,d=4004',
			'CMCD-Request': 'bl=21600',
		})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
		// #endregion example
	})

	it('accepts all keys in correct shards', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': 'br=3000,d=4004,ot=v,tb=6000',
			'CMCD-Request': 'bl=21600,dl=18200,mtp=48100,su',
			'CMCD-Session': 'sid="abc",cid="xyz",sf=h,st=v',
			'CMCD-Status': 'bs,rtp=12000',
		})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('reports error for key in wrong shard', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': 'bl=21600',
		})
		equal(result.valid, false)
		equal(result.issues.length >= 1, true)
		equal(result.issues[0].key, 'bl')
		equal(result.issues[0].severity, 'error')
	})

	it('accepts custom keys in any shard', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': 'com.example-key="value"',
			'CMCD-Session': 'com.other-key="data"',
		})
		equal(result.valid, true)
	})

	it('accepts empty headers', () => {
		const result = validateCmcdHeaders({})
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('detects unknown keys across shards', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': 'br=3000,xyz="bad"',
			'CMCD-Request': 'bl=21600',
		})
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'xyz'), true)
	})

	it('detects invalid value types across shards', () => {
		const result = validateCmcdHeaders({
			'CMCD-Object': 'br="not-a-number"',
			'CMCD-Request': 'bl=21600',
		})
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'br'), true)
	})

	it('automatically validates in request mode', () => {
		const result = validateCmcdHeaders({
			'CMCD-Session': 'v=2,sid="abc"',
			'CMCD-Status': 'bs',
		})
		equal(result.valid, true)
	})

	it('rejects event-only keys in headers', () => {
		const result = validateCmcdHeaders({
			'CMCD-Session': 'v=2,sid="abc"',
			'CMCD-Status': 'e=ps',
		})
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'e'), true)
	})
})
