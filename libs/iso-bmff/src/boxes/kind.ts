import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readKind } from '../readers/readKind.ts'
import { writeKind } from '../writers/writeKind.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackKindBox } from './types/TrackKindBox.ts'

/**
 * TrackKind Box
 *
 * @public
 */
export class kind implements Fields<TrackKindBox> {
	/**
	 * Write a TrackKindBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackKindBox>): IsoBoxWriteView {
		return writeKind(fields)
	}

	/**
	 * Read a TrackKindBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackKindBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackKindBox> {
		return readKind(view)
	}

	version: number
	flags: number
	schemeUri: string
	value: string

	/**
	 * Create a new TrackKindBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param schemeUri - The schemeUri
	 * @param value - The value
	 */
	constructor(version: number, flags: number, schemeUri: string, value: string) {
		this.version = version
		this.flags = flags
		this.schemeUri = schemeUri
		this.value = value
	}
}
