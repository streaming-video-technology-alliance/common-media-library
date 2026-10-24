/**
 * The options of `createThroughputSelector`.
 *
 * Both factors must be finite numbers above 0 and at most 1, and `upgradeFactor` must not exceed `safetyFactor`.
 * The tolerance must be a finite number of 0 or more.
 * `createThroughputSelector` throws a `RangeError` for an invalid option.
 *
 * @beta
 */
export type ThroughputSelectorOptions = {
	/**
	 * The fraction of the effective throughput that a rung may use.
	 * The selector picks the highest rung at or below `effectiveThroughput * safetyFactor`.
	 * hls.js and shaka-player use 0.95. dash.js uses 0.9.
	 *
	 * @defaultValue `DEFAULT_SAFETY_FACTOR`
	 */
	safetyFactor?: number

	/**
	 * The fraction of the effective throughput that a higher rung may use.
	 * An upgrade needs the new rung at or below `effectiveThroughput * upgradeFactor`.
	 * A value equal to `safetyFactor` disables the hysteresis.
	 * hls.js uses 0.7 for the same rule.
	 *
	 * @defaultValue `DEFAULT_UPGRADE_FACTOR`
	 */
	upgradeFactor?: number

	/**
	 * The seconds of stall that the second pass of the starvation guard allows, capped at the segment duration.
	 * The second pass runs when no rung downloads before the buffer empties.
	 * hls.js uses 4 as `maxStarvationDelay`.
	 *
	 * @defaultValue `DEFAULT_STARVATION_TOLERANCE`
	 */
	starvationTolerance?: number

	/**
	 * When `true`, the selector ignores the time to first byte of every sample.
	 * The pick and the starvation guard then count the transfer only.
	 * Set the option when the time to first byte is not time that a download loses.
	 * Set the option in these cases.
	 * The player requests the next segment before the current download ends.
	 * The value of `responseStart` does not mark the first byte of the body.
	 * The server sends the response headers before the body exists.
	 *
	 * @defaultValue `false`
	 */
	ignoreTimeToFirstByte?: boolean
}
