import type { EditListEntry } from './EditListEntry.js';
import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type EditListBox = FullBox & {
	type: 'elst';
	entryCount: number;
	entries: EditListEntry[];
};
