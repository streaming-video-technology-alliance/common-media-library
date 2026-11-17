import type { DataEntryUrlBox } from './DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from './DataEntryUrnBox.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Data Reference Box (`dref`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @public
 */
export type DataReferenceBox = FullBox & {
	type: 'dref'
	entryCount: number
	entries: (DataEntryUrlBox | DataEntryUrnBox)[]
}
