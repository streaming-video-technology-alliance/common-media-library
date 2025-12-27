import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTfhd } from '../readers/readTfhd.ts'
import { writeTfhd } from '../writers/writeTfhd.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackFragmentHeaderBox } from './types/TrackFragmentHeaderBox.ts'

/**
 * TrackFragmentHeader Box
 *
 * @public
 */
export class tfhd implements Fields<TrackFragmentHeaderBox> {
	/**
	 * Write a TrackFragmentHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackFragmentHeaderBox>): IsoBoxWriteView {
		return writeTfhd(fields)
	}

	/**
	 * Read a TrackFragmentHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackFragmentHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackFragmentHeaderBox> {
		return readTfhd(view)
	}

	baseDataOffset: any
	defaultSampleDuration: any
	defaultSampleFlags: any
	defaultSampleSize: any
	flags: number
	sampleDescriptionIndex: any
	trackId: number
	version: number

	/**
	 * Create a new TrackFragmentHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param baseDataOffset - The baseDataOffset
	 * @param defaultSampleDuration - The defaultSampleDuration
	 * @param defaultSampleFlags - The defaultSampleFlags
	 * @param defaultSampleSize - The defaultSampleSize
	 * @param sampleDescriptionIndex - The sampleDescriptionIndex
	 * @param trackId - The trackId
	 */
	constructor(version: number, flags: number, baseDataOffset: any, defaultSampleDuration: any, defaultSampleFlags: any, defaultSampleSize: any, sampleDescriptionIndex: any, trackId: number) {
		this.version = version
		this.flags = flags
		this.baseDataOffset = baseDataOffset
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleFlags = defaultSampleFlags
		this.defaultSampleSize = defaultSampleSize
		this.sampleDescriptionIndex = sampleDescriptionIndex
		this.trackId = trackId
	}
}
