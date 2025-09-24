import type { ContainerBox } from './ContainerBox.js';
import type { SampleAuxiliaryInformationOffsetsBox } from './SampleAuxiliaryInformationOffsetsBox.js';
import type { SampleAuxiliaryInformationSizesBox } from './SampleAuxiliaryInformationSizesBox.js';
import type { SampleEncryptionBox } from './SampleEncryptionBox.js';
import type { TrackFragmentBaseMediaDecodeTimeBox } from './TrackFragmentBaseMediaDecodeTimeBox.js';
import type { TrackFragmentHeaderBox } from './TrackFragmentHeaderBox.js';
import type { TrackRunBox } from './TrackRunBox.js';

/**
 * Track Fragment Box - 'traf' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type TrackFragmentBox = ContainerBox<TrackFragmentHeaderBox | TrackFragmentBaseMediaDecodeTimeBox | TrackRunBox | SampleAuxiliaryInformationSizesBox | SampleAuxiliaryInformationOffsetsBox | SampleEncryptionBox> & {
	type: 'traf';
};
