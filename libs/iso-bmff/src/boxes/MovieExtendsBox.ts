import type { IsoInt64 } from '../IsoInt64.ts'
import type { MovieExtendsHeaderBox } from './MovieExtendsHeaderBox.ts'
import type { TrackExtendsBox } from './TrackExtendsBox.ts'

/**
 * Child boxes of Movie Extends Box
 *
 * @public
 */
export type MovieExtendsBoxChild<V extends IsoInt64 = number> =
	| MovieExtendsHeaderBox<V>
	| TrackExtendsBox

/**
 * Movie Extends Box (`mvex`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.1
 *
 * @public
 */
export type MovieExtendsBox<V extends IsoInt64 = number> = {
	type: 'mvex'
	boxes: MovieExtendsBoxChild<V>[]
}
