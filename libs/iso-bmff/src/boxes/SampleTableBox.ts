import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'

/**
 * Sample Table Box (`stbl`).
 *
 * ISO/IEC 14496-12:2015 - 8.5.1
 *
 * @public
 */
export type SampleTableBox<V extends IsoInt64 = number> = {
	type: 'stbl'
	boxes: ParsedIsoBox<V>[]
}
