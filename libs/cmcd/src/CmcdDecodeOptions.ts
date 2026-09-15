/**
 * Options for decoding CMCD data.
 *
 * @public
 */
export type CmcdDecodeOptions = {
	/**
	 * When `true`, up-converts version 1 data to version 2 format by wrapping
	 * scalar values in arrays for inner-list keys. Examples: `bl`, `br`, `mtp`.
	 *
	 * The result has a consistent structure regardless of the source version.
	 * This conversion corresponds to the down-conversion during encoding.
	 *
	 * @defaultValue false
	 */
	convertToLatest?: boolean

	/**
	 * Controls how the decoded data represents RFC 8941 token values. If
	 * omitted, tokens decode to plain strings, which re-encoding cannot
	 * distinguish from string values. `true` decodes tokens as registry
	 * `Symbol`s and `false` as `SfToken` instances. Either preserved
	 * representation re-encodes as a bare token, so a decode/encode round
	 * trip reproduces the wire bytes.
	 */
	useSymbol?: boolean
}
