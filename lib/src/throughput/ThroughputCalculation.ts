/**
 * Throughput Calculation
 *
 * @group Throughput
 *
 * @beta
 */
export type ThroughputCalculation = {
	addSample: (bps: number, durationSeconds: number) => void;
	getEstimate: () => number;
	getTotalDuration: () => number;
}
