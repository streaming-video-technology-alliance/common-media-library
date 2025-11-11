import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
 */
export class SubtitleMediaHeaderBox extends FullBox {
	static readonly type = 'sthd'

	/**
	 * Reads a SubtitleMediaHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
	 */
	static read(view: IsoView): SubtitleMediaHeaderBox {
		const { version, flags } = view.readFullBox()
		return new SubtitleMediaHeaderBox(version, flags)
	}

	/**
	 * Writes a SubtitleMediaHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2015 - 8.4.5.6 Subtitle Media Header Box
	 */
	static write(box: SubtitleMediaHeaderBox, dataView: DataView, offset: number = 0): number {
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
		super('sthd', version, flags)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox)
		return 12
	}
}
