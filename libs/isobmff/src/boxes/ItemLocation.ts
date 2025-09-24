import type { ItemExtent } from './ItemExtent.js';

/**
 * Item Location
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ItemLocation = {
	itemId: number;
	constructionMethod?: number;
	dataReferenceIndex: number;
	baseOffset: number;
	extents: ItemExtent[];
};
