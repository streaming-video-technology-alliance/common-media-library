import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * Media Information Box (`minf`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.4
 *
 * @public
 */
export type MediaInformationBox<V extends IsoInt64 = number> = {
	type: 'minf'
	boxes: ParsedIsoBox<V>[]
}
