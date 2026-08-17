import { SvtaErrorCategory } from './SvtaErrorCategory.ts'

/**
 * Embed an IAB VAST error code into the SVTA Advertising error category,
 * per the spec's external-code embedding rule (e.g. VAST error 301
 * becomes 7301). Values outside the valid VAST error code range
 * (integers 100-999) return the unknown advertising error code (7000)
 * rather than throwing, so error reporting paths cannot fail.
 *
 * @param vastError - An IAB VAST error code (100-999).
 * @returns The SVTA advertising error code embedding the VAST error.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/vastErrorToSvtaErrorCode.test.ts#example}
 */
export function vastErrorToSvtaErrorCode(vastError: number): number {
	const base = SvtaErrorCategory.ADVERTISING * 1000

	if (!Number.isInteger(vastError) || vastError < 100 || vastError > 999) {
		return base
	}

	return base + vastError
}
