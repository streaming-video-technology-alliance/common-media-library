import type { EditListEntry } from './EditListEntry.js';
import type { FullBox } from './FullBox.js';

/**
 * Edit List Box - 'elst'
 */
export type EditListBox = FullBox & {
	type: 'elst';
	entryCount: number;
	entries: EditListEntry[];
};
