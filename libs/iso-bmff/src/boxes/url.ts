import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readUrl } from '../readers/readUrl.ts'
import { writeUrl } from '../writers/writeUrl.ts'
import type { Fields } from './types/Fields.ts'
import type { UrlBox } from './types/UrlBox.ts'

/**
 * Url Box
 *
 * @public
 */
export class url implements Fields<UrlBox> {
	/**
	 * Write a UrlBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<UrlBox>): IsoBoxWriteView {
		return writeUrl(fields)
	}

	/**
	 * Read a UrlBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed UrlBox
	 */
	static read(view: IsoBoxReadView): Fields<UrlBox> {
		return readUrl(view)
	}

	version: number
	flags: number
	location: string

	/**
	 * Create a new UrlBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param location - The location
	 */
	constructor(version: number, flags: number, location: string) {
		this.version = version
		this.flags = flags
		this.location = location
	}
}
