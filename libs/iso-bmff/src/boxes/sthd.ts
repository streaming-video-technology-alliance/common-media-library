import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSthd } from '../readers/readSthd.ts'
import { writeSthd } from '../writers/writeSthd.ts'
import type { Fields } from './types/Fields.ts'
import type { SubtitleMediaHeaderBox } from './types/SubtitleMediaHeaderBox.ts'

/**
 * SubtitleMediaHeader Box
 *
 * @public
 */
export class sthd implements Fields<SubtitleMediaHeaderBox> {
	/**
	 * Write a SubtitleMediaHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SubtitleMediaHeaderBox>): IsoBoxWriteView {
		return writeSthd(fields)
	}

	/**
	 * Read a SubtitleMediaHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SubtitleMediaHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<SubtitleMediaHeaderBox> {
		return readSthd(view)
	}

	flags: number
	version: number

	/**
	 * Create a new SubtitleMediaHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 */
	constructor(version: number, flags: number) {
		this.version = version
		this.flags = flags
	}
}
