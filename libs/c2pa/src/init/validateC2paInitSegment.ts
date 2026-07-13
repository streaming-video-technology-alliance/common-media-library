import { decode } from 'cbor-x/decode'
import { encode } from 'cbor-x/encode'
import { findIsoBox, readIsoBoxes } from '@svta/cml-iso-bmff'
import type { C2paAssertion } from '../C2paAssertion.ts'
import { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { readC2paManifest } from '../readC2paManifest.ts'
import { extractCertificateFromSignatureBytes } from '../extractManifestCertificate.ts'
import { validateBmffHash } from '../bmff/validateBmffHash.ts'
import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import { validateManifestIntegrity } from '../claim/validateManifestIntegrity.ts'
import { convertCoseKeyToJwk } from '../cose/convertCoseKeyToJwk.ts'
import { verifySignerBinding } from '../cose/verifySignerBinding.ts'
import type { InitSegmentValidation, ValidatedSessionKey } from './InitSegmentValidation.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { parseExclusions } from '../bmff/parseExclusions.ts'
import type { MerkleMap } from '../merkle/MerkleSegmentValidation.ts'
import { asInteger, bytesToHex, hashesEqual, isKeyExpired, normalizeAlgorithmName } from '../utils.ts'

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
	if (value instanceof Uint8Array) return decode(value)
	if (Array.isArray(value) && value.length > 0 && typeof (value as number[])[0] === 'number') {
		return decode(new Uint8Array(value as number[]))
	}
	return value
}

function parseCreatedAt(value: unknown): string | null {
	const resolved = extractCborTaggedValue(value) ?? value
	if (typeof resolved === 'string') return resolved
	if (resolved instanceof Date) return resolved.toISOString()
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
	const alg = normalizeAlgorithmName(data['alg'] as string | undefined)
	const exclusions = (data['exclusions'] as BmffHashExclusion[] | undefined) ?? []
	return validateBmffHash(bytes, expectedHash, { exclusions, alg })
}

// --- VOD Merkle: merkle map extraction (§18.6) ---

function toBytesOrNull(value: unknown): Uint8Array | null {
	try {
		return normalizeToUint8Array(value)
	} catch {
		return null
	}
}

function parseMerkleRow(rawHashes: unknown): Uint8Array[] | null {
	if (!Array.isArray(rawHashes) || rawHashes.length === 0) return null
	const row: Uint8Array[] = []
	for (const entry of rawHashes) {
		const bytes = toBytesOrNull(entry)
		if (!bytes) return null
		row.push(bytes)
	}
	return row
}

/**
 * Parses the `merkle` array of a `c2pa.hash.bmff.v3` assertion into one
 * MerkleMap per track. The `exclusions` are taken from the parent assertion
 * data and shared across all tracks; per-entry `alg` overrides the
 * assertion-level `alg`. Returns `null` when `merkle` is not a non-empty
 * array or an entry is missing required fields.
 */
function extractMerkleMaps(bmffHashAssertionData: Record<string, unknown>): MerkleMap[] | null {
	const rawMerkle = bmffHashAssertionData['merkle']
	if (!Array.isArray(rawMerkle) || rawMerkle.length === 0) return null

	const exclusions = parseExclusions(bmffHashAssertionData['exclusions'])
	const assertionAlg = bmffHashAssertionData['alg']
	// §18.6.2: the box offset prefix is omitted only when the assertion carries both `hash` and `merkle`.
	const offsetPrefixSize = bmffHashAssertionData['hash'] == null ? 8 : 0

	const maps: MerkleMap[] = []
	for (const entry of rawMerkle) {
		if (!entry || typeof entry !== 'object') return null
		const record = entry as Record<string, unknown>

		const uniqueId = asInteger(record['uniqueId'])
		const localId = asInteger(record['localId'])
		const count = asInteger(record['count'])
		const hashes = parseMerkleRow(record['hashes'])
		if (uniqueId === null || localId === null || count === null || !hashes) return null

		const rawInitHash = record['initHash']
		const initHash = rawInitHash == null ? null : toBytesOrNull(rawInitHash)
		if (rawInitHash != null && !initHash) return null

		const rawAlg = record['alg'] ?? assertionAlg
		maps.push({
			uniqueId,
			localId,
			count,
			hashes,
			initHash,
			alg: typeof rawAlg === 'string' ? normalizeAlgorithmName(rawAlg) : null,
			exclusions,
			offsetPrefixSize,
		})
	}
	return maps
}

/**
 * Extracts the merkle maps from the `c2pa.hash.bmff.v3` assertion and
 * validates each entry's `initHash` binding against the raw init segment
 * bytes (§18.6.2); entries without an `initHash` (single-file fMP4) skip the
 * check. Adds error codes to `codes` in place. Returns `null` when the
 * assertion has no `merkle` field (the stream is not in VOD Merkle mode)
 * and `[]` when the field is malformed.
 */
async function validateMerkleMaps(
	bytes: Uint8Array,
	assertion: C2paAssertion | null,
	codes: Set<LiveVideoStatusCode | C2paStatusCode>,
): Promise<MerkleMap[] | null> {
	const data = assertion?.data
	if (data === null || typeof data !== 'object' || Array.isArray(data)) return null
	if ((data as Record<string, unknown>)['merkle'] === undefined) return null

	const merkleMaps = extractMerkleMaps(data as Record<string, unknown>)
	if (!merkleMaps) {
		codes.add(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED)
		return []
	}

	// All entries share exclusions and offsetPrefixSize, so the init hash only varies by alg.
	const initHashByAlg = new Map<string | null, Uint8Array>()
	for (const merkleMap of merkleMaps) {
		if (!merkleMap.initHash) continue
		let computed = initHashByAlg.get(merkleMap.alg)
		if (!computed) {
			computed = await computeBmffHash(bytes, {
				offsetPrefixSize: merkleMap.offsetPrefixSize,
				exclusions: merkleMap.exclusions,
				alg: merkleMap.alg ?? undefined,
			})
			initHashByAlg.set(merkleMap.alg, computed)
		}
		if (!hashesEqual(computed, merkleMap.initHash)) {
			codes.add(LiveVideoStatusCode.INIT_INVALID)
			codes.add(C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH)
		}
	}

	return merkleMaps
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
	const certificate = internalData.signatureBytes
		? extractCertificateFromSignatureBytes(internalData.signatureBytes)
		: null

	const bmffHashAssertion =
		manifest.assertions.find(a => a.label === BMFF_HASH_ASSERTION_LABEL) ?? null
	const bmffHashValid = await validateBmffHashAssertion(bytes, bmffHashAssertion)

	const sessionKeysAssertion = manifest.assertions.find(
		a => a.label === SESSION_KEYS_ASSERTION_LABEL,
	)
	const sessionKeys =
		sessionKeysAssertion && certificate
			? await validateSessionKeys(sessionKeysAssertion, certificate)
			: []

	const integrityCodes = await validateManifestIntegrity(internalData, certificate)

	const codes = new Set<LiveVideoStatusCode | C2paStatusCode>()
	const merkleMaps = await validateMerkleMaps(bytes, bmffHashAssertion, codes)

	if (!bmffHashValid) codes.add(LiveVideoStatusCode.INIT_INVALID)
	// VOD Merkle streams carry no session keys — only flag their absence in live mode.
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
