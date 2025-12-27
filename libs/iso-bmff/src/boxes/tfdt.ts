import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTfdt } from '../readers/readTfdt.ts'
import { writeTfdt } from '../writers/writeTfdt.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackFragmentBaseMediaDecodeTimeBox } from './types/TrackFragmentBaseMediaDecodeTimeBox.ts'

/**
 * TrackFragmentBaseMediaDecodeTime Box
 *
 * @public
 */
export class tfdt implements Fields<TrackFragmentBaseMediaDecodeTimeBox> {
	/**
	 * Write a TrackFragmentBaseMediaDecodeTimeBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackFragmentBaseMediaDecodeTimeBox>): IsoBoxWriteView {
		return writeTfdt(fields)
	}

	/**
	 * Read a TrackFragmentBaseMediaDecodeTimeBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackFragmentBaseMediaDecodeTimeBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackFragmentBaseMediaDecodeTimeBox> {
		return readTfdt(view)
	}

	baseMediaDecodeTime: number
	flags: number
	version: number

	/**
	 * Create a new TrackFragmentBaseMediaDecodeTimeBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param baseMediaDecodeTime - The baseMediaDecodeTime
	 */
	constructor(version: number, flags: number, baseMediaDecodeTime: number) {
		this.version = version
		this.flags = flags
		this.baseMediaDecodeTime = baseMediaDecodeTime
	}
}
