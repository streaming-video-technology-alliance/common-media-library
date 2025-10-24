import type { ContainerBox } from './ContainerBox.ts'
import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.ts'
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.ts'

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 *
 *
 * @beta
 */
export type MovieFragmentRandomAccessBox = ContainerBox<TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox> & {
	type: 'mfra';
};
