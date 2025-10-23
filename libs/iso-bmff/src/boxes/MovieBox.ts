import type { ContainerBox } from './ContainerBox.ts'
import type { MovieExtendsBox } from './MovieExtendsBox.ts'
import type { MovieHeaderBox } from './MovieHeaderBox.ts'
import type { TrackBox } from './TrackBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Movie Box - 'moov' - Container
 *
 *
 * @beta
 */
export type MovieBox = ContainerBox<MovieHeaderBox | TrackBox | MovieExtendsBox | UserDataBox> & {
	type: 'moov';
};
