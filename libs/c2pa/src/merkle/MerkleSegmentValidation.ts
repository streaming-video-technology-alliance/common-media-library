import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'
import type { C2paStatusCode } from '../C2paStatusCode.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * One merkle map from the `c2pa.hash.bmff.v3` assertion (§18.6).
 *
 * @public
 */
export type MerkleMap = {
	readonly uniqueId: number
	readonly localId: number
	readonly count: number
	readonly hashes: readonly Uint8Array[]
	readonly initHash: Uint8Array | null
	readonly alg: string | null
	readonly exclusions: readonly BmffHashExclusion[]
	readonly offsetPrefixSize: number
}

/**
 * Continuity state carried between calls to `validateC2paMerkleSegment`.
 * Reset (pass `undefined`) after a seek.
 *
 * `lastLocations` is keyed by `${uniqueId}:${localId}`, matching the
 * `MerkleMap` fields of the track it tracks. The first location seen for a
 * key is always accepted (no prior state to compare against), so a caller
 * that needs strict start-at-zero enforcement must seed this map itself.
 *
 * @public
 */
export type MerkleSegmentState = {
	readonly lastLocations: ReadonlyMap<string, number>
}

/**
 * Result of `validateC2paMerkleSegment` for one media segment.
 *
 * @public
 */
export type MerkleSegmentValidation = {
	readonly location: number | null
	readonly bmffHashHex: string | null
	readonly isValid: boolean
	readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[]
}
