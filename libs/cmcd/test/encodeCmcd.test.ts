import type { CmcdEncodeOptions } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdReportingMode, encodeCmcd } from '@svta/cml-cmcd'
import { SfToken } from '@svta/cml-structured-field-values'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { toCmcdValue } from '../src/toCmcdValue.ts'
import { CMCD_INPUT } from './data/CMCD_INPUT.ts'
import { CMCD_STRING_EVENT } from './data/CMCD_STRING_EVENT.ts'
import { CMCD_STRING_REQUEST } from './data/CMCD_STRING_REQUEST.ts'
import { CMCD_STRING_RESPONSE } from './data/CMCD_STRING_RESPONSE.ts'
import { CMCD_STRING_V1 } from './data/CMCD_STRING_V1.ts'

describe('encodeCmcd', () => {
	it('provides a valid example', () => {
		//#region example
		const input = { br: 1000, 'com.example-hello': 'world', ec: ['ERR001', 'ERR002'], su: true }
		const options = { version: 2, reportingMode: CmcdReportingMode.REQUEST }
		equal(encodeCmcd(input, options), 'br=1000,com.example-hello="world",ec=("ERR001" "ERR002"),su,v=2')
		//#endregion example
	})

	it('handles null data object', () => {
		equal(encodeCmcd(null as any), '')
	})

	it('ignore invalid values', () => {
		// @ts-expect-error - This is a test
		equal(encodeCmcd({ mtp: NaN, br: Infinity, nor: '', sid: undefined, cid: null, su: false }), '')
	})

	describe('version 1', () => {
		it('returns encoded v1 string when no version is provided', () => {

			const { v, ...input } = CMCD_INPUT
			equal(encodeCmcd(input), CMCD_STRING_V1)
		})

		it('returns encoded v1 string when encoding options version is set to 1', () => {
			equal(encodeCmcd(CMCD_INPUT, { version: 1 }), CMCD_STRING_V1)
		})
	})

	describe('filtering', () => {
		it('filters keys', () => {
			equal(encodeCmcd({ cid: 'content-id', sid: 'session-id' }, { filter: key => key === 'cid' }), 'cid="content-id"')
		})

		it('doesn\'t filter version key', () => {
			equal(encodeCmcd({ v: 2, cid: 'content-id', sid: 'session-id' }, { filter: key => key === 'cid' }), 'cid="content-id",v=2')
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
			nor: 'http://test.com/base/segments/video/1.mp4',
		}
		const options: CmcdEncodeOptions = {
			baseUrl: 'http://test.com/base/manifest/manifest.mpd',
		}
		equal(encodeCmcd(input, options), 'nor="..%2Fsegments%2Fvideo%2F1.mp4"')

		options.version = 2
		equal(encodeCmcd(input, options), 'nor=("../segments/video/1.mp4"),v=2')
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

	describe('nor', () => {
		it('returns encoded string for request mode with nor string', () => {
			const input = {
				nor: '1.mp4',
			}
			equal(encodeCmcd(input), 'nor="1.mp4"')
		})

		it('returns encoded inner list for request mode with nor list of strings', () => {
			const input = {
				nor: [
					'1.mp4',
					'2.mp4',
				],
			}
			equal(encodeCmcd(input), 'nor=("1.mp4" "2.mp4")')
		})

		it('returns encoded inner list for request mode with nor list of CmcdItem', () => {
			const input = {
				nor: [
					toCmcdValue('1.mp4', { r: '0-100' }),
					toCmcdValue('2.mp4', { r: '101-200' }),
				],
			}
			equal(encodeCmcd(input), 'nor=("1.mp4";r="0-100" "2.mp4";r="101-200")')
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
			equal(encodeCmcd(input), 'br=(5000;v 128;a)')
		})

		it('returns plain number when no object type is specified', () => {
			const input = {
				br: 5000,
			}
			equal(encodeCmcd(input), 'br=5000')
		})

		it.todo('returns encoded inner list for array of plain numbers', () => {
			const input = {
				br: [5000, 128],
			}
			equal(encodeCmcd(input), 'br=(5000 128)')
		})
	})
})
