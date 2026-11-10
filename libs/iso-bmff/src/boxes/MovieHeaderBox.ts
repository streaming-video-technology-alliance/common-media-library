import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.2.2 Movie Header Box
 *
 * @public
 */
export type MovieHeaderBox = FullBox & {
	type: 'mvhd'
	creationTime: number
	modificationTime: number
	timescale: number
	duration: number
	rate: number
	volume: number
	reserved1: number
	reserved2: number[]
	/**
	 * The transformation matrix in the order a, b, u, c, d, v, x, y, w.
	 * The identity matrix is `[1, 0, 0, 0, 1, 0, 0, 0, 1]`.
	 */
	matrix: number[]
	preDefined: number[]
	nextTrackId: number
}
