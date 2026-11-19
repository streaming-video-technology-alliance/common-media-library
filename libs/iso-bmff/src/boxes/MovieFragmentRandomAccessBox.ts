import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Movie Fragment Random Access Box (`mfra`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.9
 *
 * @public
 */
export type MovieFragmentRandomAccessBox<V extends IsoInt64 = number> = {
	type: 'mfra'
	boxes: ParsedIsoBox<V>[]
}
