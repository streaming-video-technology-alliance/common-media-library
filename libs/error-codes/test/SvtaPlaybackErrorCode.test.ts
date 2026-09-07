import { SvtaErrorCategory, SvtaPlaybackErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { assertCatalogInvariants } from './data/assertCatalogInvariants.ts'

describe('SvtaPlaybackErrorCode', () => {
	it('provides a valid example', () => {
		//#region example
		const code = SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN

		assert(code === 2001)
		//#endregion example
	})

	it('satisfies the catalog invariants', () => {
		assertCatalogInvariants(SvtaPlaybackErrorCode, SvtaErrorCategory.PLAYBACK, 42, 'SVTA_PLAYBACK')
	})

	it('matches the spec table', () => {
		strictEqual(SvtaPlaybackErrorCode.UNKNOWN, 2000)
		strictEqual(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN, 2001)
		strictEqual(SvtaPlaybackErrorCode.AUDIO_BUFFER_UNDERRUN, 2002)
		strictEqual(SvtaPlaybackErrorCode.TRACK_LOAD_ERROR, 2020)
		strictEqual(SvtaPlaybackErrorCode.CONTENT_STEERING_MANIFEST_PARSE_ERROR, 2041)
	})
})
