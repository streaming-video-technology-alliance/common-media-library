import type { ItemExtent } from './ItemExtent.ts'

/**
 * Item Location
 *
 * @public
 */
export type ItemLocation = {
	itemId: number;
	constructionMethod?: number;
	dataReferenceIndex: number;
	baseOffset: number;
	extents: ItemExtent[];
};
