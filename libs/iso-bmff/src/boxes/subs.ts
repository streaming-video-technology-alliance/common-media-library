import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readSubs } from '../readers/readSubs.ts'
import { writeSubs } from '../writers/writeSubs.ts'
import type { Fields } from './types/Fields.ts'
import type { SubsampleInformationBox } from './types/SubsampleInformationBox.ts'

/**
 * SubsampleInformation Box
 *
 * @public
 */
export class subs implements Fields<SubsampleInformationBox> {
	/**
	 * Write a SubsampleInformationBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SubsampleInformationBox>): IsoBoxWriteView {
		return writeSubs(fields)
	}

	/**
	 * Read a SubsampleInformationBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SubsampleInformationBox
	 */
	static read(view: IsoBoxReadView): Fields<SubsampleInformationBox> {
		return readSubs(view)
	}

	flags: number
	version: number
	entries: any[]
	entryCount: number

	/**
	 * Create a new SubsampleInformationBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param entries - The entries
	 * @param entryCount - The entryCount
	 */
	constructor(version: number, flags: number, entries: any[], entryCount: number) {
		this.version = version
		this.flags = flags
		this.entries = entries
		this.entryCount = entryCount
	}
}
