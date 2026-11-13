import type { IsoInt64 } from '../IsoInt64.ts'
import type { MovieExtendsBox } from './MovieExtendsBox.ts'
import type { MovieHeaderBox } from './MovieHeaderBox.ts'
import type { TrackBox } from './TrackBox.ts'
import type { UserDataBox } from './UserDataBox.ts'

/**
 * Child boxes of Movie Box
 *
 * @public
 */
export type MovieBoxChild<V extends IsoInt64 = number> =
	| MovieHeaderBox<V>
	| TrackBox<V>
	| MovieExtendsBox<V>
	| UserDataBox

/**
 * Movie Box - 'moov' - Container
 *
 * @public
 */
export type MovieBox<V extends IsoInt64 = number> = {
	type: 'moov'
	boxes: MovieBoxChild<V>[]
}
