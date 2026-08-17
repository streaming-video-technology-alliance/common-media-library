import { SvtaAdvertisingErrorCode, vastErrorToSvtaErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('vastErrorToSvtaErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = vastErrorToSvtaErrorCode(301)

		assert(code === 7301)
		//#endregion example
	})

	it('embeds valid VAST error codes into the advertising category', () => {
		strictEqual(vastErrorToSvtaErrorCode(100), SvtaAdvertisingErrorCode.VAST_PARSE_ERROR)
		strictEqual(vastErrorToSvtaErrorCode(301), SvtaAdvertisingErrorCode.WRAPPER_TIMEOUT)
		strictEqual(vastErrorToSvtaErrorCode(999), SvtaAdvertisingErrorCode.EMPTY_VAST_RESPONSE)
	})

	it('returns the unknown advertising code for values outside the VAST range', () => {
		strictEqual(vastErrorToSvtaErrorCode(99), SvtaAdvertisingErrorCode.UNKNOWN)
		strictEqual(vastErrorToSvtaErrorCode(1000), SvtaAdvertisingErrorCode.UNKNOWN)
		strictEqual(vastErrorToSvtaErrorCode(301.5), SvtaAdvertisingErrorCode.UNKNOWN)
		strictEqual(vastErrorToSvtaErrorCode(NaN), SvtaAdvertisingErrorCode.UNKNOWN)
	})
})
