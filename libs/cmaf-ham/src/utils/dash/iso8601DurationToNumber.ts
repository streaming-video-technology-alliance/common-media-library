// The (?:^|[^.,\d]) prefix pins each match to the start of a number run,
// keeping the scan linear on non-matching input (CodeQL js/polynomial-redos).
const HOURS_REGEX = /(?:^|[^.,\d])([.,\d]+)H/
const MINUTES_REGEX = /(?:^|[^.,\d])([.,\d]+)M/
const SECONDS_REGEX = /(?:^|[^.,\d])([.,\d]+)S/

/**
 * @internal
 */
export function iso8601DurationToNumber(isoDuration: string): number {
	const hours = HOURS_REGEX.exec(isoDuration)
	const minutes = MINUTES_REGEX.exec(isoDuration)
	const seconds = SECONDS_REGEX.exec(isoDuration)

	let duration = 0
	if (hours) {
		duration += +hours[1] * 60 * 60
	}
	if (minutes) {
		duration += +minutes[1] * 60
	}
	if (seconds) {
		duration += +seconds[1]
	}
	return duration
}
