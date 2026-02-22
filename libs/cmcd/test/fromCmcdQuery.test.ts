import { fromCmcdQuery } from '@svta/cml-cmcd'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.ts'
import { CMCD_QUERY } from './data/CMCD_QUERY.ts'

describe('fromCmcdQuery', () => {
	it('provides a valid example', () => {
		//#region example
		const query = 'CMCD=br%3D1000%2Ccom.example-hello%3D%22world%22%2Cec%3D(%22ERR001%22%20%22ERR002%22)%2Csu'
		deepEqual(fromCmcdQuery(query), {
			br: 1000,
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
		})
		//#endregion example
	})

	it('produces CMCD object', () => {
		deepEqual(fromCmcdQuery(CMCD_QUERY), CMCD_OUTPUT)
	})

	it('up-converts v1 data with convertToLatest', () => {
		const query = 'CMCD=bl%3D2000%2Cbr%3D3000%2Csu'
		deepEqual(fromCmcdQuery(query, { convertToLatest: true }), {
			bl: [2000],
			br: [3000],
			su: true,
		})
	})
})
