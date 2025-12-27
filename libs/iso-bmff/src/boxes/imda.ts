import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readImda } from '../readers/readImda.ts'
import { writeImda } from '../writers/writeImda.ts'
import type { Fields } from './types/Fields.ts'
import type { IdentifiedMediaDataBox } from './types/IdentifiedMediaDataBox.ts'

/**
 * IdentifiedMediaData Box
 *
 * @public
 */
export class imda implements Fields<IdentifiedMediaDataBox> {
	/**
	 * Write a IdentifiedMediaDataBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<IdentifiedMediaDataBox>): IsoBoxWriteView {
		return writeImda(fields)
	}

	/**
	 * Read a IdentifiedMediaDataBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed IdentifiedMediaDataBox
	 */
	static read(view: IsoBoxReadView): Fields<IdentifiedMediaDataBox> {
		return readImda(view)
	}

	data: Uint8Array
	imdaIdentifier: number

	/**
	 * Create a new IdentifiedMediaDataBox.
	 *
	 * @param data - The data
	 * @param imdaIdentifier - The imdaIdentifier
	 */
	constructor(data: Uint8Array, imdaIdentifier: number) {
		this.data = data
		this.imdaIdentifier = imdaIdentifier
	}
}
