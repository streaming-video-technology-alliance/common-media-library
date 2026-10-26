import type { DashManifest } from '../../../../types/mapper/dash/DashManifest.ts'

import { iso8601DurationToNumber } from '../../../../utils/dash/iso8601DurationToNumber.ts'

/**
 * @internal
 *
 * Get the duration of a Period in seconds.
 *
 * A Period without a `duration` attribute ends at the start of the next Period.
 * The last Period ends at the end of the Media Presentation.
 *
 * @param dash - Dash manifest that contains the Period
 * @param index - Index of the Period in the Dash manifest
 * @returns Duration of the Period
 */
export function getPeriodDuration(dash: DashManifest, index: number): number {
	const period = dash.MPD.Period[index]
	if (period.$.duration) {
		return iso8601DurationToNumber(period.$.duration)
	}

	const end = dash.MPD.Period[index + 1]?.$.start ?? dash.MPD.$?.mediaPresentationDuration
	if (!end) {
		return 0
	}

	return iso8601DurationToNumber(end) - iso8601DurationToNumber(period.$.start ?? '')
}
