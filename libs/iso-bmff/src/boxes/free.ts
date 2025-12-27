import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readFree } from '../readers/readFree.ts'
import { writeFree } from '../writers/writeFree.ts'
import type { Fields } from './types/Fields.ts'
import type { FreeSpaceBox } from './types/FreeSpaceBox.ts'

/**
 * Free Space Box (free)
 *
 * @public
 */
export class free implements Fields<FreeSpaceBox<'free'>> {
	/**
	 * Write a FreeSpaceBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<FreeSpaceBox<'free'>>): IsoBoxWriteView {
		return writeFree(fields)
	}

	/**
	 * Read a FreeSpaceBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed FreeSpaceBox
	 */
	static read(view: IsoBoxReadView): Fields<FreeSpaceBox<'free'>> {
		return readFree(view)
	}

	data: Uint8Array

	/**
	 * Create a new FreeSpaceBox (free).
	 *
	 * @param data - The data
	 */
	constructor(data: Uint8Array) {
		this.data = data
	}
}
