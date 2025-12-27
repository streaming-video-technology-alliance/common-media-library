import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTrun } from '../readers/readTrun.ts'
import { writeTrun } from '../writers/writeTrun.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackRunBox } from './types/TrackRunBox.ts'

/**
 * TrackRun Box
 *
 * @public
 */
export class trun implements Fields<TrackRunBox> {
	/**
	 * Write a TrackRunBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackRunBox>): IsoBoxWriteView {
		return writeTrun(fields)
	}

	/**
	 * Read a TrackRunBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackRunBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackRunBox> {
		return readTrun(view)
	}

	version: number
	flags: number
	sampleCount: number
	dataOffset?: number
	firstSampleFlags?: number
	samples: any[]

	/**
	 * Create a new TrackRunBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param sampleCount - The sampleCount
	 * @param dataOffset - The dataOffset
	 * @param firstSampleFlags - The firstSampleFlags
	 * @param samples - The samples
	 */
	constructor(version: number, flags: number, sampleCount: number, samples: any[], dataOffset?: number, firstSampleFlags?: number) {
		this.version = version
		this.flags = flags
		this.sampleCount = sampleCount
		this.samples = samples
		this.dataOffset = dataOffset
		this.firstSampleFlags = firstSampleFlags
	}
}
