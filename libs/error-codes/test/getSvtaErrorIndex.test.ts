import { getSvtaErrorIndex, SvtaNetworkErrorCode, SvtaPlaybackErrorCode, SvtaUnknownErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('getSvtaErrorIndex', () => {
	it('provides a valid example', () => {
		//#region example
		const index = getSvtaErrorIndex(SvtaNetworkErrorCode.RESOURCE_NOT_FOUND)

		assert(index === 4)
		//#endregion example
	})

	it('extracts the index within the category', () => {
		strictEqual(getSvtaErrorIndex(SvtaPlaybackErrorCode.UNKNOWN), 0)
		strictEqual(getSvtaErrorIndex(SvtaUnknownErrorCode.UNKNOWN), 999)
		strictEqual(getSvtaErrorIndex(3404), 404)
		strictEqual(getSvtaErrorIndex(8123), 123)
		strictEqual(getSvtaErrorIndex(99123), 123)
	})

	it('returns undefined for inputs that are not non-negative integers', () => {
		strictEqual(getSvtaErrorIndex(-2001), undefined)
		strictEqual(getSvtaErrorIndex(2001.5), undefined)
		strictEqual(getSvtaErrorIndex(NaN), undefined)
	})
})
