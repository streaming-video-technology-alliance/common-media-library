import { validateCmcdStructure } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcdStructure', () => {
	it('provides a valid example', () => {
		// #region example
		const result = validateCmcdStructure(
			{ e: 'bc', br: [3000], ts: 1234567890 },
			{ reportingMode: 'event' },
		)
		equal(result.valid, true)
		// #endregion example
	})

	it('reports error for event mode without e', () => {
		const result = validateCmcdStructure({ ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'e' && i.severity === 'error'), true)
	})

	it('reports error for event mode without ts', () => {
		const result = validateCmcdStructure({ e: 'br' }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'ts' && i.severity === 'error'), true)
	})

	it('reports error for custom event without cen', () => {
		const result = validateCmcdStructure({ e: 'ce', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'cen' && i.severity === 'error'), true)
	})

	it('reports error for non-custom event with cen', () => {
		const result = validateCmcdStructure({ e: 'ps', cen: 'myevent', sta: 'p', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'cen' && i.severity === 'error'), true)
	})

	it('reports error for non-rr event with response keys', () => {
		const result = validateCmcdStructure({ e: 'ps', rc: 200, ttfb: 100, sta: 'p' })
		equal(result.valid, false)
		const errorKeys = result.issues.filter(i => i.severity === 'error').map(i => i.key)
		equal(errorKeys.includes('rc'), true)
		equal(errorKeys.includes('ttfb'), true)
	})

	it('accepts rr event with response keys and url', () => {
		const result = validateCmcdStructure({ e: 'rr', rc: 200, ttfb: 100, url: 'https://example.com/video.mp4' })
		equal(result.valid, true)
	})

	it('reports error for rr event without url', () => {
		const result = validateCmcdStructure({ e: 'rr', rc: 200 })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'url' && i.severity === 'error'), true)
	})

	it('reports error for ps event without sta', () => {
		const result = validateCmcdStructure({ e: 'ps', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'sta' && i.severity === 'error'), true)
	})

	it('accepts ps event with sta', () => {
		const result = validateCmcdStructure({ e: 'ps', sta: 'p', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for pr event without pr', () => {
		const result = validateCmcdStructure({ e: 'pr', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'pr' && i.severity === 'error'), true)
	})

	it('accepts pr event with pr', () => {
		const result = validateCmcdStructure({ e: 'pr', pr: 1.5, ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for c event without cid', () => {
		const result = validateCmcdStructure({ e: 'c', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'cid' && i.severity === 'error'), true)
	})

	it('accepts c event with cid', () => {
		const result = validateCmcdStructure({ e: 'c', cid: 'content-123', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for b event without bg', () => {
		const result = validateCmcdStructure({ e: 'b', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'bg' && i.severity === 'error'), true)
	})

	it('accepts b event with bg', () => {
		const result = validateCmcdStructure({ e: 'b', bg: true, ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for bc event without br', () => {
		const result = validateCmcdStructure({ e: 'bc', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'br' && i.severity === 'error'), true)
	})

	it('accepts bc event with br', () => {
		const result = validateCmcdStructure({ e: 'bc', br: [3000], ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for error event without ec', () => {
		const result = validateCmcdStructure({ e: 'e', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'ec' && i.severity === 'error'), true)
	})

	it('accepts error event with ec', () => {
		const result = validateCmcdStructure({ e: 'e', ec: ['ERR-001'], ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for v2 payload without v key', () => {
		const result = validateCmcdStructure({ br: 3000 }, { version: 2 })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'v' && i.severity === 'error'), true)
	})

	it('warns for v1 payload with v key', () => {
		const result = validateCmcdStructure({ v: 1, br: 3000 })
		equal(result.valid, true)
		equal(result.issues.some(i => i.key === 'v' && i.severity === 'warning'), true)
	})

	it('reports error for event key in request mode', () => {
		const result = validateCmcdStructure({ e: 'br', ts: 123, br: 3000 }, { reportingMode: 'request' })
		equal(result.valid, false)
		const errorKeys = result.issues.filter(i => i.severity === 'error').map(i => i.key)
		equal(errorKeys.includes('e'), true)
		equal(errorKeys.includes('ts'), true)
	})

	it('reports error for response key in request mode', () => {
		const result = validateCmcdStructure({ rc: 200, ttfb: 100, br: 3000 }, { reportingMode: 'request' })
		equal(result.valid, false)
		const errorKeys = result.issues.filter(i => i.severity === 'error').map(i => i.key)
		equal(errorKeys.includes('rc'), true)
		equal(errorKeys.includes('ttfb'), true)
	})

	it('accepts request mode payload without event or response keys', () => {
		const result = validateCmcdStructure({ br: 3000 }, { reportingMode: 'request' })
		equal(result.valid, true)
	})

	it('does not warn for v2 payload with v key', () => {
		const result = validateCmcdStructure({ v: 2, br: 3000 }, { version: 2 })
		equal(result.valid, true)
		equal(result.issues.length, 0)
	})

	it('reports error for unsupported v value', () => {
		const result = validateCmcdStructure({ v: 3, br: 3000 })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'v' && i.severity === 'error'), true)
	})
})
