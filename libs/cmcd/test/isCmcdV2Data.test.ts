import type { CmcdData, CmcdV2Data } from '@svta/cml-cmcd'
import { isCmcdV2Data } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('isCmcdV2Data', () => {
	it('provides a valid example', () => {
		//#region example
		const v2: CmcdData = { v: 2 }
		equal(isCmcdV2Data(v2), true)

		const v1: CmcdData = { bl: 2000 }
		equal(isCmcdV2Data(v1), false)
		//#endregion example
	})

	it('returns true when v is 2', () => {
		const data: CmcdData = { v: 2, sid: 'abc' }
		equal(isCmcdV2Data(data), true)
	})

	it('returns false when v is undefined', () => {
		const data: CmcdData = { sid: 'abc' }
		equal(isCmcdV2Data(data), false)
	})

	it('returns false when v is 1', () => {
		const data: CmcdData = { v: 1, sid: 'abc' }
		equal(isCmcdV2Data(data), false)
	})

	it('narrows to CmcdV2Data', () => {
		const data: CmcdData = { v: 2, sid: 'abc' }

		if (isCmcdV2Data(data)) {
			const _v2: CmcdV2Data = data
			equal(_v2.v, 2)
		}
	})
})
