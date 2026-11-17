import type { TrackReferenceTypeBox } from './TrackReferenceTypeBox.ts'

/**
 * Child boxes of Track Reference Box
 *
 * @public
 */
export type TrackReferenceBoxChild = TrackReferenceTypeBox

/**
 * Track Reference Box (`tref`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.3
 *
 * @public
 */
export type TrackReferenceBox = {
	type: 'tref'
	boxes: TrackReferenceBoxChild[]
}
