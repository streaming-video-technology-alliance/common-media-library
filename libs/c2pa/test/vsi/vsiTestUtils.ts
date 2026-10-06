import { writeEmsg } from '@svta/cml-iso-bmff'
import { Tag } from 'cbor-x'
import { Encoder } from 'cbor-x/encode'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { buildSigStructure } from '../../src/cose/buildSigStructure.ts'
import { bytesToHex, JUMBF_UUID } from '../../src/utils.ts'
import { buildBox, buildInitMediaBoxes, buildJumb, buildMediaContent, buildUuidBox, concatBytes, sha256 } from '../merkle/merkleTestUtils.ts'
import type { TestSigner } from '../testSigner.ts'

const TEXT_ENCODER = new TextEncoder()

// Plain CBOR as real signers emit it: no tag 64 on byte strings, and Maps encode as plain CBOR maps (no tag 259).
const CBOR = new Encoder({ tagUint8Array: false, useRecords: false, mapsAsObjects: false })

const CBOR_TAG_DATE_TIME = 0
const CBOR_TAG_COSE_SIGN1 = 18
const COSE_HEADER_ALG = 1
const COSE_HEADER_KID = 4
const COSE_ALG_ES256 = -7
const COSE_KEY_KTY = 1
const COSE_KEY_KID = 2
const COSE_KEY_CRV = -1
const COSE_KEY_X = -2
const COSE_KEY_Y = -3
const COSE_KTY_EC2 = 2
const COSE_CRV_P256 = 1
const P256_COORDINATE_BYTES = 32
const SHA256_BYTES = 32

// cbor-x reuses its output buffer between calls, so copy every encoding.
const ES256_PROTECTED_HEADER = Uint8Array.from(CBOR.encode(new Map([[COSE_HEADER_ALG, COSE_ALG_ES256]])))

const MANIFEST_ID = 'urn:uuid:vsi-test-manifest'
const SESSION_KEYS_LABEL = 'c2pa.session-keys'
const VSI_SCHEME_ID_URI = 'urn:c2pa:verifiable-segment-info'
const VSI_EXCLUSIONS = [{ xpath: '/emsg' }]

export type TestSessionKey = {
	/** Key ID bytes, carried in the COSE key and in the `kid` header of each VSI signature. */
	readonly kid: Uint8Array
	/** Hex-encoded key ID, as `ValidatedSessionKey.kid` reports it. */
	readonly kidHex: string
	/** Public key as a COSE_Key (RFC 9052 §7) with the key ID. */
	readonly coseKey: ReadonlyMap<number, unknown>
	readonly privateKey: CryptoKey
}

/** One session key of a `c2pa.session-keys` assertion (§18.25.2). */
export type TestSessionKeyEntry = {
	readonly key: TestSessionKey
	readonly minSequenceNumber: number
	/** RFC 3339 date-time, encoded with CBOR tag 0. */
	readonly createdAt: string
	/** Encodes `createdAt` as a text string without CBOR tag 0. */
	readonly omitCreatedAtTag?: boolean
	/** Seconds from `createdAt`. */
	readonly validityPeriod: number
	/** Adds a `kid` field next to the COSE key. §18.25.2 does not define this field. */
	readonly topLevelKid?: Uint8Array
}

// COSE_Sign1_Tagged (RFC 9052 §4.2) with an ES256 protected header. A detached payload is nil in the structure.
async function signCoseSign1(privateKey: CryptoKey, unprotectedHeader: ReadonlyMap<number, unknown>, payload: Uint8Array, detached: boolean): Promise<Tag> {
	const toBeSigned = buildSigStructure(ES256_PROTECTED_HEADER, payload) as Uint8Array<ArrayBuffer>
	const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, toBeSigned))
	return new Tag([ES256_PROTECTED_HEADER, unprotectedHeader, detached ? null : payload, signature], CBOR_TAG_COSE_SIGN1)
}

/**
 * Creates a P-256 session key with the given key ID. Key generation takes a few milliseconds,
 * so create the keys once per test file.
 */
export async function createTestSessionKey(kid: string): Promise<TestSessionKey> {
	const keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
	// Uncompressed point: 0x04 || x || y
	const point = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey))
	const kidBytes = TEXT_ENCODER.encode(kid)
	return {
		kid: kidBytes,
		kidHex: bytesToHex(kidBytes),
		coseKey: new Map<number, unknown>([
			[COSE_KEY_KTY, COSE_KTY_EC2],
			[COSE_KEY_KID, kidBytes],
			[COSE_KEY_CRV, COSE_CRV_P256],
			[COSE_KEY_X, point.slice(1, 1 + P256_COORDINATE_BYTES)],
			[COSE_KEY_Y, point.slice(1 + P256_COORDINATE_BYTES)],
		]),
		privateKey: keyPair.privateKey,
	}
}

/**
 * Encodes a `signerBinding` (§18.25.2): a COSE_Sign1_Tagged signed with the session key over `payload`.
 * The payload is detached, unless `embedded` is `true`.
 */
export async function encodeSignerBinding(key: TestSessionKey, payload: Uint8Array, embedded: boolean = false): Promise<Uint8Array> {
	return Uint8Array.from(CBOR.encode(await signCoseSign1(key.privateKey, new Map(), payload, !embedded)))
}

// The signerBinding is a detached COSE_Sign1 over the end-entity certificate of the signer (§18.25.2).
async function buildSessionKeyData(entry: TestSessionKeyEntry, certificateDER: Uint8Array): Promise<Record<string, unknown>> {
	return {
		key: entry.key.coseKey,
		minSequenceNumber: entry.minSequenceNumber,
		createdAt: entry.omitCreatedAtTag ? entry.createdAt : new Tag(entry.createdAt, CBOR_TAG_DATE_TIME),
		validityPeriod: entry.validityPeriod,
		signerBinding: await signCoseSign1(entry.key.privateKey, new Map(), certificateDER, true),
		...(entry.topLevelKid && { kid: entry.topLevelKid }),
	}
}

/**
 * Builds an init segment whose manifest has a `c2pa.session-keys` assertion (§18.25) with the given keys.
 * The claim references the assertion and is signed by `signer`.
 */
export async function buildSessionKeysInitSegment(signer: TestSigner, entries: readonly TestSessionKeyEntry[]): Promise<Uint8Array> {
	const keys = await Promise.all(entries.map(entry => buildSessionKeyData(entry, signer.certificateDER)))
	const sessionKeysAssertion = buildJumb(SESSION_KEYS_LABEL, buildBox('cbor', Uint8Array.from(CBOR.encode({ keys }))))
	const claimCborBytes = Uint8Array.from(CBOR.encode({
		instanceID: MANIFEST_ID,
		created_assertions: [{
			url: `self#jumbf=c2pa.assertions/${SESSION_KEYS_LABEL}`,
			hash: await sha256(sessionKeysAssertion.subarray(8)),
			alg: 'sha256',
		}],
	}))
	const manifest = buildJumb(MANIFEST_ID,
		buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes)),
		buildJumb('c2pa.assertions', sessionKeysAssertion),
		buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimCborBytes))),
	)

	const purpose = TEXT_ENCODER.encode('manifest')
	const prefix = new Uint8Array(4 + purpose.length + 1 + 8) // fullbox header + purpose\0 + aux offset
	prefix.set(purpose, 4)
	return concatBytes(buildInitMediaBoxes(), buildUuidBox(JUMBF_UUID, concatBytes(prefix, buildJumb('c2pa', manifest))))
}

// VSI emsg box (§19.4.2) whose message data is a verifiable-segment-info signed with `key`.
async function buildVsiEmsgBox(key: TestSessionKey, sequenceNumber: number | bigint, hash: Uint8Array): Promise<Uint8Array> {
	const segmentInfoMap = {
		sequenceNumber,
		bmffHash: { exclusions: VSI_EXCLUSIONS, alg: 'sha256', hash },
		manifestId: MANIFEST_ID,
	}
	const verifiableSegmentInfo = await signCoseSign1(key.privateKey, new Map([[COSE_HEADER_KID, key.kid]]), Uint8Array.from(CBOR.encode(segmentInfoMap)), false)
	return new Uint8Array(writeEmsg({
		type: 'emsg',
		version: 0,
		flags: 0,
		schemeIdUri: VSI_SCHEME_ID_URI,
		value: 'fseg',
		timescale: 1000,
		presentationTimeDelta: 0,
		eventDuration: 2000,
		// The emsg version 0 id field has 32 bits.
		id: Number(sequenceNumber) % 2 ** 32,
		messageData: Uint8Array.from(CBOR.encode(verifiableSegmentInfo)),
	}).buffer)
}

/**
 * Builds a media segment with a VSI emsg box signed with `key`. The bmffHash covers the
 * moof and mdat boxes with 8-byte box-offset prefixes (§18.6.2).
 * A BigInt `sequenceNumber` encodes as a CBOR unsigned integer of 8 bytes.
 */
export async function buildVsiSegment(key: TestSessionKey, sequenceNumber: number | bigint): Promise<Uint8Array> {
	const media = buildMediaContent(Number(sequenceNumber))
	// The emsg box has the same size for every hash value, so a placeholder gives the final media box offsets.
	const placeholder = await buildVsiEmsgBox(key, sequenceNumber, new Uint8Array(SHA256_BYTES))
	const hash = await computeBmffHash(concatBytes(placeholder, media), { exclusions: VSI_EXCLUSIONS, offsetPrefixSize: 8 })
	return concatBytes(await buildVsiEmsgBox(key, sequenceNumber, hash), media)
}
