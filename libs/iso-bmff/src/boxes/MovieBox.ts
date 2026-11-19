import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Movie Box (`moov`).
 *
 * ISO/IEC 14496-12:2015 - 8.2.1
 *
 * @public
 */
export type MovieBox<V extends IsoInt64 = number> = {
	type: 'moov'
	boxes: ParsedIsoBox<V>[]
}
