import type { ContainerBox } from './ContainerBox.ts'
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.ts'
import type { TrackExtendsBox } from './TrackExtendsBox.ts'

/**
 * Movie Extends Box - 'mvex' - Container
 *
 *
 * @beta
 */
export type MovieExtendsBox = ContainerBox<MovieExtendsHeaderBox | TrackExtendsBox> & {
	type: 'mvex';
};
