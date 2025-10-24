import type { Box } from './Box.ts'

/**
 * Utility TypeBox
 *
 *
 * @beta
 */
export type TypeBox<T> = Box & {
	type: T;
	majorBrand: string;
	minorVersion: number;
	compatibleBrands: string[];
};
