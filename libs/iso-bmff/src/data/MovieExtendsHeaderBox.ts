import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 */
export class MovieExtendsHeaderBox extends FullBox {
	static readonly type = 'mehd'

	/**
	 * Reads a MovieExtendsHeaderBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
	 */
	static read(view: IsoView): MovieExtendsHeaderBox {
		const { version, flags } = view.readFullBox()
		const fragmentDuration = view.readUint(version === 1 ? 8 : 4)
		return new MovieExtendsHeaderBox(version, flags, fragmentDuration)
	}

	/**
	 * Writes a MovieExtendsHeaderBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
	 */
	static write(box: MovieExtendsHeaderBox, dataView: DataView, offset: number = 0): number {
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

		// Write fragmentDuration
		const durationSize = box.version === 1 ? 8 : 4
		writeUint(dataView, cursor, durationSize, box.fragmentDuration)
		cursor += durationSize

		return cursor - bufferOffset
	}

	fragmentDuration: number

	constructor(version: number, flags: number, fragmentDuration: number) {
		super('mehd', version, flags)
		this.fragmentDuration = fragmentDuration
	}

	override get size(): number {
		const durationSize = this.version === 1 ? 8 : 4
		// 8 (box header) + 4 (FullBox) + durationSize
		return 12 + durationSize
	}
}
