import type { IsoInt64 } from '../IsoInt64.ts'
import type { SampleAuxiliaryInformationOffsetsBox } from './SampleAuxiliaryInformationOffsetsBox.ts'
import type { SampleAuxiliaryInformationSizesBox } from './SampleAuxiliaryInformationSizesBox.ts'
import type { SampleEncryptionBox } from './SampleEncryptionBox.ts'
import type { SubsampleInformationBox } from './SubsampleInformationBox.ts'
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
	| SampleAuxiliaryInformationSizesBox
	| SampleAuxiliaryInformationOffsetsBox
	| SampleEncryptionBox
	| SubsampleInformationBox

/**
 * Track Fragment Box - 'traf' - Container
 *
 * @public
 */
export type TrackFragmentBox<V extends IsoInt64 = number> = {
	type: 'traf'
	boxes: TrackFragmentBoxChild<V>[]
}
