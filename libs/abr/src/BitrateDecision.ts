/**
 * The result of one `select` call.
 *
 * @beta
 */
export type BitrateDecision = {
	/**
	 * The position of the chosen rung in the `ladder` of the same call.
	 */
	readonly index: number

	/**
	 * The time, in seconds, to wait before the next request. The value is 0 or more.
	 * A player that cannot wait may ignore the value.
	 */
	readonly delay: number
}
