import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTfra } from '../readers/readTfra.ts'
import { writeTfra } from '../writers/writeTfra.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackFragmentRandomAccessBox } from './types/TrackFragmentRandomAccessBox.ts'

/**
 * TrackFragmentRandomAccess Box
 *
 * @public
 */
export class tfra implements Fields<TrackFragmentRandomAccessBox> {
	/**
	 * Write a TrackFragmentRandomAccessBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackFragmentRandomAccessBox>): IsoBoxWriteView {
		return writeTfra(fields)
	}

	/**
	 * Read a TrackFragmentRandomAccessBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackFragmentRandomAccessBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackFragmentRandomAccessBox> {
		return readTfra(view)
	}

	version: number
	flags: number
	trackId: number
	reserved: number
	numberOfEntry: number
	lengthSizeOfTrafNum: number
	lengthSizeOfTrunNum: number
	lengthSizeOfSampleNum: number
	entries: any[]

	/**
	 * Create a new TrackFragmentRandomAccessBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param trackId - The trackId
	 * @param reserved - The reserved
	 * @param numberOfEntry - The numberOfEntry
	 * @param lengthSizeOfTrafNum - The lengthSizeOfTrafNum
	 * @param lengthSizeOfTrunNum - The lengthSizeOfTrunNum
	 * @param lengthSizeOfSampleNum - The lengthSizeOfSampleNum
	 * @param entries - The entries
	 */
	constructor(version: number, flags: number, trackId: number, reserved: number, numberOfEntry: number, lengthSizeOfTrafNum: number, lengthSizeOfTrunNum: number, lengthSizeOfSampleNum: number, entries: any[]) {
		this.version = version
		this.flags = flags
		this.trackId = trackId
		this.reserved = reserved
		this.numberOfEntry = numberOfEntry
		this.lengthSizeOfTrafNum = lengthSizeOfTrafNum
		this.lengthSizeOfTrunNum = lengthSizeOfTrunNum
		this.lengthSizeOfSampleNum = lengthSizeOfSampleNum
		this.entries = entries
	}
}
