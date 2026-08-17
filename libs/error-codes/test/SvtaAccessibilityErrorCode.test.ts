import { SvtaAccessibilityErrorCode, SvtaErrorCategory } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaAccessibilityErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaAccessibilityErrorCode.TIMED_TEXT_PARSE_ERROR

		assert(code === 5001)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaAccessibilityErrorCode, SvtaErrorCategory.ACCESSIBILITY, 5, 'SVTA_ACCESSIBILITY')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaAccessibilityErrorCode.UNKNOWN, 5000)
		strictEqual(SvtaAccessibilityErrorCode.AUDIO_DESCRIPTION_EXCEEDS_CONTENT_DURATION, 5004)
	})
})
