import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.ts'
import type { TrackExtendsBox } from './TrackExtendsBox.ts'

/**
 * Child boxes of Movie Extends Box
 *
 * @public
 */
export type MovieExtendsBoxChild = MovieExtendsHeaderBox | TrackExtendsBox;

/**
 * Movie Extends Box - 'mvex' - Container
 *
 * @public
 */
export type MovieExtendsBox = {
	type: 'mvex';
	boxes: MovieExtendsBoxChild[];
};
