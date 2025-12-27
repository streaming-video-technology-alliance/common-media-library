import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import { readArdi } from '../readers/readArdi.ts'
import { writeArdi } from '../writers/writeArdi.ts'
import type { AudioRenderingIndicationBox } from './types/AudioRenderingIndicationBox.ts'
import type { Fields } from './types/Fields.ts'

/**
 * Audio Rendering Indication Box
 *
 * @public
 */
export class ardi implements Fields<AudioRenderingIndicationBox> {
	/**
	 * Write an AudioRenderingIndicationBox to an IsoBoxWriteView.
	 *
	 * @param fields - The fields to write
	 *
	 * @returns An IsoBoxWriteView containing the encoded box
	 */
	static write(fields: Fields<AudioRenderingIndicationBox>): IsoBoxWriteView {
		return writeArdi(fields)
	}

	/**
	 * Read an AudioRenderingIndicationBox from an IsoBoxReadView.
	 *
	 * @param view - The IsoBoxReadView to read data from
	 *
	 * @returns A parsed AudioRenderingIndicationBox
	 */
	static read(view: IsoBoxReadView): Fields<AudioRenderingIndicationBox> {
		return readArdi(view)
	}

	version: number
	flags: number
	audioRenderingIndication: number

	/**
	 * Create a new AudioRenderingIndicationBox.
	 *
	 * @param version - The version
	 * @param flags - The flags
	 * @param audioRenderingIndication - The audioRenderingIndication
	 */
	constructor(version: number, flags: number, audioRenderingIndication: number) {
		this.version = version
		this.flags = flags
		this.audioRenderingIndication = audioRenderingIndication
	}
}
