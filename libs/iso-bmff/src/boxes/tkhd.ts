import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readTkhd } from '../readers/readTkhd.ts'
import { writeTkhd } from '../writers/writeTkhd.ts'
import type { Fields } from './types/Fields.ts'
import type { TrackHeaderBox } from './types/TrackHeaderBox.ts'

/**
 * TrackHeader Box
 *
 * @public
 */
export class tkhd implements Fields<TrackHeaderBox> {
	/**
	 * Write a TrackHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<TrackHeaderBox>): IsoBoxWriteView {
		return writeTkhd(fields)
	}

	/**
	 * Read a TrackHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed TrackHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<TrackHeaderBox> {
		return readTkhd(view)
	}

	alternateGroup: number
	creationTime: number
	duration: number
	flags: number
	height: number
	layer: number
	matrix: any[]
	modificationTime: number
	reserved1: number
	reserved2: any[]
	reserved3: number
	trackId: number
	version: number
	volume: number
	width: number

	/**
	 * Create a new TrackHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param alternateGroup - The alternateGroup
	 * @param creationTime - The creationTime
	 * @param duration - The duration
	 * @param height - The height
	 * @param layer - The layer
	 * @param matrix - The matrix
	 * @param modificationTime - The modificationTime
	 * @param reserved1 - The reserved1
	 * @param reserved2 - The reserved2
	 * @param reserved3 - The reserved3
	 * @param trackId - The trackId
	 * @param volume - The volume
	 * @param width - The width
	 */
	constructor(version: number, flags: number, alternateGroup: number, creationTime: number, duration: number, height: number, layer: number, matrix: any[], modificationTime: number, reserved1: number, reserved2: any[], reserved3: number, trackId: number, volume: number, width: number) {
		this.version = version
		this.flags = flags
		this.alternateGroup = alternateGroup
		this.creationTime = creationTime
		this.duration = duration
		this.height = height
		this.layer = layer
		this.matrix = matrix
		this.modificationTime = modificationTime
		this.reserved1 = reserved1
		this.reserved2 = reserved2
		this.reserved3 = reserved3
		this.trackId = trackId
		this.volume = volume
		this.width = width
	}
}
