import { SvtaErrorCategory, SvtaRemotePlayErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaRemotePlayErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaRemotePlayErrorCode.RECEIVER_CONNECTION_LOST

		assert(code === 6005)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaRemotePlayErrorCode, SvtaErrorCategory.REMOTE_PLAY, 10, 'SVTA_REMOTE_PLAY')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaRemotePlayErrorCode.UNKNOWN, 6000)
		strictEqual(SvtaRemotePlayErrorCode.SENDER_INITIALIZATION_ERROR, 6001)
		strictEqual(SvtaRemotePlayErrorCode.RECEIVER_PLAYBACK_ERROR, 6009)
	})
})
