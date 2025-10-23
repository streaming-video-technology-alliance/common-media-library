/**
 * Encode a duration in seconds to an ISO 8601 duration string.
 *
 * @param duration - Duration in seconds.
 * @returns ISO 8601 duration string.
 *
 * @beta
 *
 * @example
 * {@includeCode ../test/encodeIso8601Duration.test.ts#example}
 */
export function encodeIso8601Duration(duration: number): string {
	if (!isFinite(duration)) {
		return 'PT'
	}

	const hours = Math.floor(duration / 3600)
	const minutes = Math.floor((duration % 3600) / 60)
	const seconds = duration % 60
	if (hours > 0) {
		return `PT${hours}H${minutes}M${seconds}S`
	}
	else if (minutes > 0) {
		return `PT${minutes}M${seconds}S`
	}
	return `PT${seconds}S`
}
