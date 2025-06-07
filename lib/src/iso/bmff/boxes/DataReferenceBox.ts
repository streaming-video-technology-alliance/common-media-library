import type { DataEntryUrlBox } from './DataEntryUrlBox.js';
import type { DataEntryUrnBox } from './DataEntryUrnBox.js';
import type { FullBox } from './FullBox.js';

/**
 * Data Reference Box - 'dref'
 */
export type DataReferenceBox = FullBox & {
	type: 'dref';
	entryCount: number;
	boxes: Array<DataEntryUrlBox | DataEntryUrnBox>;
};
