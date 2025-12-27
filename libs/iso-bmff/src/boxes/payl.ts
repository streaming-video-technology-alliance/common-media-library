import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readPayl } from '../readers/readPayl.ts'
import { writePayl } from '../writers/writePayl.ts'
import type { Fields } from './types/Fields.ts'
import type { WebVttCuePayloadBox } from './types/WebVttCuePayloadBox.ts'

/**
 * WebVttCuePayload Box
 *
 * @public
 */
export class payl implements Fields<WebVttCuePayloadBox> {
	/**
	 * Write a WebVttCuePayloadBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<WebVttCuePayloadBox>): IsoBoxWriteView {
		return writePayl(fields)
	}

	/**
	 * Read a WebVttCuePayloadBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed WebVttCuePayloadBox
	 */
	static read(view: IsoBoxReadView): Fields<WebVttCuePayloadBox> {
		return readPayl(view)
	}

	cueText: string

	/**
	 * Create a new WebVttCuePayloadBox.
	 *
	 * @param cueText - The cueText
	 */
	constructor(cueText: string) {
		this.cueText = cueText
	}
}
