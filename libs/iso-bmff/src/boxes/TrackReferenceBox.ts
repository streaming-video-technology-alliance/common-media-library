import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * Track Reference Box (`tref`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.3
 *
 * @public
 */
export type TrackReferenceBox<V extends IsoInt64 = number> = {
	type: 'tref'
	boxes: ParsedIsoBox<V>[]
}
