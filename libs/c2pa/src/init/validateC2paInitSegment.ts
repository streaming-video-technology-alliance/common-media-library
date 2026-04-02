import { decode, encode } from 'cbor-x'
import { findIsoBox, readIsoBoxes } from '@svta/cml-iso-bmff'
import type { C2paAssertion } from '../C2paAssertion.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifestInternal } from '../readC2paManifest.ts'
import { extractManifestCertificate } from '../extractManifestCertificate.ts'
import { validateBmffHash } from '../bmff/validateBmffHash.ts'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import { validateManifestIntegrity } from '../claim/validateManifestIntegrity.ts'
import { convertCoseKeyToJwk } from '../cose/convertCoseKeyToJwk.ts'
import { verifySignerBinding } from '../cose/verifySignerBinding.ts'
import type { InitSegmentValidation, ValidatedSessionKey } from './InitSegmentValidation.ts'
import { bytesToHex, isKeyExpired } from '../utils.ts'

const BMFF_HASH_ASSERTION_LABEL = 'c2pa.hash.bmff.v3'
const SESSION_KEYS_ASSERTION_LABEL = 'c2pa.session-keys'
const COSE_KEY_ID_LABEL = 2

function normalizeToUint8Array(value: unknown): Uint8Array {
	if (value instanceof Uint8Array) return value
	if (Array.isArray(value)) return new Uint8Array(value as number[])
	const obj = value as Record<string, unknown>
	if (typeof obj['tag'] === 'number' && 'value' in obj) return encode(value) as Uint8Array
	const ctor = (value as { constructor?: { name?: string } }).constructor
	if (ctor?.name === 'Tag') return encode(value) as Uint8Array
	throw new Error('Cannot convert value to Uint8Array')
}

function ensureDecodedCbor(value: unknown): unknown {
	if (value instanceof Uint8Array) return decode(value)
	if (Array.isArray(value) && value.length > 0 && typeof (value as number[])[0] === 'number') {
		return decode(new Uint8Array(value as number[]))
	}
	return value
}

// cbor-x uses this key for CBOR tagged values (e.g., tag 0 for date-time)
const CBOR_TAGGED_KEY = '@@TAGGED@@'

function parseCreatedAt(value: unknown): string | null {
	if (typeof value === 'string') return value
	if (value instanceof Date) return value.toISOString()
	if (typeof value === 'object' && value !== null) {
		const obj = value as Record<string, unknown>
		const tagged = obj[CBOR_TAGGED_KEY]
		if (Array.isArray(tagged) && tagged.length === 2) return String(tagged[1])
		const direct = obj['value'] ?? (obj as unknown as Record<number, unknown>)[1]
		if (typeof direct === 'string') return direct
	}
	return null
}

function extractKidHex(keyData: Record<string, unknown>, coseKey: unknown): string | null {
	const kid = keyData['kid']
	if (kid instanceof Uint8Array) return bytesToHex(kid)
	if (typeof kid === 'string') return kid
	if (Array.isArray(kid) && kid.length > 0) return bytesToHex(new Uint8Array(kid as number[]))

	// Fallback: COSE key field 2 is the key ID per RFC 9052
	const coseKeyLike = coseKey as Map<number, unknown> | Record<number, unknown>
	const coseKid = coseKeyLike instanceof Map ? coseKeyLike.get(COSE_KEY_ID_LABEL) : coseKeyLike[COSE_KEY_ID_LABEL]
	if (coseKid instanceof Uint8Array) return bytesToHex(coseKid)
	if (Array.isArray(coseKid) && coseKid.length > 0) {
		return bytesToHex(new Uint8Array(coseKid as number[]))
	}

	return null
}

function extractKeyArray(data: unknown): unknown[] {
	if (Array.isArray(data)) return data
	if (typeof data === 'object' && data !== null) {
		const obj = data as Record<string, unknown>
		const keys = obj['keys'] ?? obj['sessionKeys']
		if (Array.isArray(keys)) return keys
		if (typeof keys === 'object' && keys !== null) {
			const nested = (keys as Record<string, unknown>)['keys']
			if (Array.isArray(nested)) return nested
		}
	}
	return []
}

async function validateBmffHashAssertion(
	bytes: Uint8Array,
	assertion: C2paAssertion | null,
): Promise<boolean> {
	if (!assertion) return true
	const data = assertion.data as Record<string, unknown>
	const rawHash = data['hash'] ?? data['value']
	if (!rawHash) return true
	const expectedHash =
		rawHash instanceof Uint8Array ? rawHash : new Uint8Array(rawHash as number[])
	let alg = (data['alg'] as string | undefined) ?? 'SHA-256'
	if (alg.toLowerCase() === 'sha256') alg = 'SHA-256'
	const exclusions = (data['exclusions'] as BmffHashExclusion[] | undefined) ?? []
	return validateBmffHash(bytes, expectedHash, { exclusions, alg })
}

type SessionKeyFields = {
	minSequenceNumber: number
	validityPeriod: number
	createdAt: string
	kid: string
	coseKey: unknown
	signerBindingBytes: Uint8Array
}

function extractSessionKeyFields(entry: unknown): SessionKeyFields | null {
	const keyData = entry as Record<string, unknown>

	const minSequenceNumber = keyData['minSequenceNumber']
	const validityPeriod = keyData['validityPeriod']
	const createdAt = parseCreatedAt(keyData['createdAt'])

	if (minSequenceNumber == null || validityPeriod == null || !createdAt) return null

	const isNotYetActive = new Date() < new Date(createdAt)
	if (isNotYetActive || isKeyExpired(createdAt, Number(validityPeriod))) return null

	const coseKey = ensureDecodedCbor(keyData['key'])
	const kid = extractKidHex(keyData, coseKey)
	if (!kid) return null

	const signerBindingRaw = keyData['signerBinding']
	if (!signerBindingRaw) return null

	try {
		return {
			minSequenceNumber: Number(minSequenceNumber),
			validityPeriod: Number(validityPeriod),
			createdAt,
			kid,
			coseKey,
			signerBindingBytes: normalizeToUint8Array(signerBindingRaw),
		}
	} catch {
		return null
	}
}

async function verifyAndConvertKey(
	fields: SessionKeyFields,
	certificate: Uint8Array,
): Promise<ValidatedSessionKey | null> {
	const isBindingValid = await verifySignerBinding(fields.signerBindingBytes, fields.coseKey, certificate)
	if (!isBindingValid) return null

	try {
		const jwk = convertCoseKeyToJwk(fields.coseKey)
		return {
			kid: fields.kid,
			jwk,
			minSequenceNumber: fields.minSequenceNumber,
			validityPeriod: fields.validityPeriod,
			createdAt: fields.createdAt,
		}
	} catch {
		return null
	}
}

async function validateSingleSessionKey(
	entry: unknown,
	certificate: Uint8Array,
): Promise<ValidatedSessionKey | null> {
	const fields = extractSessionKeyFields(entry)
	if (!fields) return null
	return verifyAndConvertKey(fields, certificate)
}

async function validateSessionKeys(
	assertion: C2paAssertion,
	certificate: Uint8Array,
): Promise<ValidatedSessionKey[]> {
	const keyEntries = extractKeyArray(ensureDecodedCbor(assertion.data))
	const results = await Promise.all(
		keyEntries.map(entry => validateSingleSessionKey(entry, certificate)),
	)
	return results.filter((key): key is ValidatedSessionKey => key !== null)
}

/**
 * Validates a C2PA init segment: parses the manifest, extracts and verifies
 * the certificate, validates the BMFF hard binding hash, verifies all
 * session keys from the `c2pa.session-keys` assertion, and performs
 * manifest integrity checks (assertion hashes, missing assertions,
 * action ingredients, and claim signature verification).
 *
 * Only session keys with a valid signer binding and an unexpired validity period
 * are included in the result.
 *
 * @param bytes - Raw init segment bytes
 * @returns Structured validation result (with `INIT_INVALID` error code if `mdat` box is present)
 * @throws If no C2PA UUID box is found
 *
 * @example
 * {@includeCode ../../test/init/validateC2paInitSegment.test.ts#example}
 *
 * @public
 */
export async function validateC2paInitSegment(bytes: Uint8Array): Promise<InitSegmentValidation> {
	const boxes = readIsoBoxes(bytes)
	if (findIsoBox(boxes, box => box.type === 'mdat')) {
		return {
			activeManifest: null,
			certificate: null,
			manifestId: null,
			sessionKeys: [],
			isValid: false,
			errorCodes: [LiveVideoStatusCode.INIT_INVALID],
		}
	}

	const internalData = readC2paManifestInternal(bytes)
	const { manifest: activeManifest } = internalData
	const certificate = extractManifestCertificate(bytes)

	const bmffHashAssertion =
		activeManifest.assertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL) ?? null
	const bmffHashValid = await validateBmffHashAssertion(bytes, bmffHashAssertion)

	const sessionKeysAssertion = activeManifest.assertions.find(
		a => a.label === SESSION_KEYS_ASSERTION_LABEL,
	)
	const sessionKeys =
		sessionKeysAssertion && certificate
			? await validateSessionKeys(sessionKeysAssertion, certificate)
			: []

	const integrityCodes = await validateManifestIntegrity(internalData, certificate)

	const codes = new Set<LiveVideoStatusCode | C2paStatusCode>()
	if (!bmffHashValid) codes.add(LiveVideoStatusCode.INIT_INVALID)
	if (sessionKeys.length === 0) codes.add(LiveVideoStatusCode.SESSIONKEY_INVALID)
	for (const code of integrityCodes) codes.add(code)
	const errorCodes = [...codes]

	return {
		activeManifest,
		certificate,
		manifestId: activeManifest.label,
		sessionKeys,
		isValid: errorCodes.length === 0,
		errorCodes,
	}
}
