import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readElng } from '../readers/readElng.ts'
import { writeElng } from '../writers/writeElng.ts'
import type { ExtendedLanguageBox } from './types/ExtendedLanguageBox.ts'
import type { Fields } from './types/Fields.ts'

/**
 * ExtendedLanguage Box
 *
 * @public
 */
export class elng implements Fields<ExtendedLanguageBox> {
	/**
	 * Write a ExtendedLanguageBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<ExtendedLanguageBox>): IsoBoxWriteView {
		return writeElng(fields)
	}

	/**
	 * Read a ExtendedLanguageBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed ExtendedLanguageBox
	 */
	static read(view: IsoBoxReadView): Fields<ExtendedLanguageBox> {
		return readElng(view)
	}

	version: number
	flags: number
	extendedLanguage: string

	/**
	 * Create a new ExtendedLanguageBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param extendedLanguage - The extendedLanguage
	 */
	constructor(version: number, flags: number, extendedLanguage: string) {
		this.version = version
		this.flags = flags
		this.extendedLanguage = extendedLanguage
	}
}
