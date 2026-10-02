import { fromCmcdUrl } from '@svta/cml-cmcd'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.ts'
import { CMCD_QUERY } from './data/CMCD_QUERY.ts'

describe('fromCmcdUrl', () => {
	it('provides a valid example', () => {
		//#region example
		const query = 'br%3D1000%2Ccom.example-hello%3D%22world%22%2Cec%3D(%22ERR001%22%20%22ERR002%22)%2Csu'
		deepEqual(fromCmcdUrl(query), {
			br: 1000,
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
		})
		//#endregion example
	})

	it('produces CMCD object', () => {
		deepEqual(fromCmcdUrl(CMCD_QUERY), CMCD_OUTPUT)
	})

	it('up-converts v1 data with convertToLatest', () => {
		const url = 'bl%3D2000%2Cbr%3D3000%2Csu'
		deepEqual(fromCmcdUrl(url, { convertToLatest: true }), {
			bl: [2000],
			br: [3000],
			su: true,
		})
	})

	it('decodes a + as a space in a form-encoded value', () => {
		const url = 'com.example-hello%3D%22hello+world%22%2Cec%3D%28%22ERR001%22+%22ERR002%22%29%2Cnor%3D%28%22a.m4s%22+%22b.m4s%22%29'
		deepEqual(fromCmcdUrl(url), {
			'com.example-hello': 'hello world',
			ec: ['ERR001', 'ERR002'],
			nor: ['a.m4s', 'b.m4s'],
		})
	})

	it('decodes a %20 as a space in a percent-encoded value', () => {
		const url = 'com.example-hello%3D%22hello%20world%22%2Cec%3D(%22ERR001%22%20%22ERR002%22)%2Cnor%3D(%22a.m4s%22%20%22b.m4s%22)'
		deepEqual(fromCmcdUrl(url), {
			'com.example-hello': 'hello world',
			ec: ['ERR001', 'ERR002'],
			nor: ['a.m4s', 'b.m4s'],
		})
	})

	it('decodes a %2B as a literal +', () => {
		const url = 'com.example-hello%3D%22a%2Bb%22'
		deepEqual(fromCmcdUrl(url), {
			'com.example-hello': 'a+b',
		})
	})
})
