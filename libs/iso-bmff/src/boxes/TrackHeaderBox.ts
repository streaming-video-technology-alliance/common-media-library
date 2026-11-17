import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Track Header Box (`tkhd`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.2
 *
 * The `flags` field holds the values 0x000001 (track enabled), 0x000002 (track in movie),
 * 0x000004 (track in preview), and 0x000008 (size is aspect ratio).
 *
 * @public
 */
export type TrackHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'tkhd'
	/** The creation time of the track, in seconds since midnight, 1904-01-01, UTC. */
	creationTime: V
	/** The most recent time the track was modified, in seconds since midnight, 1904-01-01, UTC. */
	modificationTime: V
	trackId: number
	reserved1: number
	/** The duration of the track in units of the `timescale` of the `mvhd` box. All bits set means that the duration cannot be determined. */
	duration: V
	reserved2: number[]
	layer: number
	alternateGroup: number
	/** The volume of an audio track. The box stores a signed 8.8 value, and the reader returns the decoded number, such as 1. */
	volume: number
	reserved3: number
	/**
	 * The transformation matrix in the order a, b, u, c, d, v, x, y, w.
	 * The identity matrix is `[1, 0, 0, 0, 1, 0, 0, 0, 1]`.
	 * The box stores u, v, and w as 2.30 values, and the other entries as 16.16 values.
	 */
	matrix: number[]
	/** The visual width of the track. The box stores an unsigned 16.16 value, and the reader returns the decoded number. */
	width: number
	/** The visual height of the track. The box stores an unsigned 16.16 value, and the reader returns the decoded number. */
	height: number
}
