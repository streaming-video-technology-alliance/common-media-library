import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSkip } from '../readers/readSkip.ts'
import { writeSkip } from '../writers/writeSkip.ts'
import type { Fields } from './types/Fields.ts'
import type { FreeSpaceBox } from './types/FreeSpaceBox.ts'

/**
 * Free Space Box (skip)
 *
 * @public
 */
export class skip implements Fields<FreeSpaceBox<'skip'>> {
	/**
	 * Write a FreeSpaceBox (skip) to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<FreeSpaceBox<'skip'>>): IsoBoxWriteView {
		return writeSkip(fields)
	}

	/**
	 * Read a FreeSpaceBox (skip) from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed FreeSpaceBox (skip)
	 */
	static read(view: IsoBoxReadView): Fields<FreeSpaceBox<'skip'>> {
		return readSkip(view)
	}

	data: Uint8Array

	/**
	 * Create a new FreeSpaceBox (skip).
	 *
	 * @param data - The data
	 */
	constructor(data: Uint8Array) {
		this.data = data
	}
}
