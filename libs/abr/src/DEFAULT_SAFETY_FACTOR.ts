/**
 * The default `safetyFactor` of the throughput selector.
 * The selector picks the highest rung whose download fits in one segment at 0.9 times the throughput.
 *
 * @beta
 */
export const DEFAULT_SAFETY_FACTOR = 0.9
