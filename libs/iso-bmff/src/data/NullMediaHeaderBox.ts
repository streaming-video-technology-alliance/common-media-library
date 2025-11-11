import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
 */
export class NullMediaHeaderBox extends FullBox {
	static readonly type = 'nmhd'

	/**
	 * Reads a NullMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
	 */
	static read(view: IsoView): NullMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		return new NullMediaHeaderBox(version, flags)
	}

	/**
	 * Writes a NullMediaHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.4.5.4 Null Media Header Box
	 */
	static write(box: NullMediaHeaderBox, dataView: DataView, offset: number = 0): number {
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

		return cursor - bufferOffset
	}

	constructor(version: number, flags: number) {
		super('nmhd', version, flags)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox)
		return 12
	}
}
