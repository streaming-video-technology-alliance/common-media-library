import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readFtyp } from '../readers/readFtyp.ts'
import { writeFtyp } from '../writers/writeFtyp.ts'
import type { Fields } from './types/Fields.ts'
import type { FileTypeBox } from './types/FileTypeBox.ts'

/**
 * File Type Box
 *
 * @public
 */
export class ftyp implements Fields<FileTypeBox> {
	/**
	 * Write a FileTypeBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<FileTypeBox>): IsoBoxWriteView {
		return writeFtyp(fields)
	}

	/**
	 * Read a FileTypeBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed FileTypeBox
	 */
	static read(view: IsoBoxReadView): Fields<FileTypeBox> {
		return readFtyp(view)
	}

	majorBrand: string
	minorVersion: number
	compatibleBrands: string[]

	/**
	 * Create a new FileTypeBox.
	 *
	 * @param majorBrand - The major brand
	 * @param minorVersion - The minor version
	 * @param compatibleBrands - The compatible brands
	 */
	constructor(majorBrand: string, minorVersion: number, compatibleBrands: string[]) {
		this.majorBrand = majorBrand
		this.minorVersion = minorVersion
		this.compatibleBrands = compatibleBrands
	}
}
