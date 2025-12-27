import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMdhd } from '../readers/readMdhd.ts'
import { writeMdhd } from '../writers/writeMdhd.ts'
import type { Fields } from './types/Fields.ts'
import type { MediaHeaderBox } from './types/MediaHeaderBox.ts'

/**
 * MediaHeader Box
 *
 * @public
 */
export class mdhd implements Fields<MediaHeaderBox> {
	/**
	 * Write a MediaHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MediaHeaderBox>): IsoBoxWriteView {
		return writeMdhd(fields)
	}

	/**
	 * Read a MediaHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MediaHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<MediaHeaderBox> {
		return readMdhd(view)
	}

	version: number
	flags: number
	creationTime: number
	duration: number
	language: string
	modificationTime: number
	preDefined: number
	timescale: number

	/**
	 * Create a new MediaHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param creationTime - The creationTime
	 * @param duration - The duration
	 * @param language - The language
	 * @param modificationTime - The modificationTime
	 * @param preDefined - The preDefined
	 * @param timescale - The timescale
	 */
	constructor(version: number, flags: number, creationTime: number, duration: number, language: string, modificationTime: number, preDefined: number, timescale: number) {
		this.version = version
		this.flags = flags
		this.creationTime = creationTime
		this.duration = duration
		this.language = language
		this.modificationTime = modificationTime
		this.preDefined = preDefined
		this.timescale = timescale
	}
}
