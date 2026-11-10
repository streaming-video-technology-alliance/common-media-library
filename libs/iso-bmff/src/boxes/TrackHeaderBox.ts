import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.3.2 Track Header Box
 *
 * @public
 */
export type TrackHeaderBox = FullBox & {
	type: 'tkhd'
	creationTime: number
	modificationTime: number
	trackId: number
	reserved1: number
	duration: number
	reserved2: number[]
	layer: number
	alternateGroup: number
	volume: number
	reserved3: number
	/**
	 * The transformation matrix in the order a, b, u, c, d, v, x, y, w.
	 * The identity matrix is `[1, 0, 0, 0, 1, 0, 0, 0, 1]`.
	 * The box stores u, v, and w as 2.30 values, and the other entries as 16.16 values.
	 */
	matrix: number[]
	width: number
	height: number
}
