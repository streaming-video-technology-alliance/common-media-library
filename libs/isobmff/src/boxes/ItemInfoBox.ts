import type { ContainerBox } from './ContainerBox.js';
import type { ItemInfoEntry } from './ItemInfoEntry.js';

/**
 * Item Info Box - 'iinf' - Container
 *
 *
 * @beta
 */
export type ItemInfoBox = ContainerBox<ItemInfoEntry> & {
	type: 'iinf';
	entryCount: number;
};
