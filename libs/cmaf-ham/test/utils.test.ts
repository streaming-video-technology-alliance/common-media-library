import { equal, ok } from 'node:assert'
import { describe, it } from 'vite-plus/test'

import { iso8601DurationToNumber } from '@svta/cml-cmaf-ham'

describe('iso8601DurationToNumber', () => {
	it('converts PT5S to 5', () => {
		const res = iso8601DurationToNumber('PT5S')
		equal(res, 5)
	})

	it('converts PT1M5S to 65', () => {
		const res = iso8601DurationToNumber('PT1M5S')
		equal(res, 65)
	})

	it('converts PT7M24S to 444', () => {
		const res = iso8601DurationToNumber('PT7M24S')
		equal(res, 444)
	})

	it('converts PT1H2M3S to 3723', () => {
		const res = iso8601DurationToNumber('PT1H2M3S')
		equal(res, 3723)
	})

	it('converts fractional seconds', () => {
		const res = iso8601DurationToNumber('PT1.5S')
		equal(res, 1.5)
	})

	it('converts fractional seconds after minutes', () => {
		const res = iso8601DurationToNumber('PT1M30.5S')
		equal(res, 90.5)
	})

	it('adds the days to the time components', () => {
		const res = iso8601DurationToNumber('P1DT2H')
		equal(res, 93600)
	})

	it('converts a days-only duration', () => {
		const res = iso8601DurationToNumber('P1D')
		equal(res, 86400)
	})

	it('reads the minutes after the T in the long form', () => {
		const res = iso8601DurationToNumber('P0Y0M0DT0H1M30.000S')
		equal(res, 90)
	})

	it('returns 0 when no components match', () => {
		equal(iso8601DurationToNumber(''), 0)
		equal(iso8601DurationToNumber('P'), 0)
		equal(iso8601DurationToNumber('PT'), 0)
	})

	it('returns 0 for a string that is not a duration', () => {
		equal(iso8601DurationToNumber('1H'), 0)
		equal(iso8601DurationToNumber('PT1X'), 0)
		equal(iso8601DurationToNumber('PT1H 2M'), 0)
	})

	it('ignores whitespace around the duration', () => {
		equal(iso8601DurationToNumber(' PT60S '), 60)
		equal(iso8601DurationToNumber('\tPT1M\n'), 60)
	})

	it('runs in linear time on adversarial input', () => {
		const start = performance.now()
		equal(iso8601DurationToNumber(','.repeat(50_000)), 0)
		equal(iso8601DurationToNumber(`P${'1'.repeat(50_000)}`), 0)
		equal(iso8601DurationToNumber(`PT${'1.'.repeat(25_000)}S`), 0)
		ok(performance.now() - start < 500, 'iso8601DurationToNumber took too long')
	})
})
