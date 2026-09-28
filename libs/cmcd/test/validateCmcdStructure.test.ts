import { validateCmcdStructure } from '@svta/cml-cmcd'
import { SfToken } from '@svta/cml-structured-field-values'
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

	it('accepts b event with bg=false', () => {
		const result = validateCmcdStructure({ e: 'b', bg: false, ts: 123 }, { reportingMode: 'event' })
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

	it('doesn\'t raise sta error for non-ps events', () => {
		const result = validateCmcdStructure({ e: 'pr', pr: 1.5, ts: 123 }, { reportingMode: 'event' })
		equal(result.issues.some(i => i.key === 'sta'), false)
	})

	it('doesn\'t require any state field for e=rr', () => {
		const result = validateCmcdStructure({ e: 'rr', url: 'https://example.com/video.mp4', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('doesn\'t require any state field for e=ce when cen is present', () => {
		const result = validateCmcdStructure({ e: 'ce', cen: 'foo', ts: 123 }, { reportingMode: 'event' })
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

	it('reports a missing state-change field when e is a Symbol', () => {
		const result = validateCmcdStructure({ e: Symbol.for('ps'), ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'sta' && i.severity === 'error'), true)
	})

	it('reports a missing ec when e is an SfToken', () => {
		const result = validateCmcdStructure({ e: new SfToken('e'), ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, false)
		equal(result.issues.some(i => i.key === 'ec' && i.severity === 'error'), true)
	})

	it('accepts cen on a custom event when e is an SfToken', () => {
		const result = validateCmcdStructure({ e: new SfToken('ce'), cen: 'my-event', ts: 123 }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('accepts response keys on a response-received event when e is a Symbol', () => {
		const result = validateCmcdStructure({ e: Symbol.for('rr'), rc: 200, ts: 123, url: 'https://example.com/seg.m4s' }, { reportingMode: 'event' })
		equal(result.valid, true)
	})

	it('reports error for d when ot is not a media object type', () => {
		for (const ot of ['m', 'i', 'k']) {
			const result = validateCmcdStructure({ v: 2, ot, d: 4000 })
			equal(result.valid, false, `ot=${ot}`)
			equal(result.issues.some(i => i.key === 'd' && i.severity === 'error'), true, `ot=${ot}`)
		}
	})

	it('names the received and expected object types in the d message', () => {
		const result = validateCmcdStructure({ v: 2, ot: 'm', d: 4000 })
		equal(result.issues[0].message, 'Key "d" must not be present when "ot" is "m". Expected "ot" to be one of: a, v, av, tt, c, o.')
	})

	it('accepts d for the object types that carry a duration', () => {
		for (const ot of ['a', 'v', 'av', 'tt', 'c', 'o']) {
			equal(validateCmcdStructure({ v: 2, ot, d: 4000 }).valid, true, `ot=${ot}`)
		}
	})

	it('accepts d when ot is absent', () => {
		equal(validateCmcdStructure({ v: 2, d: 4000 }).valid, true)
	})

	it('does not apply the d object type rule to version 1 payloads', () => {
		equal(validateCmcdStructure({ ot: 'm', d: 4000 }).valid, true)
	})

	it('reads the object type from an SfToken', () => {
		equal(validateCmcdStructure({ v: 2, ot: new SfToken('m'), d: 4000 }).valid, false)
	})

	it('reports error for tpb when ot is not an audio, video, muxed, or caption object', () => {
		for (const ot of ['m', 'i', 'tt', 'k', 'o']) {
			const result = validateCmcdStructure({ v: 2, ot, tpb: [5000] })
			equal(result.issues.some(i => i.key === 'tpb' && i.severity === 'error'), true, `ot=${ot}`)
		}
	})

	it('accepts tpb for audio, video, muxed, and caption objects', () => {
		for (const ot of ['a', 'v', 'av', 'c']) {
			equal(validateCmcdStructure({ v: 2, ot, tpb: [5000] }).valid, true, `ot=${ot}`)
		}
	})

	it('reports error for an aggregate bitrate key sent with its exact key', () => {
		for (const [aggregate, exact] of [['ab', 'br'], ['lab', 'lb'], ['tab', 'tb']]) {
			const result = validateCmcdStructure({ v: 2, [aggregate]: [5000], [exact]: [3000] })
			equal(result.valid, false, aggregate)
			const message = `Key "${aggregate}" must not be present when "${exact}" is present.`
			equal(result.issues.some(i => i.key === aggregate && i.severity === 'error' && i.message === message), true, aggregate)
		}
	})

	it('accepts an aggregate bitrate key without its exact key', () => {
		for (const aggregate of ['ab', 'lab', 'tab']) {
			equal(validateCmcdStructure({ v: 2, [aggregate]: [5000] }).valid, true, aggregate)
		}
	})
})
