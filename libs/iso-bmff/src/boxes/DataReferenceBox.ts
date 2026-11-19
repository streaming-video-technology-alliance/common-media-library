import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Data Reference Box (`dref`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @public
 */
export type DataReferenceBox<V extends IsoInt64 = number> = FullBox & {
	type: 'dref'
	entryCount: number
	boxes: ParsedIsoBox<V>[]
}
