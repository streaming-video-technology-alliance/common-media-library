import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readStyp } from '../readers/readStyp.ts'
import { writeStyp } from '../writers/writeStyp.ts'
import type { Fields } from './types/Fields.ts'
import type { SegmentTypeBox } from './types/SegmentTypeBox.ts'

/**
 * SegmentType Box
 *
 * @public
 */
export class styp implements Fields<SegmentTypeBox> {
	/**
	 * Write a SegmentTypeBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SegmentTypeBox>): IsoBoxWriteView {
		return writeStyp(fields)
	}

	/**
	 * Read a SegmentTypeBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SegmentTypeBox
	 */
	static read(view: IsoBoxReadView): Fields<SegmentTypeBox> {
		return readStyp(view)
	}

	majorBrand: string
	minorVersion: number
	compatibleBrands: string[]

	/**
	 * Create a new SegmentTypeBox.
	 */
	constructor(majorBrand: string, minorVersion: number, compatibleBrands: string[]) {
		this.majorBrand = majorBrand
		this.minorVersion = minorVersion
		this.compatibleBrands = compatibleBrands
	}
}
