import { readIsoBoxes } from '@svta/cml-iso-bmff'
import { decode } from 'cbor-x/decode'
import { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { JUMBF_UUID, MERKLE_AUX_UUID, asInteger, bytesToHex, hashesEqual, matchesUuid, normalizeAlgorithmName, readUuidBoxPurpose, toUint8Array } from '../utils.ts'
import type { UuidParsedBox } from '../utils.ts'
import type { MerkleMap, MerkleSegmentState, MerkleSegmentValidation } from './MerkleSegmentValidation.ts'

type MerkleValidationCode = LiveVideoStatusCode | C2paStatusCode

const MERKLE_BOX_PURPOSE = 'merkle'

// --- Auxiliary uuid box extraction ---

type AuxPayload = Uint8Array | 'other' | 'malformed'

// §A.5.4 format: the box payload is a CBOR map { box_purpose: string, data: bstr }.
function readSpecAuxPayload(rawPayload: Uint8Array): AuxPayload {
	let decoded: unknown
	try {
		decoded = decode(rawPayload)
	} catch {
		return 'malformed'
	}
	const record = decoded as Record<string, unknown> | null
	if (record === null || typeof record !== 'object') return 'malformed'
	if (record['box_purpose'] !== MERKLE_BOX_PURPOSE) return 'other'
	return toUint8Array(record['data']) ?? 'malformed'
}

// JUMBF format: version/flags(4) + null-terminated purpose + raw bmff-merkle-map CBOR.
function readJumbfAuxPayload(rawPayload: Uint8Array): AuxPayload {
	const prefix = readUuidBoxPurpose(rawPayload)
	if (!prefix || prefix.purpose !== MERKLE_BOX_PURPOSE) return 'other'
	return prefix.rest
}

/**
 * Scans a media segment's top-level BMFF boxes for auxiliary C2PA `uuid`
 * boxes carrying a `bmff-merkle-map`, returning each box's raw CBOR payload
 * (one per track). Supports both on-disk formats:
 *
 * - §A.5.4: dedicated extended type, CBOR `{ box_purpose, data }` wrapper
 * - JUMBF: ContentProvenanceBox UUID, `version/flags + "merkle\0" + CBOR`
 *
 * A matching box that cannot be decoded sets `malformed`; boxes with other
 * purposes or UUIDs are ignored.
 */
function extractMerkleAuxBoxes(segmentBytes: Uint8Array): { payloads: Uint8Array[]; malformed: boolean } {
	const payloads: Uint8Array[] = []
	let malformed = false

	for (const box of readIsoBoxes(segmentBytes)) {
		const uuidBox = box as unknown as UuidParsedBox
		if (uuidBox.type !== 'uuid') continue
		const usertype = uuidBox.usertype ?? []

		const isSpecUuid = matchesUuid(usertype, MERKLE_AUX_UUID)
		if (!isSpecUuid && !matchesUuid(usertype, JUMBF_UUID)) continue

		const rawPayload = uuidBox.view.readData(uuidBox.view.bytesRemaining) as Uint8Array
		const payload = isSpecUuid ? readSpecAuxPayload(rawPayload) : readJumbfAuxPayload(rawPayload)
		if (payload === 'malformed') malformed = true
		else if (payload !== 'other') payloads.push(payload)
	}

	return { payloads, malformed }
}

// --- bmff-merkle-map decoding ---

// Decoded bmff-merkle-map payload from a segment's auxiliary uuid box (§18.6).
type BmffMerkleMapSegment = {
	readonly uniqueId: number
	readonly localId: number
	readonly location: number
	/** Sibling proof path, bottom-up; null entries are padding nodes. Null = leaf row in manifest. */
	readonly hashes: readonly (Uint8Array | null)[] | null
}

// CBOR integer keys per the §18.6 bmff-merkle-map schema; string keys are accepted as a fallback.
const KEY_UNIQUE_ID = 1
const KEY_LOCAL_ID = 2
const KEY_LOCATION = 3
const KEY_HASHES = 4

function readMapField(map: unknown, intKey: number, name: string): unknown {
	if (map instanceof Map) return map.get(intKey) ?? map.get(name)
	const record = map as Record<string | number, unknown>
	return record[intKey] ?? record[name]
}

/**
 * Decodes the CBOR `bmff-merkle-map` from an auxiliary box payload. Null
 * entries in `hashes` are preserved — they mark padding nodes whose sibling
 * must not be mixed into the proof traversal. Returns `null` when the payload
 * cannot be decoded or a required field is missing.
 */
function parseBmffMerkleMap(payload: Uint8Array): BmffMerkleMapSegment | null {
	let decoded: unknown
	try {
		decoded = decode(payload)
	} catch {
		return null
	}
	if (decoded === null || typeof decoded !== 'object') return null

	const uniqueId = asInteger(readMapField(decoded, KEY_UNIQUE_ID, 'uniqueId'))
	const localId = asInteger(readMapField(decoded, KEY_LOCAL_ID, 'localId'))
	const location = asInteger(readMapField(decoded, KEY_LOCATION, 'location'))
	if (uniqueId === null || localId === null || location === null) return null

	const rawHashes = readMapField(decoded, KEY_HASHES, 'hashes')
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

// Layer sizes of the balanced binary tree, leaf level first (e.g. 61 → [61, 31, 16, 8, 4, 2, 1]).
function treeLayout(leafCount: number): number[] {
	const layers = [leafCount]
	while (layers[layers.length - 1] > 1) {
		layers.push(Math.ceil(layers[layers.length - 1] / 2))
	}
	return layers
}

/**
 * Verifies a Merkle proof path against the row stored in the merkle map
 * (§15.12.2.2).
 *
 * Traverses the balanced binary tree from the leaf upward, applying sibling
 * hashes level by level (`H(left || right)`), and stops at the level whose
 * layer size equals the manifest row length. A node whose sibling index falls
 * outside its layer (rightmost orphan) is promoted unchanged without
 * consuming a proof entry — proofs carry only present siblings, though null
 * placeholders (§A.5.4 style) are tolerated and skipped. An empty proof with
 * the leaf row stored in the manifest degenerates to a direct compare.
 */
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
	if (!layers.includes(manifestRow.length)) {
		return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED
	}

	const treeDepth = layers.length - 1
	const path = (proofPath ?? []).filter((node): node is Uint8Array => node !== null)
	if (path.length > treeDepth) return C2paStatusCode.ASSERTION_BMFFHASH_MALFORMED

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

/** Computes the segment's leaf hash, reusing a prior result when the hash parameters match (tracks usually share them). */
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
 * Validates a fragmented MP4 VOD media segment against the merkle maps from
 * the init manifest (C2PA §15.12.2.2).
 *
 * Extracts each track's auxiliary `uuid` box, decodes its `bmff-merkle-map`,
 * computes the segment's leaf hash (all bytes except the exclusion list,
 * with per-box offset prefixes per §18.6.2 when the assertion is
 * merkle-only), and verifies the Merkle proof path against the tree row
 * stored in the matching merkle map. All tracks must pass; error codes from
 * all tracks are accumulated.
 *
 * `location` continuity is enforced across successive calls via `state`:
 * during sequential playback each track's `location` must increment by 1
 * (§15.12.2) — replays, reorders, and gaps flag a discontinuity. Only
 * segments whose proof verifies advance the continuity baseline. The first
 * segment (no prior state) is exempt — callers reset the state after a seek
 * by passing `undefined`.
 *
 * This function is **pure** — the caller persists `nextState` between calls.
 *
 * @param segmentBytes - Raw media segment bytes
 * @param merkleMaps - Merkle maps from `validateC2paInitSegment`
 * @param state - Continuity state from the previous call, or `undefined` for the first segment
 * @returns Validation result and state for the next call, or `null` when `merkleMaps` is empty (stream is not in VOD Merkle mode)
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

	const previousLocations = state?.lastLocation ?? new Map<string, number>()
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

		// §15.12.2: during sequential playback each track's location must
		// increment by 1. Replays, reorders, and gaps all break the sequence.
		const trackKey = `${segmentMap.uniqueId}:${segmentMap.localId}`
		const lastLocation = previousLocations.get(trackKey)
		if (lastLocation !== undefined && segmentMap.location !== lastLocation + 1) {
			codes.add(LiveVideoStatusCode.ASSERTION_INVALID)
		}

		const leafHash = await computeLeafHash(segmentBytes, merkleMap, leafHashCache)
		if (bmffHashHex === null) bmffHashHex = bytesToHex(leafHash)
		const proofResult = await verifyMerkleProof(leafHash, segmentMap.location, segmentMap.hashes, merkleMap)
		if (proofResult === 'ok') {
			nextLocations.set(trackKey, segmentMap.location)
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
		nextState: { lastLocation: nextLocations },
	}
}
