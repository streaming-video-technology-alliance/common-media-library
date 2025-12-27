import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSttg } from '../readers/readSttg.ts'
import { writeSttg } from '../writers/writeSttg.ts'
import type { Fields } from './types/Fields.ts'
import type { WebVttSettingsBox } from './types/WebVttSettingsBox.ts'

/**
 * WebVttSettings Box
 *
 * @public
 */
export class sttg implements Fields<WebVttSettingsBox> {
	/**
	 * Write a WebVttSettingsBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<WebVttSettingsBox>): IsoBoxWriteView {
		return writeSttg(fields)
	}

	/**
	 * Read a WebVttSettingsBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed WebVttSettingsBox
	 */
	static read(view: IsoBoxReadView): Fields<WebVttSettingsBox> {
		return readSttg(view)
	}

	settings: string

	/**
	 * Create a new WebVttSettingsBox.
	 *
	 * @param settings - The settings
	 */
	constructor(settings: string) {
		this.settings = settings
	}
}
