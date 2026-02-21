import { validateCmcd } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateCmcd', () => {
	it('provides a valid example', () => {
		// #region example
		const result = validateCmcd({ br: 3000, bl: 21600, d: 4004, ot: 'v', sid: 'abc' })
		equal(result.valid, true)
		// #endregion example
	})

	it('returns valid for a fully valid v2 payload', () => {
		const result = validateCmcd({ br: [3000], bl: [21600], d: 4004, ot: 'v', v: 2 })
		equal(result.valid, true)
		equal(result.issues.length, 0)
	})

	it('collects mixed errors and warnings', () => {
		const result = validateCmcd({ xyz: 123, bl: 150 })
		equal(result.valid, false)
		equal(result.issues.some(i => i.severity === 'error'), true)
		equal(result.issues.some(i => i.severity === 'warning'), true)
	})

	it('returns valid when only warnings are present', () => {
		const result = validateCmcd({ bl: 150 })
		equal(result.valid, true)
		equal(result.issues.length, 1)
		equal(result.issues[0].severity, 'warning')
	})

	it('infers version from v key', () => {
		// sta is a v2-only key; with v=2 it should be valid
		const result = validateCmcd({ sta: 'p', v: 2 })
		equal(result.valid, true)
	})

	it('uses version override from options', () => {
		// sta is a v2-only key; with explicit version: 2 and v key present it should be valid
		const result = validateCmcd({ v: 2, sta: 'p' }, { version: 2 })
		equal(result.valid, true)
	})

	it('fails for v2-only key when version is 1', () => {
		const result = validateCmcd({ sta: 'p' }, { version: 1 })
		equal(result.valid, false)
	})
})
