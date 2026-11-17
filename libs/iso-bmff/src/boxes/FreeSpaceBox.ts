/**
 * Free Space Box (`free` or `skip`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.2
 *
 * @public
 */
export type FreeSpaceBox<T extends 'free' | 'skip' = 'free'> = {
	type: T
	/** The bytes of the box body. The bytes are a view over the input buffer. */
	data: Uint8Array
}
