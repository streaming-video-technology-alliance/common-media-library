/**
 * Throughput Calculation
 *
 * @group Throughput
 *
 * @beta
 */
export type ThroughputCalculation = {
	addEntry: (bps: number, durationSeconds: number) => void;
	getEstimate: () => number;
}
