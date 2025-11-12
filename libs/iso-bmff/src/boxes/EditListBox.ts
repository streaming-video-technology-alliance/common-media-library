import type { EditListEntry } from './EditListEntry.ts'
import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.6 Edit List Box
 *
 *
 * @beta
 */
export type EditListBox = FullBox<'elst'> & {
	entryCount: number;
	entries: EditListEntry[];
};
