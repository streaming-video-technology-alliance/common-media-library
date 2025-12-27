import type { Box } from './Box.ts'

/**
 * Single Item Type Reference Box
 *
 * @public
 */
export type SingleItemTypeReferenceBox = Box & {
	fromItemId: number;
	referenceCount: number;
	toItemId: number[];
};
