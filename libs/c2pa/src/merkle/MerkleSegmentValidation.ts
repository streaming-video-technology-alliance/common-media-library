import type { C2paStatusCode } from '../C2paStatusCode.ts'
import type { LiveVideoStatusCode } from '../LiveVideoStatusCode.ts'

/**
 * One entry from the `merkle` array of the `c2pa.hash.bmff.v3` assertion (§18.6).
 *
 * @public
 */
export type MerkleMap = {
	readonly uniqueId: number
	readonly localId: number
	/** Number of leaf nodes (media segments) in the tree */
	readonly count: number
	/** Merkle tree row stored in the manifest */
	readonly hashes: readonly Uint8Array[]
	/** `null` for single-file fMP4 */
	readonly initHash: Uint8Array | null
	/** `null` for the default (SHA-256) */
	readonly alg: string | null
	readonly exclusions: readonly {
		readonly xpath: string
		readonly data?: readonly {
			readonly offset: number
			readonly value: Uint8Array | readonly number[]
		}[]
	}[]
	/** `8`, or `0` when the assertion also carries `hash` (§18.6.2) */
	readonly offsetPrefixSize: number
}

/**
 * Continuity state carried between calls to `validateC2paMerkleSegment`.
 * Reset (pass `undefined`) after a seek.
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
	/** Zero-based leaf index, or `null` if malformed */
	readonly location: number | null
	/** Computed leaf hash, hex-encoded */
	readonly bmffHashHex: string | null
	readonly isValid: boolean
	readonly errorCodes: readonly (LiveVideoStatusCode | C2paStatusCode)[]
}
