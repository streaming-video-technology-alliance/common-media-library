import { equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

import { iso8601DurationToNumber, numberToIso8601Duration } from '@svta/cml-cmaf-ham'

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

	it('extracts time components from a full designator', () => {
		const res = iso8601DurationToNumber('P1DT2H')
		equal(res, 7200)
	})

	it('returns 0 when no components match', () => {
		equal(iso8601DurationToNumber(''), 0)
		equal(iso8601DurationToNumber('P'), 0)
	})

	it('runs in linear time on adversarial input', () => {
		const evil = ','.repeat(50_000)
		const start = performance.now()
		equal(iso8601DurationToNumber(evil), 0)
		ok(performance.now() - start < 500, 'iso8601DurationToNumber took too long')
	})
})

describe('numberToIso8601Duration', () => {
	it('converts 5 to PT5S', () => {
		const res = numberToIso8601Duration(5)
		equal(res, 'PT5S')
	})

	it('converts 65 to PT1M5S', () => {
		const res = numberToIso8601Duration(65)
		equal(res, 'PT1M5S')
	})

	it('converts 444 to PT7M24S', () => {
		const res = numberToIso8601Duration(444)
		equal(res, 'PT7M24S')
	})
})
