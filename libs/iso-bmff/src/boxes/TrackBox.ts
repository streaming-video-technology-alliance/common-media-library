import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Track Box (`trak`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.1
 *
 * @public
 */
export type TrackBox<V extends IsoInt64 = number> = {
	type: 'trak'
	boxes: ParsedIsoBox<V>[]
}
