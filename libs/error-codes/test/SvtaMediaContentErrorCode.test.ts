import { SvtaErrorCategory, SvtaMediaContentErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaMediaContentErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaMediaContentErrorCode.UNSUPPORTED_VIDEO_FORMAT

		assert(code === 1004)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaMediaContentErrorCode, SvtaErrorCategory.MEDIA_CONTENT, 10, 'SVTA_MEDIA_CONTENT')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaMediaContentErrorCode.UNKNOWN, 1000)
		strictEqual(SvtaMediaContentErrorCode.MEDIA_UNAVAILABLE, 1001)
		strictEqual(SvtaMediaContentErrorCode.MISALIGNED_TRACK_DURATION, 1009)
	})
})
