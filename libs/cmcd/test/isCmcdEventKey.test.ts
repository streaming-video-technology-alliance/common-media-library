import { CMCD_EVENT_KEYS, CMCD_RESPONSE_KEYS, isCmcdEventKey } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('isCmcdEventKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdEventKey('e'), true)
		equal(isCmcdEventKey('cmsdd'), true)
		//#endregion example
	})

	it('Accepts event keys', () => {
		for (const key of CMCD_EVENT_KEYS) {
			equal(isCmcdEventKey(key), true)
		}
	})

	it('Accepts response keys', () => {
		for (const key of CMCD_RESPONSE_KEYS) {
			equal(isCmcdEventKey(key), true)
		}
	})

	it('Accepts custom keys', () => {
		equal(isCmcdEventKey('com.hello.world-foo'), true)
	})

	it('Rejects invalid keys', () => {
		equal(isCmcdEventKey('nrr'), false)
	})
})
