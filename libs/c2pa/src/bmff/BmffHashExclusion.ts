/**
 * A byte-level constraint used to match specific BMFF box content
 * within a C2PA BMFF hash exclusion.
 *
 * @public
 */
export type BmffHashConstraint = {
	/** Byte offset from the start of the box header. */
	readonly offset: number
	/** Bytes that the box has at `offset`. */
	readonly value: Uint8Array | readonly number[]
}

/**
 * A byte range of a BMFF box that a C2PA BMFF hash exclusion excludes.
 *
 * @public
 */
export type BmffHashSubset = {
	/** Byte offset from the start of the box header. */
	readonly offset: number
	/** Number of bytes. A length of `0` on the last entry runs to the end of the box. */
	readonly length: number
}

/**
 * Identifies a BMFF box, or byte ranges of a box, to exclude from the C2PA content hash (`c2pa.hash.bmff.v3`).
 *
 * The fields follow the `exclusions-map` of C2PA section 18.6.2. A box matches the exclusion
 * when its path matches `xpath` and every present constraint holds.
 *
 * @public
 */
export type BmffHashExclusion = {
	/** Path of the box from the root, such as `/emsg` or `/moov/trak[2]/udta`. */
	readonly xpath: string
	/** The box matches only if its length, header included, equals this value. */
	readonly length?: number
	/** The box matches only if its bytes at each `offset` equal `value`. */
	readonly data?: readonly BmffHashConstraint[]
	/** Excludes only these byte ranges of the box instead of the whole box. */
	readonly subset?: readonly BmffHashSubset[]
	/** The box matches only if it is a FullBox with this version. */
	readonly version?: number
	/** The box matches only if it is a FullBox with these 3 flag bytes. */
	readonly flags?: Uint8Array | readonly number[]
	/** If `false`, the box matches when its flags have at least the bits of `flags`. Defaults to `true`. */
	readonly exact?: boolean
}
