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
const CBOR_ARRAY_INDEFINITE = 0x9f
const CBOR_MAP_INDEFINITE = 0xbf
const CBOR_BREAK = 0xff
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
	/** RFC 3339 date-time. A number tests other encodings, such as seconds since the epoch with CBOR tag 1. */
	readonly createdAt: string | number
	/** CBOR tag of `createdAt`. The default is tag 0. `null` encodes `createdAt` without a tag. */
	readonly createdAtTag?: number | null
	/** Seconds from `createdAt`. */
	readonly validityPeriod: number
	/** Adds a `kid` field next to the COSE key. §18.25.2 does not define this field. */
	readonly topLevelKid?: Uint8Array
	/** Payload in the COSE_Sign1 structure of the `signerBinding`. The signature still covers the certificate. */
	readonly signerBindingPayload?: Uint8Array
	/** Encodes the fields in the deterministic key order of RFC 8949 section 4.2.1, which puts `minSequenceNumber` last. */
	readonly deterministicKeyOrder?: boolean
	/** Replaces fields of the encoded session key, after the other options. */
	readonly fields?: Readonly<Record<string, unknown>>
}

// COSE_Sign1_Tagged (RFC 9052 §4.2) with an ES256 protected header, signed over `payload`.
// The structure contains `embeddedPayload`. A detached payload is nil in the structure.
async function signCoseSign1(privateKey: CryptoKey, unprotectedHeader: ReadonlyMap<number, unknown>, payload: Uint8Array, embeddedPayload: Uint8Array | null): Promise<Tag> {
	const toBeSigned = buildSigStructure(ES256_PROTECTED_HEADER, payload) as Uint8Array<ArrayBuffer>
	const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, toBeSigned))
	return new Tag([ES256_PROTECTED_HEADER, unprotectedHeader, embeddedPayload, signature], CBOR_TAG_COSE_SIGN1)
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
 * The structure contains `embeddedPayload` as its payload. The payload is detached (nil) if `embeddedPayload` is `null`.
 */
export async function encodeSignerBinding(key: TestSessionKey, payload: Uint8Array, embeddedPayload: Uint8Array | null = null): Promise<Uint8Array> {
	return Uint8Array.from(CBOR.encode(await signCoseSign1(key.privateKey, new Map(), payload, embeddedPayload)))
}

// The signerBinding is a COSE_Sign1 over the end-entity certificate of the signer (§18.25.2).
// The payload is detached, unless the entry sets `signerBindingPayload`.
async function buildSessionKeyData(entry: TestSessionKeyEntry, certificateDER: Uint8Array): Promise<Record<string, unknown>> {
	const data: Record<string, unknown> = {
		key: entry.key.coseKey,
		minSequenceNumber: entry.minSequenceNumber,
		createdAt: entry.createdAtTag === null ? entry.createdAt : new Tag(entry.createdAt, entry.createdAtTag ?? CBOR_TAG_DATE_TIME),
		validityPeriod: entry.validityPeriod,
		signerBinding: await signCoseSign1(entry.key.privateKey, new Map(), certificateDER, entry.signerBindingPayload ?? null),
		...(entry.topLevelKid && { kid: entry.topLevelKid }),
		...entry.fields,
	}
	if (!entry.deterministicKeyOrder) return data
	// RFC 8949 section 4.2.1: a shorter encoded text key sorts first, then the bytes decide
	return Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.length - b.length || (a < b ? -1 : 1)))
}

// Encodes plain objects and arrays with indefinite lengths. Each ends with the break code (RFC 8949 section 3.2.2).
// cbor-x does not decode byte strings or text strings of indefinite length.
function encodeIndefiniteLengths(value: unknown): Uint8Array {
	if (Array.isArray(value)) return concatBytes(Uint8Array.of(CBOR_ARRAY_INDEFINITE), ...value.map(encodeIndefiniteLengths), Uint8Array.of(CBOR_BREAK))
	if (typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
		const entries = Object.entries(value).flatMap(([key, item]) => [Uint8Array.from(CBOR.encode(key)), encodeIndefiniteLengths(item)])
		return concatBytes(Uint8Array.of(CBOR_MAP_INDEFINITE), ...entries, Uint8Array.of(CBOR_BREAK))
	}
	return Uint8Array.from(CBOR.encode(value))
}

/** One assertion of a test manifest: the JUMBF label and the CBOR content of the assertion. */
export type TestAssertion = {
	readonly label: string
	readonly cbor: Uint8Array
}

/** Builds an init segment with a manifest store that holds the given manifest JUMBF box */
export function buildInitSegmentWithManifest(manifest: Uint8Array): Uint8Array {
	const purpose = TEXT_ENCODER.encode('manifest')
	const prefix = new Uint8Array(4 + purpose.length + 1 + 8) // fullbox header + purpose\0 + aux offset
	prefix.set(purpose, 4)
	return concatBytes(buildInitMediaBoxes(), buildUuidBox(JUMBF_UUID, concatBytes(prefix, buildJumb('c2pa', manifest))))
}

/**
 * Builds an init segment whose manifest has the given CBOR assertions.
 * The claim references every assertion and is signed by `signer`.
 */
export async function buildSignedInitSegment(signer: TestSigner, assertions: readonly TestAssertion[]): Promise<Uint8Array> {
	const assertionBoxes = assertions.map(assertion => buildJumb(assertion.label, buildBox('cbor', assertion.cbor)))
	const claimCborBytes = Uint8Array.from(CBOR.encode({
		instanceID: MANIFEST_ID,
		created_assertions: await Promise.all(assertionBoxes.map(async (box, index) => ({
			url: `self#jumbf=c2pa.assertions/${assertions[index].label}`,
			hash: await sha256(box.subarray(8)),
			alg: 'sha256',
		}))),
	}))
	const manifest = buildJumb(MANIFEST_ID,
		buildJumb('c2pa.claim', buildBox('cbor', claimCborBytes)),
		buildJumb('c2pa.assertions', ...assertionBoxes),
		buildJumb('c2pa.signature', buildBox('cbor', await signer.sign(claimCborBytes))),
	)
	return buildInitSegmentWithManifest(manifest)
}

/**
 * Builds an init segment whose manifest has a `c2pa.session-keys` assertion (§18.25) with the given keys.
 * The claim references the assertion and is signed by `signer`. If `indefiniteLengths` is `true`, the assertion
 * encodes its maps and arrays with indefinite lengths. The COSE keys and signer bindings keep definite lengths.
 */
export async function buildSessionKeysInitSegment(signer: TestSigner, entries: readonly TestSessionKeyEntry[], indefiniteLengths: boolean = false): Promise<Uint8Array> {
	const keys = await Promise.all(entries.map(entry => buildSessionKeyData(entry, signer.certificateDER)))
	const cbor = indefiniteLengths ? encodeIndefiniteLengths({ keys }) : Uint8Array.from(CBOR.encode({ keys }))
	return buildSignedInitSegment(signer, [{ label: SESSION_KEYS_LABEL, cbor }])
}

// VSI emsg box (§19.4.2) whose message data is a verifiable-segment-info signed with `key`.
async function buildVsiEmsgBox(key: TestSessionKey, sequenceNumber: number | bigint, hash: Uint8Array): Promise<Uint8Array> {
	const segmentInfoMap = {
		sequenceNumber,
		bmffHash: { exclusions: VSI_EXCLUSIONS, alg: 'sha256', hash },
		manifestId: MANIFEST_ID,
	}
	const segmentInfoBytes = Uint8Array.from(CBOR.encode(segmentInfoMap))
	const verifiableSegmentInfo = await signCoseSign1(key.privateKey, new Map([[COSE_HEADER_KID, key.kid]]), segmentInfoBytes, segmentInfoBytes)
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
