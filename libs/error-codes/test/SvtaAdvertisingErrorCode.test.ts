import { SvtaAdvertisingErrorCode, SvtaErrorCategory } from '@svta/cml-error-codes'
import assert, { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaAdvertisingErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaAdvertisingErrorCode.AD_BLOCKER_DETECTED

		assert(code === 7001)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaAdvertisingErrorCode, SvtaErrorCategory.ADVERTISING, 34, 'SVTA_ADVERTISING')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaAdvertisingErrorCode.UNKNOWN, 7000)
		strictEqual(SvtaAdvertisingErrorCode.VAST_PARSE_ERROR, 7100)
		strictEqual(SvtaAdvertisingErrorCode.WRAPPER_TIMEOUT, 7301)
		strictEqual(SvtaAdvertisingErrorCode.MEDIA_FILE_DISPLAY_ERROR, 7405)
		strictEqual(SvtaAdvertisingErrorCode.VPAID_ERROR, 7901)
		strictEqual(SvtaAdvertisingErrorCode.EMPTY_VAST_RESPONSE, 7999)
	})

	it('embeds VAST codes at their IAB values with no 404 defined', () => {
		const values: number[] = Object.values(SvtaAdvertisingErrorCode)
		ok(!values.includes(7404))
	})
})
