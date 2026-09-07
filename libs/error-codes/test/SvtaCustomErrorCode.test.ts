import { SvtaCustomErrorCode, SvtaErrorCategory } from '@svta/cml-error-codes'
import assert from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaCustomErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaCustomErrorCode.UNKNOWN

		assert(code === 99000)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaCustomErrorCode, SvtaErrorCategory.CUSTOM, 1, 'SVTA_CUSTOM')
	})
})
