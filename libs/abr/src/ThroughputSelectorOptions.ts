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
	 * The fraction of the throughput that a rung may use.
	 * The selector picks the highest rung whose download fits in one segment at `throughput * safetyFactor`.
	 * Without `segmentDuration`, the pick is the highest rung at or below `throughput * safetyFactor / playbackRate`.
	 * hls.js and shaka-player use 0.95. dash.js uses 0.9.
	 *
	 * @defaultValue `DEFAULT_SAFETY_FACTOR`
	 */
	safetyFactor?: number

	/**
	 * The fraction of the throughput that a higher rung may use.
	 * An upgrade needs a rung whose download fits in one segment at `throughput * upgradeFactor`.
	 * Without `segmentDuration`, the upgrade needs a rung at or below `throughput * upgradeFactor / playbackRate`.
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
	 * Both read the time to first byte only when the input has `segmentDuration`.
	 * Set the option when the request overlap hides the whole time to first byte.
	 * The next request must start at least the time to first byte before the current download ends.
	 * That wait then runs during the transfer of the previous segment and delays nothing.
	 * Keep the default for a smaller overlap, because the rest of the wait still delays the download.
	 * The selector accepts the `select` call for the next request during the current download.
	 * The current rung is then the rung of the last sample.
	 *
	 * @defaultValue `false`
	 */
	ignoreTimeToFirstByte?: boolean
}
