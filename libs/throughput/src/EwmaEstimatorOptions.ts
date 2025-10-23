/**
 * Exponential Weighted Moving Average (EWMA) Estimator Options
 *
 *
 * @beta
 */
export type EwmaEstimatorOptions = {
	defaultEstimate?: number;
	minTotalBytes?: number;
	minBodySize?: number;
	fastHalfLife: number;
	slowHalfLife: number;
};
