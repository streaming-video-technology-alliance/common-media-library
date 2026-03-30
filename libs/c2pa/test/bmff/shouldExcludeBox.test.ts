import { shouldExcludeBox } from '../../src/bmff/shouldExcludeBox.ts'
import { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('shouldExcludeBox', () => {
	// #region example
	it('returns true when box type matches xpath', () => {
		const exclusions = [{ xpath: '/emsg' }]
		const boxData = new Uint8Array(16).fill(0)
		strictEqual(shouldExcludeBox('emsg', boxData, exclusions), true)
	})
	// #endregion example

	it('returns false when no exclusions match', () => {
		const exclusions = [{ xpath: '/moof' }]
		const boxData = new Uint8Array(16).fill(0)
		strictEqual(shouldExcludeBox('emsg', boxData, exclusions), false)
	})

	it('returns false for empty exclusion list', () => {
		strictEqual(shouldExcludeBox('emsg', new Uint8Array(16), []), false)
	})

	it('returns true when xpath is a path prefix matching box type', () => {
		const exclusions = [{ xpath: '/moof/traf' }]
		ok(shouldExcludeBox('moof', new Uint8Array(16), exclusions))
	})

	it('returns false when data constraints do not match', () => {
		const exclusions = [{ xpath: '/uuid', data: [{ offset: 8, value: new Uint8Array([0xaa, 0xbb]) }] }]
		const boxData = new Uint8Array(24).fill(0)
		strictEqual(shouldExcludeBox('uuid', boxData, exclusions), false)
	})

	it('returns true when data constraints match at absolute offset', () => {
		const exclusions = [{ xpath: '/uuid', data: [{ offset: 8, value: new Uint8Array([0xca, 0xfe]) }] }]
		const boxData = new Uint8Array(24).fill(0)
		boxData[8] = 0xca
		boxData[9] = 0xfe
		strictEqual(shouldExcludeBox('uuid', boxData, exclusions), true)
	})
})
