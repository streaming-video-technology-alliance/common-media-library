import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readStss } from '../readers/readStss.ts'
import { writeStss } from '../writers/writeStss.ts'
import type { Fields } from './types/Fields.ts'
import type { SyncSample } from './types/SyncSample.ts'
import type { SyncSampleBox } from './types/SyncSampleBox.ts'

/**
 * SyncSample Box
 *
 * @public
 */
export class stss implements Fields<SyncSampleBox> {
	/**
	 * Write a SyncSampleBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<SyncSampleBox>): IsoBoxWriteView {
		return writeStss(fields)
	}

	/**
	 * Read a SyncSampleBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed SyncSampleBox
	 */
	static read(view: IsoBoxReadView): Fields<SyncSampleBox> {
		return readStss(view)
	}

	entryCount: number
	entries: SyncSample[]
	flags: number
	version: number

	/**
	 * Create a new SyncSampleBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param entries - The entries
	 * @param entryCount - The entryCount
	 */
	constructor(version: number, flags: number, entries: SyncSample[], entryCount: number) {
		this.version = version
		this.flags = flags
		this.entries = entries
		this.entryCount = entryCount
	}
}
