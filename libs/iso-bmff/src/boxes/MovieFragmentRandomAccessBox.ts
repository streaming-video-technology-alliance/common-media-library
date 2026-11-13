import type { IsoInt64 } from '../IsoInt64.ts'
import type { MovieFragmentRandomAccessOffsetBox } from './MovieFragmentRandomAccessOffsetBox.ts'
import type { TrackFragmentRandomAccessBox } from './TrackFragmentRandomAccessBox.ts'

/**
 * Child boxes of Movie Fragment Random Access Box
 *
 * @public
 */
export type MovieFragmentRandomAccessBoxChild<V extends IsoInt64 = number> =
	| TrackFragmentRandomAccessBox<V>
	| MovieFragmentRandomAccessOffsetBox

/**
 * Movie Fragment Random Access Box - 'mfra' - Container
 *
 * @public
 */
export type MovieFragmentRandomAccessBox<V extends IsoInt64 = number> = {
	type: 'mfra'
	boxes: MovieFragmentRandomAccessBoxChild<V>[]
}
