import type { DataEntryUrlBox } from './DataEntryUrlBox.ts'
import type { DataEntryUrnBox } from './DataEntryUrnBox.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @public
 */
export type DataReferenceBox = FullBox & {
	type: 'dref';
	entryCount: number;
	entries: (DataEntryUrlBox | DataEntryUrnBox)[];
};

/**
 * @public
 */
export type dref = DataReferenceBox;
