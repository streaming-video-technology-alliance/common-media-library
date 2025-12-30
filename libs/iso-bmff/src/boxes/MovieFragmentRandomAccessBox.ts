import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.ts'
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.ts'

/**
 * Child boxes of Movie Fragment Random Access Box
 *
 * @public
 */
export type MovieFragmentRandomAccessBoxChild = TrackFragmentRandomAccessBox | MovieFragmentRandomAccessOffsetBox;

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 *
 * @public
 */
export type MovieFragmentRandomAccessBox = {
	type: 'mfra';
	boxes: MovieFragmentRandomAccessBoxChild[];
};

/**
 * @public
 */
export type mfra = MovieFragmentRandomAccessBox;
