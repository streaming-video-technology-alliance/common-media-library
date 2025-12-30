import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.ts'
import type { TrackFragmentBox } from './TrackFragmentBox.ts'

/**
 * Child boxes of Movie Fragment Box
 *
 * @public
 */
export type MovieFragmentBoxChild = MovieFragmentHeaderBox | TrackFragmentBox;

/**
 * Movie Fragment Box - 'moof' - Container
 *
 * @public
 */
export type MovieFragmentBox = {
	type: 'moof';
	boxes: MovieFragmentBoxChild[];
};

/**
 * @public
 */
export type moof = MovieFragmentBox;
