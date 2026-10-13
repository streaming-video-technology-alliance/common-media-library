import type { ResourceTiming } from '@svta/cml-utils'

/**
 * A finished or abandoned segment download.
 *
 * @beta
 */
export type SegmentSample = {
	/**
	 * The timing of the download. The player passes the same object to the throughput estimator.
	 */
	timing: ResourceTiming;

	/**
	 * The bitrate of the requested rung, in bits per second.
	 * The value is authoritative. A selector that keeps a current rung corrects it from this value.
	 */
	bitrate: number;

	/**
	 * The media duration of the segment, in seconds.
	 */
	duration: number;

	/**
	 * The seconds of media buffered ahead of the playhead at response end, before the segment is appended.
	 */
	bufferLevel: number;

	/**
	 * `true` when the segment replaced buffered media.
	 */
	isReplacement?: boolean;

	/**
	 * `true` when the player cancelled the download.
	 */
	aborted?: boolean;
};
