import type { FullBox } from './FullBox.ts';
import type { ItemLocation } from './ItemLocation.ts';

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
