import type { Encoding } from './Encoding.js';

/**
 * Options for the `decodeText` function.
 *
 *
 * @beta
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
