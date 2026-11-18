import type { IsoInt64 } from '../IsoInt64.ts'
import type { SubSampleInformationBox } from './SubSampleInformationBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentHeaderBox } from './TrackFragmentHeaderBox.ts'
import type { TrackRunBox } from './TrackRunBox.ts'

/**
 * Child boxes of Track Fragment Box
 *
 * @public
 */
export type TrackFragmentBoxChild<V extends IsoInt64 = number> =
	| TrackFragmentHeaderBox<V>
	| TrackFragmentBaseMediaDecodeTimeBox<V>
	| TrackRunBox
	| SubSampleInformationBox

/**
 * Track Fragment Box (`traf`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.6
 *
 * @public
 */
export type TrackFragmentBox<V extends IsoInt64 = number> = {
	type: 'traf'
	boxes: TrackFragmentBoxChild<V>[]
}
