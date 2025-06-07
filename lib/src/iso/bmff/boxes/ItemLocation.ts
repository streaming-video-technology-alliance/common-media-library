import type { ItemExtent } from './ItemExtent.js';

export type ItemLocation = {
	itemId: number;
	constructionMethod?: number;
	dataReferenceIndex: number;
	baseOffset: number;
	extents: ItemExtent[];
};
