import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readVttC } from '../readers/readVttC.ts'
import { writeVttC } from '../writers/writeVttC.ts'
import type { Fields } from './types/Fields.ts'
import type { WebVttConfigurationBox } from './types/WebVttConfigurationBox.ts'

/**
 * WebVttConfiguration Box
 *
 * @public
 */
export class vttC implements Fields<WebVttConfigurationBox> {
	/**
	 * Write a WebVttConfigurationBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<WebVttConfigurationBox>): IsoBoxWriteView {
		return writeVttC(fields)
	}

	/**
	 * Read a WebVttConfigurationBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed WebVttConfigurationBox
	 */
	static read(view: IsoBoxReadView): Fields<WebVttConfigurationBox> {
		return readVttC(view)
	}
	config: string
	/**
	 * Create a new WebVttConfigurationBox.
	 *
	 * @param config - The config
	 */
	constructor(config: string) {
		this.config = config
	}
}