import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Track Fragment Box (`traf`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.6
 *
 * @public
 */
export type TrackFragmentBox<V extends IsoInt64 = number> = {
	type: 'traf'
	boxes: ParsedIsoBox<V>[]
}
