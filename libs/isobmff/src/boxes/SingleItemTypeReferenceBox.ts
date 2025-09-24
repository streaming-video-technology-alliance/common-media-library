import type { Box } from './Box.js';

/**
 * Single Item Type Reference Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type SingleItemTypeReferenceBox = Box & {
	fromItemId: number;
	referenceCount: number;
	toItemId: number[];
};
