/**
 * Get the error index of an SVTA error code, per the spec's
 * `code mod 1000` rule. The index identifies the specific error within
 * its category: native indices are 0-99, embedded external codes (HTTP,
 * VAST) are 100-999.
 *
 * @param code - An SVTA error code.
 * @returns The error index within the code's category, or `undefined`
 * if the code is not a non-negative integer.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/getSvtaErrorIndex.test.ts#example}
 */
export function getSvtaErrorIndex(code: number): number | undefined {
	if (!Number.isInteger(code) || code < 0) {
		return undefined
	}

	return code % 1000
}
