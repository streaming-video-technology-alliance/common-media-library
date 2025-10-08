import type { ItemExtent } from './ItemExtent.js';

/**
 * Item Location
 *
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
