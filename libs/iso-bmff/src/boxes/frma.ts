import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readFrma } from '../readers/readFrma.ts'
import { writeFrma } from '../writers/writeFrma.ts'
import type { Fields } from './types/Fields.ts'
import type { OriginalFormatBox } from './types/OriginalFormatBox.ts'

/**
 * OriginalFormat Box
 *
 * @public
 */
export class frma implements Fields<OriginalFormatBox> {
	/**
	 * Write a OriginalFormatBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<OriginalFormatBox>): IsoBoxWriteView {
		return writeFrma(fields)
	}

	/**
	 * Read a OriginalFormatBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed OriginalFormatBox
	 */
	static read(view: IsoBoxReadView): Fields<OriginalFormatBox> {
		return readFrma(view)
	}

	dataFormat: number

	/**
	 * Create a new OriginalFormatBox.
	 *
	 * @param dataFormat - The dataFormat
	 */
	constructor(dataFormat: number) {
		this.dataFormat = dataFormat
	}
}
