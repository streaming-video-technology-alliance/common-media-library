import type { Box } from './Box.ts'
import type { BoxType } from './BoxType.ts'

/**
 * Single Item Type Reference Box
 *
 *
 * @beta
 */
export type SingleItemTypeReferenceBox = Box<BoxType> & {
	fromItemId: number;
	referenceCount: number;
	toItemId: number[];
};
