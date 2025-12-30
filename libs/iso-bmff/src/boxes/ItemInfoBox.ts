import type { ItemInfoEntry } from './ItemInfoEntry.ts'

/**
 * Child boxes of Item Info Box
 *
 * @public
 */
export type ItemInfoBoxChild = ItemInfoEntry;

/**
 * Item Info Box - 'iinf' - Container
 *
 * @public
 */
export type ItemInfoBox = {
	type: 'iinf';
	boxes: ItemInfoBoxChild[];
	entryCount: number;
};

/**
 * @public
 */
export type iinf = ItemInfoBox;
