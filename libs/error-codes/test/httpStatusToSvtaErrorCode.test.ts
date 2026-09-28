import { httpStatusToSvtaErrorCode, SvtaNetworkErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('httpStatusToSvtaErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = httpStatusToSvtaErrorCode(404)

		assert(code === 3404)
		//#endregion example
	})

	it('embeds valid HTTP statuses into the network category', () => {
		strictEqual(httpStatusToSvtaErrorCode(100), 3100)
		strictEqual(httpStatusToSvtaErrorCode(500), 3500)
		strictEqual(httpStatusToSvtaErrorCode(599), 3599)
	})

	it('returns the unknown network code for values outside the HTTP range', () => {
		strictEqual(httpStatusToSvtaErrorCode(99), SvtaNetworkErrorCode.UNKNOWN)
		strictEqual(httpStatusToSvtaErrorCode(600), SvtaNetworkErrorCode.UNKNOWN)
		strictEqual(httpStatusToSvtaErrorCode(404.5), SvtaNetworkErrorCode.UNKNOWN)
		strictEqual(httpStatusToSvtaErrorCode(NaN), SvtaNetworkErrorCode.UNKNOWN)
	})
})
