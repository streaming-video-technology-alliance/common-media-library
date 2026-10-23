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
	 * It picks the highest rung at or below `throughput * safetyFactor`.
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
}
