/**
 * Exponential Weighted Moving Average (EWMA) Estimator Options
 *
 * @public
 */
export type EwmaEstimatorOptions = {
	/**
	 * The estimate, in bits per second, that `getEstimate` returns before the first sample.
	 * `getEstimate` also returns this value while the sampled bytes are below `minTotalBytes`.
	 *
	 * @defaultValue `NaN`
	 */
	defaultEstimate?: number

	/**
	 * The number of bytes to sample before `getEstimate` returns a measured estimate.
	 * Below this total, `getEstimate` returns `defaultEstimate`.
	 * shaka-player uses 128000.
	 *
	 * @defaultValue `0`
	 */
	minTotalBytes?: number

	/**
	 * The smallest `encodedBodySize`, in bytes, that counts as a sample.
	 * A sample with an `encodedBodySize` of 0 never counts.
	 * The estimator ignores smaller responses, because their transfer is too short to measure.
	 * shaka-player uses 16000.
	 *
	 * @defaultValue `0`
	 */
	minBodySize?: number

	/**
	 * The shortest transfer, in milliseconds, that counts as a sample.
	 * The transfer runs from `responseStart` to the end of the response when the sample has `responseStart`, and over `duration` otherwise.
	 * A body that arrives within a few milliseconds of its headers came from a cache, and its rate says nothing about the network.
	 * shaka-player uses 5 as `cacheLoadThreshold`.
	 *
	 * @defaultValue `0`
	 */
	minTransferDuration?: number

	/**
	 * The half-life of the fast moving average, in seconds.
	 * Samples from the last `fastHalfLife` seconds have half of the weight in the estimate.
	 * shaka-player uses 2.
	 */
	fastHalfLife: number

	/**
	 * The half-life of the slow moving average, in seconds.
	 * Samples from the last `slowHalfLife` seconds have half of the weight in the estimate.
	 * shaka-player uses 5.
	 */
	slowHalfLife: number
}
