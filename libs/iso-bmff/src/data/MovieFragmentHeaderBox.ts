import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 */
export class MovieFragmentHeaderBox extends FullBox {
	static readonly type = 'mfhd'

	/**
	 * Reads a MovieFragmentHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
	 */
	static read(view: IsoView): MovieFragmentHeaderBox {
		const { version, flags } = view.readFullBox()
		const sequenceNumber = view.readUint(4)
		return new MovieFragmentHeaderBox(version, flags, sequenceNumber)
	}

	/**
	 * Writes a MovieFragmentHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
	 */
	static write(box: MovieFragmentHeaderBox, dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box header
		writeUint(dataView, cursor, 4, box.size)
		cursor += 4
		writeString(dataView, cursor, 4, box.type)
		cursor += 4

		// Write FullBox header
		writeFullBoxHeader(box, dataView, cursor)
		cursor += 4

		// Write sequenceNumber (4 bytes)
		writeUint(dataView, cursor, 4, box.sequenceNumber)
		cursor += 4

		return cursor - bufferOffset
	}

	sequenceNumber: number

	constructor(version: number, flags: number, sequenceNumber: number) {
		super('mfhd', version, flags)
		this.sequenceNumber = sequenceNumber
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (sequenceNumber)
		return 16
	}
}
