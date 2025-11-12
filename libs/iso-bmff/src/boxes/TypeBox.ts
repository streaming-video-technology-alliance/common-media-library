import type { Box } from './Box.ts';
import type { BoxType } from './BoxType.ts';

/**
 * Utility TypeBox
 *
 *
 * @beta
 */
export type TypeBox<T extends BoxType> = Box<T> & {
	majorBrand: string;
	minorVersion: number;
	compatibleBrands: string[];
};
