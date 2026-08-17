import { SvtaErrorCategory, SvtaNetworkErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaNetworkErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaNetworkErrorCode.RESOURCE_NOT_FOUND

		assert(code === 3004)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaNetworkErrorCode, SvtaErrorCategory.NETWORK, 12, 'SVTA_NETWORK')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaNetworkErrorCode.UNKNOWN, 3000)
		strictEqual(SvtaNetworkErrorCode.NO_NETWORK_CONNECTION, 3001)
		strictEqual(SvtaNetworkErrorCode.MAX_RETRIES_EXCEEDED, 3008)
		strictEqual(SvtaNetworkErrorCode.INSUFFICIENT_BANDWIDTH, 3009)
		strictEqual(SvtaNetworkErrorCode.INVALID_HTTP_CONTENT_TYPE, 3011)
	})
})
