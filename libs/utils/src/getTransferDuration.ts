import type { ResourceTiming } from './ResourceTiming.ts'

/**
 * Returns the milliseconds a response body took to transfer.
 *
 * When `responseStart` is a finite number between `startTime` and the end of the response,
 * the function returns the time from `responseStart` to the end. The wait for the first byte
 * is not part of the transfer. Otherwise the function returns `duration`.
 *
 * @example
 * {@includeCode ../test/getTransferDuration.test.ts#example}
 *
 * @param sample - A ResourceTiming sample
 * @returns The transfer duration in milliseconds
 *
 * @public
 */
export function getTransferDuration(sample: ResourceTiming): number {
	const { startTime, duration, responseStart } = sample
	const responseEnd = startTime + duration

	if (
		typeof responseStart === 'number' &&
		Number.isFinite(responseStart) &&
		responseStart >= startTime &&
		responseStart <= responseEnd
	) {
		return responseEnd - responseStart
	}

	return duration
}
