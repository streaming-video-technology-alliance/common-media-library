/**
 * Exponential Weighted Moving Average (EWMA) Estimator Options
 *
 * @group Throughput
 *
 * @beta
 */
export type EwmaEstimatorOptions = {
	fastHalfLife: number;
	slowHalfLife: number;
};
