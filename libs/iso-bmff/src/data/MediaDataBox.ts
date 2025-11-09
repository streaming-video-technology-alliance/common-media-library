import type { IsoView } from '../IsoView.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 */
export class MediaDataBox extends Box {
	data: Uint8Array

	constructor(data: Uint8Array = new Uint8Array(0)) {
		super('mdat')
		this.data = data
	}

	/**
	 * Reads a MediaDataBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
	 */
	static read(view: IsoView): MediaDataBox {
		const data = view.readData(-1)
		return new MediaDataBox(data)
	}

	override get size(): number {
		// 8 bytes header + data length
		return 8 + this.data.length
	}

	/**
	 * Writes a MediaDataBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box size (4 bytes)
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4

		// Write box type (4 bytes) - 'mdat'
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		// Write data
		if (this.data.length > 0) {
			const uint8View = new Uint8Array(dataView.buffer)
			uint8View.set(this.data, cursor)
			cursor += this.data.length
		}

		return cursor - bufferOffset
	}
}

