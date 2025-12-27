import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readVtte } from '../readers/readVtte.ts'
import { writeVtte } from '../writers/writeVtte.ts'
import type { Fields } from './types/Fields.ts'
import type { WebVttEmptySampleBox } from './types/WebVttEmptySampleBox.ts'

/**
 * WebVttEmptySample Box
 *
 * @public
 */
// eslint-disable-next-line
export class vtte implements Fields<WebVttEmptySampleBox> {
	/**
	 * Write a WebVttEmptySampleBox to an IsoBoxWriteView.
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(_: Fields<WebVttEmptySampleBox>): IsoBoxWriteView {
		return writeVtte(_)
	}

	/**
	 * Read a WebVttEmptySampleBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed WebVttEmptySampleBox
	 */
	static read(_: IsoBoxReadView): Fields<WebVttEmptySampleBox> {
		return readVtte(_)
	}

	/**
	 * Create a new WebVttEmptySampleBox.
	 */
	// eslint-disable-next-line
	constructor() { }
}
