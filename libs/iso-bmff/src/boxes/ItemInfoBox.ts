import type { ContainerBox } from './ContainerBox.ts'
import type { ItemInfoEntry } from './ItemInfoEntry.ts'

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
