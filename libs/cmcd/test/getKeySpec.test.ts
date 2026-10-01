import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_KEY_SPECS } from '../src/CMCD_KEY_SPECS.ts'
import { getKeySpec } from '../src/getKeySpec.ts'

describe('getKeySpec', () => {
	it('returns the row of a reserved key', () => {
		equal(getKeySpec('br'), CMCD_KEY_SPECS['br'])
	})

	it('returns the custom row for a custom key', () => {
		deepEqual(getKeySpec('com.example-x'), { type: 'custom', omitDefault: false, max: 64, v1Max: Infinity })
	})

	it('returns undefined for a key that is neither reserved nor custom', () => {
		equal(getKeySpec('unknown'), undefined)
		equal(getKeySpec('constructor'), undefined)
		equal(getKeySpec('Com.Example-x'), undefined)
	})
})
