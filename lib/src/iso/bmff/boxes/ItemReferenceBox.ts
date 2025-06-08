import type { ContainerBox } from './ContainerBox.js';
import type { SingleItemTypeReferenceBox } from './SingleItemTypeReferenceBox.js';

/**
 * Item Reference Box - 'iref' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ItemReferenceBox = ContainerBox<SingleItemTypeReferenceBox> & {
	type: 'iref';
};
