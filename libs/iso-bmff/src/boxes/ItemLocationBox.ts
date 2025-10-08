import type { FullBox } from './FullBox.js';
import type { ItemLocation } from './ItemLocation.js';

/**
 * Item Location Box - 'iloc'
 *
 *
 * @beta
 */
export type ItemLocationBox = FullBox & {
	type: 'iloc';
	offsetSize: number;
	lengthSize: number;
	baseOffsetSize: number;
	indexSize?: number;
	itemCount: number;
	items: ItemLocation[];
};
