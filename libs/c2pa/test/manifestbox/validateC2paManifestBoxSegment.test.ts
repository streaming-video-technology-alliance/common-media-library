import { validateC2paManifestBoxSegment, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { encode } from 'cbor-x/encode'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'

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

describe('validateC2paManifestBoxSegment — BMFF hash assertion offset prefix (§18.6.2)', () => {
	const TEXT_ENCODER = new TextEncoder()

	// JUMBF UUID per ISO 19566-5 (same value as the internal JUMBF_UUID in src/utils.ts)
	const JUMBF_UUID = [
		0xd8, 0xfe, 0xc3, 0xd6, 0x1b, 0x0e, 0x48, 0x3c,
		0x92, 0x97, 0x58, 0x28, 0x87, 0x7e, 0xc4, 0x81,
	] as const

	function concatBytes(...parts: readonly Uint8Array[]): Uint8Array {
		const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0))
		let offset = 0
		for (const part of parts) {
			out.set(part, offset)
			offset += part.length
		}
		return out
	}

	function buildBox(type: string, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
		const box = new Uint8Array(8 + payload.length)
		new DataView(box.buffer).setUint32(0, box.length, false)
		for (let i = 0; i < 4; i++) box[4 + i] = type.charCodeAt(i)
		box.set(payload, 8)
		return box
	}

	function buildJumd(label: string): Uint8Array {
		const labelBytes = TEXT_ENCODER.encode(label)
		const data = new Uint8Array(16 + 1 + labelBytes.length + 1)
		data[16] = 0x03 // toggles: requestable + label present
		data.set(labelBytes, 17)
		return buildBox('jumd', data)
	}

	function buildJumb(label: string, ...content: readonly Uint8Array[]): Uint8Array {
		return buildBox('jumb', concatBytes(buildJumd(label), ...content))
	}

	function buildMediaBoxes(): Uint8Array {
		return concatBytes(
			buildBox('styp', TEXT_ENCODER.encode('msdh')),
			buildBox('moof'),
			buildBox('mdat', TEXT_ENCODER.encode('media payload')),
		)
	}

	// Unsigned manifest-box segment with a `c2pa.hash.bmff.v3` assertion; no signature
	// box, so integrity checks skip signature verification.
	function buildSegment(assertionData: Record<string, unknown>): Uint8Array {
		const bmffAssertion = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encode(assertionData) as Uint8Array))
		const assertionStore = buildJumb('c2pa.assertions', bmffAssertion)
		const claimData = { instanceID: 'urn:uuid:bmff-hash-test-manifest', created_assertions: [] }
		const claim = buildJumb('c2pa.claim', buildBox('cbor', encode(claimData) as Uint8Array))
		const manifestJumb = buildJumb('urn:uuid:bmff-hash-test-manifest', claim, assertionStore)
		const store = buildJumb('c2pa', manifestJumb)

		const purpose = TEXT_ENCODER.encode('manifest')
		const prefix = new Uint8Array(4 + purpose.length + 1 + 8) // fullbox header + purpose\0 + aux offset
		prefix.set(purpose, 4)
		const uuidBox = buildBox('uuid', concatBytes(new Uint8Array(JUMBF_UUID), prefix, store))

		return concatBytes(buildMediaBoxes(), uuidBox)
	}

	// /uuid is excluded, so the flat hash covers only styp + moof + mdat — computable up front.
	async function buildSegmentWithFlatHash(offsetPrefixSize: number): Promise<Uint8Array> {
		const hash = await computeBmffHash(buildMediaBoxes(), { offsetPrefixSize })
		return buildSegment({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })
	}

	it('accepts a flat hash computed with 8-byte box-offset prefixes', async () => {
		const segment = await buildSegmentWithFlatHash(8)

		const { result } = await validateC2paManifestBoxSegment(segment, null)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SEGMENT_INVALID), false)
	})

	it('rejects a flat hash computed without box-offset prefixes', async () => {
		const segment = await buildSegmentWithFlatHash(0)

		const { result } = await validateC2paManifestBoxSegment(segment, null)

		ok(result.errorCodes.includes(LiveVideoStatusCode.SEGMENT_INVALID))
	})

	it('accepts the flat hash of a real signed manifest-box segment', async () => {
		const bytes = new Uint8Array(
			readFileSync(new URL('../fixtures/test-segment.m4s', import.meta.url)),
		)

		const { result } = await validateC2paManifestBoxSegment(bytes, null)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SEGMENT_INVALID), false)
	})
})
