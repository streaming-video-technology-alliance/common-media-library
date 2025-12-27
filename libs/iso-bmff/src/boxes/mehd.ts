import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMehd } from '../readers/readMehd.ts'
import { writeMehd } from '../writers/writeMehd.ts'
import type { Fields } from './types/Fields.ts'
import type { MovieExtendsHeaderBox } from './types/MovieExtendsHeaderBox.ts'

/**
 * MovieExtendsHeader Box
 *
 * @public
 */
export class mehd implements Fields<MovieExtendsHeaderBox> {
	/**
	 * Write a MovieExtendsHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MovieExtendsHeaderBox>): IsoBoxWriteView {
		return writeMehd(fields)
	}

	/**
	 * Read a MovieExtendsHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MovieExtendsHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<MovieExtendsHeaderBox> {
		return readMehd(view)
	}

	version: number
	flags: number
	fragmentDuration: number

	/**
	 * Create a new MovieExtendsHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param fragmentDuration - The fragmentDuration
	 */
	constructor(version: number, flags: number, fragmentDuration: number) {
		this.version = version
		this.flags = flags
		this.fragmentDuration = fragmentDuration
	}
}
