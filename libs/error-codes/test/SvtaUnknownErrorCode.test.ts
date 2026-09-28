import { SvtaErrorCategory, SvtaUnknownErrorCode } from '@svta/cml-error-codes'
import assert from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaUnknownErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaUnknownErrorCode.UNKNOWN

		assert(code === 999)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaUnknownErrorCode, SvtaErrorCategory.UNKNOWN, 1, 'SVTA_UNKNOWN')
	})
})
