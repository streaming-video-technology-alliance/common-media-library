import type { IsoView } from '../IsoView.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 */
export class OriginalFormatBox extends Box {
	dataFormat: number

	constructor(dataFormat: number) {
		super('frma')
		this.dataFormat = dataFormat
	}

	/**
	 * Reads an OriginalFormatBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
	 */
	static read(view: IsoView): OriginalFormatBox {
		const dataFormat = view.readUint(4)
		return new OriginalFormatBox(dataFormat)
	}

	override get size(): number {
		// 8 bytes header + 4 (dataFormat)
		return 12
	}

	/**
	 * Writes an OriginalFormatBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box size (4 bytes)
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4

		// Write box type (4 bytes) - 'frma'
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write dataFormat (4 bytes)
		writeUint(dataView, cursor, 4, this.dataFormat)
		cursor += 4

		return cursor - bufferOffset
	}
}

