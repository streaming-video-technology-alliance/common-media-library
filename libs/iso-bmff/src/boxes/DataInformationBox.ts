import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * Data Information Box (`dinf`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.1
 *
 * @public
 */
export type DataInformationBox<V extends IsoInt64 = number> = {
	type: 'dinf'
	boxes: ParsedIsoBox<V>[]
}
