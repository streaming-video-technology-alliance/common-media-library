import { validateC2paManifestBoxSegment, C2paStatusCode, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { before, describe, it } from 'node:test'
import { Tag } from 'cbor-x'
import { encodeCbor } from '../cborTestUtils.ts'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { createTestSigner, type TestSigner } from '../testSigner.ts'

const CUSTOM_METHOD = 'com.test.custom'
const PREVIOUS_MANIFEST_ID = 'urn:uuid:live-segment-test-previous'

let signer: TestSigner

before(async () => {
	signer = await createTestSigner()
})

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

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

	it('does not report SEGMENT_INVALID when no manifest parses', async () => {
		const { result } = await validateC2paManifestBoxSegment(
			new Uint8Array(0),
			null,
		)

		strictEqual(result.errorCodes.includes('livevideo.segment.invalid'), false)
	})

	it('does not report CONTINUITY_METHOD_UNSUPPORTED for the spec-defined method', async () => {
		const { result } = await validateC2paManifestBoxSegment(loadFixture('test-segment.m4s'), null)

		strictEqual(result.continuityMethod, 'c2pa.manifestId')
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.unsupported'), false)
	})

	it('fails with CONTINUITY_METHOD_INVALID plus CONTINUITY_METHOD_UNSUPPORTED for an unknown custom method', async () => {
		const bytes = await buildLiveSegment(chainedLiveVideoData(CUSTOM_METHOD), c => signer.sign(c))

		const { result } = await validateC2paManifestBoxSegment(bytes, null)

		strictEqual(result.continuityMethod, CUSTOM_METHOD)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.invalid'), true)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.unsupported'), true)
	})

	it('delegates a custom continuity method to its registered validator', async () => {
		const bytes = await buildLiveSegment(chainedLiveVideoData(CUSTOM_METHOD), c => signer.sign(c))
		let receivedAssertion: Record<string, unknown> = {}
		let receivedManifest: unknown = null

		const { result } = await validateC2paManifestBoxSegment(bytes, 'previous-id', undefined, {
			continuityValidator: {
				method: CUSTOM_METHOD,
				validate: (liveVideoAssertion, manifest) => {
					receivedAssertion = liveVideoAssertion as Record<string, unknown>
					receivedManifest = manifest
					return true
				},
			},
		})

		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.invalid'), false)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.unsupported'), false)
		strictEqual(result.errorCodes.includes('livevideo.segment.invalid'), false)
		strictEqual(receivedAssertion['continuityMethod'], CUSTOM_METHOD)
		strictEqual(typeof receivedAssertion['sequenceNumber'], 'number')
		strictEqual(receivedManifest !== null && typeof receivedManifest === 'object', true)
	})

	it('reports SEGMENT_INVALID when the custom continuity validator returns false', async () => {
		const bytes = await buildLiveSegment(chainedLiveVideoData(CUSTOM_METHOD), c => signer.sign(c))

		const { result } = await validateC2paManifestBoxSegment(bytes, null, undefined, {
			continuityValidator: { method: CUSTOM_METHOD, validate: () => false },
		})

		strictEqual(result.errorCodes.includes('livevideo.segment.invalid'), true)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.invalid'), false)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.unsupported'), false)
	})

	it('awaits an async custom continuity validator', async () => {
		const bytes = await buildLiveSegment(chainedLiveVideoData(CUSTOM_METHOD), c => signer.sign(c))

		const { result } = await validateC2paManifestBoxSegment(bytes, null, undefined, {
			continuityValidator: {
				method: CUSTOM_METHOD,
				validate: async liveVideoAssertion => liveVideoAssertion['sequenceNumber'] === 1,
			},
		})

		strictEqual(result.errorCodes.includes('livevideo.segment.invalid'), false)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.invalid'), false)
	})

	it('does not invoke a validator registered for a different method', async () => {
		const bytes = await buildLiveSegment(chainedLiveVideoData(CUSTOM_METHOD), c => signer.sign(c))
		let called = false

		const { result } = await validateC2paManifestBoxSegment(bytes, null, undefined, {
			continuityValidator: {
				method: 'com.other.method',
				validate: () => {
					called = true
					return true
				},
			},
		})

		strictEqual(called, false)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.invalid'), true)
		strictEqual(result.errorCodes.includes('livevideo.continuityMethod.unsupported'), true)
	})

	it('treats a throwing custom continuity validator as SEGMENT_INVALID', async () => {
		const bytes = await buildLiveSegment(chainedLiveVideoData(CUSTOM_METHOD), c => signer.sign(c))

		const { result } = await validateC2paManifestBoxSegment(bytes, null, undefined, {
			continuityValidator: {
				method: CUSTOM_METHOD,
				validate: () => {
					throw new Error('boom')
				},
			},
		})

		strictEqual(result.errorCodes.includes('livevideo.segment.invalid'), true)
	})

	it('does not invoke the custom validator for the c2pa.manifestId method', async () => {
		let called = false

		const { result } = await validateC2paManifestBoxSegment(
			loadFixture('test-segment.m4s'),
			null,
			undefined,
			{
				continuityValidator: {
					method: 'c2pa.manifestId',
					validate: () => {
						called = true
						return true
					},
				},
			},
		)

		strictEqual(called, false)
		strictEqual(result.continuityMethod, 'c2pa.manifestId')
	})
})


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

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>))
}

// A claim `created_assertions` entry that declares an assertion box by the hash of its
// JUMBF payload, so the box reaches the validator's claim-verified assertion set.
async function claimRef(label: string, assertionBox: Uint8Array): Promise<Record<string, unknown>> {
	return { url: `self#jumbf=c2pa.assertions/${label}`, hash: await sha256(assertionBox.subarray(8)), alg: 'sha256' }
}

// The claim `signature` field: the absolute URI of the signature box, which names the manifest label.
function signatureUri(manifestLabel: string): string {
	return `self#jumbf=/c2pa/${manifestLabel}/c2pa.signature`
}

// Wraps a manifest store in the C2PA `uuid` box and appends it to the media boxes.
function buildManifestBoxSegment(manifestLabel: string, ...manifestContent: readonly Uint8Array[]): Uint8Array {
	const manifestJumb = buildJumb(manifestLabel, ...manifestContent)
	const store = buildJumb('c2pa', manifestJumb)

	const purpose = TEXT_ENCODER.encode('manifest')
	const prefix = new Uint8Array(4 + purpose.length + 1 + 8) // fullbox header + purpose\0 + aux offset
	prefix.set(purpose, 4)
	const uuidBox = buildBox('uuid', concatBytes(new Uint8Array(JUMBF_UUID), prefix, store))

	return concatBytes(buildMediaBoxes(), uuidBox)
}

// Segment carrying a live-video assertion and a matching flat hash, so that the only remaining
// verdict inputs are the claim and its signature. Both assertions are declared in the claim so they
// reach the validator's claim-verified assertion set. `sign` returns the `c2pa.signature` box
// content; omit it for an unsigned segment. `claimOverride` replaces the content of the claim box,
// for a claim that does not decode or is not a map.
async function buildLiveSegment(
	liveVideoData: Record<string, unknown>,
	sign?: (claimCborBytes: Uint8Array) => Promise<Uint8Array>,
	claimOverride?: Uint8Array,
): Promise<Uint8Array> {
	const hash = await computeBmffHash(buildMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
	const liveVideoAssertion = buildJumb('c2pa.livevideo.segment', buildBox('cbor', encodeCbor(liveVideoData)))
	const bmffAssertion = buildJumb(
		'c2pa.hash.bmff.v3',
		buildBox('cbor', encodeCbor({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })),
	)
	const assertionStore = buildJumb('c2pa.assertions', liveVideoAssertion, bmffAssertion)
	const claimCborBytes = claimOverride ?? encodeCbor({
		instanceID: 'urn:uuid:live-segment-test-manifest',
		signature: signatureUri('urn:uuid:live-segment-test-manifest'),
		created_assertions: [await claimRef('c2pa.livevideo.segment', liveVideoAssertion), await claimRef('c2pa.hash.bmff.v3', bmffAssertion)],
	})
	const claim = buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes))
	const manifestContent = [claim, assertionStore]
	if (sign) manifestContent.push(buildJumb('c2pa.signature', buildBox('cbor', await sign(claimCborBytes))))
	return buildManifestBoxSegment('urn:uuid:live-segment-test-manifest', ...manifestContent)
}

function chainedLiveVideoData(continuityMethod: string): Record<string, unknown> {
	return { sequenceNumber: 1, previousManifestId: PREVIOUS_MANIFEST_ID, streamId: 'stream-1', continuityMethod }
}

describe('validateC2paManifestBoxSegment — BMFF hash assertion offset prefix (§18.6.2)', () => {
	// Unsigned manifest-box segment with a `c2pa.hash.bmff.v3` assertion. It has no signature
	// box, so validation also reports CLAIM_SIGNATURE_MISSING; these tests assert on
	// SEGMENT_INVALID only.
	async function buildSegment(assertionData: Record<string, unknown>): Promise<Uint8Array> {
		const bmffAssertion = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encodeCbor(assertionData)))
		const assertionStore = buildJumb('c2pa.assertions', bmffAssertion)
		const claimData = { instanceID: 'urn:uuid:bmff-hash-test-manifest', signature: signatureUri('urn:uuid:bmff-hash-test-manifest'), created_assertions: [await claimRef('c2pa.hash.bmff.v3', bmffAssertion)] }
		const claim = buildJumb('c2pa.claim', buildBox('cbor', encodeCbor(claimData)))
		return buildManifestBoxSegment('urn:uuid:bmff-hash-test-manifest', claim, assertionStore)
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

	it('rejects a hash that is a text string with ASSERTION_BMFFHASH_MALFORMED', async () => {
		const segment = await buildSegment({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash: 'not a byte string' })

		const { result } = await validateC2paManifestBoxSegment(segment, null)

		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
		strictEqual(result.bmffHashHex, null)
	})

	it('rejects a hash with CBOR tag 64 with ASSERTION_BMFFHASH_MALFORMED', async () => {
		const hash = await computeBmffHash(buildMediaBoxes(), { offsetPrefixSize: 8 })
		const segment = await buildSegment({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash: new Tag(hash, 64) })

		const { result } = await validateC2paManifestBoxSegment(segment, null)

		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
		strictEqual(result.bmffHashHex, null)
	})

	it('rejects a hash that is a CBOR array of integers with ASSERTION_BMFFHASH_MALFORMED', async () => {
		const hash = await computeBmffHash(buildMediaBoxes(), { offsetPrefixSize: 8 })
		const segment = await buildSegment({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash: Array.from(hash) })

		const { result } = await validateC2paManifestBoxSegment(segment, null)

		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
		strictEqual(result.bmffHashHex, null)
	})

	it('accepts the flat hash of a real signed manifest-box segment', async () => {
		const bytes = new Uint8Array(
			readFileSync(new URL('../fixtures/test-segment.m4s', import.meta.url)),
		)

		const { result } = await validateC2paManifestBoxSegment(bytes, null)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SEGMENT_INVALID), false)
	})
})

describe('validateC2paManifestBoxSegment — claim signature', () => {
	it('validates a signed segment end to end with the built-in c2pa.manifestId method', async () => {
		const segment = await buildLiveSegment(chainedLiveVideoData('c2pa.manifestId'), claim => signer.sign(claim))

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, true)
		deepStrictEqual(result.errorCodes, [])
		strictEqual(result.issuer, signer.issuer)
		deepStrictEqual(result.certificate, signer.certificateDER)
	})

	function payloadOffsetOf(bytes: Uint8Array, boxType: string): number {
		const code = Array.from(boxType, c => c.charCodeAt(0))
		for (let i = 4; i + 4 <= bytes.length; i++) {
			if (code.every((byte, j) => bytes[i + j] === byte)) return i + 4
		}
		throw new Error(`no ${boxType} box`)
	}

	it('rejects an exclusion constraint that is not a byte string, also after the constrained byte changed', async () => {
		const media = buildMediaBoxes()
		const constrainedOffset = payloadOffsetOf(media, 'mdat')
		// The hash excludes mdat only while its first payload byte keeps the value of the constraint.
		const constraint = { offset: 8, value: Uint8Array.of(media[constrainedOffset]) }
		const hash = await computeBmffHash(media, { exclusions: [{ xpath: '/uuid' }, { xpath: '/mdat', data: [constraint] }], offsetPrefixSize: 8 })
		// The assertion encodes the constraint value as a CBOR array of integers instead of a byte string.
		const assertionData = { exclusions: [{ xpath: '/uuid' }, { xpath: '/mdat', data: [{ offset: 8, value: Array.from(constraint.value) }] }], alg: 'sha256', hash }
		const liveVideoBox = buildJumb('c2pa.livevideo.segment', buildBox('cbor', encodeCbor(chainedLiveVideoData('c2pa.manifestId'))))
		const bmffBox = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encodeCbor(assertionData)))
		const claimCborBytes = encodeCbor({
			instanceID: 'urn:uuid:live-segment-test-manifest',
			signature: signatureUri('urn:uuid:live-segment-test-manifest'),
			created_assertions: [await claimRef('c2pa.livevideo.segment', liveVideoBox), await claimRef('c2pa.hash.bmff.v3', bmffBox)],
		})
		const segment = buildManifestBoxSegment('urn:uuid:live-segment-test-manifest',
			buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes)),
			buildJumb('c2pa.assertions', liveVideoBox, bmffBox),
			buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimCborBytes))),
		)
		segment[constrainedOffset] ^= 0xff

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
	})

	// A claim that references an assertion the segment does not have. Only a decoded claim can report that.
	const CLAIM_WITH_MISSING_ASSERTION = {
		instanceID: 'urn:uuid:live-segment-test-manifest',
		signature: signatureUri('urn:uuid:live-segment-test-manifest'),
		created_assertions: [{ url: 'self#jumbf=c2pa.assertions/c2pa.session-keys', hash: new Uint8Array(32), alg: 'sha256' }],
	}

	// Each claim box holds CBOR that is not a map of claim fields (C2PA section 15.6.2)
	const INVALID_CLAIMS: readonly (readonly [string, Uint8Array, 'CLAIM_MALFORMED' | 'CLAIM_CBOR_INVALID'])[] = [
		['a map in CBOR tag 55799', encodeCbor(new Tag(CLAIM_WITH_MISSING_ASSERTION, 55799)), 'CLAIM_MALFORMED'],
		['CBOR that does not decode', Uint8Array.of(0xa1), 'CLAIM_CBOR_INVALID'],
	]

	for (const [description, claimCborBytes, codeName] of INVALID_CLAIMS) {
		it(`fails with ${codeName} if the signed claim box holds ${description}`, async () => {
			const segment = await buildLiveSegment(chainedLiveVideoData('c2pa.manifestId'), claim => signer.sign(claim), claimCborBytes)

			const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

			// A claim that does not decode references no assertions, so the live-video assertion
			// is unverified and the result also carries the live-video codes. The assertion checks
			// that need a decodable claim stay silent.
			ok(result.errorCodes.includes(C2paStatusCode[codeName]))
			strictEqual(result.errorCodes.includes(C2paStatusCode.ASSERTION_MISSING), false)
			strictEqual(result.errorCodes.includes(C2paStatusCode.ASSERTION_UNDECLARED), false)
			strictEqual(result.isValid, false)
		})
	}

	it('accepts a sequenceNumber of 2^32 after the sequenceNumber 2^32 - 1 (§19.3.2.1)', async () => {
		// A BigInt encodes as a CBOR unsigned integer of 8 bytes, which decodes to a number up to 2^53 - 1.
		const liveVideoData = { ...chainedLiveVideoData('c2pa.manifestId'), sequenceNumber: BigInt(2 ** 32) }
		const segment = await buildLiveSegment(liveVideoData, claim => signer.sign(claim))

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID, { lastStreamId: 'stream-1', lastSequenceNumber: 2 ** 32 - 1 })

		strictEqual(result.sequenceNumber, 2 ** 32)
		strictEqual(result.isValid, true)
		deepStrictEqual(result.errorCodes, [])
	})

	// §19.3.2.1: sequenceNumber is a uint. The library supports values up to 2^53 - 1.
	const NONCONFORMING_SEQUENCE_NUMBERS: readonly (readonly [string, unknown])[] = [
		['a fraction', 3.5],
		['a BigInt above 2^53 - 1', BigInt(2 ** 53)],
	]

	for (const [description, sequenceNumber] of NONCONFORMING_SEQUENCE_NUMBERS) {
		it(`fails with ASSERTION_INVALID if the sequenceNumber is ${description} (§19.3.2.1)`, async () => {
			const liveVideoData = { ...chainedLiveVideoData('c2pa.manifestId'), sequenceNumber }
			const segment = await buildLiveSegment(liveVideoData, claim => signer.sign(claim))

			const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID, { lastStreamId: 'stream-1', lastSequenceNumber: 3 })

			strictEqual(result.sequenceNumber, null)
			deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.ASSERTION_INVALID])
			strictEqual(result.isValid, false)
		})
	}

	it('validates a signed segment end to end with a custom continuity method', async () => {
		const method = 'com.test.happy-path'
		const segment = await buildLiveSegment(chainedLiveVideoData(method), claim => signer.sign(claim))

		// lastManifestId is irrelevant here: the manifestId chain check only
		// applies to the built-in c2pa.manifestId method.
		const { result } = await validateC2paManifestBoxSegment(segment, null, undefined, {
			continuityValidator: { method, validate: () => true },
		})

		strictEqual(result.isValid, true)
		deepStrictEqual(result.errorCodes, [])
	})

	it('rejects an unsigned segment with CLAIM_SIGNATURE_MISSING', async () => {
		const segment = await buildLiveSegment(chainedLiveVideoData('c2pa.manifestId'))

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING))
		strictEqual(result.issuer, null)
		strictEqual(result.certificate, null)
	})

	it('rejects a signature that carries no certificate with CLAIM_SIGNATURE_MISMATCH', async () => {
		// COSE_Sign1 with an empty protected header, so there is no x5chain to verify against
		const noCertificate = new Uint8Array([0xd2, 0x84, 0x40, 0xa0, 0x40, 0x40])
		const segment = await buildLiveSegment(chainedLiveVideoData('c2pa.manifestId'), async () => noCertificate)

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH))
		strictEqual(result.certificate, null)
	})

	it('exposes the certificate of a signature that does not verify over the claim', async () => {
		const otherClaim = new Uint8Array([0xa1, 0x61, 0x61, 0x01])
		const segment = await buildLiveSegment(chainedLiveVideoData('c2pa.manifestId'), () => signer.sign(otherClaim))

		const { result } = await validateC2paManifestBoxSegment(segment, PREVIOUS_MANIFEST_ID)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISMATCH))
		deepStrictEqual(result.certificate, signer.certificateDER)
	})
})


// --- Replay protection: manifest ID and sequence state advance only from authentic forward-moving segments ---

describe('validateC2paManifestBoxSegment — state advances only from authentic forward-moving segments', () => {
	const INITIAL_MANIFEST_ID = 'urn:uuid:manifestbox-replay-initial'
	const MANIFEST_ID_1 = 'urn:uuid:manifestbox-replay-1'
	const MANIFEST_ID_2 = 'urn:uuid:manifestbox-replay-2'
	const MANIFEST_ID_3 = 'urn:uuid:manifestbox-replay-3'
	const MANIFEST_ID_4 = 'urn:uuid:manifestbox-replay-4'
	const MANIFEST_ID_5 = 'urn:uuid:manifestbox-replay-5'
	const FORGED_MANIFEST_ID = 'urn:uuid:manifestbox-replay-forged'
	const STREAM_ID = 'stream-replay'
	const HIGH_SEQUENCE_NUMBER = 2 ** 40
	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	type ChainedSegmentFields = {
		/** The JUMBF label of the manifest. */
		readonly manifestId: string
		/** Replaces the claim instanceID, which by default differs from `manifestId`. */
		readonly instanceId?: unknown
		readonly sequenceNumber: number
		readonly previousManifestId: string
		readonly streamId?: string
		/** Replaces the computed content hash of the `c2pa.hash.bmff.v3` assertion. */
		readonly bmffHash?: unknown
		/** Leaves the `c2pa.livevideo.segment` assertion out of the store and out of the claim. */
		readonly omitLiveVideo?: boolean
	}

	// A claim `created_assertions` entry for an assertion box. The hash covers the box content after its 8-byte header.
	async function declaredAssertion(label: string, assertionBox: Uint8Array): Promise<Record<string, unknown>> {
		const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', assertionBox.subarray(8) as Uint8Array<ArrayBuffer>))
		return { url: `self#jumbf=c2pa.assertions/${label}`, hash, alg: 'sha256' }
	}

	// A manifest-box segment with a chained c2pa.livevideo.segment assertion and a flat hash. The claim
	// declares every assertion in the store. Omit `sign` for an unsigned segment. The JUMBF label
	// `manifestId` is the manifest identifier, which the validator returns as nextManifestId. The claim
	// instanceID differs from it, so a validator that chains on the instanceID fails these tests.
	async function buildChainedSegment(
		fields: ChainedSegmentFields,
		sign?: (claimCborBytes: Uint8Array) => Promise<Uint8Array>,
	): Promise<Uint8Array> {
		const hash = fields.bmffHash ?? await computeBmffHash(buildMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const liveVideoData = {
			sequenceNumber: fields.sequenceNumber,
			previousManifestId: fields.previousManifestId,
			streamId: fields.streamId ?? STREAM_ID,
			continuityMethod: 'c2pa.manifestId',
		}
		const bmffAssertion = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encodeCbor({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })))
		const assertions = [bmffAssertion]
		const declaredAssertions = [await declaredAssertion('c2pa.hash.bmff.v3', bmffAssertion)]
		if (!fields.omitLiveVideo) {
			const liveVideoAssertion = buildJumb('c2pa.livevideo.segment', buildBox('cbor', encodeCbor(liveVideoData)))
			assertions.unshift(liveVideoAssertion)
			declaredAssertions.unshift(await declaredAssertion('c2pa.livevideo.segment', liveVideoAssertion))
		}
		const assertionStore = buildJumb('c2pa.assertions', ...assertions)
		const instanceID = 'instanceId' in fields ? fields.instanceId : `xmp.iid:${fields.manifestId}`
		const claimCborBytes = encodeCbor({ instanceID, signature: signatureUri(fields.manifestId), created_assertions: declaredAssertions })
		const claim = buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes))
		const manifestContent = [claim, assertionStore]
		if (sign) manifestContent.push(buildJumb('c2pa.signature', buildBox('cbor', await sign(claimCborBytes))))
		return buildManifestBoxSegment(fields.manifestId, ...manifestContent)
	}

	function signed(fields: ChainedSegmentFields): Promise<Uint8Array> {
		return buildChainedSegment(fields, claim => signer.sign(claim))
	}

	// Flips the first payload byte of the mdat box, which the flat hash covers.
	function tamperMedia(segment: Uint8Array): Uint8Array {
		const tampered = new Uint8Array(segment)
		const mdat = Array.from('mdat', c => c.charCodeAt(0))
		for (let i = 4; i + 4 <= tampered.length; i++) {
			if (mdat.every((byte, j) => tampered[i + j] === byte)) {
				tampered[i + 4] ^= 0xff
				return tampered
			}
		}
		throw new Error('no mdat box')
	}

	// Validates one signed segment at sequence number 5 as the first segment and returns its result.
	async function firstSegmentAtFive() {
		const r = await validateC2paManifestBoxSegment(await signed({ manifestId: MANIFEST_ID_1, sequenceNumber: 5, previousManifestId: INITIAL_MANIFEST_ID }), null)
		strictEqual(r.result.isValid, true)
		return r
	}

	it('rejects a replayed segment instead of rewinding state on a failed segment', async () => {
		const s1 = await signed({ manifestId: MANIFEST_ID_1, sequenceNumber: 1, previousManifestId: INITIAL_MANIFEST_ID })
		const s2 = await signed({ manifestId: MANIFEST_ID_2, sequenceNumber: 2, previousManifestId: MANIFEST_ID_1 })
		const s3 = await signed({ manifestId: MANIFEST_ID_3, sequenceNumber: 3, previousManifestId: MANIFEST_ID_2 })

		// Normal forward playback advances the state.
		const r1 = await validateC2paManifestBoxSegment(s1, null)
		strictEqual(r1.result.isValid, true)
		const r2 = await validateC2paManifestBoxSegment(s2, r1.nextManifestId, r1.nextState)
		strictEqual(r2.result.isValid, true)
		const r3 = await validateC2paManifestBoxSegment(s3, r2.nextManifestId, r2.nextState)
		strictEqual(r3.result.isValid, true)

		// A failed replay of s2 must not rewind lastManifestId or lastSequenceNumber.
		const replay2 = await validateC2paManifestBoxSegment(s2, r3.nextManifestId, r3.nextState)
		strictEqual(replay2.result.isValid, false)
		strictEqual(replay2.nextManifestId, MANIFEST_ID_3)
		deepStrictEqual(replay2.nextState, r3.nextState)

		// Replaying s3 against the state the failed replay produced must still fail. An equal sequence number is not forward.
		const replay3 = await validateC2paManifestBoxSegment(s3, replay2.nextManifestId, replay2.nextState)
		strictEqual(replay3.result.isValid, false)
		deepStrictEqual(replay3.result.errorCodes, [LiveVideoStatusCode.ASSERTION_INVALID, LiveVideoStatusCode.SEGMENT_INVALID])
	})

	it('does not advance for an unsigned segment with a lower sequence number', async () => {
		const r5 = await firstSegmentAtFive()
		const rewind = await buildChainedSegment({ manifestId: INITIAL_MANIFEST_ID, sequenceNumber: 1, previousManifestId: INITIAL_MANIFEST_ID })

		const rR = await validateC2paManifestBoxSegment(rewind, r5.nextManifestId, r5.nextState)

		strictEqual(rR.result.isValid, false)
		strictEqual(rR.nextManifestId, r5.nextManifestId)
		deepStrictEqual(rR.nextState, r5.nextState)
	})

	it('does not advance for an unsigned segment with a higher sequence number', async () => {
		const r5 = await firstSegmentAtFive()
		const forged = await buildChainedSegment({ manifestId: FORGED_MANIFEST_ID, sequenceNumber: HIGH_SEQUENCE_NUMBER, previousManifestId: MANIFEST_ID_1 })

		const rF = await validateC2paManifestBoxSegment(forged, r5.nextManifestId, r5.nextState)

		ok(rF.result.errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING))
		strictEqual(rF.nextManifestId, r5.nextManifestId)
		deepStrictEqual(rF.nextState, r5.nextState)
	})

	it('does not advance for a signed segment whose media was tampered', async () => {
		const r5 = await firstSegmentAtFive()
		const tampered = tamperMedia(await signed({ manifestId: MANIFEST_ID_2, sequenceNumber: 6, previousManifestId: MANIFEST_ID_1 }))

		const rT = await validateC2paManifestBoxSegment(tampered, r5.nextManifestId, r5.nextState)

		deepStrictEqual(rT.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		strictEqual(rT.nextManifestId, r5.nextManifestId)
		deepStrictEqual(rT.nextState, r5.nextState)
	})

	it('does not advance for a signed segment with a malformed content hash', async () => {
		const r5 = await firstSegmentAtFive()
		const malformed = await signed({ manifestId: MANIFEST_ID_2, sequenceNumber: 6, previousManifestId: MANIFEST_ID_1, bmffHash: 'not a byte string' })

		const rM = await validateC2paManifestBoxSegment(malformed, r5.nextManifestId, r5.nextState)

		ok(rM.result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
		strictEqual(rM.nextManifestId, r5.nextManifestId)
		deepStrictEqual(rM.nextState, r5.nextState)
	})

	it('does not advance for an authentic segment on another stream', async () => {
		const r5 = await firstSegmentAtFive()
		const other = await signed({ manifestId: MANIFEST_ID_2, sequenceNumber: 6, previousManifestId: MANIFEST_ID_1, streamId: 'stream-other' })

		const rO = await validateC2paManifestBoxSegment(other, r5.nextManifestId, r5.nextState)

		deepStrictEqual(rO.result.errorCodes, [LiveVideoStatusCode.ASSERTION_INVALID])
		strictEqual(rO.nextManifestId, r5.nextManifestId)
		deepStrictEqual(rO.nextState, r5.nextState)
	})

	it('does not update the state for a signed segment without a live video assertion', async () => {
		const segment = await signed({ manifestId: MANIFEST_ID_1, sequenceNumber: 1, previousManifestId: INITIAL_MANIFEST_ID, omitLiveVideo: true })

		const r = await validateC2paManifestBoxSegment(segment, null)

		strictEqual(r.result.isValid, false)
		strictEqual(r.nextManifestId, null)
		deepStrictEqual(r.nextState, {})
	})

	it('recovers after a missing segment through an authentic forward-moving segment', async () => {
		const s1 = await signed({ manifestId: MANIFEST_ID_1, sequenceNumber: 1, previousManifestId: INITIAL_MANIFEST_ID })
		// s2 is never delivered. s3 chains to it, so s3 fails only the continuity check.
		const s3 = await signed({ manifestId: MANIFEST_ID_3, sequenceNumber: 3, previousManifestId: MANIFEST_ID_2 })
		const s4 = await signed({ manifestId: MANIFEST_ID_4, sequenceNumber: 4, previousManifestId: MANIFEST_ID_3 })
		const s5 = await signed({ manifestId: MANIFEST_ID_5, sequenceNumber: 5, previousManifestId: MANIFEST_ID_4 })

		const r1 = await validateC2paManifestBoxSegment(s1, null)
		strictEqual(r1.result.isValid, true)

		// The authentic segment after the gap is reported invalid but updates the state.
		const r3 = await validateC2paManifestBoxSegment(s3, r1.nextManifestId, r1.nextState)
		deepStrictEqual(r3.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		strictEqual(r3.nextManifestId, MANIFEST_ID_3)
		strictEqual(r3.nextState.lastSequenceNumber, 3)

		// The stream recovers from there.
		const r4 = await validateC2paManifestBoxSegment(s4, r3.nextManifestId, r3.nextState)
		strictEqual(r4.result.isValid, true)
		const r5 = await validateC2paManifestBoxSegment(s5, r4.nextManifestId, r4.nextState)
		strictEqual(r5.result.isValid, true)
	})
})

describe('validateC2paManifestBoxSegment — manifest identifier (§19.3)', () => {
	const MANIFEST_ID_1 = 'urn:c2pa:1b3b77b7-552f-4a30-9ed5-8e1bf3410919'
	const MANIFEST_ID_2 = 'urn:c2pa:2e52408b-4fbe-4557-8e84-e7e4a21a5107'
	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	// A signed segment whose JUMBF label is `manifestId` and whose claim instanceID is `instanceId`.
	// `signatureField` replaces the claim `signature` URI, which by default is the absolute form.
	async function signedSegment(manifestId: string, instanceId: unknown, sequenceNumber: number, previousManifestId: string, signatureField: unknown = signatureUri(manifestId)): Promise<Uint8Array> {
		const hash = await computeBmffHash(buildMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const liveVideoData = { sequenceNumber, previousManifestId, streamId: 'stream-id', continuityMethod: 'c2pa.manifestId' }
		const liveVideoAssertion = buildJumb('c2pa.livevideo.segment', buildBox('cbor', encodeCbor(liveVideoData)))
		const bmffAssertion = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encodeCbor({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })))
		const assertionStore = buildJumb('c2pa.assertions', liveVideoAssertion, bmffAssertion)
		const claimCborBytes = encodeCbor({
			instanceID: instanceId,
			signature: signatureField,
			created_assertions: [await claimRef('c2pa.livevideo.segment', liveVideoAssertion), await claimRef('c2pa.hash.bmff.v3', bmffAssertion)],
		})
		const claim = buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes))
		const signature = buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimCborBytes)))
		return buildManifestBoxSegment(manifestId, claim, assertionStore, signature)
	}

	it('chains previousManifestId to the JUMBF label of the previous manifest, not to its claim instanceID', async () => {
		const s1 = await signedSegment(MANIFEST_ID_1, 'xmp.iid:0f84e6f5-e2ee-464c-8880-61f93a6f91b5', 1, 'urn:c2pa:initial')
		const s2 = await signedSegment(MANIFEST_ID_2, 'xmp.iid:cae0ff34-2614-4fa8-bcd1-f754bddd9445', 2, MANIFEST_ID_1)

		const r1 = await validateC2paManifestBoxSegment(s1, null)
		strictEqual(r1.nextManifestId, MANIFEST_ID_1)
		const r2 = await validateC2paManifestBoxSegment(s2, r1.nextManifestId, r1.nextState)

		strictEqual(r2.result.isValid, true)
		strictEqual(r2.nextManifestId, MANIFEST_ID_2)
	})

	// Replaces the first occurrence of `from` with `to`, which must have the same length. In a segment that
	// signedSegment builds, the first occurrence of the manifest label is the JUMBF label, before the claim.
	function relabel(segment: Uint8Array, from: string, to: string): Uint8Array {
		const bytes = Buffer.from(segment)
		const at = bytes.indexOf(from, 0, 'latin1')
		ok(at >= 0 && from.length === to.length)
		bytes.write(to, at, 'latin1')
		return new Uint8Array(bytes)
	}

	it('does not take the identity of an omitted segment from a changed JUMBF label', async () => {
		const MANIFEST_ID_3 = 'urn:c2pa:3000c55f-ac31-4e62-9cc3-7cb89c3509b6'
		const s1 = await signedSegment(MANIFEST_ID_1, null, 1, 'urn:c2pa:initial')
		// s2 is omitted. s3 chains to it.
		const s3 = await signedSegment(MANIFEST_ID_3, null, 3, MANIFEST_ID_2)
		// Only the label of s1 changes to the identifier of s2. Nothing is signed again.
		const forged = relabel(s1, MANIFEST_ID_1, MANIFEST_ID_2)

		const lastManifestId = 'urn:c2pa:initial'
		const state = { lastStreamId: 'stream-id', lastSequenceNumber: 0 }
		const r1 = await validateC2paManifestBoxSegment(forged, lastManifestId, state)
		deepStrictEqual(r1.result.errorCodes, [C2paStatusCode.CLAIM_SIGNATURE_MISSING])
		strictEqual(r1.nextManifestId, lastManifestId)
		deepStrictEqual(r1.nextState, state)

		const r3 = await validateC2paManifestBoxSegment(s3, MANIFEST_ID_1, { lastStreamId: 'stream-id', lastSequenceNumber: 1 })
		deepStrictEqual(r3.result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
	})

	it('fails with CLAIM_SIGNATURE_MISSING if the claim has no signature field', async () => {
		const hash = await computeBmffHash(buildMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
		const liveVideoAssertion = buildJumb('c2pa.livevideo.segment', buildBox('cbor', encodeCbor({ sequenceNumber: 1, previousManifestId: 'urn:c2pa:initial', streamId: 'stream-id', continuityMethod: 'c2pa.manifestId' })))
		const bmffAssertion = buildJumb('c2pa.hash.bmff.v3', buildBox('cbor', encodeCbor({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })))
		const claimCborBytes = encodeCbor({
			created_assertions: [await claimRef('c2pa.livevideo.segment', liveVideoAssertion), await claimRef('c2pa.hash.bmff.v3', bmffAssertion)],
		})
		const segment = buildManifestBoxSegment(MANIFEST_ID_1,
			buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes)),
			buildJumb('c2pa.assertions', liveVideoAssertion, bmffAssertion),
			buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimCborBytes))),
		)

		const { result, nextManifestId } = await validateC2paManifestBoxSegment(segment, null)

		deepStrictEqual(result.errorCodes, [C2paStatusCode.CLAIM_SIGNATURE_MISSING])
		strictEqual(nextManifestId, null)
	})

	it('accepts a signature URI relative to the manifest store and chains on the label it names', async () => {
		const s1 = await signedSegment(MANIFEST_ID_1, null, 1, 'urn:c2pa:initial', `self#jumbf=${MANIFEST_ID_1}/c2pa.signature`)

		const { result, nextManifestId } = await validateC2paManifestBoxSegment(s1, null)

		strictEqual(result.isValid, true)
		strictEqual(nextManifestId, MANIFEST_ID_1)
	})

	// §8.4.2.1, §10.2.1: the relative form resolves to the signature box of the same manifest, so the manifest is valid.
	// The URI does not name the label, so the claim signature does not cover it and the segment does not update the state.
	it('accepts a signature URI relative to the manifest without updating the state', async () => {
		const s2 = await signedSegment(MANIFEST_ID_2, null, 2, MANIFEST_ID_1, 'self#jumbf=c2pa.signature')
		const state = { lastStreamId: 'stream-id', lastSequenceNumber: 1 }

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(s2, MANIFEST_ID_1, state)

		strictEqual(result.isValid, true)
		strictEqual(nextManifestId, MANIFEST_ID_1)
		deepStrictEqual(nextState, state)
	})

	for (const [name, signature] of [
		['names another manifest', 'self#jumbf=/c2pa/urn:c2pa:ddfdd88d-cd2c-4a60-94ac-ec069d9f3a83/c2pa.signature'],
		['names another box', `self#jumbf=/c2pa/${MANIFEST_ID_1}/c2pa.claim`],
		['is not a JUMBF URI', 'c2pa.signature'],
		['is not a text string', 1],
	] as const) {
		it(`fails with CLAIM_SIGNATURE_MISSING if the signature URI ${name}`, async () => {
			const s1 = await signedSegment(MANIFEST_ID_1, null, 1, 'urn:c2pa:initial', signature)

			const { result, nextManifestId } = await validateC2paManifestBoxSegment(s1, null)

			deepStrictEqual(result.errorCodes, [C2paStatusCode.CLAIM_SIGNATURE_MISSING])
			strictEqual(nextManifestId, null)
		})
	}

	it('compares manifest identifiers exactly', async () => {
		const s2 = await signedSegment(MANIFEST_ID_2, null, 2, MANIFEST_ID_1.toUpperCase())

		const { result } = await validateC2paManifestBoxSegment(s2, MANIFEST_ID_1)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
	})

	it('reads a claim instanceID that is not a text string as null and does not throw on the next call', async () => {
		const s1 = await signedSegment(MANIFEST_ID_1, 12345, 1, 'urn:c2pa:initial')
		const s2 = await signedSegment(MANIFEST_ID_2, 67890, 2, MANIFEST_ID_1)

		const r1 = await validateC2paManifestBoxSegment(s1, null)
		strictEqual(r1.result.isValid, true)
		strictEqual(r1.result.manifest?.instanceId, null)
		strictEqual(r1.nextManifestId, MANIFEST_ID_1)

		const r2 = await validateC2paManifestBoxSegment(s2, r1.nextManifestId, r1.nextState)
		strictEqual(r2.result.isValid, true)
	})
})

describe('validateC2paManifestBoxSegment — content binding (§19.3)', () => {
	const LAST_MANIFEST_ID = 'urn:uuid:content-binding-previous'
	const LAST_STATE = { lastStreamId: 'stream-1', lastSequenceNumber: 1 }
	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	// A signed segment with a chained live video assertion and the given other assertions. The claim declares every assertion.
	async function signedSegment(otherAssertions: readonly (readonly [string, unknown])[]): Promise<Uint8Array> {
		const liveVideoData = { sequenceNumber: 2, previousManifestId: LAST_MANIFEST_ID, streamId: 'stream-1', continuityMethod: 'c2pa.manifestId' }
		const boxes = [buildJumb('c2pa.livevideo.segment', buildBox('cbor', encodeCbor(liveVideoData)))]
		const refs = [await claimRef('c2pa.livevideo.segment', boxes[0])]
		for (const [label, data] of otherAssertions) {
			const box = buildJumb(label, buildBox('cbor', encodeCbor(data)))
			boxes.push(box)
			refs.push(await claimRef(label, box))
		}
		const manifestLabel = 'urn:uuid:content-binding-test'
		// The claim `signature` field: the absolute URI of the signature box, which names the manifest label.
		const signature = `self#jumbf=/c2pa/${manifestLabel}/c2pa.signature`
		const claimCborBytes = encodeCbor({ instanceID: manifestLabel, signature, created_assertions: refs })
		return buildManifestBoxSegment(manifestLabel,
			buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes)),
			buildJumb('c2pa.assertions', ...boxes),
			buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimCborBytes))),
		)
	}

	async function flatHash(): Promise<Uint8Array> {
		return computeBmffHash(buildMediaBoxes(), { exclusions: [{ xpath: '/uuid' }], offsetPrefixSize: 8 })
	}

	it('accepts a signed segment whose c2pa.hash.bmff.v3 assertion matches', async () => {
		const segment = await signedSegment([['c2pa.hash.bmff.v3', { exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash: await flatHash() }]])

		const { result } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

		strictEqual(result.isValid, true)
	})

	it('fails with SEGMENT_INVALID and CLAIM_HARD_BINDINGS_MISSING for a signed segment without a hard binding', async () => {
		const segment = await signedSegment([])

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID, C2paStatusCode.CLAIM_HARD_BINDINGS_MISSING])
		strictEqual(nextManifestId, LAST_MANIFEST_ID)
		deepStrictEqual(nextState, LAST_STATE)
	})

	it('fails with SEGMENT_INVALID for a signed segment with another hard binding instead of c2pa.hash.bmff.v3', async () => {
		const segment = await signedSegment([['c2pa.hash.data', { exclusions: [], alg: 'sha256', hash: new Uint8Array(32) }]])

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		strictEqual(nextManifestId, LAST_MANIFEST_ID)
		deepStrictEqual(nextState, LAST_STATE)
	})

	// The deprecated c2pa.hash.bmff.v2 counts as a hard binding (§15.10.1.2), but §19.3.1 requires c2pa.hash.bmff.v3.
	it('fails with SEGMENT_INVALID for a signed segment with a matching c2pa.hash.bmff.v2 hash instead of c2pa.hash.bmff.v3', async () => {
		const segment = await signedSegment([['c2pa.hash.bmff.v2', { exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash: await flatHash() }]])

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SEGMENT_INVALID])
		strictEqual(nextManifestId, LAST_MANIFEST_ID)
		deepStrictEqual(nextState, LAST_STATE)
	})

	it('fails with ASSERTION_BMFFHASH_MALFORMED for a c2pa.hash.bmff.v3 assertion without a hash', async () => {
		const segment = await signedSegment([['c2pa.hash.bmff.v3', { exclusions: [{ xpath: '/uuid' }], alg: 'sha256' }]])

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

		deepStrictEqual(result.errorCodes, [C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED])
		strictEqual(nextManifestId, LAST_MANIFEST_ID)
		deepStrictEqual(nextState, LAST_STATE)
	})

	for (const [name, hashField] of [['a missing hash', {}], ['a null hash', { hash: null }]] as const) {
		it(`fails with ASSERTION_BMFFHASH_MALFORMED for ${name} and a matching value field`, async () => {
			const segment = await signedSegment([['c2pa.hash.bmff.v3', { exclusions: [{ xpath: '/uuid' }], alg: 'sha256', ...hashField, value: await flatHash() }]])

			const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

			deepStrictEqual(result.errorCodes, [C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED])
			strictEqual(result.bmffHashHex, null)
			strictEqual(nextManifestId, LAST_MANIFEST_ID)
			deepStrictEqual(nextState, LAST_STATE)
		})
	}

	it('fails with ASSERTION_BMFFHASH_MALFORMED for a c2pa.hash.bmff.v3 assertion that is not a map', async () => {
		const segment = await signedSegment([['c2pa.hash.bmff.v3', [await flatHash()]]])

		const { result, nextManifestId, nextState } = await validateC2paManifestBoxSegment(segment, LAST_MANIFEST_ID, LAST_STATE)

		deepStrictEqual(result.errorCodes, [C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED])
		strictEqual(nextManifestId, LAST_MANIFEST_ID)
		deepStrictEqual(nextState, LAST_STATE)
	})
})
