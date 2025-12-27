import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readMvhd } from '../readers/readMvhd.ts'
import { writeMvhd } from '../writers/writeMvhd.ts'
import type { Fields } from './types/Fields.ts'
import type { MovieHeaderBox } from './types/MovieHeaderBox.ts'

/**
 * MovieHeader Box
 *
 * @public
 */
export class mvhd implements Fields<MovieHeaderBox> {
	/**
	 * Write a MovieHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<MovieHeaderBox>): IsoBoxWriteView {
		return writeMvhd(fields)
	}

	/**
	 * Read a MovieHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed MovieHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<MovieHeaderBox> {
		return readMvhd(view)
	}

	creationTime: number
	duration: number
	flags: number
	matrix: number[]
	modificationTime: number
	nextTrackId: number
	preDefined: number[]
	rate: number
	reserved1: number
	reserved2: number[]
	timescale: number
	version: number
	volume: number

	/**
	 * Create a new MovieHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param creationTime - The creationTime
	 * @param duration - The duration
	 * @param matrix - The matrix
	 * @param modificationTime - The modificationTime
	 * @param nextTrackId - The nextTrackId
	 * @param preDefined - The preDefined
	 * @param rate - The rate
	 * @param reserved1 - The reserved1
	 * @param reserved2 - The reserved2
	 * @param timescale - The timescale
	 * @param volume - The volume
	 */
	constructor(version: number, flags: number, creationTime: number, duration: number, matrix: number[], modificationTime: number, nextTrackId: number, preDefined: number[], rate: number, reserved1: number, reserved2: number[], timescale: number, volume: number) {
		this.version = version
		this.flags = flags
		this.creationTime = creationTime
		this.duration = duration
		this.matrix = matrix
		this.modificationTime = modificationTime
		this.nextTrackId = nextTrackId
		this.preDefined = preDefined
		this.rate = rate
		this.reserved1 = reserved1
		this.reserved2 = reserved2
		this.timescale = timescale
		this.volume = volume
	}
}
