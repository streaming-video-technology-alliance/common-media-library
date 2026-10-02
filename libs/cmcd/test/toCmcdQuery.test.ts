import { CmcdReportingMode, toCmcdQuery, toCmcdValue } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_INPUT } from './data/CMCD_INPUT.ts'
import { CMCD_QUERY } from './data/CMCD_QUERY.ts'

describe('toCmcdQuery', () => {
	it('provides a valid example', () => {
		//#region example
		const data = {
			br: [1000],
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
		}

		const options = {
			version: 2 as const,
			reportingMode: CmcdReportingMode.REQUEST,
		}

		equal(toCmcdQuery(data, options), 'CMCD=br%3D%281000%29%2Ccom.example-hello%3D%22world%22%2Cec%3D%28%22ERR001%22%20%22ERR002%22%29%2Csu%2Cv%3D2')
		//#endregion example
	})

	it('handles null data object', () => {
		equal(toCmcdQuery(null as any), '')
	})

	it('returns encoded query string', () => {
		equal(toCmcdQuery(CMCD_INPUT), CMCD_QUERY)
	})

	it('reproduces the query examples of CTA-5004-B', () => {
		const v = (value: number) => toCmcdValue<number, { v: boolean; }>(value, { v: true })
		const a = (value: number) => toCmcdValue<number, { a: boolean; }>(value, { a: true })
		const options = { version: 2 as const, reportingMode: CmcdReportingMode.REQUEST }

		// CTA-5004-B section 8.1.5, second request
		equal(
			toCmcdQuery({ cid: 'content-id-123', ec: ['DRM_NOT_SUPPORTED', 'PLAYBACK_FAILED'], sid: 'session-id-123', sta: 'f' }, options),
			'CMCD=cid%3D%22content-id-123%22%2Cec%3D%28%22DRM_NOT_SUPPORTED%22%20%22PLAYBACK_FAILED%22%29%2Csid%3D%22session-id-123%22%2Csta%3Df%2Cv%3D2',
		)

		// CTA-5004-B section 8.1.6, second request
		equal(
			toCmcdQuery({ bl: [v(0), a(2000)], bs: true, cid: 'content-id-123', ot: 'v', sid: 'session-id-123', sta: 'r' }, options),
			'CMCD=bl%3D%280%3Bv%202000%3Ba%29%2Cbs%2Ccid%3D%22content-id-123%22%2Cot%3Dv%2Csid%3D%22session-id-123%22%2Csta%3Dr%2Cv%3D2',
		)
	})
})
