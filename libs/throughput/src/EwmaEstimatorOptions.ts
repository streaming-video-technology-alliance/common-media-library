/**
 * Exponential Weighted Moving Average (EWMA) Estimator Options
 *
 * @public
 */
export type EwmaEstimatorOptions = {
	defaultEstimate?: number;
	minTotalBytes?: number;
	minBodySize?: number;
	fastHalfLife: number;
	slowHalfLife: number;
};
