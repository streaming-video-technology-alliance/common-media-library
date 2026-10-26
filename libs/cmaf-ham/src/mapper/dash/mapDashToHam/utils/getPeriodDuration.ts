import type { DashManifest } from '../../../../types/mapper/dash/DashManifest.ts'

import { iso8601DurationToNumber } from '../../../../utils/dash/iso8601DurationToNumber.ts'

function getPeriodStart(dash: DashManifest, index: number): number | undefined {
	const periods = dash.MPD.Period
	const start = periods[index].$.start
	if (start) {
		return iso8601DurationToNumber(start)
	}
	if (index === 0) {
		return dash.MPD.$?.type === 'dynamic' ? undefined : 0
	}
	const previousDuration = periods[index - 1].$.duration
	if (!previousDuration) {
		return undefined
	}
	const previousStart = getPeriodStart(dash, index - 1)
	return previousStart === undefined
		? undefined
		: previousStart + iso8601DurationToNumber(previousDuration)
}

/**
 * @internal
 *
 * Get the duration of a Period.
 *
 * A Period without a `duration` attribute ends at the start of the next Period.
 * The last Period ends at the `mediaPresentationDuration` of the MPD.
 * A Period without a `start` attribute starts at the end of the previous Period.
 * The first Period of a static MPD starts at 0.
 * See ISO/IEC 23009-1 section 5.3.2.1.
 *
 * @param dash - Dash manifest that contains the Period
 * @param index - Index of the Period in the Dash manifest
 * @returns Duration of the Period in seconds, or 0 if the duration is unknown
 */
export function getPeriodDuration(dash: DashManifest, index: number): number {
	const periods = dash.MPD.Period
	const duration = periods[index].$.duration
	if (duration) {
		return iso8601DurationToNumber(duration)
	}

	const total = dash.MPD.$?.mediaPresentationDuration
	const start = getPeriodStart(dash, index)
	const end =
		index + 1 < periods.length
			? getPeriodStart(dash, index + 1)
			: total
				? iso8601DurationToNumber(total)
				: undefined

	return start === undefined || end === undefined ? 0 : Math.max(0, end - start)
}
