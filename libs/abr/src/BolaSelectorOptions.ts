/**
 * The options of `createBolaSelector`.
 *
 * Both factors must be finite numbers above 0 and at most 1.
 * `createBolaSelector` throws a `RangeError` for an invalid option.
 *
 * @beta
 */
export type BolaSelectorOptions = {
	/**
	 * The fraction of the throughput that a rung may use.
	 * The selector uses it at startup and in the oscillation guard.
	 * It picks the highest rung whose download fits in one segment at `throughput * safetyFactor`.
	 * Without `segmentDuration`, the pick is the highest rung at or below `throughput * safetyFactor`.
	 * It has the same meaning as the option of `createThroughputSelector`.
	 *
	 * @defaultValue `DEFAULT_SAFETY_FACTOR`
	 */
	safetyFactor?: number

	/**
	 * The fraction of the throughput that the starvation guard assumes for the download of the next segment.
	 * The guard runs when the player passes `segmentDuration`.
	 * It lowers the pick when that download does not fit in the real buffer.
	 * One download varies more than the smoothed estimate, so the default is lower than the default of `safetyFactor`.
	 *
	 * @defaultValue `DEFAULT_STARVATION_SAFETY_FACTOR`
	 */
	starvationSafetyFactor?: number

	/**
	 * When `true`, the selector ignores the time to first byte of every sample.
	 * The pick and the starvation guard then count the transfer only.
	 * Both read the time to first byte only when the input has `segmentDuration`.
	 * The option fits a time to first byte that is not time a download loses.
	 * Set the option in these cases.
	 * The player requests the next segment before the current download ends.
	 * The value of `responseStart` does not mark the first byte of the body.
	 * The server sends the response headers before the body exists.
	 *
	 * @defaultValue `false`
	 */
	ignoreTimeToFirstByte?: boolean
}
