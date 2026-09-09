import { SvtaErrorCategory } from './SvtaErrorCategory.ts'

/**
 * Embed an IAB VAST error code into the SVTA Advertising error category,
 * per the external code embedding rule of SVTA2070. VAST error 301
 * becomes 7301. The four-digit VAST error 1009 (empty VAST response)
 * does not fit a three-digit index, so SVTA2070 maps it to 7999.
 *
 * Values outside the valid VAST error code range (integers 100-999, or
 * 1009) return the unknown advertising error code (7000) rather than
 * throwing, so error reporting paths cannot fail.
 *
 * @param vastError - An IAB VAST error code (100-999, or 1009).
 * @returns The SVTA advertising error code embedding the VAST error.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/vastErrorToSvtaErrorCode.test.ts#example}
 */
export function vastErrorToSvtaErrorCode(vastError: number): number {
	const base = SvtaErrorCategory.ADVERTISING * 1000

	// SVTA2070 maps the four-digit VAST error 1009 (empty VAST response) to index 999.
	if (vastError === 1009) {
		return base + 999
	}

	if (!Number.isInteger(vastError) || vastError < 100 || vastError > 999) {
		return base
	}

	return base + vastError
}
