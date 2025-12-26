import type { ResourceTiming } from '@svta/cml-utils'

/**
 * Throughput Estimator.
 *
 * @public
 */
export type ThroughputEstimator = {
	/**
	 * Adds a sample to the throughput estimator
	 *
	 * @param sample - The timing sample to add
	 */
	sample(sample: ResourceTiming): void;

	/**
	 * Returns the current estimate of the throughput (in bytes per second)
	 *
	 * @returns The current estimate of the throughput
	 */
	getEstimate(): number;
};
