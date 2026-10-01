import type { Cmcd, CmcdEncodeOptions } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdPlayerState, CmcdReportingMode, decodeCmcd, encodeCmcd } from '@svta/cml-cmcd'
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { toCmcdValue } from '@svta/cml-cmcd'
import { CMCD_INPUT } from './data/CMCD_INPUT.ts'
import { CMCD_STRING_EVENT } from './data/CMCD_STRING_EVENT.ts'
import { CMCD_STRING_REQUEST } from './data/CMCD_STRING_REQUEST.ts'
import { CMCD_STRING_RESPONSE } from './data/CMCD_STRING_RESPONSE.ts'
import { CMCD_STRING_V1 } from './data/CMCD_STRING_V1.ts'

describe('encodeCmcd', () => {
	it('provides a valid example', () => {
		//#region example
		const input = { br: [1000], 'com.example-hello': 'world', ec: ['ERR001', 'ERR002'], su: true }
		const options = { version: 2 as const, reportingMode: CmcdReportingMode.REQUEST }
		equal(encodeCmcd(input, options), 'br=(1000),com.example-hello="world",ec=("ERR001" "ERR002"),su,v=2')
		//#endregion example
	})

	it('handles null data object', () => {
		equal(encodeCmcd(null as any), '')
	})

	it('ignore invalid values', () => {
		// @ts-expect-error - This is a test
		equal(encodeCmcd({ mtp: NaN, br: Infinity, nor: '', sid: undefined, cid: null, su: false }), 'v=2')
	})

	it('rounds tbl to the nearest 100 ms', () => {
		equal(encodeCmcd({ tbl: [21349, toCmcdValue(8051, { a: true })] }), 'tbl=(21300 8100;a),v=2')
	})

	it('keeps the parameters of a formatted inner list and of its elements', () => {
		for (const s of [
			'bl=(21300;v 8100;a);p=2,v=2',
			'br=(3000;v 128;a);p=2,v=2',
			'mtp=(10000;v);p=2,v=2',
			'tb=(6000;v 320;a);p=2,v=2',
			'tbl=(21300;v 8100;a);p=2,v=2',
		]) {
			equal(encodeCmcd(decodeCmcd(s, { convertToLatest: true }) as Cmcd), s)
		}
	})

	it('rounds the values inside an inner list with parameters', () => {
		equal(encodeCmcd(decodeCmcd('tbl=(21349;v 8051;a);p=2,v=2', { convertToLatest: true }) as Cmcd), 'tbl=(21300;v 8100;a);p=2,v=2')
		equal(encodeCmcd(decodeCmcd('br=(3000.4;v 128.6;a);p=2,v=2', { convertToLatest: true }) as Cmcd), 'br=(3000;v 129;a);p=2,v=2')
	})

	it('rounds the integer inner list keys to integers', () => {
		const input = { bsa: [2.5], bsd: [toCmcdValue(1549.6, { v: true })], bsda: [3000.5], lb: [1234.5], pb: [2500.7], tpb: [8049.6] }
		equal(encodeCmcd(input), 'bsa=(3),bsd=(1550;v),bsda=(3001),lb=(1235),pb=(2501),tpb=(8050),v=2')
	})

	it('rounds the aggregate bitrate keys to integers', () => {
		equal(encodeCmcd({ ab: [4000.6], lab: [1500.5], tab: [6049.6] }), 'ab=(4001),lab=(1501),tab=(6050),v=2')
	})

	it('rounds the integer request keys to integers', () => {
		equal(encodeCmcd({ dfa: 1.5, ltc: 3549.6, msd: 250.4, pt: 12345.6, sn: 3.2 }), 'dfa=2,ltc=3550,msd=250,pt=12346,sn=3,v=2')
	})

	it('rounds the integer response keys to integers', () => {
		const input = { e: CmcdEventType.RESPONSE_RECEIVED, rc: 404.4, ts: 1727712000000, ttfb: 12.3, ttfbb: 7.7, ttlb: 45.6, url: 'https://example.com/seg.m4s' }
		equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), 'e=rr,rc=404,ts=1727712000000,ttfb=12,ttfbb=8,ttlb=46,url="https://example.com/seg.m4s",v=2')
	})

	it('rounds a fractional ts instead of failing to serialize it', () => {
		const input = { e: CmcdEventType.PLAY_STATE, sta: CmcdPlayerState.PLAYING, ts: 1727712000000.5 }
		equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), 'e=ps,sta=p,ts=1727712000001,v=2')
	})

	it('drops an inner list element that is not a finite number', () => {
		const input = { pb: [2500.4, null, 'abc', Infinity, toCmcdValue('x', { v: true }), toCmcdValue(1000.6, { a: true })] } as unknown as Cmcd
		equal(encodeCmcd(input), 'pb=(2500 1001;a),v=2')
	})

	it('omits an inner list key when no element is a finite number', () => {
		const input = { bl: [NaN], pb: ['abc'], tb: [null] } as unknown as Cmcd
		equal(encodeCmcd(input), 'v=2')
	})

	it('drops an element that is not a number from an inner list that has parameters', () => {
		const input = decodeCmcd('pb=(2500 "abc");p=2,tb=("x");p=1', { useSymbol: false }) as Cmcd
		equal(encodeCmcd(input), 'pb=(2500);p=2,v=2')
	})

	it('omits a numeric key when the value is not a number', () => {
		const input = { d: '4000', dfa: true, pr: 'abc', pt: '123' } as unknown as Cmcd
		equal(encodeCmcd(input), 'v=2')
	})

	it('replaces a ts that is not a number with the current time', (context) => {
		context.mock.timers.enable({ apis: ['Date'], now: 1234 })
		const input = { e: CmcdEventType.PLAY_STATE, sta: CmcdPlayerState.PLAYING, ts: '1727712000000' } as unknown as Cmcd
		equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), 'e=ps,sta=p,ts=1234,v=2')
	})

	describe('version 1', () => {
		it('returns encoded v1 string when version option is set to 1', () => {
			const { v, ...input } = CMCD_INPUT
			equal(encodeCmcd(input, { version: 1 }), CMCD_STRING_V1)
		})

		it('returns encoded v1 string when encoding options version is set to 1', () => {
			equal(encodeCmcd(CMCD_INPUT, { version: 1 }), CMCD_STRING_V1)
		})
	})

	describe('filtering', () => {
		it('filters keys', () => {
			equal(encodeCmcd({ cid: 'content-id', sid: 'session-id' }, { filter: key => key === 'cid' }), 'cid="content-id",v=2')
		})

		it('doesn\'t filter version key', () => {
			equal(encodeCmcd({ v: 2, cid: 'content-id', sid: 'session-id' }, { filter: key => key === 'cid' }), 'cid="content-id",v=2')
		})

		it('doesn\'t filter e key in event mode', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.TIME_INTERVAL, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('e=t'), 'e key must not be filtered out in event mode')
		})

		it('doesn\'t filter ts key in event mode', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.TIME_INTERVAL, ts: 1640995200000, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('ts='), 'ts key must not be filtered out in event mode')
		})

		it('doesn\'t filter cen key in event mode when event type is ce', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.CUSTOM_EVENT, cen: 'my-custom-event', cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('cen="my-custom-event"'), 'cen key must not be filtered out in event mode when e=ce')
		})

		it('doesn\'t filter sta key in event mode when event type is ps', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.PLAY_STATE, sta: CmcdPlayerState.PLAYING, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('sta='), 'sta key must not be filtered out in event mode when e=ps')
		})

		it('doesn\'t filter pr key in event mode when event type is pr', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.PLAYBACK_RATE, pr: 1.5, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('pr='), 'pr key must not be filtered out in event mode when e=pr')
		})

		it('doesn\'t filter cid key in event mode when event type is c', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.CONTENT_ID, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'sid' })
			ok(output.includes('cid='), 'cid key must not be filtered out in event mode when e=c')
		})

		it('doesn\'t filter bg key in event mode when event type is b', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.BACKGROUNDED_MODE, bg: true, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('bg'), 'bg key must not be filtered out in event mode when e=b')
		})

		it('encodes bg=?0 in event mode when bg is false', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.BACKGROUNDED_MODE, bg: false, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('bg=?0'), 'bg must be emitted as ?0 when false on e=b state-change event')
		})

		it('still strips bg=false in request mode', () => {
			const input = { bg: false, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.REQUEST })
			equal(output.includes('bg'), false, 'bg=false should still be stripped in request mode (v1 default-omission)')
		})

		it('still strips bg=false in non-b event mode', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.RESPONSE_RECEIVED, bg: false, url: 'https://example.com/v.mp4' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT })
			equal(output.includes('bg'), false, 'bg=false should still be stripped when event type is not b')
		})

		it('still strips sta="" in event mode when event type is ps', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.PLAY_STATE, sta: '' as any, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			equal(output.includes('sta='), false, 'sta="" is a caller bug and should not be carved out')
		})

		it('still strips cid=false in event mode when event type is c', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.CONTENT_ID, cid: false as any, sid: 'session-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'sid' })
			equal(output.includes('cid='), false, 'cid=false is a caller bug (cid is a string field); carve-out is bg-only')
		})

		it('doesn\'t filter br key in event mode when event type is bc', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.BITRATE_CHANGE, br: [3000], cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			ok(output.includes('br='), 'br key must not be filtered out in event mode when e=bc')
		})

		it('doesn\'t force-include sta when value is undefined', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.PLAY_STATE, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT, filter: key => key === 'cid' })
			equal(output.includes('sta='), false)
		})

		it('doesn\'t force-include required field in request mode', () => {
			const input = { e: CmcdEventType.PLAY_STATE, sta: CmcdPlayerState.PLAYING, cid: 'content-id', br: [3000] }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.REQUEST, filter: key => key === 'br' })
			equal(output.includes('sta='), false, 'sta should be filtered out in request mode')
		})

		it('preserves pr=1 in event mode when event type is pr', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.PLAYBACK_RATE, pr: 1, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT })
			ok(output.includes('pr=1'), 'pr=1 must be preserved when event type is pr')
		})

		it('still skips pr=1 in request mode', () => {
			const input = { pr: 1, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.REQUEST })
			equal(output.includes('pr=1'), false, 'pr=1 should still be skipped in request mode')
		})

		it('still skips pr=1 in non-pr event mode', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = { e: CmcdEventType.RESPONSE_RECEIVED, pr: 1, url: 'https://example.com/v.mp4' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT })
			equal(output.includes('pr=1'), false, 'pr=1 should still be skipped when e is not pr')
		})

		it('still skips pr=1 in request mode even when e=pr is in input data', () => {
			const input = { e: CmcdEventType.PLAYBACK_RATE, pr: 1, cid: 'content-id' }
			const output = encodeCmcd(input, { reportingMode: CmcdReportingMode.REQUEST })
			equal(output.includes('pr=1'), false, 'pr=1 should be suppressed in request mode regardless of e')
		})
	})

	it('returns encoded string when SfToken is used', () => {
		const input = Object.assign({}, CMCD_INPUT, { 'com.example-token': new SfToken('s') })
		equal(encodeCmcd(input, { version: 1 }), CMCD_STRING_V1)
	})

	it('returns encoded string when Symbol is used', () => {
		const input = Object.assign({}, CMCD_INPUT, { 'com.example-token': Symbol('s') })
		equal(encodeCmcd(input, { version: 1 }), CMCD_STRING_V1)
	})

	it('returns converts to relative path when baseUrl is provided', () => {
		const input = {
			nor: ['http://test.com/base/segments/video/1.mp4'],
		}
		const options: CmcdEncodeOptions = {
			baseUrl: 'http://test.com/base/manifest/manifest.mpd',
		}
		equal(encodeCmcd(input, options), 'nor=("../segments/video/1.mp4"),v=2')

		options.version = 2
		equal(encodeCmcd(input, options), 'nor=("../segments/video/1.mp4"),v=2')
	})

	it('passes nor through unchanged when value is already a relative path and baseUrl is provided', () => {
		const input = {
			nor: ['bbb_30fps_480x270_600k_2.m4v'],
		}
		const options: CmcdEncodeOptions = {
			baseUrl: 'http://test.com/base/manifest/manifest.mpd',
		}
		equal(encodeCmcd(input, options), 'nor=("bbb_30fps_480x270_600k_2.m4v"),v=2')

		options.version = 1
		equal(encodeCmcd(input, options), 'nor="bbb_30fps_480x270_600k_2.m4v"')
	})

	it('converts a nor inner list with parameters to relative paths when baseUrl is provided', () => {
		const input = decodeCmcd('nor=("http://test.com/base/segments/video/1.mp4";r="0-99" "http://test.com/base/segments/video/2.mp4");x') as Cmcd
		const options: CmcdEncodeOptions = {
			baseUrl: 'http://test.com/base/manifest/manifest.mpd',
		}
		equal(encodeCmcd(input, options), 'nor=("../segments/video/1.mp4";r="0-99" "../segments/video/2.mp4");x,v=2')
	})

	it('converts a nor SfItem to a relative path when baseUrl is provided', () => {
		const input = {
			nor: toCmcdValue('http://test.com/base/segments/video/1.mp4', { r: '0-99' }),
		} as unknown as Cmcd
		const options: CmcdEncodeOptions = {
			baseUrl: 'http://test.com/base/manifest/manifest.mpd',
		}
		equal(encodeCmcd(input, options), 'nor=("../segments/video/1.mp4";r="0-99"),v=2')
	})

	it('ignores a baseUrl that is not a valid URL', () => {
		equal(encodeCmcd({ nor: ['https://a.test/x/seg2.m4s'] }, { baseUrl: 'not a url' }), 'nor=("https://a.test/x/seg2.m4s"),v=2')
		equal(encodeCmcd({ nor: ['https://a.test/x/seg2.m4s'] }, { version: 1, baseUrl: 'not a url' }), 'nor="https%3A%2F%2Fa.test%2Fx%2Fseg2.m4s"')
	})

	it('ignores a baseUrl with an opaque origin', () => {
		for (const baseUrl of ['file:///x/seg1.m4s', 'data:text/plain,x']) {
			equal(encodeCmcd({ nor: ['https://a.test/x/seg2.m4s'] }, { baseUrl }), 'nor=("https://a.test/x/seg2.m4s"),v=2', baseUrl)
			equal(encodeCmcd({ nor: ['https://a.test/x/seg2.m4s'] }, { version: 1, baseUrl }), 'nor="https%3A%2F%2Fa.test%2Fx%2Fseg2.m4s"', baseUrl)
		}
	})

	it('drops a nor entry that is not a non-empty string', () => {
		equal(encodeCmcd({ nor: ['a.m4s', ''] }), 'nor=("a.m4s"),v=2')
		equal(encodeCmcd({ nor: [''] }), 'v=2')
	})

	it('sends a version 1 token that names an inherited property as its own text', () => {
		equal(encodeCmcd({ st: 'constructor', sf: 'toString' } as unknown as Cmcd, { version: 1 }), 'sf=toString,st=constructor')
	})

	describe('reporting modes', () => {
		it('defaults to request mode', () => {
			equal(encodeCmcd(CMCD_INPUT), CMCD_STRING_REQUEST)
		})

		it('returns encoded string for request mode', () => {
			equal(encodeCmcd(CMCD_INPUT, { reportingMode: CmcdReportingMode.REQUEST }), CMCD_STRING_REQUEST)
		})

		it('returns encoded string for response received', () => {
			const input = Object.assign({}, CMCD_INPUT)
			input.e = CmcdEventType.RESPONSE_RECEIVED

			const output = CMCD_STRING_RESPONSE.replace(/e=[a-z]+/, 'e=rr')
			equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), output)
		})

		it('appends timestamp in response received', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = Object.assign({}, CMCD_INPUT)
			input.e = CmcdEventType.RESPONSE_RECEIVED
			delete input.ts

			const output = CMCD_STRING_RESPONSE.replace(/e=[a-z]+/, 'e=rr').replace(/ts=\d+/, 'ts=1234')
			equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), output)
		})

		it('returns encoded string for event mode', () => {
			equal(encodeCmcd(CMCD_INPUT, { reportingMode: CmcdReportingMode.EVENT }), CMCD_STRING_EVENT)
		})

		it('appends timestamp in event mode', (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: 1234 })
			const input = Object.assign({}, CMCD_INPUT)
			delete input.ts

			const output = CMCD_STRING_EVENT.replace(/ts=\d+/, 'ts=1234')
			equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), output)
		})
	})

	describe('V1 down-conversion', () => {
		it('extracts nrr from nor SfItem with r parameter', () => {
			const input = { nor: [toCmcdValue('../testing/3.m4v', { r: '0-99' })] }
			equal(encodeCmcd(input, { version: 1 }), 'nor="..%2Ftesting%2F3.m4v",nrr="0-99"')
		})

		it('unwraps inner-list values to plain scalars for V1', () => {
			const input = { br: [5000], mtp: [10000] }
			equal(encodeCmcd(input, { version: 1 }), 'br=5000,mtp=10000')
		})

		it('selects the item whose object type flag matches ot for V1', () => {
			equal(encodeCmcd(decodeCmcd('bl=(0;v 2000;a),br=(5000;v 320;a),ot=a') as Cmcd, { version: 1 }), 'bl=2000,br=320,ot=a')
			equal(encodeCmcd(decodeCmcd('bl=(0;v 2000;a),br=(5000;v 320;a),ot=v') as Cmcd, { version: 1 }), 'bl=0,br=5000,ot=v')
		})

		it('selects an item without an object type flag when no flag matches ot for V1', () => {
			equal(encodeCmcd(decodeCmcd('mtp=(6000;a 15000),ot=v') as Cmcd, { version: 1 }), 'mtp=15000,ot=v')
			equal(encodeCmcd({ mtp: [toCmcdValue(6000, { a: true }), toCmcdValue(15000, {})], ot: 'v' } as unknown as Cmcd, { version: 1 }), 'mtp=15000,ot=v')
		})

		it('prefers a matching object type flag over an item without a flag for V1', () => {
			equal(encodeCmcd(decodeCmcd('mtp=(15000 6000;a),ot=a') as Cmcd, { version: 1 }), 'mtp=6000,ot=a')
		})

		it('omits an inner-list key when no item matches ot for V1', () => {
			equal(encodeCmcd(decodeCmcd('br=(5000;v 320;a),ot=m') as Cmcd, { version: 1 }), 'ot=m')
			equal(encodeCmcd(decodeCmcd('br=(5000;v 320;a),ot=av') as Cmcd, { version: 1 }), 'ot=av')
			equal(encodeCmcd(decodeCmcd('br=(5000;v 320;a),sid="s"') as Cmcd, { version: 1 }), 'sid="s"')
		})

		it('unwraps inner lists with parameters to plain scalars for V1', () => {
			const input = decodeCmcd('bl=(2100 3200);p=2,br=(3000 6000);p=2,mtp=(25400 1200);p=1,tb=(6000 128);x') as Cmcd
			equal(encodeCmcd(input, { version: 1 }), 'bl=2100,br=3000,mtp=25400,tb=6000')
		})

		it('matches the object type flag of an item in an inner list with parameters for V1', () => {
			const input = {
				br: new SfItem([toCmcdValue(3000, { a: true }), toCmcdValue(6000, { v: true })], { p: 2 }),
				ot: new SfToken('v'),
			} as unknown as Cmcd
			equal(encodeCmcd(input, { version: 1 }), 'br=6000,ot=v')
		})

		it('preserves plain nor string in V1', () => {
			const input = { nor: ['../testing/3.m4v'] }
			equal(encodeCmcd(input, { version: 1 }), 'nor="..%2Ftesting%2F3.m4v"')
		})

		it('extracts nrr from the first item of a nor inner list with parameters for V1', () => {
			const input = decodeCmcd('nor=("../testing/3.m4v";r="0-99" "../testing/4.m4v");x') as Cmcd
			equal(encodeCmcd(input, { version: 1 }), 'nor="..%2Ftesting%2F3.m4v",nrr="0-99"')
		})
	})

	describe('nor', () => {
		it('returns encoded string for request mode with nor string', () => {
			const input = {
				nor: ['1.mp4'],
			}
			equal(encodeCmcd(input), 'nor=("1.mp4"),v=2')
		})

		it('returns encoded inner list for request mode with nor list of strings', () => {
			const input = {
				nor: [
					'1.mp4',
					'2.mp4',
				],
			}
			equal(encodeCmcd(input), 'nor=("1.mp4" "2.mp4"),v=2')
		})

		it('returns encoded inner list for request mode with nor list of CmcdItem', () => {
			const input = {
				nor: [
					toCmcdValue('1.mp4', { r: '0-100' }),
					toCmcdValue('2.mp4', { r: '101-200' }),
				],
			}
			equal(encodeCmcd(input), 'nor=("1.mp4";r="0-100" "2.mp4";r="101-200"),v=2')
		})
	})

	describe('CmcdObjectTypeList', () => {
		it.todo('returns encoded inner list with object type parameters', () => {
			const input = {
				br: [
					toCmcdValue(5000, { v: true }),
					toCmcdValue(128, { a: true }),
				],
			}
			equal(encodeCmcd(input), 'br=(5000;v 128;a),v=2')
		})

		it.todo('returns encoded inner list for array of plain numbers', () => {
			const input = {
				br: [5000, 128],
			}
			equal(encodeCmcd(input), 'br=(5000 128),v=2')
		})
	})

	describe('token values', () => {
		it('re-tokenizes a token field wrapped in an SfItem', () => {
			const input = { ot: new SfItem('m', { 'com.example-p': 1 }) } as unknown as Cmcd
			equal(encodeCmcd(input), 'ot=m;com.example-p=1,v=2')
		})

		it('keeps response-received keys when e is an SfToken', () => {
			const input = { e: new SfToken('rr'), rc: 200, ts: 1000, url: 'https://example.com/seg.m4s' } as unknown as Cmcd
			equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), 'e=rr,rc=200,ts=1000,url="https://example.com/seg.m4s",v=2')
		})

		it('keeps bg=false on a backgrounded-mode event when e is a Symbol', () => {
			const input = { bg: false, e: Symbol.for('b'), ts: 1000 } as unknown as Cmcd
			equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), 'bg=?0,e=b,ts=1000,v=2')
		})

		it('keeps pr=1 on a playback-rate event when e is an SfToken', () => {
			const input = { e: new SfToken('pr'), pr: 1, ts: 1000 } as unknown as Cmcd
			equal(encodeCmcd(input, { reportingMode: CmcdReportingMode.EVENT }), 'e=pr,pr=1,ts=1000,v=2')
		})

		it('matches the object type flag of an inner-list item by token text in V1 down-conversion', () => {
			const input = {
				br: [toCmcdValue(3000, { a: true }), toCmcdValue(6000, { v: true })],
				ot: new SfToken('v'),
			} as unknown as Cmcd
			equal(encodeCmcd(input, { version: 1 }), 'br=6000,ot=v')
		})
	})

	describe('specification constraints', () => {
		it('omits d for a manifest request', () => {
			equal(encodeCmcd({ ot: 'm', d: 4000, v: 2 }), 'ot=m,v=2')
		})

		it('omits ab when br is sent', () => {
			equal(encodeCmcd({ ab: [5000], br: [3000], v: 2 }), 'br=(3000),v=2')
		})

		it('encodes the aggregate bitrate keys when the exact keys are absent', () => {
			equal(encodeCmcd({ ab: [2500], lab: [200], tab: [3000], v: 2 }), 'ab=(2500),lab=(200),tab=(3000),v=2')
		})
	})
})
