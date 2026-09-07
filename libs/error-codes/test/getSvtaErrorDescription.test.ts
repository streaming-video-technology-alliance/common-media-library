import { getSvtaErrorDescription, SvtaAccessibilityErrorCode, SvtaAdvertisingErrorCode, SvtaContentProtectionErrorCode, SvtaCustomErrorCode, SvtaMediaContentErrorCode, SvtaNetworkErrorCode, SvtaPlaybackErrorCode, SvtaRemotePlayErrorCode, SvtaUnknownErrorCode } from '@svta/cml-error-codes'
import assert, { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('getSvtaErrorDescription', () => {
	it('provides a valid example', () => {
		//#region example
		const description = getSvtaErrorDescription(SvtaPlaybackErrorCode.VIDEO_BUFFER_UNDERRUN)

		assert(description === 'Video buffer underrun')
		//#endregion example
	})

	it('describes every named code', () => {
		const catalogs: Record<string, number>[] = [
			SvtaUnknownErrorCode,
			SvtaMediaContentErrorCode,
			SvtaPlaybackErrorCode,
			SvtaNetworkErrorCode,
			SvtaContentProtectionErrorCode,
			SvtaAccessibilityErrorCode,
			SvtaRemotePlayErrorCode,
			SvtaAdvertisingErrorCode,
			SvtaCustomErrorCode,
		]

		for (const catalog of catalogs) {
			for (const [name, code] of Object.entries(catalog)) {
				ok(typeof getSvtaErrorDescription(code) === 'string', `missing description for ${name} (${code})`)
			}
		}
	})

	it('matches the spec descriptions', () => {
		strictEqual(getSvtaErrorDescription(SvtaUnknownErrorCode.UNKNOWN), 'Unknown error')
		strictEqual(getSvtaErrorDescription(SvtaMediaContentErrorCode.MEDIA_UNAVAILABLE), 'Media unavailable')
		strictEqual(getSvtaErrorDescription(SvtaPlaybackErrorCode.MANIFEST_PARSE_ERROR), 'Unable to parse manifest')
		strictEqual(getSvtaErrorDescription(SvtaNetworkErrorCode.INSUFFICIENT_BANDWIDTH), 'Insufficient bandwidth to support playback of current presentation')
		strictEqual(getSvtaErrorDescription(SvtaContentProtectionErrorCode.GEO_RESTRICTED), 'Access restricted due to unsupported geo')
		strictEqual(getSvtaErrorDescription(SvtaAccessibilityErrorCode.TIMED_TEXT_PARSE_ERROR), 'Unable to parse timed text')
		strictEqual(getSvtaErrorDescription(SvtaRemotePlayErrorCode.SENDER_CONNECTION_ERROR), 'Sender unable to make a connection to the receiver')
		strictEqual(getSvtaErrorDescription(SvtaAdvertisingErrorCode.WRAPPER_LIMIT_REACHED), 'Wrapper limit reached (e.g. too many redirects)')
		strictEqual(getSvtaErrorDescription(SvtaCustomErrorCode.UNKNOWN), 'Unknown custom error')
	})

	it('synthesizes descriptions for embedded HTTP statuses', () => {
		strictEqual(getSvtaErrorDescription(3404), 'Received an HTTP 404 response')
		strictEqual(getSvtaErrorDescription(3100), 'Received an HTTP 100 response')
		strictEqual(getSvtaErrorDescription(3599), 'Received an HTTP 599 response')
		strictEqual(getSvtaErrorDescription(SvtaNetworkErrorCode.RESOURCE_NOT_FOUND), 'Resource not found')
	})

	it('returns undefined for unassigned codes', () => {
		strictEqual(getSvtaErrorDescription(1999), undefined)
		strictEqual(getSvtaErrorDescription(8000), undefined)
		strictEqual(getSvtaErrorDescription(99001), undefined)
		strictEqual(getSvtaErrorDescription(3404.5), undefined)
		strictEqual(getSvtaErrorDescription(NaN), undefined)
	})
})
