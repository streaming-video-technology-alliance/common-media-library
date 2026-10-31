import type { ResourceTiming } from '@svta/cml-utils'

/**
 * Throughput Estimator.
 *
 * @public
 */
export type ThroughputEstimator = {
	/**
	 * Adds a sample to the throughput estimator.
	 * The estimator ignores a sample with an `encodedBodySize` or a `duration` at or below 0, `NaN`, or `Infinity`.
	 *
	 * @param sample - The timing sample to add
	 */
	sample(sample: ResourceTiming): void

	/**
	 * Returns the current estimate of the throughput (in bits per second)
	 *
	 * @returns The current estimate of the throughput
	 */
	getEstimate(): number
}
