import { decodeIso8601Duration } from '@svta/cml-iso-8601'
import assert, { equal } from 'node:assert'
import { describe, it } from 'node:test'

const HUGE_NUMBER_STRING = new Array(500).join('7')

describe('decodeIso8601Duration', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = decodeIso8601Duration('PT1H1M1S')

		assert(result === 3661)
		//#endregion example
	})

	it('parses valid durations', () => {
		// No time.
		equal(decodeIso8601Duration('P'), 0)
		equal(decodeIso8601Duration('PT'), 0)

		// Years only. 1 year has 365 or 366 days.
		equal(decodeIso8601Duration('P3Y') < 3 * (60 * 60 * 24 * 366) + 1, true)
		equal(decodeIso8601Duration('P3Y') > 3 * (60 * 60 * 24 * 365) - 1, true)

		// Months only. 1 month has 28 to 31 days.
		equal(decodeIso8601Duration('P2M') < 2 * (60 * 60 * 24 * 31) + 1, true)
		equal(decodeIso8601Duration('P2M') > 2 * (60 * 60 * 24 * 28) - 1, true)

		// Days only.
		equal(decodeIso8601Duration('P7D'), 604800)

		// Hours only.
		equal(decodeIso8601Duration('PT1H'), 3600)

		// Minutes only.
		equal(decodeIso8601Duration('PT1M'), 60)

		// Seconds only (with no fractional part).
		equal(decodeIso8601Duration('PT1S'), 1)

		// Seconds only (with no whole part).
		equal(decodeIso8601Duration('PT0.1S'), 0.1)
		equal(decodeIso8601Duration('PT.1S'), 0.1)

		// Seconds only (with whole part and fractional part).
		equal(decodeIso8601Duration('PT1.1S'), 1.1)

		// Hours, and minutes.
		equal(decodeIso8601Duration('PT1H2M'), 3720)

		// Hours, and seconds.
		equal(decodeIso8601Duration('PT1H2S'), 3602)
		equal(decodeIso8601Duration('PT1H2.2S'), 3602.2)

		// Minutes, and seconds.
		equal(decodeIso8601Duration('PT1M2S'), 62)
		equal(decodeIso8601Duration('PT1M2.2S'), 62.2)

		// Hours, minutes, and seconds.
		equal(decodeIso8601Duration('PT1H2M3S'), 3723)
		equal(decodeIso8601Duration('PT1H2M3.3S'), 3723.3)

		// Days, hours, minutes, and seconds.
		equal(decodeIso8601Duration('P1DT1H2M3S'), 90123)
		equal(decodeIso8601Duration('P1DT1H2M3.3S'), 90123.3)

		// Months, hours, minutes, and seconds.
		equal(decodeIso8601Duration('P1M1DT1H2M3S') < (60 * 60 * 24 * 31) + 90123 + 1, true)
		equal(decodeIso8601Duration('P1M1DT1H2M3S') > (60 * 60 * 24 * 28) + 90123 - 1, true)

		// Years, Months, hours, minutes, and seconds.
		equal(decodeIso8601Duration('P1Y1M1DT1H2M3S') < (60 * 60 * 24 * 366) + (60 * 60 * 24 * 31) + 90123 + 1, true)
		equal(decodeIso8601Duration('P1Y1M1DT1H2M3S') > (60 * 60 * 24 * 365) + (60 * 60 * 24 * 28) + 90123 - 1, true)

		equal(decodeIso8601Duration('PT'), 0)
		equal(decodeIso8601Duration('P'), 0)
		equal(decodeIso8601Duration('-PT3S'), -3)
	})

	it('handles invalid durations', () => {
		equal(decodeIso8601Duration('PT-3S'), NaN)
		equal(decodeIso8601Duration('P1Sasdf'), NaN)
		equal(decodeIso8601Duration('1H2M3S'), NaN)
		equal(decodeIso8601Duration('123'), NaN)
		equal(decodeIso8601Duration('abc'), NaN)
		equal(decodeIso8601Duration(''), NaN)

		equal(decodeIso8601Duration('P' + HUGE_NUMBER_STRING + 'Y'), NaN)
		equal(decodeIso8601Duration('P' + HUGE_NUMBER_STRING + 'M'), NaN)
		equal(decodeIso8601Duration('P' + HUGE_NUMBER_STRING + 'D'), NaN)
		equal(decodeIso8601Duration('PT' + HUGE_NUMBER_STRING + 'H'), NaN)
		equal(decodeIso8601Duration('PT' + HUGE_NUMBER_STRING + 'M'), NaN)
		equal(decodeIso8601Duration('PT' + HUGE_NUMBER_STRING + 'S'), NaN)
	})
})
