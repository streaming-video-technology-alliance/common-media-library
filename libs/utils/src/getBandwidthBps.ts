import type { ResourceTiming } from './ResourceTiming.ts'

/**
 * Converts a ResourceTiming sample to bandwidth in bits per second.
 *
 * @param sample - A ResourceTiming sample
 * @returns The bandwidth in bits per second.
 *
 * @public
 */
export function getBandwidthBps(sample: ResourceTiming): number {
	const durationSeconds = sample.duration / 1000
	const bandwidthBps = sample.encodedBodySize * 8 / durationSeconds
	return bandwidthBps
}
