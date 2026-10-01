import type { CmcdFormatterOptions } from '@svta/cml-cmcd'
import { CMCD_EVENT_KEYS, CMCD_FORMATTER_MAP, CMCD_KEYS, CMCD_REQUEST_KEYS, CMCD_RESPONSE_KEYS, CMCD_V1_KEYS, CmcdReportingMode } from '@svta/cml-cmcd'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_KEY_SPECS } from '../src/CMCD_KEY_SPECS.ts'
import { CMCD_STATE_EVENT_FIELDS } from '../src/CMCD_STATE_EVENT_FIELDS.ts'

const KEYS = Object.keys(CMCD_KEY_SPECS)

function sorted(keys: readonly string[]): string[] {
	return [...keys].sort()
}

describe('CMCD_KEY_SPECS', () => {
	it('has one row for each key of CMCD_KEYS', () => {
		deepEqual(sorted(KEYS), sorted(CMCD_KEYS))
	})

	it('gives the request keys to both reporting modes', () => {
		const keys = KEYS.filter(key => CMCD_KEY_SPECS[key].mode === undefined && CMCD_KEY_SPECS[key].version !== 1)
		deepEqual(sorted(keys), sorted(CMCD_REQUEST_KEYS))
	})

	it('gives the event keys and the response keys to event mode only', () => {
		const keys = KEYS.filter(key => CMCD_KEY_SPECS[key].mode === 'event')
		deepEqual(sorted(keys), sorted([...CMCD_EVENT_KEYS, ...CMCD_RESPONSE_KEYS]))
	})

	it('gives version 1 the keys of CMCD_V1_KEYS without v', () => {
		const keys = KEYS.filter(key => CMCD_KEY_SPECS[key].version !== 2)
		deepEqual(sorted(keys), sorted(CMCD_V1_KEYS.filter(key => key !== 'v')))
	})

	it('requires the field of each state-change event on that event', () => {
		for (const [event, field] of CMCD_STATE_EVENT_FIELDS) {
			equal(CMCD_KEY_SPECS[field].requiredOn, event, field)
		}
	})

	it('rounds each numeric key like CMCD_FORMATTER_MAP', () => {
		const options: CmcdFormatterOptions = { version: 2, reportingMode: CmcdReportingMode.REQUEST }

		for (const key of KEYS) {
			const spec = CMCD_KEY_SPECS[key]

			if ((spec.type !== 'integer' && spec.type !== 'ot-list') || key === 'v') {
				continue
			}

			ok(CMCD_FORMATTER_MAP[key], `CMCD_FORMATTER_MAP has no formatter for ${key}`)
			equal(CMCD_FORMATTER_MAP[key](1249.6, options), Math.round(1249.6 / spec.round) * spec.round, key)
		}
	})
})
