import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readStts } from '../readers/readStts.ts'
import { writeStts } from '../writers/writeStts.ts'
import type { DecodingTimeSample } from './types/DecodingTimeSample.ts'
import type { DecodingTimeToSampleBox } from './types/DecodingTimeToSampleBox.ts'
import type { Fields } from './types/Fields.ts'

/**
 * DecodingTimeToSample Box
 *
 * @public
 */
export class stts implements Fields<DecodingTimeToSampleBox> {
	/**
	 * Write a DecodingTimeToSampleBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<DecodingTimeToSampleBox>): IsoBoxWriteView {
		return writeStts(fields)
	}

	/**
	 * Read a DecodingTimeToSampleBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed DecodingTimeToSampleBox
	 */
	static read(view: IsoBoxReadView): Fields<DecodingTimeToSampleBox> {
		return readStts(view)
	}

	entries: DecodingTimeSample[]
	entryCount: number
	flags: number
	version: number

	/**
	 * Create a new DecodingTimeToSampleBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param entries - The entries
	 * @param entryCount - The entryCount
	 */
	constructor(version: number, flags: number, entries: DecodingTimeSample[], entryCount: number) {
		this.version = version
		this.flags = flags
		this.entries = entries
		this.entryCount = entryCount
	}
}
