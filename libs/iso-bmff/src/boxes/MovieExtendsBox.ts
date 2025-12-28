import type { ContainerBox } from './ContainerBox.ts'
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.ts'
import type { TrackExtendsBox } from './TrackExtendsBox.ts'

/**
 * Movie Extends Box - 'mvex' - Container
 *
 * @public
 */
export type MovieExtendsBox = ContainerBox<MovieExtendsHeaderBox | TrackExtendsBox> & {
	type: 'mvex';
};

/**
 * @public
 */
export type mvex = MovieExtendsBox;
