import type { ContainerBox } from './ContainerBox.js';
import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.js';
import type { TrackFragmentBox } from './TrackFragmentBox.js';

/**
 * Movie Fragment Box - 'moof' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type MovieFragmentBox = ContainerBox<MovieFragmentHeaderBox | TrackFragmentBox> & {
	type: 'moof';
};
