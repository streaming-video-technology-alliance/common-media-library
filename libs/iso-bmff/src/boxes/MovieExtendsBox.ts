import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Movie Extends Box (`mvex`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.1
 *
 * @public
 */
export type MovieExtendsBox<V extends IsoInt64 = number> = {
	type: 'mvex'
	boxes: ParsedIsoBox<V>[]
}
