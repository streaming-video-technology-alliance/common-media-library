/**
 * A byte-level constraint used to match specific BMFF box content
 * within a C2PA BMFF hash exclusion.
 *
 * @internal
 */
export type BmffHashConstraint = {
	readonly offset: number
	readonly value: Uint8Array | readonly number[]
}

/**
 * Identifies a BMFF box to exclude from the C2PA content hash (`c2pa.hash.bmff.v3`).
 *
 * The `xpath` uses C2PA path notation (e.g. `/emsg`, `/moof/traf`).
 * Optional `data` constraints narrow the match to specific box content
 * by byte offset within the box.
 *
 * @internal
 */
export type BmffHashExclusion = {
	readonly xpath: string
	readonly data?: readonly BmffHashConstraint[]
}
