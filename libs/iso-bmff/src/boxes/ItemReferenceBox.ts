import type { SingleItemTypeReferenceBox } from './SingleItemTypeReferenceBox.ts'

/**
 * Child boxes of Item Reference Box
 *
 * @public
 */
export type ItemReferenceBoxChild = SingleItemTypeReferenceBox;

/**
 * Item Reference Box - 'iref' - Container
 *
 * @public
 */
export type ItemReferenceBox = {
	type: 'iref';
	boxes: ItemReferenceBoxChild[];
};
