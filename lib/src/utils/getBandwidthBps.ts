import type { ResourceTiming } from '../request/ResourceTiming.js';

/**
 * Converts a ResourceTiming sample to bandwidth in bits per second (bps).
 *
 * @param sample - A ResourceTiming sample
 * @returns
 */
export function getBandwidthBps(sample: ResourceTiming): number {
	const durationSeconds = sample.duration / 1000;
	const bandwidthBps = sample.encodedBodySize * 8 / durationSeconds;
	return bandwidthBps;
}
