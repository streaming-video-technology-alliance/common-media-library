import type { MovieExtendsBox } from './MovieExtendsBox.ts'
import type { MovieHeaderBox } from './MovieHeaderBox.ts'
import type { TrackBox } from './TrackBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Child boxes of Movie Box
 *
 * @public
 */
export type MovieBoxChild = MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox;

/**
 * Movie Box - 'moov' - Container
 *
 * @public
 */
export type MovieBox = {
	type: 'moov';
	boxes: MovieBoxChild[];
};
