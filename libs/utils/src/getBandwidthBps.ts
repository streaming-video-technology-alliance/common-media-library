import { getTransferDurationMs } from './getTransferDurationMs.ts'
import type { ResourceTiming } from './ResourceTiming.ts'

/**
 * Converts a ResourceTiming sample to bandwidth in bits per second.
 *
 * The rate is the body size over the transfer duration from {@link getTransferDurationMs}.
 * When the sample has `responseStart`, the wait for the first byte does not count.
 *
 * @example
 * {@includeCode ../test/getBandwidthBps.test.ts#example}
 *
 * @param sample - A ResourceTiming sample
 * @returns The bandwidth in bits per second.
 *
 * @public
 */
export function getBandwidthBps(sample: ResourceTiming): number {
	const durationSeconds = getTransferDurationMs(sample) / 1000
	const bandwidthBps = (sample.encodedBodySize * 8) / durationSeconds
	return bandwidthBps
}
