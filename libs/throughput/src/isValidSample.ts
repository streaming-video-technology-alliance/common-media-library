import type { ResourceTiming } from '@svta/cml-utils'

/**
 * Returns true when the sample has a finite `encodedBodySize` above 0 and a finite `duration` above 0.
 *
 * @param sample - The timing sample
 * @returns Whether the sample counts as a throughput measurement
 */
export function isValidSample(sample: ResourceTiming): boolean {
	const { encodedBodySize, duration } = sample

	return (
		Number.isFinite(encodedBodySize) &&
		encodedBodySize > 0 &&
		Number.isFinite(duration) &&
		duration > 0
	)
}
