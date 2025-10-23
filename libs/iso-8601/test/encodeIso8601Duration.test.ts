import { encodeIso8601Duration } from '@svta/cml-iso-8601'
import assert, { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('encodeIso8601Duration', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = encodeIso8601Duration(3661)

		assert(result === 'PT1H1M1S')
		//#endregion example
	})

	it('encodes valid durations', () => {
		equal(encodeIso8601Duration(0), 'PT0S')
		equal(encodeIso8601Duration(60), 'PT1M0S')
		equal(encodeIso8601Duration(61), 'PT1M1S')
		equal(encodeIso8601Duration(3600), 'PT1H0M0S')
		equal(encodeIso8601Duration(3661), 'PT1H1M1S')
	})

	it('does not encode invalid durations', () => {
		equal(encodeIso8601Duration(NaN), 'PT')
		equal(encodeIso8601Duration(Infinity), 'PT')
	})
})
