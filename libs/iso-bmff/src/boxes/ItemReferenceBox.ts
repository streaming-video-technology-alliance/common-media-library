import type { ContainerBox } from './ContainerBox.ts'
import type { SingleItemTypeReferenceBox } from './SingleItemTypeReferenceBox.ts'

/**
 * Item Reference Box - 'iref' - Container
 *
 * @public
 */
export type ItemReferenceBox = ContainerBox<SingleItemTypeReferenceBox> & {
	type: 'iref';
};

/**
 * @public
 */
export type iref = ItemReferenceBox;
