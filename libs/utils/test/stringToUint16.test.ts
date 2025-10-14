import { stringToUint16 } from '@svta/cml-utils'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('stringToUint16', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = stringToUint16('hello world')

		deepEqual(result, new Uint16Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]))
		//#endregion example
	})

	it('handles special characters', () => {
		const str = '!@#$%^&*()_+{}|:"<>? 😀🚀🌟'

		const result = new Uint16Array([33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, 123, 125, 124, 58, 34, 60, 62, 63, 32, 55357, 56832, 55357, 56960, 55356, 57119])

		deepEqual(stringToUint16(str), result)
	})
})
