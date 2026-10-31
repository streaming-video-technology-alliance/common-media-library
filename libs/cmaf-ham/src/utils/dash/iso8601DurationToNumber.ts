import { decodeIso8601Duration } from '@svta/cml-iso-8601'

/**
 * Converts the ISO 8601 duration of an MPD attribute to seconds.
 *
 * The function trims the whitespace that the XML scanner keeps around an
 * attribute value, and decodes the rest with `decodeIso8601Duration`. A value
 * that is not an ISO 8601 duration gives 0.
 *
 * @param isoDuration - The ISO 8601 duration, such as `PT1H2M3S` or ` P1DT2H `.
 * @returns The duration in seconds.
 *
 * @internal
 */
export function iso8601DurationToNumber(isoDuration: string): number {
	const duration = decodeIso8601Duration(isoDuration.trim())
	return Number.isNaN(duration) ? 0 : duration
}
