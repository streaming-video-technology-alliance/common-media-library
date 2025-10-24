import { decodeCmsdDynamic } from '@svta/cml-cmsd'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { CMSD_DYNAMIC_LIST } from './data/CMSD_DYNAMIC_LIST.ts'
import { CMSD_DYNAMIC_OBJ } from './data/CMSD_DYNAMIC_OBJ.ts'
import { CMSD_DYNAMIC_SINGLE } from './data/CMSD_DYNAMIC_SINGLE.ts'

describe('decodeCmsdDynamic', () => {
	it('handles null data object', () => {
		// @ts-expect-error - This is a test
		deepEqual(decodeCmsdDynamic(undefined), [])
		// @ts-expect-error - This is a test
		deepEqual(decodeCmsdDynamic(null), [])
	})

	it('handles empty string', () => {
		deepEqual(decodeCmsdDynamic(''), [])
	})

	it('returns encoded string from list', () => {
		deepEqual(decodeCmsdDynamic(CMSD_DYNAMIC_LIST), CMSD_DYNAMIC_OBJ)
	})

	it('returns encoded string from single item', () => {
		deepEqual(decodeCmsdDynamic(CMSD_DYNAMIC_SINGLE), [CMSD_DYNAMIC_OBJ[0]])
	})
})
