/**
 * Options for decoding CMCD data.
 *
 * @public
 */
export type CmcdDecodeOptions = {
	/**
	 * When `true`, up-converts version 1 data to version 2 format by wrapping
	 * scalar values in arrays for inner-list keys (e.g., `bl`, `br`, `mtp`).
	 *
	 * This ensures a consistent data shape regardless of the source version,
	 * mirroring the down-conversion that occurs during encoding.
	 *
	 * @defaultValue false
	 */
	convertToLatest?: boolean
}
