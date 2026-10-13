/**
 * The input of one `select` call.
 *
 * @beta
 */
export type BitrateSelectorInput = {
	/**
	 * The bitrate of each rung the player can play, in bits per second, in ascending order.
	 * The player removes the rungs it cannot play before the call.
	 * The `index` of the decision is a position in this array.
	 */
	ladder: readonly number[];

	/**
	 * The seconds of media buffered ahead of the playhead.
	 * A value that is not a finite number, or is negative, counts as 0.
	 */
	bufferLevel: number;

	/**
	 * The throughput estimate, in bits per second.
	 * A value that is not a positive finite number, such as `NaN`, counts as unknown.
	 */
	throughput: number;

	/**
	 * The current time, in milliseconds, on the clock of `ResourceTiming.startTime`.
	 */
	now: number;

	/**
	 * The buffer level, in seconds, that the player aims for.
	 */
	bufferTarget?: number;

	/**
	 * The media duration, in seconds, of the next segment.
	 */
	segmentDuration?: number;

	/**
	 * The playback rate.
	 * A value that is not a positive finite number counts as 1.
	 *
	 * @defaultValue `1`
	 */
	playbackRate?: number;
};
