/**
 * The options of `createBolaSelector`.
 *
 * `safetyFactor` must be a finite number above 0 and at most 1.
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
	safetyFactor?: number;
};
