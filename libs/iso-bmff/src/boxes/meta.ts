import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMeta } from '../readers/readMeta.ts'
import { writeMeta } from '../writers/writeMeta.ts'
import type { Fields } from './types/Fields.ts'
import type { MetaBox } from './types/MetaBox.ts'

/**
 * Meta Box
 *
 * @public
 */
export class meta implements Fields<MetaBox> {
	/**
	 * Write a MetaBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MetaBox>): IsoBoxWriteView {
		return writeMeta(fields)
	}

	/**
	 * Read a MetaBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MetaBox
	 */
	static read(view: IsoBoxReadView): Fields<MetaBox> {
		return readMeta(view)
	}

	version: number
	flags: number

	/**
	 * Create a new MetaBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 */
	constructor(version: number, flags: number) {
		this.version = version
		this.flags = flags
	}
}
