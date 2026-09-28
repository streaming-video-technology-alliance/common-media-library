import type { Encoding } from './Encoding.ts'

/**
 * Options for the `decodeText` function.
 *
 * @public
 */
export type DecodeTextOptions = {
	/**
	 * The encoding to use. If omitted, the function tries to detect the encoding from the BOM.
	 */
	encoding?: Encoding;

	/**
	 * Whether to exit on the first null byte.
	 */
	// exitOnNull?: boolean;
};
