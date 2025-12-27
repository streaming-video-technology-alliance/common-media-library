import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readElst } from '../readers/readElst.ts'
import { writeElst } from '../writers/writeElst.ts'
import type { EditListBox } from './types/EditListBox.ts'
import type { EditListEntry } from './types/EditListEntry.ts'
import type { Fields } from './types/Fields.ts'

/**
 * EditList Box
 *
 * @public
 */
export class elst implements Fields<EditListBox> {
	/**
	 * Write a EditListBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<EditListBox>): IsoBoxWriteView {
		return writeElst(fields)
	}

	/**
	 * Read a EditListBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed EditListBox
	 */
	static read(view: IsoBoxReadView): Fields<EditListBox> {
		return readElst(view)
	}

	version: number
	flags: number
	entries: EditListEntry[]
	entryCount: number

	/**
	 * Create a new EditListBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param entries - The entries
	 * @param entryCount - The entryCount
	 */
	constructor(version: number, flags: number, entries: EditListEntry[], entryCount: number) {
		this.version = version
		this.flags = flags
		this.entries = entries
		this.entryCount = entryCount
	}
}
