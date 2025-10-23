import type { Box } from './Box.ts'

/**
 * Single Item Type Reference Box
 *
 *
 * @beta
 */
export type SingleItemTypeReferenceBox = Box & {
	fromItemId: number;
	referenceCount: number;
	toItemId: number[];
};
