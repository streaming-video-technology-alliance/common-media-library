import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMfhd } from '../readers/readMfhd.ts'
import { writeMfhd } from '../writers/writeMfhd.ts'
import type { Fields } from './types/Fields.ts'
import type { MovieFragmentHeaderBox } from './types/MovieFragmentHeaderBox.ts'

/**
 * MovieFragmentHeader Box
 *
 * @public
 */
export class mfhd implements Fields<MovieFragmentHeaderBox> {
	/**
	 * Write a MovieFragmentHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MovieFragmentHeaderBox>): IsoBoxWriteView {
		return writeMfhd(fields)
	}

	/**
	 * Read a MovieFragmentHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MovieFragmentHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<MovieFragmentHeaderBox> {
		return readMfhd(view)
	}

	version: number
	flags: number
	sequenceNumber: number

	/**
	 * Create a new MovieFragmentHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param sequenceNumber - The sequenceNumber
	 */
	constructor(version: number, flags: number, sequenceNumber: number) {
		this.version = version
		this.flags = flags
		this.sequenceNumber = sequenceNumber
	}
}
