/**
 * Throughput Calculation
 *
 * @group Throughput
 *
 * @beta
 */
export type ThroughputCalculation = {
	/**
	 * Adds sample to the calculation
	 */
	addSample: (bps: number, durationSeconds: number) => void;
	/**
	 * Returns the current estimate of the throughput (in bps)
	 */
	getEstimate: () => number;
	/**
	 * Returns the total duration of the samples added (in seconds)
	 */
	getTotalDuration: () => number;
	/**
	 * Updates the half-life (and hence alpha) of the throughput calculation
	 */
	configure: (halfLife: number) => void;
}

