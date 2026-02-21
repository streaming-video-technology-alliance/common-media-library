import type { CmcdData, CmcdV1Data } from '@svta/cml-cmcd'
import { isCmcdV1Data } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('isCmcdV1Data', () => {
	it('provides a valid example', () => {
		//#region example
		const v1: CmcdData = { bl: 2000, br: 3000 }
		equal(isCmcdV1Data(v1), true)

		const v2: CmcdData = { v: 2 }
		equal(isCmcdV1Data(v2), false)
		//#endregion example
	})

	it('returns true when v is undefined', () => {
		const data: CmcdData = { sid: 'abc' }
		equal(isCmcdV1Data(data), true)
	})

	it('returns true when v is 1', () => {
		const data: CmcdData = { v: 1, sid: 'abc' }
		equal(isCmcdV1Data(data), true)
	})

	it('returns false when v is 2', () => {
		const data: CmcdData = { v: 2, sid: 'abc' }
		equal(isCmcdV1Data(data), false)
	})

	it('narrows to CmcdV1Data', () => {
		const data: CmcdData = { bl: 2000 }

		if (isCmcdV1Data(data)) {
			const _v1: CmcdV1Data = data
			equal(typeof _v1.bl, 'number')
		}
	})
})
