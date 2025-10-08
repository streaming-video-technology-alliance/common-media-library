import type { ContainerBox } from './ContainerBox.js';
import type { MovieExtendsBox } from './MovieExtendsBox.js';
import type { MovieHeaderBox } from './MovieHeaderBox.js';
import type { TrackBox } from './TrackBox.js';
import type { UserDataBox } from './UserDataBox.js';

/**
 * Movie Box - 'moov' - Container
 *
 *
 * @beta
 */
export type MovieBox = ContainerBox<MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox> & {
	type: 'moov';
};
