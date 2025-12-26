import type { Encoding } from './Encoding.ts'

/**
 * Options for the `decodeText` function.
 *
 * @public
 */
export type DecodeTextOptions = {
	/**
	 *  The encoding to use. If not provided, the function will try to detect the encoding from the BOM.
	 */
	encoding?: Encoding;

	/**
	 * Whether to exit on the first null byte.
	 */
	// exitOnNull?: boolean;
};
