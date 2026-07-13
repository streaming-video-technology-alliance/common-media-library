import type { C2paStatusCode } from '../C2paStatusCode.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * One entry from the `merkle` array in the init manifest's `c2pa.hash.bmff.v3`
 * assertion (C2PA §18.6): the Merkle tree row and hash parameters for one
 * track. Returned by `validateC2paInitSegment` and consumed by
 * `validateC2paMerkleSegment`.
 *
 * @public
 */
export type MerkleMap = {
	/** Identifier shared by the init manifest entry and each segment's auxiliary box */
	readonly uniqueId: number
	/** Track-local identifier; `uniqueId` + `localId` is the join key per track */
	readonly localId: number
	/** Total number of leaf nodes (media segments) in the tree */
	readonly count: number
	/** The Merkle tree row stored in the manifest (`merkle-map.hashes`). Null padding nodes excluded. */
	readonly hashes: readonly Uint8Array[]
	/** Hash of the entire init segment file; `null` = single-file fMP4 (check skipped) */
	readonly initHash: Uint8Array | null
	/** Hash algorithm override; `null` = fall back to the claim algorithm (SHA-256) */
	readonly alg: string | null
	/** Exclusion list from `c2pa.hash.bmff.v3` — reused for leaf hash computation */
	readonly exclusions: readonly {
		readonly xpath: string
		readonly data?: readonly {
			readonly offset: number
			readonly value: Uint8Array | readonly number[]
		}[]
	}[]
	/**
	 * Byte length of the per-box offset prefix mixed into leaf and init hashes:
	 * `8` when the assertion carries only `merkle`, `0` when it carries both
	 * `hash` and `merkle` (§18.6.2: the offset shall not be included in that case).
	 */
	readonly offsetPrefixSize: number
}

/**
 * State carried between successive calls to `validateC2paMerkleSegment`,
 * used to enforce `location` continuity during sequential playback. Callers
 * reset this state (pass `undefined`) after a seek.
 *
 * @public
 */
export type MerkleSegmentState = {
	/** Last validated location per `${uniqueId}:${localId}` track key */
	readonly lastLocation: ReadonlyMap<string, number>
}

/**
 * Result of `validateC2paMerkleSegment` for one media segment.
 *
 * @public
 */
export type MerkleSegmentValidation = {
	/** Zero-based leaf index of the segment (first track's auxiliary box), or `null` if malformed */
	readonly location: number | null
	/** Hex of the computed leaf hash (first track), or `null` if no track was hashed */
	readonly bmffHashHex: string | null
	readonly isValid: boolean
	readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[]
}
