import type { DataEntryUrlBox } from './DataEntryUrlBox.js';
import type { DataEntryUrnBox } from './DataEntryUrnBox.js';
import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type DataReferenceBox = FullBox & {
	type: 'dref';
	entryCount: number;
	entries: Array<DataEntryUrlBox | DataEntryUrnBox>;
};
