/**
 * Exponential Weighted Moving Average (EWMA) Estimator Options
 *
 * @public
 */
export type EwmaEstimatorOptions = {
	defaultEstimate?: number;
	minTotalBytes?: number;
	minBodySize?: number;

	/**
	 * The half-life of the fast moving average, in seconds.
	 */
	fastHalfLife: number;

	/**
	 * The half-life of the slow moving average, in seconds.
	 */
	slowHalfLife: number;
};
