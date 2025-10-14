import type { ResourceTiming } from './ResourceTiming.ts';

/**
 * Converts a ResourceTiming sample to bandwidth in bits per second (bps).
 *
 * @param sample - A ResourceTiming sample
 * @returns
 *
 *
 * @beta
 */
export function getBandwidthBps(sample: ResourceTiming): number {
	const durationSeconds = sample.duration / 1000;
	const bandwidthBps = sample.encodedBodySize * 8 / durationSeconds;
	return bandwidthBps;
}
