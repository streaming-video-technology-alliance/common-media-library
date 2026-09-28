import { getSvtaErrorCategory, SvtaAccessibilityErrorCode, SvtaAdvertisingErrorCode, SvtaContentProtectionErrorCode, SvtaCustomErrorCode, SvtaErrorCategory, SvtaMediaContentErrorCode, SvtaNetworkErrorCode, SvtaPlaybackErrorCode, SvtaRemotePlayErrorCode, SvtaUnknownErrorCode } from '@svta/cml-error-codes'
import assert, { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('getSvtaErrorCategory', () => {
	it('provides a valid example', () => {
		//#region example
		const category = getSvtaErrorCategory(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN)

		assert(category === SvtaErrorCategory.PLAYBACK)
		//#endregion example
	})

	it('maps every catalog member to its category', () => {
		const catalogs: [Record<string, number>, number][] = [
			[SvtaUnknownErrorCode, SvtaErrorCategory.UNKNOWN],
			[SvtaMediaContentErrorCode, SvtaErrorCategory.MEDIA_CONTENT],
			[SvtaPlaybackErrorCode, SvtaErrorCategory.PLAYBACK],
			[SvtaNetworkErrorCode, SvtaErrorCategory.NETWORK],
			[SvtaContentProtectionErrorCode, SvtaErrorCategory.CONTENT_PROTECTION],
			[SvtaAccessibilityErrorCode, SvtaErrorCategory.ACCESSIBILITY],
			[SvtaRemotePlayErrorCode, SvtaErrorCategory.REMOTE_PLAY],
			[SvtaAdvertisingErrorCode, SvtaErrorCategory.ADVERTISING],
			[SvtaCustomErrorCode, SvtaErrorCategory.CUSTOM],
		]

		for (const [catalog, category] of catalogs) {
			for (const code of Object.values(catalog)) {
				strictEqual(getSvtaErrorCategory(code), category)
			}
		}
	})

	it('extracts categories from embedded external codes', () => {
		strictEqual(getSvtaErrorCategory(3404), SvtaErrorCategory.NETWORK)
		strictEqual(getSvtaErrorCategory(7301), SvtaErrorCategory.ADVERTISING)
		strictEqual(getSvtaErrorCategory(99123), SvtaErrorCategory.CUSTOM)
	})

	it('returns undefined for unassigned categories', () => {
		strictEqual(getSvtaErrorCategory(8000), undefined)
		strictEqual(getSvtaErrorCategory(98999), undefined)
		strictEqual(getSvtaErrorCategory(100000), undefined)
		strictEqual(getSvtaErrorCategory(-1), undefined)
		strictEqual(getSvtaErrorCategory(2001.5), undefined)
		strictEqual(getSvtaErrorCategory(NaN), undefined)
	})
})
