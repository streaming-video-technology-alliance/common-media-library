import type { BmffHashExclusion } from '../bmff/BmffHashExclusion.ts'

/**
 * A decoded C2PA Verifiable Segment Info (VSI) CBOR map.
 *
 * Carries the per-segment hash, sequence number, and manifest reference
 * used to authenticate DASH segments in live streaming
 * (C2PA Live Video Streaming Specification §5).
 *
 * @public
 */
export type VsiMap = {
	readonly sequenceNumber: number
	readonly bmffHash: {
		readonly hash: Uint8Array
		readonly alg: string
		readonly exclusions: readonly BmffHashExclusion[]
	}
	readonly manifestId: Uint8Array
}
