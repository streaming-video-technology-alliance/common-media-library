import type { LadderRung } from './LadderRung.ts'

/**
 * The values that BOLA derives from a ladder and a buffer target.
 * All arrays have one entry for each distinct bandwidth, in ascending order.
 * With one distinct bandwidth, BOLA derives no thresholds, and the arrays hold a single 0.
 */
export type BolaParams = {
	/**
	 * The distinct rungs. Equal neighbouring bandwidths merge into one rung.
	 */
	readonly rungs: readonly LadderRung[];

	/**
	 * The position in the player ladder of each distinct rung. The highest position of equal bandwidths wins.
	 */
	readonly positions: readonly number[];

	/**
	 * The effective buffer, in seconds, at which each rung becomes the best choice.
	 */
	readonly thresholds: readonly number[];

	/**
	 * The effective buffer, in seconds, at which the score of each rung reaches zero.
	 */
	readonly maximumBuffers: readonly number[];

	/**
	 * The weight of the utility in the score. The paper calls it V.
	 */
	readonly utilityScale: number;

	/**
	 * The natural logarithm of the lowest bandwidth. The utility of a rung is its logarithm minus this value.
	 */
	readonly lowestBandwidthLog: number;
};
