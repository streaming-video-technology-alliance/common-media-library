import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readCtts } from '../readers/readCtts.ts'
import { writeCtts } from '../writers/writeCtts.ts'
import type { CompositionTimeToSampleBox } from './types/CompositionTimeToSampleBox.ts'
import type { CompositionTimeToSampleEntry } from './types/CompositionTimeToSampleEntry.ts'
import type { Fields } from './types/Fields.ts'

/**
 * CompositionTimeToSample Box
 *
 * @public
 */
export class ctts implements Fields<CompositionTimeToSampleBox> {
	/**
	 * Write a CompositionTimeToSampleBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<CompositionTimeToSampleBox>): IsoBoxWriteView {
		return writeCtts(fields)
	}

	/**
	 * Read a CompositionTimeToSampleBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed CompositionTimeToSampleBox
	 */
	static read(view: IsoBoxReadView): Fields<CompositionTimeToSampleBox> {
		return readCtts(view)
	}

	version: number
	flags: number
	entries: CompositionTimeToSampleEntry[]
	entryCount: number

	/**
	 * Create a new CompositionTimeToSampleBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param entries - The entries
	 * @param entryCount - The entryCount
	 */
	constructor(version: number, flags: number, entries: CompositionTimeToSampleEntry[], entryCount: number) {
		this.version = version
		this.flags = flags
		this.entries = entries
		this.entryCount = entryCount
	}
}
