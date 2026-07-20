import { readIsoBoxes } from '@svta/cml-iso-bmff'
import { decodeMultiple } from 'cbor-x/decode'
import { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { JUMBF_UUID, asInteger, bytesToHex, hashesEqual, matchesUuid, normalizeAlgorithmName, readUuidBoxPurpose, toUint8Array } from '../utils.ts'
import type { UuidParsedBox } from '../utils.ts'
import type { MerkleMap, MerkleSegmentState, MerkleSegmentValidation } from './MerkleSegmentValidation.ts'

type MerkleValidationCode = LiveVideoStatusCode | C2paStatusCode

const MERKLE_BOX_PURPOSE = 'merkle'

// --- Auxiliary uuid box extraction ---

type AuxPayload = Uint8Array | 'other' | 'malformed'

// §A.5.1.2/A.5.4.1.4: version/flags + null-terminated box_purpose + raw data.
function readAuxPayload(rawPayload: Uint8Array): AuxPayload {
	const prefix = readUuidBoxPurpose(rawPayload)
	if (!prefix || prefix.purpose !== MERKLE_BOX_PURPOSE) return 'other'
	return prefix.rest
}

function extractMerkleAuxBoxes(segmentBytes: Uint8Array): { payloads: Uint8Array[]; malformed: boolean } {
	const payloads: Uint8Array[] = []
	let malformed = false

	for (const box of readIsoBoxes(segmentBytes)) {
		const uuidBox = box as unknown as UuidParsedBox
		if (uuidBox.type !== 'uuid') continue
		const usertype = uuidBox.usertype ?? []
		if (!matchesUuid(usertype, JUMBF_UUID)) continue

		const rawPayload = uuidBox.view.readData(uuidBox.view.bytesRemaining) as Uint8Array
		const payload = readAuxPayload(rawPayload)
		if (payload === 'malformed') malformed = true
		else if (payload !== 'other') payloads.push(payload)
	}

	return { payloads, malformed }
}

// --- bmff-merkle-map decoding ---

type BmffMerkleMapSegment = {
	readonly uniqueId: number
	readonly localId: number
	readonly location: number
	/** Sibling proof path; null when the manifest stores the leaf row */
	readonly hashes: readonly (Uint8Array | null)[] | null
}

function readMapField(map: unknown, name: string): unknown {
	if (map instanceof Map) return map.get(name)
	return (map as Record<string, unknown>)[name]
}

// §A.5.4.1.4: multiple merkle boxes for one tree are padded to a fixed size,
// so trailing bytes after the CBOR item are expected and not part of the data.
function decodeFirstCbor(payload: Uint8Array): unknown {
	let first: unknown
	let found = false
	try {
		decodeMultiple(payload, value => {
			first = value
			found = true
			return false
		})
	} catch {
		return undefined
	}
	return found ? first : undefined
}

function parseBmffMerkleMap(payload: Uint8Array): BmffMerkleMapSegment | null {
	const decoded = decodeFirstCbor(payload)
	if (decoded === null || decoded === undefined || typeof decoded !== 'object') return null

	const uniqueId = asInteger(readMapField(decoded, 'uniqueId'))
	const localId = asInteger(readMapField(decoded, 'localId'))
	const location = asInteger(readMapField(decoded, 'location'))
	if (uniqueId === null || localId === null || location === null) return null

	const rawHashes = readMapField(decoded, 'hashes')
	if (rawHashes == null) return { uniqueId, localId, location, hashes: null }
	if (!Array.isArray(rawHashes)) return null

	const hashes: (Uint8Array | null)[] = []
	for (const entry of rawHashes) {
		if (entry == null) {
			hashes.push(null)
			continue
		}
		const bytes = toUint8Array(entry)
		if (!bytes) return null
		hashes.push(bytes)
	}
	return { uniqueId, localId, location, hashes }
}

// --- Merkle proof traversal ---

async function hashPair(left: Uint8Array, right: Uint8Array, alg: string): Promise<Uint8Array> {
	const input = new Uint8Array(left.length + right.length)
	input.set(left, 0)
	input.set(right, left.length)
	return new Uint8Array(await crypto.subtle.digest(alg, input))
}

// Layer sizes, leaf level first (61 → [61, 31, 16, 8, 4, 2, 1]).
function treeLayout(leafCount: number): number[] {
	const layers = [leafCount]
	while (layers[layers.length - 1] > 1) {
		layers.push(Math.ceil(layers[layers.length - 1] / 2))
	}
	return layers
}

// §15.12.2.2: hash from the leaf up to the layer matching the manifest row length.
async function verifyMerkleProof(
	leafHash: Uint8Array,
	location: number,
	proofPath: readonly (Uint8Array | null)[] | null,
	merkleMap: MerkleMap,
): Promise<'ok' | MerkleValidationCode> {
	const { count, hashes: manifestRow } = merkleMap
	if (location < 0 || location >= count) {
		return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	}

	const layers = treeLayout(count)
	const committedLevel = layers.indexOf(manifestRow.length)
	if (committedLevel === -1) {
		return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	}

	const rawPath = proofPath ?? []
	if (rawPath.length > committedLevel) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	const path = rawPath.filter((node): node is Uint8Array => node !== null)

	const alg = normalizeAlgorithmName(merkleMap.alg ?? undefined)

	let currentHash = leafHash
	let currentIndex = location
	let proofIndex = 0
	for (const layer of layers) {
		if (layer === manifestRow.length) {
			break
		}
		const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1
		if (siblingIndex >= 0 && siblingIndex < layer) {
			const sibling = path[proofIndex++]
			if (!sibling) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
			currentHash = currentIndex % 2 === 0
				? await hashPair(currentHash, sibling, alg)
				: await hashPair(sibling, currentHash, alg)
		}
		currentIndex = Math.floor(currentIndex / 2)
	}

	if (proofIndex !== path.length) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED

	const expected = manifestRow[currentIndex]
	if (!expected) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	return hashesEqual(currentHash, expected) ? 'ok' : C2paStatusCode.ASSERTION_BMFFHASH_MISMATCH
}

// --- Public API ---

function findMerkleMap(
	merkleMaps: readonly MerkleMap[],
	uniqueId: number,
	localId: number,
): MerkleMap | null {
	return merkleMaps.find(m => m.uniqueId === uniqueId && m.localId === localId) ?? null
}

type LeafHashCache = {
	alg: string | null
	offsetPrefixSize: number
	exclusions: MerkleMap['exclusions']
	hash: Uint8Array
}[]

async function computeLeafHash(
	segmentBytes: Uint8Array,
	merkleMap: MerkleMap,
	cache: LeafHashCache,
): Promise<Uint8Array> {
	const cached = cache.find(entry =>
		entry.alg === merkleMap.alg &&
		entry.offsetPrefixSize === merkleMap.offsetPrefixSize &&
		entry.exclusions === merkleMap.exclusions,
	)
	if (cached) return cached.hash

	const hash = await computeBmffHash(segmentBytes, {
		offsetPrefixSize: merkleMap.offsetPrefixSize,
		exclusions: merkleMap.exclusions,
		alg: merkleMap.alg ?? undefined,
	})
	cache.push({
		alg: merkleMap.alg,
		offsetPrefixSize: merkleMap.offsetPrefixSize,
		exclusions: merkleMap.exclusions,
		hash,
	})
	return hash
}

/**
 * Validates a fragmented MP4 VOD media segment against the init manifest's
 * merkle maps (§15.12.2.2). Pure: the caller persists `nextState` and resets
 * `state` after a seek. Returns `null` when `merkleMaps` is empty.
 *
 * @example
 * {@includeCode ../../test/merkle/validateC2paMerkleSegment.test.ts#example}
 *
 * @public
 */
export async function validateC2paMerkleSegment(
	segmentBytes: Uint8Array,
	merkleMaps: readonly MerkleMap[],
	state?: MerkleSegmentState,
): Promise<{
	readonly result: MerkleSegmentValidation
	readonly nextState: MerkleSegmentState
} | null> {
	if (merkleMaps.length === 0) return null

	const previousLocations = state?.lastLocations ?? new Map<string, number>()
	const nextLocations = new Map(previousLocations)
	const codes = new Set<MerkleValidationCode>()
	const leafHashCache: LeafHashCache = []
	let location: number | null = null
	let bmffHashHex: string | null = null

	const { payloads, malformed } = extractMerkleAuxBoxes(segmentBytes)
	if (malformed || payloads.length === 0) {
		codes.add(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED)
	}

	for (const payload of payloads) {
		const segmentMap = parseBmffMerkleMap(payload)
		if (!segmentMap) {
			codes.add(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED)
			continue
		}

		const merkleMap = findMerkleMap(merkleMaps, segmentMap.uniqueId, segmentMap.localId)
		if (!merkleMap) {
			codes.add(C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED)
			continue
		}

		if (location === null) location = segmentMap.location

		// §15.12.2: each track's location must increment by 1 during sequential playback.
		const trackKey = `${segmentMap.uniqueId}:${segmentMap.localId}`
		const lastLocation = previousLocations.get(trackKey)
		const locationValid = lastLocation === undefined || segmentMap.location === lastLocation + 1
		if (!locationValid) {
			codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
		}

		const leafHash = await computeLeafHash(segmentBytes, merkleMap, leafHashCache)
		if (bmffHashHex === null) bmffHashHex = bytesToHex(leafHash)
		const proofResult = await verifyMerkleProof(leafHash, segmentMap.location, segmentMap.hashes, merkleMap)
		if (proofResult === 'ok') {
			if (locationValid) nextLocations.set(trackKey, segmentMap.location)
		} else {
			codes.add(proofResult)
		}
	}

	return {
		result: {
			location,
			bmffHashHex,
			isValid: codes.size === 0,
			errorCodes: [...codes],
		},
		nextState: { lastLocations: nextLocations },
	}
}
