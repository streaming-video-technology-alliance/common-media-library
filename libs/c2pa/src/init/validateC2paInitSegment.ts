import { findIsoBox, readIsoBoxes } from '@svta/cml-iso-bmff'
import { CborTag, decodeCbor } from '../cbor/readCborItem.ts'
import type { C2paAssertion } from '../C2paAssertion.ts'
import { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { parseExclusions } from '../bmff/parseExclusions.ts'
import { readRootBoxes } from '../bmff/readRootBoxes.ts'
import { shouldExcludeBox } from '../bmff/shouldExcludeBox.ts'
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

// §18.25.3: an inline COSE_Sign1 passes through as the bytes of the tagged item
function normalizeToUint8Array(value: unknown): Uint8Array {
	if (value instanceof Uint8Array) return value
	if (value instanceof CborTag) return value.bytes
	throw new Error('Cannot convert value to Uint8Array')
}

function ensureDecodedCbor(value: unknown): unknown {
	return value instanceof Uint8Array ? decodeCbor(value) : value
}

// RFC 8949 section 3.4.1: the date-time of RFC 3339, as refined by RFC 4287 section 3.3 (C2PA section 6.9)
const RFC_3339_DATE_TIME = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3])(:[0-5]\d){2}(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/
const CBOR_TAG_DATE_TIME = 0

// §18.25.2: CBOR tag 0 with an RFC 3339 date-time
function parseCreatedAt(value: unknown): string | null {
	if (!(value instanceof CborTag) || value.tag !== CBOR_TAG_DATE_TIME) return null
	const text = value.value
	if (typeof text !== 'string' || !RFC_3339_DATE_TIME.test(text)) return null
	// Date rolls a day that does not exist over to the next month
	if (new Date(text.slice(0, 10)).getUTCDate() !== Number(text.slice(8, 10))) return null
	return new Date(text).toISOString()
}

// §18.25.2: the COSE key includes the kid (COSE key label 2, RFC 9052)
function extractKidHex(coseKey: unknown): string | null {
	const coseKid = (coseKey as Record<number, unknown>)[COSE_KEY_ID_LABEL]
	return coseKid instanceof Uint8Array ? bytesToHex(coseKid) : null
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

type BmffHashCode =
	| typeof LiveVideoStatusCode.INIT_INVALID
	| typeof C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	| typeof C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH

// hashIncludesMoov must see the same root boxes as computeBmffHash.
function hashIncludesMoov(bytes: Uint8Array, exclusions: readonly BmffHashExclusion[]): boolean {
	const moov = readRootBoxes(bytes).find(box => box.type === 'moov')
	return moov !== undefined && !shouldExcludeBox(moov, exclusions)
}

// Checks the `c2pa.hash.bmff.v3` assertion and its flat content hash. Returns the status code of the failure, or null.
async function validateBmffHashAssertion(
	bytes: Uint8Array,
	assertion: C2paAssertion | null,
): Promise<BmffHashCode | null> {
	if (!assertion) return null
	if (assertion.data === null || typeof assertion.data !== 'object' || Array.isArray(assertion.data)) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	const data = assertion.data as Record<string, unknown>
	// §18.6.6.1 step 2: a Merkle initHash verifies the init, so only an init with Merkle maps may omit `hash`.
	// validateMerkleMaps checks each map.
	const rawHash = data['hash']
	const merkle = data['merkle']
	const hash = rawHash instanceof Uint8Array ? rawHash : null
	if (!hash && !(rawHash == null && Array.isArray(merkle) && merkle.length > 0)) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	const exclusions = parseExclusions(data['exclusions'])
	if (!exclusions) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	// §19.2.3: the bmff-hash-map of an init segment includes the moov box
	if (!hashIncludesMoov(bytes, exclusions)) return LiveVideoStatusCode.INIT_INVALID
	if (!hash) return null
	const alg = normalizeAlgorithmName(data['alg'] as string | undefined)
	// §18.6.2: the flat v2/v3 hash covers offset || data for every non-excluded root
	// box; only Merkle tree hashes may omit the 8-byte offset prefix.
	const computed = await computeBmffHash(bytes, { exclusions, alg, offsetPrefixSize: 8 })
	return hashesEqual(computed, hash) ? null : C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH
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

function extractSessionKeyFields(entry: unknown): SessionKeyFields | null {
	const keyData = entry as Record<string, unknown>

	const minSequenceNumber = asUnsignedInteger(keyData['minSequenceNumber'])
	const validityPeriod = asUnsignedInteger(keyData['validityPeriod'])
	const createdAt = parseCreatedAt(keyData['createdAt'])

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
	certificate: Uint8Array,
): Promise<ValidatedSessionKey | null> {
	try {
		const fields = extractSessionKeyFields(entry)
		if (!fields) return null
		return await verifyAndConvertKey(fields, certificate)
	} catch {
		return null
	}
}

function isWithinValidityPeriod(key: ValidatedSessionKey): boolean {
	return !isKeyExpired(key.createdAt, key.validityPeriod)
}

async function validateSessionKeys(
	assertion: InternalAssertionData,
	certificate: Uint8Array,
): Promise<SessionKeysValidation> {
	// §18.25.2: the assertion is a map with a keys array of one or more session keys
	const keyEntries = extractKeyArray(assertion.taggedData)
	const results = await Promise.all(keyEntries.map(entry => validateSingleSessionKey(entry, certificate)))
	const validKeys = results.filter((key): key is ValidatedSessionKey => key !== null)
	return {
		sessionKeys: validKeys.filter(isWithinValidityPeriod),
		hasInvalidSessionKey: keyEntries.length === 0 || validKeys.length < results.length,
	}
}

/**
 * Validates a C2PA init segment: parses the manifest, extracts and verifies
 * the certificate, validates the BMFF hard binding hash, verifies all
 * session keys from the `c2pa.session-keys` assertion, and performs
 * manifest integrity checks (assertion references and hashes, undeclared
 * assertions, the hard binding count, duplicate manifest boxes, action
 * ingredients, and claim signature verification).
 *
 * Only session keys with a valid signer binding and an unexpired validity period
 * are included in the result. The result holds `sessionKeys` and `merkleMaps` only when
 * every manifest integrity check and every content hash check pass, so check `isValid`
 * before you use either list.
 *
 * The result includes `LiveVideoStatusCode.SESSIONKEY_INVALID` if the function finds an invalid
 * session key (C2PA section 19.7.3). A session key is invalid if it does not conform to section 18.25.2,
 * or if its signer binding fails verification. The function does not check every rule of section 18.25.2.
 * An expired session key does not count as invalid. A `c2pa.session-keys` assertion without a session key,
 * or with CBOR that does not decode, also causes `SESSIONKEY_INVALID`. An init segment without a
 * `c2pa.session-keys` assertion does not cause `SESSIONKEY_INVALID`. In a section 19.4 stream, an empty
 * `sessionKeys` list makes each VSI segment fail with `SEGMENT_INVALID`.
 *
 * @param bytes - Raw init segment bytes
 * @returns Structured validation result. It has `INIT_INVALID` if the segment has an `mdat` box or no `c2pa.hash.bmff.v3` assertion. It also has `INIT_INVALID` if the content hash does not include the `moov` box (C2PA section 19.2.3). A manifest without a hard binding assertion also has `CLAIM_HARD_BINDINGS_MISSING`. A content hash that does not match adds `INIT_INVALID` and `ASSERTION_BMFFHASH_MISMATCH`. A `c2pa.hash.bmff.v3` assertion that does not conform to the `bmff-hash-map` adds `ASSERTION_BMFFHASH_MALFORMED`.
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
	const { codes: integrityCodes, certificate, verifiedAssertions } = await validateManifestIntegrity(internalData)

	const bmffHashAssertion =
		verifiedAssertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL) ?? null
	// §19.2.3: the manifest of an init segment has a c2pa.hash.bmff.v3 assertion. An assertion
	// in the store that the claim does not verify reports an integrity code instead.
	const bmffHashMissing = !internalData.assertions.some(a => a.label === BMFF_HASH_ASSERTION_LABEL)
	const bmffHashCode = bmffHashMissing
		? LiveVideoStatusCode.INIT_INVALID
		: await validateBmffHashAssertion(bytes, bmffHashAssertion)

	const merkleCodes = new Set<LiveVideoStatusCode | C2paStatusCode>()
	const merkleMaps = await validateMerkleMaps(bytes, bmffHashAssertion, merkleCodes)
	const codes = new Set<LiveVideoStatusCode | C2paStatusCode>(merkleCodes)

	const sessionKeysAssertion = verifiedAssertions.find(
		a => a.label === SESSION_KEYS_ASSERTION_LABEL,
	)
	const sessionKeysValidation =
		sessionKeysAssertion && certificate
			? await validateSessionKeys(sessionKeysAssertion, certificate)
			: { sessionKeys: [], hasInvalidSessionKey: false }
	// The result exposes session keys and merkle maps only when every integrity check and every content hash check pass.
	const integrityPassed = integrityCodes.length === 0 && bmffHashCode === null && merkleCodes.size === 0
	const sessionKeys = integrityPassed ? sessionKeysValidation.sessionKeys : []
	const exposedMerkleMaps = integrityPassed ? (merkleMaps ?? []) : []

	// A content hash that does not match fails the init segment. A malformed assertion reports only its own code.
	if (bmffHashCode === C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH) codes.add(LiveVideoStatusCode.INIT_INVALID)
	if (bmffHashCode) codes.add(bmffHashCode)
	if (sessionKeysValidation.hasInvalidSessionKey) codes.add(LiveVideoStatusCode.SESSIONKEY_INVALID)
	for (const code of integrityCodes) codes.add(code)
	const errorCodes = [...codes]

	return {
		manifest,
		certificate,
		manifestId: internalData.manifestId,
		sessionKeys,
		merkleMaps: exposedMerkleMaps,
		isValid: errorCodes.length === 0,
		errorCodes,
	}
}
