import type { ContainerBox } from './ContainerBox.js';
import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.js';
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.js';

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentRandomAccessBox = ContainerBox<TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox> & {
	type: 'mfra';
};
