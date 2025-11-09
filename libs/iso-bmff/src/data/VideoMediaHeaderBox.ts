import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
 */
export class VideoMediaHeaderBox extends FullBox {
	graphicsmode: number
	opcolor: number[]

	constructor(version: number, flags: number, graphicsmode: number, opcolor: number[]) {
		super('vmhd', version, flags)
		this.graphicsmode = graphicsmode
		this.opcolor = opcolor
	}

	/**
	 * Reads a VideoMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
	 */
	static read(view: IsoView): VideoMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		const graphicsmode = view.readUint(2)
		const opcolor = view.readArray(UINT, 2, 3)
		return new VideoMediaHeaderBox(version, flags, graphicsmode, opcolor)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 2 (graphicsmode) + (opcolor.length * 2)
		return 14 + (this.opcolor.length * 2)
	}

	/**
	 * Writes a VideoMediaHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.2 Video Media Header Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(this, dataView, cursor)
		cursor += 4

		// Write graphicsmode (2 bytes)
		writeUint(dataView, cursor, 2, this.graphicsmode)
		cursor += 2

		// Write opcolor (3 * 2 bytes)
		for (let i = 0; i < this.opcolor.length; i++) {
			writeUint(dataView, cursor, 2, this.opcolor[i])
			cursor += 2
		}

		return cursor - bufferOffset
	}
}

