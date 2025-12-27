import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readVlab } from '../readers/readVlab.ts'
import { writeVlab } from '../writers/writeVlab.ts'
import type { Fields } from './types/Fields.ts'
import type { WebVttSourceLabelBox } from './types/WebVttSourceLabelBox.ts'

/**
 * WebVttSourceLabel Box
 *
 * @public
 */
export class vlab implements Fields<WebVttSourceLabelBox> {
	/**
	 * Write a WebVttSourceLabelBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<WebVttSourceLabelBox>): IsoBoxWriteView {
		return writeVlab(fields)
	}

	/**
	 * Read a WebVttSourceLabelBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed WebVttSourceLabelBox
	 */
	static read(view: IsoBoxReadView): Fields<WebVttSourceLabelBox> {
		return readVlab(view)
	}
	sourceLabel: string
	/**
	 * Create a new WebVttSourceLabelBox.
	 *
	 * @param sourceLabel - The sourceLabel
	 */
	constructor(sourceLabel: string) {
		this.sourceLabel = sourceLabel
	}
}