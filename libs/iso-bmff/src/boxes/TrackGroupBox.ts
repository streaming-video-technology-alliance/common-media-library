import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Track Group Box (`trgr`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.4
 *
 * @public
 */
export type TrackGroupBox<V extends IsoInt64 = number> = {
	type: 'trgr'
	boxes: ParsedIsoBox<V>[]
}
