/**
 * The fields of the File Type Box (`ftyp`) and the Segment Type Box (`styp`).
 *
 * @public
 */
export type TypeBox<T extends 'ftyp' | 'styp'> = {
	type: T
	majorBrand: string
	minorVersion: number
	compatibleBrands: string[]
}
