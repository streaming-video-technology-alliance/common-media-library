import { CMCD_REQUEST_KEYS, CMCD_RESPONSE_KEYS, isCmcdResponseReceivedKey } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('isCmcdResponseReceivedKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdResponseReceivedKey('url'), true)
		equal(isCmcdResponseReceivedKey('e'), false)
		//#endregion example
	})

	it('Rejects all request keys', () => {
		for (const key of CMCD_REQUEST_KEYS) {
			equal(isCmcdResponseReceivedKey(key), false)
		}
	})

	it('Accepts all response keys', () => {
		for (const key of CMCD_RESPONSE_KEYS) {
			equal(isCmcdResponseReceivedKey(key), true)
		}
	})

	it('Rejects custom keys', () => {
		equal(isCmcdResponseReceivedKey('com.hello.world-foo'), false)
	})

	it('Rejects invalid keys', () => {
		equal(isCmcdResponseReceivedKey('nrr'), false)
		equal(isCmcdResponseReceivedKey('e'), false)
	})
})