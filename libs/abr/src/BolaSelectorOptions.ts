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
	 * Set the option when the request overlap hides the whole time to first byte.
	 * The next request must start at least the time to first byte before the current download ends.
	 * That wait then runs during the transfer of the previous segment and delays nothing.
	 * Keep the default for a smaller overlap, because the rest of the wait still delays the download.
	 *
	 * @defaultValue `false`
	 */
	ignoreTimeToFirstByte?: boolean
}
