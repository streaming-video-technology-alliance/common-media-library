import type { ResourceTiming } from './ResourceTiming.ts'

/**
 * Returns the milliseconds a response waited for its first byte.
 *
 * When `responseStart` is a finite number between `startTime` and the end of the response,
 * the function returns the time from `startTime` to `responseStart`. Otherwise the function returns `NaN`.
 * The wait and the transfer from {@link getTransferDurationMs} add up to `duration`.
 *
 * @example
 * {@includeCode ../test/getTimeToFirstByteMs.test.ts#example}
 *
 * @param sample - A ResourceTiming sample
 * @returns The time to first byte in milliseconds, or `NaN` when the sample has no usable `responseStart`
 *
 * @public
 */
export function getTimeToFirstByteMs(sample: ResourceTiming): number {
	const { startTime, duration, responseStart } = sample

	if (
		typeof responseStart === 'number' &&
		Number.isFinite(responseStart) &&
		responseStart >= startTime &&
		responseStart <= startTime + duration
	) {
		return responseStart - startTime
	}

	return NaN
}
