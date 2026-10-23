/**
 * One rung of a bitrate ladder.
 *
 * @beta
 */
export type LadderRung = {
	/**
	 * The declared peak bandwidth of the rung, in bits per second.
	 * This is the `BANDWIDTH` attribute in HLS and the `bandwidth` attribute in DASH.
	 * The value is a positive finite number.
	 */
	bandwidth: number
}
