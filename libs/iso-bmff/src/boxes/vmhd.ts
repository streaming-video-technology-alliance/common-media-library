import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readVmhd } from '../readers/readVmhd.ts'
import { writeVmhd } from '../writers/writeVmhd.ts'
import type { Fields } from './types/Fields.ts'
import type { VideoMediaHeaderBox } from './types/VideoMediaHeaderBox.ts'

/**
 * VideoMediaHeader Box
 *
 * @public
 */
export class vmhd implements Fields<VideoMediaHeaderBox> {
	/**
	 * Write a VideoMediaHeaderBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<VideoMediaHeaderBox>): IsoBoxWriteView {
		return writeVmhd(fields)
	}

	/**
	 * Read a VideoMediaHeaderBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed VideoMediaHeaderBox
	 */
	static read(view: IsoBoxReadView): Fields<VideoMediaHeaderBox> {
		return readVmhd(view)
	}

	version: number
	flags: number
	graphicsmode: number
	opcolor: number[]

	/**
	 * Create a new VideoMediaHeaderBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param graphicsmode - The graphicsmode
	 * @param opcolor - The opcolor
	 */
	constructor(version: number, flags: number, graphicsmode: number, opcolor: number[]) {
		this.version = version
		this.flags = flags
		this.graphicsmode = graphicsmode
		this.opcolor = opcolor
	}
}
