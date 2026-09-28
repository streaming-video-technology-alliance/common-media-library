import { SvtaContentProtectionErrorCode, SvtaErrorCategory } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaContentProtectionErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaContentProtectionErrorCode.LICENSE_EXPIRED

		assert(code === 4003)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaContentProtectionErrorCode, SvtaErrorCategory.CONTENT_PROTECTION, 22, 'SVTA_CONTENT_PROTECTION')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaContentProtectionErrorCode.UNKNOWN, 4000)
		strictEqual(SvtaContentProtectionErrorCode.CONCURRENT_STREAM_LIMIT_EXCEEDED, 4001)
		strictEqual(SvtaContentProtectionErrorCode.GEO_RESTRICTED, 4009)
		strictEqual(SvtaContentProtectionErrorCode.LICENSE_REQUEST_GENERATION_ERROR, 4021)
	})
})
