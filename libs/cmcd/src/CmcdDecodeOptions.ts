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

	/**
	 * Controls how RFC 8941 token values are represented in the decoded
	 * data. When omitted, tokens are reduced to plain strings, which cannot
	 * be told apart from string values on re-encoding. `true` decodes
	 * tokens as registry `Symbol`s and `false` as `SfToken` instances;
	 * either preserved representation re-encodes as a bare token, so a
	 * decode/encode round trip keeps the wire bytes.
	 */
	useSymbol?: boolean
}
