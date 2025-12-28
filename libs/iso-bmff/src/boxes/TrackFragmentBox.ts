import type { ContainerBox } from './ContainerBox.ts'
import type { SampleAuxiliaryInformationOffsetsBox } from './SampleAuxiliaryInformationOffsetsBox.ts'
import type { SampleAuxiliaryInformationSizesBox } from './SampleAuxiliaryInformationSizesBox.ts'
import type { SampleEncryptionBox } from './SampleEncryptionBox.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './TrackFragmentBaseMediaDecodeTimeBox.ts'
import type { TrackFragmentHeaderBox } from './TrackFragmentHeaderBox.ts'
import type { TrackRunBox } from './TrackRunBox.ts'

/**
 * Track Fragment Box - 'traf' - Container
 *
 * @public
 */
export type TrackFragmentBox = ContainerBox<TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | SampleAuxiliaryInformationSizesBox | SampleAuxiliaryInformationOffsetsBox | SampleEncryptionBox> & {
	type: 'traf';
};

/**
 * @public
 */
export type traf = TrackFragmentBox;
