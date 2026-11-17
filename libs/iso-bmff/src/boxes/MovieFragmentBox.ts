import type { IsoInt64 } from '../IsoInt64.ts'
import type { MovieFragmentHeaderBox } from './MovieFragmentHeaderBox.ts'
import type { TrackFragmentBox } from './TrackFragmentBox.ts'

/**
 * Child boxes of Movie Fragment Box
 *
 * @public
 */
export type MovieFragmentBoxChild<V extends IsoInt64 = number> =
	| MovieFragmentHeaderBox
	| TrackFragmentBox<V>

/**
 * Movie Fragment Box (`moof`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.4
 *
 * @public
 */
export type MovieFragmentBox<V extends IsoInt64 = number> = {
	type: 'moof'
	boxes: MovieFragmentBoxChild<V>[]
}
