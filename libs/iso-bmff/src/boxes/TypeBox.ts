/**
 * Utility TypeBox
 *
 * @public
 */
export type TypeBox<T> = {
	type: T;
	majorBrand: string;
	minorVersion: number;
	compatibleBrands: string[];
};
