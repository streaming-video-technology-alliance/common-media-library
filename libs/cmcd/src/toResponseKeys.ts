import type { HttpResponse } from '@svta/cml-utils'
import { getTimeToFirstByte } from '@svta/cml-utils'
import type { Cmcd } from './Cmcd.ts'
import { replaceCmcdParam } from './replaceCmcdParam.ts'

/**
 * Derives the keys of an `rr` report from a response.
 *
 * - `url` is the request URL without the `CMCD` parameter.
 * - `rc` is the status.
 * - `ts` is the time origin plus `startTime`.
 * - `ttfb` is `responseStart` minus `startTime`, from `getTimeToFirstByte()`. It needs a `responseStart` between `startTime` and `startTime` plus `duration`.
 * - `ttlb` is `duration`. It needs a `duration` above 0.
 *
 * Resource Timing reports 0 for `responseStart` of a cross-origin response without the `Timing-Allow-Origin` header.
 *
 * @param response - The response.
 * @param timeOrigin - The time origin of `resourceTiming`, in milliseconds since the epoch.
 * @returns The derived keys.
 *
 * @internal
 */
export function toResponseKeys(response: HttpResponse, timeOrigin: number): Cmcd {
	const keys: Cmcd = { url: replaceCmcdParam(response.request.url), rc: response.status }
	const timing = response.resourceTiming

	if (timing) {
		const { startTime, duration } = timing
		const ttfb = getTimeToFirstByte(timing)

		keys.ts = Math.round(timeOrigin + startTime)

		if (Number.isFinite(ttfb)) {
			keys.ttfb = Math.round(ttfb)
		}

		if (duration > 0) {
			keys.ttlb = Math.round(duration)
		}
	}

	return keys
}
