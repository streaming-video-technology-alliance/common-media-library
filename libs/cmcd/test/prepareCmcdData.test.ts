import type { CmcdV1 } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, CmcdReportingMode, prepareCmcdData, toCmcdValue } from '@svta/cml-cmcd'
import { SfToken } from '@svta/cml-structured-field-values'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('prepareCmcdData', () => {
	it('provides a valid example', () => {
		// #region example
		const data = prepareCmcdData({ br: [1000], 'com.example-hello': 'world', su: true })
		equal(data['com.example-hello'], 'world')
		equal(data['su'], true)
		equal(data['v'], 2)
		// #endregion example
	})

	it('returns an empty object for null input', () => {
		equal(Object.keys(prepareCmcdData(null as any)).length, 0)
	})

	it('returns an empty object for non-object input', () => {
		equal(Object.keys(prepareCmcdData('data' as any)).length, 0)
	})

	it('returns an empty object when all keys are filtered out', () => {
		equal(Object.keys(prepareCmcdData({ sid: 'session-id' }, { filter: () => false })).length, 0)
	})

	describe('mode filters', () => {
		it('drops event-only keys in request mode', () => {
			const data = prepareCmcdData({ cid: 'content-id', cen: 'my-event', ts: 123, h: 'example.com' }, { reportingMode: CmcdReportingMode.REQUEST })
			ok('cid' in data)
			ok(!('cen' in data))
			ok(!('ts' in data))
			ok(!('h' in data))
		})

		it('keeps request and event keys in event mode', () => {
			const data = prepareCmcdData({ e: CmcdEventType.TIME_INTERVAL, ts: 123, cid: 'content-id' }, { reportingMode: CmcdReportingMode.EVENT })
			ok('e' in data)
			equal(data['ts'], 123)
			equal(data['cid'], 'content-id')
		})

		it('drops v2-only keys when version is 1', () => {
			const data = prepareCmcdData({ br: [1000], sta: CmcdPlayerState.PLAYING, 'com.example-hello': 'world' }, { version: 1 })
			equal(data['br'], 1000)
			ok(!('sta' in data))
			ok(!('v' in data))
			equal(data['com.example-hello'], 'world')
		})
	})

	describe('filtering', () => {
		it('applies the filter option', () => {
			const data = prepareCmcdData({ cid: 'content-id', sid: 'session-id' }, { filter: key => key === 'cid' })
			ok('cid' in data)
			ok(!('sid' in data))
			equal(data['v'], 2)
		})

		it('force-includes e, ts and cen for filtered custom events', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData(
				{ e: CmcdEventType.CUSTOM_EVENT, cen: 'my-event', cid: 'content-id', sid: 'session-id' },
				{ reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' },
			)
			const e = data['e'] as unknown
			ok(e instanceof SfToken)
			equal(e.description, 'ce')
			equal(data['ts'], 1234)
			equal(data['cen'], 'my-event')
			ok(!('sid' in data))
		})

		it('does not force-include cen for non-custom events', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData(
				{ e: CmcdEventType.ERROR, cen: 'my-event', cid: 'content-id' },
				{ reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' },
			)
			ok(!('cen' in data))
		})

		it('force-includes the required field of a filtered state-change event', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData(
				{ e: CmcdEventType.PLAY_STATE, sta: CmcdPlayerState.PLAYING, cid: 'content-id' },
				{ reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' },
			)
			ok('sta' in data)
		})
	})

	describe('response received keys', () => {
		it('strips response received keys from non-rr events', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData(
				{ e: CmcdEventType.CUSTOM_EVENT, cen: 'my-event', url: 'https://example.com/seg.mp4', rc: 200, ttfb: 50, 'com.example-detail': 'q3' },
				{ reportingMode: CmcdReportingMode.EVENT },
			)
			ok(!('url' in data))
			ok(!('rc' in data))
			ok(!('ttfb' in data))
			equal(data['com.example-detail'], 'q3')
		})

		it('keeps response received keys on rr events', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData(
				{ e: CmcdEventType.RESPONSE_RECEIVED, url: 'https://example.com/seg.mp4', rc: 200 },
				{ reportingMode: CmcdReportingMode.EVENT },
			)
			equal(data['url'], 'https://example.com/seg.mp4')
			equal(data['rc'], 200)
		})
	})

	describe('value handling', () => {
		it('skips pr=1 in request mode', () => {
			const data = prepareCmcdData({ pr: 1, cid: 'content-id' })
			ok(!('pr' in data))
		})

		it('preserves pr=1 on a playback rate event', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData({ e: CmcdEventType.PLAYBACK_RATE, pr: 1 }, { reportingMode: CmcdReportingMode.EVENT })
			equal(data['pr'], 1)
		})

		it('strips bg=false in request mode', () => {
			const data = prepareCmcdData({ bg: false, cid: 'content-id' })
			ok(!('bg' in data))
		})

		it('preserves bg=false on a backgrounded mode event', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData({ e: CmcdEventType.BACKGROUNDED_MODE, bg: false }, { reportingMode: CmcdReportingMode.EVENT })
			equal(data['bg'], false)
		})

		it('strips invalid values', () => {
			const data = prepareCmcdData({ cid: '', sid: null, mtp: NaN, su: false, br: [1000] })
			ok(!('cid' in data))
			ok(!('sid' in data))
			ok(!('mtp' in data))
			ok(!('su' in data))
			ok('br' in data)
		})

		it('wraps token field values in SfToken', () => {
			const data = prepareCmcdData({ sf: 'd', cid: 'content-id' })
			ok((data['sf'] as unknown) instanceof SfToken)
		})
	})

	describe('custom keys', () => {
		it('passes custom keys through in event mode', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const data = prepareCmcdData({ e: CmcdEventType.ERROR, 'com.example-hello': 'world' }, { reportingMode: CmcdReportingMode.EVENT })
			equal(data['com.example-hello'], 'world')
		})

		it('drops keys without a hyphenated prefix', () => {
			const data = prepareCmcdData({ 'com.examplehello': 'world', cid: 'content-id' })
			ok(!('com.examplehello' in data))
		})

		it('drops custom keys with invalid characters', () => {
			const data = prepareCmcdData({ 'com.example hello-x': 'world', cid: 'content-id' })
			ok(!('com.example hello-x' in data))
		})
	})

	describe('V1 down-conversion', () => {
		it('extracts nrr from a nor SfItem r parameter and keeps custom keys', () => {
			const data = prepareCmcdData({ nor: [toCmcdValue('../seg/3.m4v', { r: '0-99' })], 'com.example-hello': 'world' }, { version: 1 })
			equal(data['nor'], '..%2Fseg%2F3.m4v')
			equal((data as CmcdV1)['nrr'], '0-99')
			equal(data['com.example-hello'], 'world')
		})
	})
})
