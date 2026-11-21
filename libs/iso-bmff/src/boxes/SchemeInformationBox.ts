import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * Scheme Information Box (`schi`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.6
 *
 * @public
 */
export type SchemeInformationBox<V extends IsoInt64 = number> = {
	type: 'schi'
	boxes: ParsedIsoBox<V>[]
}
