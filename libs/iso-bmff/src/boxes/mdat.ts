import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMdat } from '../readers/readMdat.ts'
import { writeMdat } from '../writers/writeMdat.ts'
import type { Fields } from './types/Fields.ts'
import type { MediaDataBox } from './types/MediaDataBox.ts'

/**
 * MediaData Box
 *
 * @public
 */
export class mdat implements Fields<MediaDataBox> {
	/**
	 * Write a MediaDataBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MediaDataBox>): IsoBoxWriteView {
		return writeMdat(fields)
	}

	/**
	 * Read a MediaDataBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MediaDataBox
	 */
	static read(view: IsoBoxReadView): Fields<MediaDataBox> {
		return readMdat(view)
	}

	data: any

	/**
	 * Create a new MediaDataBox.
	 *
	 * @param data - The data
	 */
	constructor(data: any) {
		this.data = data
	}
}
