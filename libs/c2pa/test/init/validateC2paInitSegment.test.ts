import { validateC2paInitSegment, C2paStatusCode, LiveVideoStatusCode } from '@svta/cml-c2pa'
import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert'
import { readFileSync } from 'node:fs'
import { before, describe, it } from 'node:test'
import { encode } from 'cbor-x/encode'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { buildInitMediaBoxes, buildMerkleInitSegment, buildSignedMerkleInitSegment, sha256 } from '../merkle/merkleTestUtils.ts'
import { createTestSigner, type TestSigner } from '../testSigner.ts'
import { buildSessionKeysInitSegment, createTestSessionKey, type TestSessionKey, type TestSessionKeyEntry } from '../vsi/vsiTestUtils.ts'

describe('validateC2paInitSegment', () => {
	// #region example
	it('throws for empty bytes (no C2PA UUID box)', async () => {
		await rejects(
			() => validateC2paInitSegment(new Uint8Array(0)),
			/No C2PA UUID box/,
		)
	})
	// #endregion example

	it('returns INIT_INVALID when the segment contains an mdat box', async () => {
		const ftyp = new Uint8Array([0, 0, 0, 12, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])
		const mdat = new Uint8Array([0, 0, 0, 8, 0x6d, 0x64, 0x61, 0x74])
		const segment = new Uint8Array(ftyp.length + mdat.length)
		segment.set(ftyp, 0)
		segment.set(mdat, ftyp.length)

		const result = await validateC2paInitSegment(segment)
		strictEqual(result.isValid, false)
		strictEqual(result.manifest, null)
		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.INIT_INVALID])
	})

	describe('session keys (§18.25)', () => {
		let init: Uint8Array
		let key001: TestSessionKey
		let key002: TestSessionKey

		// The two keys of the §18.25.3 example: key_002 becomes active before key_001 expires.
		before(async () => {
			const signer = await createTestSigner()
			key001 = await createTestSessionKey('key_001')
			key002 = await createTestSessionKey('key_002')
			init = await buildSessionKeysInitSegment(signer, [
				{ key: key001, minSequenceNumber: 175, createdAt: '2025-07-29T10:00:00Z', validityPeriod: 3900 },
				{ key: key002, minSequenceNumber: 1975, createdAt: '2025-07-29T11:00:00Z', validityPeriod: 3900 },
			])
		})

		it('keeps a session key that is not yet active', async (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: Date.parse('2025-07-29T10:30:00Z') })

			const result = await validateC2paInitSegment(init)

			deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex, key002.kidHex])
			deepStrictEqual(result.errorCodes, [])
		})

		it('drops an expired session key', async (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: Date.parse('2025-07-29T11:30:00Z') })

			const result = await validateC2paInitSegment(init)

			deepStrictEqual(result.sessionKeys.map(key => key.kid), [key002.kidHex])
		})

		it('keeps the session key of an init segment from an independent signer', async (context) => {
			context.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-09-21T00:00:00Z') })
			const bytes = new Uint8Array(
				readFileSync(new URL('../fixtures/vsi_init_with_signer_binding.mp4', import.meta.url)),
			)

			const result = await validateC2paInitSegment(bytes)

			deepStrictEqual(result.sessionKeys.map(key => key.kid), ['ad0c9403ce98540f9569542619058da3'])
			deepStrictEqual(result.errorCodes, [])
		})
	})
})

describe('validateC2paInitSegment — VOD Merkle', () => {
	const HASH = new Uint8Array(32).fill(3)

	function merkleEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
		return { uniqueId: 1, localId: 1, count: 4, hashes: [HASH], alg: 'SHA-256', initHash: HASH, ...overrides }
	}

	let signer: TestSigner

	before(async () => {
		signer = await createTestSigner()
	})

	it('populates merkleMaps and skips SESSIONKEY_INVALID in VOD Merkle mode', async () => {
		const init = await buildSignedMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry()],
		}, signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.merkleMaps.length, 1)
		strictEqual(result.merkleMaps[0].count, 4)
		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID), false)
	})

	it('returns empty merkleMaps when the assertion has no merkle field', async () => {
		const init = buildMerkleInitSegment({ exclusions: [] })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.merkleMaps, [])
		ok(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID))
	})

	it('accepts a matching initHash without additional error codes', async () => {
		// /uuid is excluded, so the init hash covers only ftyp + moov — computable up front.
		// Merkle-only assertions hash with 8-byte box-offset prefixes (§18.6.2).
		const initHash = await computeBmffHash(buildInitMediaBoxes(), { offsetPrefixSize: 8 })
		const init = await buildSignedMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ initHash })],
		}, signer)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.merkleMaps.length, 1)
		strictEqual(result.isValid, true)
		deepStrictEqual(result.errorCodes, [])
		deepStrictEqual(result.certificate, signer.certificateDER)
	})

	it('rejects an unsigned init segment with CLAIM_SIGNATURE_MISSING', async () => {
		const initHash = await computeBmffHash(buildInitMediaBoxes(), { offsetPrefixSize: 8 })
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ initHash })],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		strictEqual(result.certificate, null)
		ok(result.errorCodes.includes(C2paStatusCode.CLAIM_SIGNATURE_MISSING))
	})

	it('rejects a mismatching initHash', async () => {
		const wrongHash = await sha256(new Uint8Array([9, 9, 9]))
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ initHash: wrongHash })],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		ok(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID))
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH))
	})

	it('rejects a merkle entry missing initHash as malformed (required for fragmented assets)', async () => {
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ initHash: undefined })],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		deepStrictEqual(result.merkleMaps, [])
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
	})

	it('rejects a merkle entry with no alg anywhere as malformed (no default per spec)', async () => {
		const init = buildMerkleInitSegment({
			exclusions: [{ xpath: '/uuid' }],
			merkle: [merkleEntry({ alg: undefined })],
		})

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		deepStrictEqual(result.merkleMaps, [])
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
	})

	it('rejects an empty merkle array as malformed without flagging session keys', async () => {
		const init = buildMerkleInitSegment({ exclusions: [], merkle: [] })

		const result = await validateC2paInitSegment(init)

		strictEqual(result.isValid, false)
		deepStrictEqual(result.merkleMaps, [])
		ok(result.errorCodes.includes(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED))
		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.SESSIONKEY_INVALID), false)
	})
})

describe('validateC2paInitSegment — BMFF hash assertion offset prefix (§18.6.2)', () => {
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

	function buildInitMediaBoxes(): Uint8Array {
		return concatBytes(buildBox('ftyp', TEXT_ENCODER.encode('isom')), buildBox('moov'))
	}

	// Unsigned init segment with a `c2pa.hash.bmff.v3` assertion; no signature box,
	// so integrity checks skip signature verification.
	function buildInitSegment(assertionData: Record<string, unknown>): Uint8Array {
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

		return concatBytes(buildInitMediaBoxes(), uuidBox)
	}

	// /uuid is excluded, so the flat hash covers only ftyp + moov — computable up front.
	async function buildInitWithFlatHash(offsetPrefixSize: number): Promise<Uint8Array> {
		const hash = await computeBmffHash(buildInitMediaBoxes(), { offsetPrefixSize })
		return buildInitSegment({ exclusions: [{ xpath: '/uuid' }], alg: 'sha256', hash })
	}

	it('accepts a flat hash computed with 8-byte box-offset prefixes', async () => {
		const init = await buildInitWithFlatHash(8)

		const result = await validateC2paInitSegment(init)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID), false)
	})

	it('rejects a flat hash computed without box-offset prefixes', async () => {
		const init = await buildInitWithFlatHash(0)

		const result = await validateC2paInitSegment(init)

		ok(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID))
	})

	it('accepts the flat hash of a real signed init segment', async () => {
		const bytes = new Uint8Array(
			readFileSync(new URL('../fixtures/init_signed_with_session_keys.m4s', import.meta.url)),
		)

		const result = await validateC2paInitSegment(bytes)

		strictEqual(result.errorCodes.includes(LiveVideoStatusCode.INIT_INVALID), false)
	})
})

describe('validateC2paInitSegment — session keys assertion (§19.7.3)', () => {
	const COSE_KEY_KTY = 1
	const COSE_KEY_KID = 2
	const COSE_KTY_RSA = 3
	const NOW = Date.parse('2025-07-29T10:30:00Z')

	let signer: TestSigner
	let key001: TestSessionKey
	let key002: TestSessionKey

	before(async () => {
		signer = await createTestSigner()
		key001 = await createTestSessionKey('key_001')
		key002 = await createTestSessionKey('key_002')
	})

	function activeEntry(key: TestSessionKey) {
		return { key, minSequenceNumber: 0, createdAt: '2025-07-29T10:00:00Z', validityPeriod: 3600 }
	}

	function expiredEntry(key: TestSessionKey) {
		return { key, minSequenceNumber: 0, createdAt: '2025-07-29T09:00:00Z', validityPeriod: 600 }
	}

	it('accepts an assertion in which every session key is valid', async (context) => {
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), activeEntry(key002)])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex, key002.kidHex])
		deepStrictEqual(result.errorCodes, [])
		strictEqual(result.isValid, true)
	})

	it('accepts a minSequenceNumber and a validityPeriod of 2^32 or more', async (context) => {
		// cbor-x decodes a CBOR unsigned integer of 2^32 or more as a BigInt.
		const entryWithLargeIntegers = { ...activeEntry(key002), minSequenceNumber: BigInt(2 ** 32), validityPeriod: BigInt(2 ** 32) } as unknown as TestSessionKeyEntry
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), entryWithLargeIntegers])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => [key.kid, key.minSequenceNumber, key.validityPeriod]), [
			[key001.kidHex, 0, 3600],
			[key002.kidHex, 4294967296, 4294967296],
		])
		deepStrictEqual(result.errorCodes, [])
		strictEqual(result.isValid, true)
	})

	it('accepts a createdAt with a fraction of a second and a time offset', async (context) => {
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), { ...activeEntry(key002), createdAt: '2025-07-29T12:00:00.5+02:00' }])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => [key.kid, key.createdAt]), [
			[key001.kidHex, '2025-07-29T10:00:00.000Z'],
			[key002.kidHex, '2025-07-29T10:00:00.500Z'],
		])
		deepStrictEqual(result.errorCodes, [])
	})

	it('accepts an assertion with CBOR maps and arrays of indefinite length', async (context) => {
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), activeEntry(key002)], true)
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => [key.kid, key.createdAt]), [
			[key001.kidHex, '2025-07-29T10:00:00.000Z'],
			[key002.kidHex, '2025-07-29T10:00:00.000Z'],
		])
		deepStrictEqual(result.errorCodes, [])
	})

	it('excludes an expired session key from sessionKeys without SESSIONKEY_INVALID', async (context) => {
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), expiredEntry(key002)])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex])
		deepStrictEqual(result.errorCodes, [])
		strictEqual(result.isValid, true)
	})

	it('treats a session key with a validityPeriod of 0 as expired, without SESSIONKEY_INVALID', async (context) => {
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), { ...activeEntry(key002), validityPeriod: 0 }])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex])
		deepStrictEqual(result.errorCodes, [])
		strictEqual(result.isValid, true)
	})

	it('fails with SESSIONKEY_INVALID if a session key has no minSequenceNumber value', async (context) => {
		// The assertion encodes minSequenceNumber as CBOR undefined.
		const entryWithoutMinSequenceNumber = { ...activeEntry(key002), minSequenceNumber: undefined as unknown as number }
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), entryWithoutMinSequenceNumber])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})

	it('fails with SESSIONKEY_INVALID if a session key has no kid', async (context) => {
		const keyWithoutKid = { ...key002, coseKey: new Map([...key002.coseKey].filter(([label]) => label !== COSE_KEY_KID)) }
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), activeEntry(keyWithoutKid)])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})

	it('fails with SESSIONKEY_INVALID if a session key has a kid only outside its COSE key', async (context) => {
		const keyWithoutKid = { ...key002, coseKey: new Map([...key002.coseKey].filter(([label]) => label !== COSE_KEY_KID)) }
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), { ...activeEntry(keyWithoutKid), topLevelKid: key002.kid }])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex])
		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})

	// Each entry breaks one §18.25.2 rule for a session key field.
	const NONCONFORMING_FIELDS: readonly (readonly [string, Readonly<Record<string, unknown>>])[] = [
		['a createdAt that is not a date', { createdAt: 'not a date' }],
		['a createdAt without CBOR tag 0', { createdAtTag: null }],
		['a createdAt with CBOR tag 1', { createdAt: Date.parse('2025-07-29T10:00:00Z') / 1000, createdAtTag: 1 }],
		['a createdAt with a date-time string in CBOR tag 1', { createdAtTag: 1 }],
		['a createdAt with a number in CBOR tag 0', { createdAt: Date.parse('2025-07-29T10:00:00Z') }],
		['a createdAt on a day that does not exist', { createdAt: '2025-02-30T00:00:00Z' }],
		['a createdAt that is not an RFC 3339 date-time', { createdAt: 'Tue, 29 Jul 2025 10:00:00 GMT' }],
		['a createdAt with a lowercase t and z', { createdAt: '2025-07-29t10:00:00z' }],
		['a minSequenceNumber that is a text string', { minSequenceNumber: '0' }],
		['a negative minSequenceNumber', { minSequenceNumber: -1 }],
		['a minSequenceNumber that is not an integer', { minSequenceNumber: 0.5 }],
		['a validityPeriod that is a text string', { validityPeriod: '3600' }],
		['a negative validityPeriod', { validityPeriod: -600 }],
		['a validityPeriod that is not an integer', { validityPeriod: 3600.5 }],
		['a minSequenceNumber above 2^53 - 1', { minSequenceNumber: BigInt(2 ** 53) }],
		['a validityPeriod above 2^53 - 1', { validityPeriod: BigInt(2 ** 53) }],
	]

	for (const [description, fields] of NONCONFORMING_FIELDS) {
		it(`fails with SESSIONKEY_INVALID if a session key has ${description}`, async (context) => {
			const nonconformingEntry = { ...activeEntry(key002), ...fields } as TestSessionKeyEntry
			const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), nonconformingEntry])
			context.mock.timers.enable({ apis: ['Date'], now: NOW })

			const result = await validateC2paInitSegment(init)

			deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex])
			deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
			strictEqual(result.isValid, false)
		})
	}

	it('fails with SESSIONKEY_INVALID if the signerBinding of a session key does not verify', async (context) => {
		// The private key of key_001 signs the signerBinding of key_002.
		const keyWithWrongBinding = { ...key002, privateKey: key001.privateKey }
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), activeEntry(keyWithWrongBinding)])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		strictEqual(result.sessionKeys.some(key => key.kid === key002.kidHex), false)
		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})

	it('fails with SESSIONKEY_INVALID if the signerBinding of a session key embeds a payload other than the certificate', async (context) => {
		// The signature covers the certificate of the signer, but the signerBinding embeds another certificate.
		const otherCertificate = (await createTestSigner('Other Signer')).certificateDER
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), { ...activeEntry(key002), signerBindingPayload: otherCertificate }])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.sessionKeys.map(key => key.kid), [key001.kidHex])
		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})

	it('fails with SESSIONKEY_INVALID if the signerBinding of an expired session key does not verify', async (context) => {
		const keyWithWrongBinding = { ...key002, privateKey: key001.privateKey }
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), expiredEntry(keyWithWrongBinding)])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})

	it('fails with SESSIONKEY_INVALID if the signerBinding of a session key cannot be verified', async (context) => {
		// The library does not support COSE key type 3 (RSA).
		const keyWithRsaType = { ...key002, coseKey: new Map([...key002.coseKey, [COSE_KEY_KTY, COSE_KTY_RSA]]) }
		const init = await buildSessionKeysInitSegment(signer, [activeEntry(key001), activeEntry(keyWithRsaType)])
		context.mock.timers.enable({ apis: ['Date'], now: NOW })

		const result = await validateC2paInitSegment(init)

		deepStrictEqual(result.errorCodes, [LiveVideoStatusCode.SESSIONKEY_INVALID])
		strictEqual(result.isValid, false)
	})
})
