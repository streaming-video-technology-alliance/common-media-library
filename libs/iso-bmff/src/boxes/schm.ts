import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSchm } from '../readers/readSchm.ts'
import { writeSchm } from '../writers/writeSchm.ts'
import type { Fields } from './types/Fields.ts'
import type { SchemeTypeBox } from './types/SchemeTypeBox.ts'

/**
 * SchemeType Box
 *
 * @public
 */
export class schm implements Fields<SchemeTypeBox> {
	/**
	 * Write a SchemeTypeBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SchemeTypeBox>): IsoBoxWriteView {
		return writeSchm(fields)
	}

	/**
	 * Read a SchemeTypeBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SchemeTypeBox
	 */
	static read(view: IsoBoxReadView): Fields<SchemeTypeBox> {
		return readSchm(view)
	}

	flags: number
	schemeType: number
	schemeUri?: string
	schemeVersion: number
	version: number

	/**
	 * Create a new SchemeTypeBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param schemeType - The schemeType
	 * @param schemeUri - The schemeUri
	 * @param schemeVersion - The schemeVersion
	 */
	constructor(version: number, flags: number, schemeType: number, schemeVersion: number, schemeUri?: string) {
		this.version = version
		this.flags = flags
		this.schemeType = schemeType
		this.schemeUri = schemeUri
		this.schemeVersion = schemeVersion
	}
}
