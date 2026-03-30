import { validateC2paManifestBoxSegment } from '@svta/cml-c2pa'
import { strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('validateC2paManifestBoxSegment', () => {
	// #region example
	it('returns isValid=false with errorCodes for empty bytes', async () => {
		const { result, nextManifestId } = await validateC2paManifestBoxSegment(
			new Uint8Array(0),
			null,
		)

		strictEqual(result.isValid, false)
		strictEqual(result.errorCodes.length > 0, true)
		strictEqual(result.manifest, null)
		strictEqual(nextManifestId, null)
	})
	// #endregion example

	it('returns isValid=false for malformed bytes', async () => {
		const { result } = await validateC2paManifestBoxSegment(
			new Uint8Array([0x00, 0x01, 0x02, 0x03]),
			null,
		)

		strictEqual(result.isValid, false)
		strictEqual(result.manifest, null)
	})

	it('preserves lastManifestId in nextManifestId when parsing fails', async () => {
		const { nextManifestId } = await validateC2paManifestBoxSegment(
			new Uint8Array(0),
			'some-id',
		)

		strictEqual(nextManifestId, 'some-id')
	})

	it('includes CONTINUITY_METHOD_INVALID when lastManifestId is set but previousManifestId is missing', async () => {
		const { result } = await validateC2paManifestBoxSegment(
			new Uint8Array(0),
			'previous-manifest-id',
		)

		strictEqual(result.isValid, false)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.invalid'), true)
	})

	it('does not report SEGMENT_INVALID when no hash assertion is present', async () => {
		const { result } = await validateC2paManifestBoxSegment(
			new Uint8Array(0),
			null,
		)

		strictEqual(result.errorCodes.includes('livevideo.segment.invalid'), false)
	})
})
