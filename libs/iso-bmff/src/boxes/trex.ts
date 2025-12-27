import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTrex } from '../readers/readTrex.ts'
import { writeTrex } from '../writers/writeTrex.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackExtendsBox } from './types/TrackExtendsBox.ts'

/**
 * TrackExtends Box
 *
 * @public
 */
export class trex implements Fields<TrackExtendsBox> {
	/**
	 * Write a TrackExtendsBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackExtendsBox>): IsoBoxWriteView {
		return writeTrex(fields)
	}

	/**
	 * Read a TrackExtendsBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackExtendsBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackExtendsBox> {
		return readTrex(view)
	}

	version: number
	flags: number
	defaultSampleDescriptionIndex: number
	defaultSampleDuration: number
	defaultSampleFlags: number
	defaultSampleSize: number
	trackId: number

	/**
	 * Create a new TrackExtendsBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param defaultSampleDescriptionIndex - The defaultSampleDescriptionIndex
	 * @param defaultSampleDuration - The defaultSampleDuration
	 * @param defaultSampleFlags - The defaultSampleFlags
	 * @param defaultSampleSize - The defaultSampleSize
	 * @param trackId - The trackId
	 */
	constructor(version: number, flags: number, defaultSampleDescriptionIndex: number, defaultSampleDuration: number, defaultSampleFlags: number, defaultSampleSize: number, trackId: number) {
		this.version = version
		this.flags = flags
		this.defaultSampleDescriptionIndex = defaultSampleDescriptionIndex
		this.defaultSampleDuration = defaultSampleDuration
		this.defaultSampleFlags = defaultSampleFlags
		this.defaultSampleSize = defaultSampleSize
		this.trackId = trackId
	}
}
