import { ResourceTiming } from '../request/ResourceTiming'

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
	 */
	sample(sample: ResourceTiming): void
	/**
	 * Returns the current estimate of the throughput (in bytes per second)
	 */
	getEstimate(): number
}
