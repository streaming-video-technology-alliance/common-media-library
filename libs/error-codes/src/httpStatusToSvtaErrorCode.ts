import { SvtaErrorCategory } from './SvtaErrorCategory.ts'

/**
 * Embed an HTTP response status code into the SVTA Network error
 * category, per the spec's external-code embedding rule (e.g. HTTP 404
 * becomes 3404). Values outside the valid HTTP status range (integers
 * 100-599) return the unknown network error code (3000) rather than
 * throwing, so error reporting paths cannot fail.
 *
 * @param status - An HTTP response status code (100-599).
 * @returns The SVTA network error code embedding the status.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/httpStatusToSvtaErrorCode.test.ts#example}
 */
export function httpStatusToSvtaErrorCode(status: number): number {
	const base = SvtaErrorCategory.NETWORK * 1000

	if (!Number.isInteger(status) || status < 100 || status > 599) {
		return base
	}

	return base + status
}
