import { validateCmcdEvent } from '@svta/cml-cmcd'
import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdEvent', () => {
	it('provides a valid example', () => {
		// #region example
		const body = `e=ps,sid="session-1",ts=1700000000000,sta=p,v=2
e=t,sid="session-1",ts=1700000001000,bl=(5000),v=2`

		const result = validateCmcdEvent(body)
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
		// #endregion example
	})

	it('validates a single-line event', () => {
		const result = validateCmcdEvent('e=ps,sid="session-1",ts=1700000000000,sta=p,v=2')
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})

	it('reports errors for missing e and ts', () => {
		const result = validateCmcdEvent('br=3000,sid="abc",v=2')
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'e'), true)
		equal(result.issues.some(i => i.key === 'ts'), true)
	})

	it('reports error for custom event without cen', () => {
		const result = validateCmcdEvent('e=ce,sid="abc",ts=1700000000000,v=2')
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'cen'), true)
	})

	it('forwards the version option', () => {
		const result = validateCmcdEvent('e=ps,sid="abc",ts=1700000000000,sta=p,v=2', { version: 2 })
		equal(result.valid, true)
	})

	it('validates a valid response received event', () => {
		const result = validateCmcdEvent('e=rr,sid="abc",ts=1700000000000,url="https://example.com",rc=200,ttfb=50,v=2')
		equal(result.valid, true)
	})

	it('merges issues from multiple lines', () => {
		const body = `e=ps,sid="s1",ts=1700000000000,sta=p,v=2
br=3000,sid="s1",v=2`

		const result = validateCmcdEvent(body)
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'e'), true)
		equal(result.issues.some(i => i.key === 'ts'), true)
	})

	it('reports error for an empty string', () => {
		const result = validateCmcdEvent('')
		equal(result.valid, false)
		equal(result.issues.length, 1)
		equal(result.issues[0].severity, 'error')
	})

	it('ignores blank lines', () => {
		const body = `e=ps,sid="s1",ts=1700000000000,sta=p,v=2

e=t,sid="s1",ts=1700000001000,bl=(5000),v=2
`

		const result = validateCmcdEvent(body)
		equal(result.valid, true)
		deepStrictEqual(result.issues, [])
	})
})
