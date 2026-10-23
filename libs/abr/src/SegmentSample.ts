import type { ResourceTiming } from '@svta/cml-utils'

/**
 * A finished or abandoned segment download.
 *
 * @beta
 */
export type SegmentSample = {
	/**
	 * The timing of the download. The player passes the same object to the throughput estimator.
	 * The starvation guard reads the first-byte wait from `responseStart`.
	 */
	timing: ResourceTiming

	/**
	 * The bandwidth of the requested rung, in bits per second.
	 * The value is the same number as the ladder entry of the rung, never a measured rate.
	 * The value is authoritative. A selector that keeps a current rung corrects it from this value.
	 */
	bandwidth: number

	/**
	 * The media duration of the segment, in seconds.
	 */
	duration: number

	/**
	 * The seconds of media buffered ahead of the playhead at response end, before the segment is appended.
	 */
	bufferLevel: number

	/**
	 * `true` when the segment replaced buffered media.
	 */
	isReplacement?: boolean

	/**
	 * `true` when the player cancelled the download.
	 */
	aborted?: boolean
}
