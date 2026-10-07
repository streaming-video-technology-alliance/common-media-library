import { decode } from 'cbor-x/decode'
import { encode } from 'cbor-x/encode'
import { findIsoBox, readIsoBoxes } from '@svta/cml-iso-bmff'
import { decodeCbor } from '../cbor/decodeCbor.ts'
import type { C2paAssertion } from '../C2paAssertion.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import type { InternalAssertionData } from '../claim/InternalManifestData.ts'
import { validateManifestIntegrity } from '../claim/validateManifestIntegrity.ts'
import { convertCoseKeyToJwk } from '../cose/convertCoseKeyToJwk.ts'
import { verifySignerBinding } from '../cose/verifySignerBinding.ts'
import type { InitSegmentValidation, ValidatedSessionKey } from './InitSegmentValidation.ts'
import { validateMerkleMaps } from '../merkle/validateMerkleMaps.ts'
import { asUnsignedInteger, bytesToHex, hashesEqual, isKeyExpired, normalizeAlgorithmName } from '../utils.ts'

const BMFF_HASH_ASSERTION_LABEL = 'c2pa.hash.bmff.v3'
const SESSION_KEYS_ASSERTION_LABEL = 'c2pa.session-keys'
const COSE_KEY_ID_LABEL = 2

// cbor-x represents CBOR tagged values in multiple ways depending on version/config:
// - { tag: number, value: unknown } (structured)
// - Tag class instance with constructor name 'Tag'
// - { '@@TAGGED@@': [tag, value] } (internal key)
const CBOR_TAGGED_KEY = '@@TAGGED@@'

function extractCborTaggedValue(value: unknown): unknown | null {
	if (typeof value !== 'object' || value === null) return null
	const obj = value as Record<string, unknown>
	if (typeof obj['tag'] === 'number' && 'value' in obj) return obj['value']
	const tagged = obj[CBOR_TAGGED_KEY]
	if (Array.isArray(tagged) && tagged.length === 2) return tagged[1]
	return null
}

function normalizeToUint8Array(value: unknown): Uint8Array {
	if (value instanceof Uint8Array) return value
	if (Array.isArray(value)) return new Uint8Array(value as number[])
	if (extractCborTaggedValue(value) !== null) return encode(value) as Uint8Array
	throw new Error('Cannot convert value to Uint8Array')
}

function ensureDecodedCbor(value: unknown): unknown {
	if (value instanceof Uint8Array) return decodeCbor(value)
	if (Array.isArray(value) && value.length > 0 && typeof (value as number[])[0] === 'number') {
		return decodeCbor(new Uint8Array(value as number[]))
	}
	return value
}

// RFC 8949 section 3.4.1: the date-time of RFC 3339, as refined by RFC 4287 section 3.3 (C2PA section 6.9)
const RFC_3339_DATE_TIME = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3])(:[0-5]\d){2}(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/
const CBOR_BREAK = 0xff

// A private key marks a real CBOR tag (RFC 8949 section 3.4), so a CBOR map with "tag" and "value" keys is not mistaken for one.
const CBOR_TAG = Symbol()

// Decodes CBOR like cbor-x, but marks each tag with CBOR_TAG. cbor-x converts tags 0 and 1 to a Date.
function decodeWithTags(cbor: Uint8Array): unknown {
	let offset = 0
	const read = (): unknown => {
		const start = offset
		const initialByte = cbor[offset++]
		const majorType = initialByte >> 5
		const additionalInfo = initialByte & 31
		const isContainer = majorType === 4 || majorType === 5
		let argument = additionalInfo
		if (additionalInfo > 23 && additionalInfo < 28) {
			let size = 1 << (additionalInfo - 24)
			for (argument = 0; size--;) argument = argument * 256 + cbor[offset++]
		}
		const indefinite = additionalInfo === 31 && isContainer
		if ((additionalInfo > 27 && !indefinite) || !(offset <= cbor.length)) throw new RangeError('Malformed CBOR')
		if (isContainer) {
			// RFC 8949 section 3.2.2: an array or a map of indefinite length ends with the break code
			const items: unknown[] = []
			const itemCount = majorType === 5 ? 2 * argument : argument
			while (indefinite ? cbor[offset] !== CBOR_BREAK : items.length < itemCount) items.push(read())
			if (indefinite) offset++
			if (majorType === 4) return items
			// Without a prototype, a "__proto__" key is a plain key
			const map: Record<string, unknown> = Object.create(null)
			for (let i = 0; i < items.length; i += 2) map[items[i] as string] = items[i + 1]
			return map
		}
		if (majorType === 6) return { [CBOR_TAG]: argument, value: read() }
		if (majorType === 2 || majorType === 3) offset += argument
		return decode(cbor.subarray(start, offset))
	}
	return read()
}

// §18.25.2: CBOR tag 0 with an RFC 3339 date-time
function parseCreatedAt(value: unknown): string | null {
	const tagged = value as Record<symbol | string, unknown> | null
	const text = tagged?.['value']
	if (tagged?.[CBOR_TAG] !== 0 || typeof text !== 'string' || !RFC_3339_DATE_TIME.test(text)) return null
	// Date rolls a day that does not exist over to the next month
	if (new Date(text.slice(0, 10)).getUTCDate() !== Number(text.slice(8, 10))) return null
	return new Date(text).toISOString()
}

// §18.25.2: the COSE key includes the kid (COSE key label 2, RFC 9052)
function extractKidHex(coseKey: unknown): string | null {
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
	const alg = normalizeAlgorithmName(data['alg'] as string | undefined)
	const exclusions = (data['exclusions'] as BmffHashExclusion[] | undefined) ?? []
	// §18.6.2: the flat v2/v3 hash covers offset || data for every non-excluded root
	// box; only Merkle tree hashes may omit the 8-byte offset prefix.
	const computed = await computeBmffHash(bytes, { exclusions, alg, offsetPrefixSize: 8 })
	return hashesEqual(computed, expectedHash)
}

type SessionKeyFields = {
	minSequenceNumber: number
	validityPeriod: number
	createdAt: string
	kid: string
	coseKey: unknown
	signerBindingBytes: Uint8Array
}

type SessionKeysValidation = {
	readonly sessionKeys: ValidatedSessionKey[]
	readonly hasInvalidSessionKey: boolean
}

function extractSessionKeyFields(entry: unknown, taggedEntry: unknown): SessionKeyFields | null {
	const keyData = entry as Record<string, unknown>

	const minSequenceNumber = asUnsignedInteger(keyData['minSequenceNumber'])
	const validityPeriod = asUnsignedInteger(keyData['validityPeriod'])
	const createdAt = parseCreatedAt((taggedEntry as Record<string, unknown> | undefined)?.['createdAt'])

	if (minSequenceNumber === null || validityPeriod === null || !createdAt) return null

	const coseKey = ensureDecodedCbor(keyData['key'])
	const kid = extractKidHex(coseKey)
	if (!kid) return null

	const signerBindingRaw = keyData['signerBinding']
	if (!signerBindingRaw) return null

	return {
		minSequenceNumber,
		validityPeriod,
		createdAt,
		kid,
		coseKey,
		signerBindingBytes: normalizeToUint8Array(signerBindingRaw),
	}
}

async function verifyAndConvertKey(
	fields: SessionKeyFields,
	certificate: Uint8Array,
): Promise<ValidatedSessionKey | null> {
	const isBindingValid = await verifySignerBinding(fields.signerBindingBytes, fields.coseKey, certificate)
	if (!isBindingValid) return null

	return {
		kid: fields.kid,
		jwk: convertCoseKeyToJwk(fields.coseKey),
		minSequenceNumber: fields.minSequenceNumber,
		validityPeriod: fields.validityPeriod,
		createdAt: fields.createdAt,
	}
}

async function validateSingleSessionKey(
	entry: unknown,
	taggedEntry: unknown,
	certificate: Uint8Array,
): Promise<ValidatedSessionKey | null> {
	try {
		const fields = extractSessionKeyFields(entry, taggedEntry)
		if (!fields) return null
		return await verifyAndConvertKey(fields, certificate)
	} catch {
		return null
	}
}

function isWithinValidityPeriod(key: ValidatedSessionKey): boolean {
	return !isKeyExpired(key.createdAt, key.validityPeriod)
}

// The session key entries with their CBOR tags, in the same order as the decoded entries
function readTaggedKeyEntries(cborBytes: Uint8Array | undefined): unknown[] {
	try {
		return cborBytes ? extractKeyArray(decodeWithTags(cborBytes)) : []
	} catch {
		return []
	}
}

async function validateSessionKeys(
	assertion: InternalAssertionData,
	certificate: Uint8Array,
): Promise<SessionKeysValidation> {
	const keyEntries = extractKeyArray(ensureDecodedCbor(assertion.data))
	const taggedKeyEntries = readTaggedKeyEntries(assertion.cborBytes)
	const results = await Promise.all(
		keyEntries.map((entry, index) => validateSingleSessionKey(entry, taggedKeyEntries[index], certificate)),
	)
	const validKeys = results.filter((key): key is ValidatedSessionKey => key !== null)
	return {
		sessionKeys: validKeys.filter(isWithinValidityPeriod),
		hasInvalidSessionKey: validKeys.length < results.length,
	}
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
 * The result includes `LiveVideoStatusCode.SESSIONKEY_INVALID` if the function finds an invalid
 * session key (C2PA section 19.7.3). A session key is invalid if it does not conform to section 18.25.2,
 * or if its signer binding fails verification. The function does not check every rule of section 18.25.2.
 * An expired session key does not count as invalid.
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
			manifest: null,
			certificate: null,
			manifestId: null,
			sessionKeys: [],
			merkleMaps: [],
			isValid: false,
			errorCodes: [LiveVideoStatusCode.INIT_INVALID],
		}
	}

	const internalData = readC2paManifest(bytes, boxes)
	const { manifest } = internalData
	const { codes: integrityCodes, certificate } = await validateManifestIntegrity(internalData)

	const bmffHashAssertion =
		manifest.assertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL) ?? null
	const bmffHashValid = await validateBmffHashAssertion(bytes, bmffHashAssertion)

	const sessionKeysAssertion = manifest.assertions.find(
		a => a.label === SESSION_KEYS_ASSERTION_LABEL,
	)
	// manifest.assertions has the order of internalData.assertions
	const { sessionKeys, hasInvalidSessionKey } =
		sessionKeysAssertion && certificate
			? await validateSessionKeys(internalData.assertions[manifest.assertions.indexOf(sessionKeysAssertion)], certificate)
			: { sessionKeys: [], hasInvalidSessionKey: false }

	const codes = new Set<LiveVideoStatusCode | C2paStatusCode>()
	const merkleMaps = await validateMerkleMaps(bytes, bmffHashAssertion, codes)

	if (!bmffHashValid) codes.add(LiveVideoStatusCode.INIT_INVALID)
	if (hasInvalidSessionKey) codes.add(LiveVideoStatusCode.SESSIONKEY_INVALID)
	// VOD Merkle streams carry no session keys; only flag their absence in live mode.
	if (sessionKeys.length === 0 && merkleMaps === null) {
		codes.add(LiveVideoStatusCode.SESSIONKEY_INVALID)
	}
	for (const code of integrityCodes) codes.add(code)
	const errorCodes = [...codes]

	return {
		manifest,
		certificate,
		manifestId: manifest.instanceId,
		sessionKeys,
		merkleMaps: merkleMaps ?? [],
		isValid: errorCodes.length === 0,
		errorCodes,
	}
}
