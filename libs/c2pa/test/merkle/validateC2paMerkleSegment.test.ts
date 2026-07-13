import { validateC2paMerkleSegment, type MerkleMap } from '@svta/cml-c2pa'
import { encode } from 'cbor-x/encode'
import { notStrictEqual, ok, strictEqual } from 'node:assert'
import { before, describe, it } from 'node:test'
import { computeBmffHash } from '../../src/bmff/computeBmffHash.ts'
import { MERKLE_AUX_UUID } from '../../src/utils.ts'
import {
	buildJumbfMerkleAuxBox,
	buildMediaContent,
	buildMerkleAuxBox,
	buildProofPath,
	buildTreeLevels,
	buildUuidBox,
	concatBytes,
	manifestRow,
	sha256,
} from './merkleTestUtils.ts'

const EXCLUSIONS = [{ xpath: '/uuid' }]
const UNIQUE_ID = 7
const SEGMENT_COUNT = 3
const TREE_DEPTH = 2

describe('validateC2paMerkleSegment', () => {
	let merkleMaps: MerkleMap[]
	let segments: Uint8Array[]
	let levels: (Uint8Array | null)[][]

	function merkleMapWith(overrides: Partial<MerkleMap>): MerkleMap[] {
		return [{ ...merkleMaps[0], ...overrides }]
	}

	function buildSegment(location: number, localId = 1): Uint8Array {
		return concatBytes(
			buildMediaContent(location * 10),
			buildMerkleAuxBox({
				uniqueId: UNIQUE_ID,
				localId,
				location,
				hashes: buildProofPath(levels, location, TREE_DEPTH),
			}),
		)
	}

	before(async () => {
		const contents = Array.from({ length: SEGMENT_COUNT }, (_, i) => buildMediaContent(i * 10))
		// Merkle-only assertions hash with 8-byte box-offset prefixes (§18.6.2)
		const leafHashes = await Promise.all(
			contents.map(c => computeBmffHash(c, { offsetPrefixSize: 8, exclusions: EXCLUSIONS })),
		)
		levels = await buildTreeLevels(leafHashes)
		merkleMaps = [{
			uniqueId: UNIQUE_ID,
			localId: 1,
			count: SEGMENT_COUNT,
			hashes: manifestRow(levels, TREE_DEPTH),
			initHash: null,
			alg: 'SHA-256',
			exclusions: EXCLUSIONS,
			offsetPrefixSize: 8,
		}]
		segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => buildSegment(i))
	})

	// #region example
	it('validates a segment with a correct Merkle proof', async () => {
		const validated = await validateC2paMerkleSegment(segments[0], merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, true)
		strictEqual(validated.result.location, 0)
		strictEqual(validated.result.errorCodes.length, 0)
	})
	// #endregion example

	it('returns null when merkleMaps is empty (not in VOD Merkle mode)', async () => {
		strictEqual(await validateC2paMerkleSegment(segments[0], []), null)
	})

	it('validates sequential segments carrying state forward', async () => {
		let state
		for (let i = 0; i < SEGMENT_COUNT; i++) {
			const validated = await validateC2paMerkleSegment(segments[i], merkleMaps, state)
			ok(validated)
			strictEqual(validated.result.isValid, true, `segment ${i} should be valid`)
			state = validated.nextState
		}
	})

	it('rejects a tampered segment with mismatch', async () => {
		const tampered = new Uint8Array(segments[1])
		tampered[12] ^= 0xff // flip a byte inside the mdat payload

		const validated = await validateC2paMerkleSegment(tampered, merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, false)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.mismatch'))
	})

	it('rejects a segment without an auxiliary box as malformed', async () => {
		const validated = await validateC2paMerkleSegment(buildMediaContent(0), merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, false)
		strictEqual(validated.result.location, null)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})

	it('rejects a track missing from the merkle maps as malformed', async () => {
		const validated = await validateC2paMerkleSegment(buildSegment(0, 99), merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, false)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})

	it('rejects an auxiliary box with undecodable CBOR as malformed', async () => {
		const segment = concatBytes(
			buildMediaContent(0),
			buildUuidBox(MERKLE_AUX_UUID, new Uint8Array([0xff, 0xff])),
		)

		const validated = await validateC2paMerkleSegment(segment, merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, false)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})

	it('ignores merkle-uuid boxes with a different purpose', async () => {
		const foreignPurpose = encode({ box_purpose: 'manifest', data: new Uint8Array([1]) }) as Uint8Array
		const segment = concatBytes(
			buildMediaContent(0),
			buildUuidBox(MERKLE_AUX_UUID, foreignPurpose),
		)

		const validated = await validateC2paMerkleSegment(segment, merkleMaps)

		// The only aux-like box has another purpose → treated as missing aux box
		ok(validated)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})

	it('accepts the JUMBF auxiliary box format (purpose string + named keys)', async () => {
		const segment = concatBytes(
			buildMediaContent(0),
			buildJumbfMerkleAuxBox({
				uniqueId: UNIQUE_ID,
				localId: 1,
				location: 0,
				hashes: buildProofPath(levels, 0, TREE_DEPTH),
			}),
		)

		const validated = await validateC2paMerkleSegment(segment, merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, true)
	})

	it('compares directly against a leaf row stored in the manifest (empty proof path)', async () => {
		const leafRowMaps = merkleMapWith({ hashes: manifestRow(levels, 0) })
		const segment = concatBytes(
			buildMediaContent(10),
			buildMerkleAuxBox({ uniqueId: UNIQUE_ID, localId: 1, location: 1, hashes: [] }),
		)

		const validated = await validateC2paMerkleSegment(segment, leafRowMaps)

		ok(validated)
		strictEqual(validated.result.isValid, true)
	})

	it('verifies against an intermediate row stored in the manifest', async () => {
		const intermediateMaps = merkleMapWith({ hashes: manifestRow(levels, 1) })
		const segment = concatBytes(
			buildMediaContent(20),
			buildMerkleAuxBox({
				uniqueId: UNIQUE_ID,
				localId: 1,
				location: 2,
				hashes: buildProofPath(levels, 2, 1),
			}),
		)

		const validated = await validateC2paMerkleSegment(segment, intermediateMaps)

		ok(validated)
		strictEqual(validated.result.isValid, true)
	})

	it('handles single-segment VOD (count = 1) as a direct compare', async () => {
		const content = buildMediaContent(0)
		const leafHash = await computeBmffHash(content, { offsetPrefixSize: 8, exclusions: EXCLUSIONS })
		const singleMaps = merkleMapWith({ count: 1, hashes: [leafHash] })
		const segment = concatBytes(
			content,
			buildMerkleAuxBox({ uniqueId: UNIQUE_ID, localId: 1, location: 0 }),
		)

		const validated = await validateC2paMerkleSegment(segment, singleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, true)
	})

	it('promotes the hash past a null sibling (rightmost leaf of an odd-count tree)', async () => {
		// 3 leaves → leaf 2 pairs with a padding node at level 0
		const proofPath = buildProofPath(levels, 2, TREE_DEPTH)
		strictEqual(proofPath[0], null, 'leaf 2 pairs with a padding node')

		const validated = await validateC2paMerkleSegment(segments[2], merkleMaps)

		ok(validated)
		strictEqual(validated.result.isValid, true)
	})

	it('rejects an out-of-range location as malformed', async () => {
		const segment = concatBytes(
			buildMediaContent(0),
			buildMerkleAuxBox({
				uniqueId: UNIQUE_ID,
				localId: 1,
				location: SEGMENT_COUNT, // valid range is [0, count-1]
				hashes: buildProofPath(levels, 0, TREE_DEPTH),
			}),
		)

		const validated = await validateC2paMerkleSegment(segment, merkleMaps)

		ok(validated)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})

	it('rejects a proof path longer than the tree depth as malformed', async () => {
		const padding = await sha256(new Uint8Array([1]))
		const segment = concatBytes(
			buildMediaContent(0),
			buildMerkleAuxBox({
				uniqueId: UNIQUE_ID,
				localId: 1,
				location: 0,
				hashes: [padding, padding, padding], // depth is 2
			}),
		)

		const validated = await validateC2paMerkleSegment(segment, merkleMaps)

		ok(validated)
		ok(validated.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})

	it('flags a location gap without seek as a discontinuity (§15.12.2: +1)', async () => {
		const first = await validateC2paMerkleSegment(segments[0], merkleMaps)
		ok(first)
		const skipped = await validateC2paMerkleSegment(segments[2], merkleMaps, first.nextState)

		ok(skipped)
		strictEqual(skipped.result.isValid, false)
		ok(skipped.result.errorCodes.includes('livevideo.assertion.invalid'))
		notStrictEqual(skipped.result.errorCodes.includes('assertion.bmffHash.mismatch'), true)
	})

	it('flags a repeated or lower location as a discontinuity (replay/reorder)', async () => {
		const first = await validateC2paMerkleSegment(segments[1], merkleMaps)
		ok(first)

		const replayed = await validateC2paMerkleSegment(segments[1], merkleMaps, first.nextState)
		ok(replayed)
		strictEqual(replayed.result.isValid, false)
		ok(replayed.result.errorCodes.includes('livevideo.assertion.invalid'))

		const reordered = await validateC2paMerkleSegment(segments[0], merkleMaps, first.nextState)
		ok(reordered)
		strictEqual(reordered.result.isValid, false)
		ok(reordered.result.errorCodes.includes('livevideo.assertion.invalid'))
	})

	it('does not advance the continuity baseline on a failed segment', async () => {
		const first = await validateC2paMerkleSegment(segments[0], merkleMaps)
		ok(first)

		const tampered = new Uint8Array(segments[1])
		tampered[12] ^= 0xff
		const bad = await validateC2paMerkleSegment(tampered, merkleMaps, first.nextState)
		ok(bad)
		strictEqual(bad.result.isValid, false)

		const retry = await validateC2paMerkleSegment(segments[1], merkleMaps, bad.nextState)
		ok(retry)
		strictEqual(retry.result.isValid, true)
	})

	it('passes after a seek when the caller resets the state', async () => {
		const first = await validateC2paMerkleSegment(segments[2], merkleMaps)
		ok(first)
		// Backward seek: caller discards the previous state instead of carrying it forward
		const afterSeek = await validateC2paMerkleSegment(segments[0], merkleMaps, undefined)

		ok(afterSeek)
		strictEqual(afterSeek.result.isValid, true)
	})

	it('validates multi-track segments and accumulates errors from all tracks', async () => {
		const twoTrackMaps: MerkleMap[] = [merkleMaps[0], { ...merkleMaps[0], localId: 2 }]
		const validSegment = concatBytes(
			buildMediaContent(0),
			buildMerkleAuxBox({ uniqueId: UNIQUE_ID, localId: 1, location: 0, hashes: buildProofPath(levels, 0, TREE_DEPTH) }),
			buildMerkleAuxBox({ uniqueId: UNIQUE_ID, localId: 2, location: 0, hashes: buildProofPath(levels, 0, TREE_DEPTH) }),
		)

		const bothPass = await validateC2paMerkleSegment(validSegment, twoTrackMaps)
		ok(bothPass)
		// Both tracks hash the same bytes minus /uuid exclusions, so both proofs verify
		strictEqual(bothPass.result.isValid, true)

		const mixedSegment = concatBytes(
			buildMediaContent(0),
			buildMerkleAuxBox({ uniqueId: UNIQUE_ID, localId: 1, location: 0, hashes: buildProofPath(levels, 0, TREE_DEPTH) }),
			buildMerkleAuxBox({ uniqueId: UNIQUE_ID, localId: 99, location: 0, hashes: buildProofPath(levels, 0, TREE_DEPTH) }),
		)
		const oneFails = await validateC2paMerkleSegment(mixedSegment, twoTrackMaps)
		ok(oneFails)
		strictEqual(oneFails.result.isValid, false)
		ok(oneFails.result.errorCodes.includes('assertion.bmffHash.malformed'))
	})
})
