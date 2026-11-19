import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Movie Fragment Box (`moof`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.4
 *
 * @public
 */
export type MovieFragmentBox<V extends IsoInt64 = number> = {
	type: 'moof'
	boxes: ParsedIsoBox<V>[]
}
