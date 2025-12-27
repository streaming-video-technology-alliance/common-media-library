import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMfro } from '../readers/readMfro.ts'
import { writeMfro } from '../writers/writeMfro.ts'
import type { Fields } from './types/Fields.ts'
import type { MovieFragmentRandomAccessOffsetBox } from './types/MovieFragmentRandomAccessOffsetBox.ts'

/**
 * MovieFragmentRandomAccessOffset Box
 *
 * @public
 */
export class mfro implements Fields<MovieFragmentRandomAccessOffsetBox> {
	/**
	 * Write a MovieFragmentRandomAccessOffsetBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MovieFragmentRandomAccessOffsetBox>): IsoBoxWriteView {
		return writeMfro(fields)
	}

	/**
	 * Read a MovieFragmentRandomAccessOffsetBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MovieFragmentRandomAccessOffsetBox
	 */
	static read(view: IsoBoxReadView): Fields<MovieFragmentRandomAccessOffsetBox> {
		return readMfro(view)
	}

	version: number
	flags: number
	mfraSize: number

	/**
	 * Create a new MovieFragmentRandomAccessOffsetBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param mfraSize - The mfraSize
	 */
	constructor(version: number, flags: number, mfraSize: number) {
		this.version = version
		this.flags = flags
		this.mfraSize = mfraSize
	}
}
