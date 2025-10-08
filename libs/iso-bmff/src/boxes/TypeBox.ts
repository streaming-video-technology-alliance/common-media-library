import type { Box } from './Box.js';

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
