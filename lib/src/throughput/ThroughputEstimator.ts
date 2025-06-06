import type { ResourceTiming } from '../request/ResourceTiming.js';

/**
 * Throughput Estimator.
 *
 * @group Throughput
 *
 * @beta
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
