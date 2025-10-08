import type { ContainerBox } from './ContainerBox.js';
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.js';
import type { TrackExtendsBox } from './TrackExtendsBox.js';

/**
 * Movie Extends Box - 'mvex' - Container
 *
 *
 * @beta
 */
export type MovieExtendsBox = ContainerBox<MovieExtendsHeaderBox | TrackExtendsBox> & {
	type: 'mvex';
};
