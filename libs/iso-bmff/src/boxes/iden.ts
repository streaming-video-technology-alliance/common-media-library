import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readIden } from '../readers/readIden.ts'
import { writeIden } from '../writers/writeIden.ts'
import type { Fields } from './types/Fields.ts'
import type { WebVttCueIdBox } from './types/WebVttCueIdBox.ts'

/**
 * WebVttCueId Box
 *
 * @public
 */
export class iden implements Fields<WebVttCueIdBox> {
	/**
	 * Write a WebVttCueIdBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<WebVttCueIdBox>): IsoBoxWriteView {
		return writeIden(fields)
	}

	/**
	 * Read a WebVttCueIdBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed WebVttCueIdBox
	 */
	static read(view: IsoBoxReadView): Fields<WebVttCueIdBox> {
		return readIden(view)
	}

	cueId: string

	/**
	 * Create a new WebVttCueIdBox.
	 *
	 * @param cueId - The cueId
	 */
	constructor(cueId: string) {
		this.cueId = cueId
	}
}
