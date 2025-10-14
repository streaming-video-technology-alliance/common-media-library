import type { ContainerBox } from './ContainerBox.ts';
import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.ts';
import type { TrackFragmentBox } from './TrackFragmentBox.ts';

/**
 * Movie Fragment Box - 'moof' - Container
 *
 *
 * @beta
 */
export type MovieFragmentBox = ContainerBox<MovieFragmentHeaderBox | TrackFragmentBox> & {
	type: 'moof';
};
