import type { C2paAssertion } from '../C2paAssertion.ts'
import { C2paStatusCode } from '../C2paStatusCode.ts'
import { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'
import { computeBmffHash } from '../bmff/computeBmffHash.ts'
import { parseExclusions } from '../bmff/parseExclusions.ts'
import { asInteger, hashesEqual, normalizeAlgorithmName, toUint8Array } from '../utils.ts'
import type { MerkleMap } from './MerkleSegmentValidation.ts'

function parseMerkleRow(rawHashes: unknown): Uint8Array[] | null {
	if (!Array.isArray(rawHashes) || rawHashes.length === 0) return null
	const row: Uint8Array[] = []
	for (const entry of rawHashes) {
		const bytes = toUint8Array(entry)
		if (!bytes) return null
		row.push(bytes)
	}
	return row
}

function extractMerkleMaps(bmffHashAssertionData: Record<string, unknown>): MerkleMap[] | null {
	const rawMerkle = bmffHashAssertionData['merkle']
	if (!Array.isArray(rawMerkle) || rawMerkle.length === 0) return null

	const exclusions = parseExclusions(bmffHashAssertionData['exclusions'])
	const assertionAlg = bmffHashAssertionData['alg']
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

		// §A.5.4.2/merkle-map CDDL: initHash is required for fragmented assets, which
		// is the only case this function handles (it's only called for init segments).
		const initHash = toUint8Array(record['initHash'])
		if (!initHash) return null

		// §A.5.4.2/merkle-map CDDL: no default when alg is absent from both this
		// entry and the enclosing assertion; the structure is invalid.
		const rawAlg = record['alg'] ?? assertionAlg
		if (typeof rawAlg !== 'string') return null

		maps.push({
			uniqueId,
			localId,
			count,
			hashes,
			initHash,
			alg: normalizeAlgorithmName(rawAlg),
			exclusions,
			offsetPrefixSize,
		})
	}
	return maps
}

export async function validateMerkleMaps(
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
