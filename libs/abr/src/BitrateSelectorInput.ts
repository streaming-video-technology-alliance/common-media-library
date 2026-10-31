import type { LadderRung } from './LadderRung.ts'

/**
 * The input of one `select` call.
 *
 * @beta
 */
export type BitrateSelectorInput = {
	/**
	 * The rungs the player can play, in ascending order of `bandwidth`.
	 * The player removes the rungs it cannot play before the call.
	 * Equal neighbouring bandwidths are accepted, and the highest position wins.
	 * The `index` of the decision is a position in this array.
	 */
	ladder: readonly LadderRung[]

	/**
	 * The seconds of media buffered ahead of the playhead.
	 * A value that is not a finite number, or is negative, counts as 0.
	 */
	bufferLevel: number

	/**
	 * The throughput estimate, in bits per second.
	 * A value that is not a finite number of 0 or more, such as `NaN`, counts as unknown.
	 */
	throughput: number

	/**
	 * The current time, in milliseconds, on the clock of `ResourceTiming.startTime`.
	 */
	now: number

	/**
	 * The buffer level, in seconds, that the player aims for.
	 * The player passes this field in every call or in none.
	 */
	bufferTarget?: number

	/**
	 * The media duration, in seconds, of the next segment.
	 * A player omits this field to skip the starvation guard, for example near the live edge.
	 */
	segmentDuration?: number

	/**
	 * The playback rate.
	 * A value that is not a positive finite number counts as 1.
	 *
	 * @defaultValue `1`
	 */
	playbackRate?: number
}
