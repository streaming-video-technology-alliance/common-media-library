/**
 * Throughput Selector Options
 *
 * Both factors must be finite numbers in the range (0, 1].
 * `upgradeFactor` must not exceed `safetyFactor`.
 * The constructor throws a `RangeError` for an invalid option.
 *
 * @beta
 */
export type ThroughputSelectorOptions = {
	/**
	 * The fraction of the throughput estimate that a rung may use.
	 * The selector picks the highest rung at or below `throughput * safetyFactor`.
	 * hls.js and shaka-player use 0.95. dash.js uses 0.9.
	 *
	 * @defaultValue `DEFAULT_SAFETY_FACTOR`
	 */
	safetyFactor?: number;

	/**
	 * The fraction of the throughput estimate that a higher rung may use.
	 * An upgrade needs the new rung at or below `throughput * upgradeFactor`.
	 * A value equal to `safetyFactor` disables the hysteresis.
	 * hls.js uses 0.7. shaka-player uses 0.85.
	 *
	 * @defaultValue `DEFAULT_UPGRADE_FACTOR`
	 */
	upgradeFactor?: number;
};
