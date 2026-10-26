// The anchors and one optional group per designator keep the match linear
// on non-matching input (CodeQL js/polynomial-redos).
const DURATION_REGEX =
	/^P(?:\d+(?:\.\d+)?Y)?(?:\d+(?:\.\d+)?M)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/

const SECONDS_IN_DAY = 24 * 60 * 60
const SECONDS_IN_HOUR = 60 * 60
const SECONDS_IN_MINUTE = 60

/**
 * Converts an ISO 8601 duration to seconds.
 *
 * The function adds the days, hours, minutes, and seconds of the duration.
 * A year or a month has no fixed length in seconds, so the function ignores
 * the `Y` and `M` designators before the `T`. A string that is not an
 * ISO 8601 duration gives 0.
 *
 * @param isoDuration - The ISO 8601 duration, such as `PT1H2M3S` or `P1DT2H`.
 * @returns The duration in seconds.
 *
 * @internal
 */
export function iso8601DurationToNumber(isoDuration: string): number {
	const match = DURATION_REGEX.exec(isoDuration)
	if (!match) {
		return 0
	}
	return (
		Number(match[1] || 0) * SECONDS_IN_DAY +
		Number(match[2] || 0) * SECONDS_IN_HOUR +
		Number(match[3] || 0) * SECONDS_IN_MINUTE +
		Number(match[4] || 0)
	)
}
