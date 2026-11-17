import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Movie Header Box (`mvhd`).
 *
 * ISO/IEC 14496-12:2015 - 8.2.2
 *
 * @public
 */
export type MovieHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'mvhd'
	/** The creation time of the presentation, in seconds since midnight, 1904-01-01, UTC. */
	creationTime: V
	/** The most recent time the presentation was modified, in seconds since midnight, 1904-01-01, UTC. */
	modificationTime: V
	/** The number of time units that pass in one second for the presentation. */
	timescale: number
	/** The duration of the presentation in units of `timescale`. All bits set means that the duration cannot be determined. */
	duration: V
	/** The preferred playback rate. The box stores a signed 16.16 value, and the reader returns the decoded number, such as 1. */
	rate: number
	/** The preferred playback volume. The box stores a signed 8.8 value, and the reader returns the decoded number, such as 1. */
	volume: number
	reserved1: number
	reserved2: number[]
	/**
	 * The transformation matrix in the order a, b, u, c, d, v, x, y, w.
	 * The identity matrix is `[1, 0, 0, 0, 1, 0, 0, 0, 1]`.
	 * The box stores u, v, and w as 2.30 values, and the other entries as 16.16 values.
	 */
	matrix: number[]
	preDefined: number[]
	/** The track ID for the next track that a writer adds to the presentation. */
	nextTrackId: number
}
