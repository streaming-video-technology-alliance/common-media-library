import type { IsoView } from '../IsoView.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 */
export class FreeSpaceBox extends Box {
	data: Uint8Array

	constructor(type: 'free' | 'skip' = 'free', data: Uint8Array = new Uint8Array(0)) {
		super(type)
		this.data = data
	}

	/**
	 * Reads a FreeSpaceBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
	 */
	static read(view: IsoView, type: 'free' | 'skip' = 'free'): FreeSpaceBox {
		const data = view.readData(-1)
		return new FreeSpaceBox(type, data)
	}

	override get size(): number {
		// 8 bytes header + data length
		return 8 + this.data.length
	}

	/**
	 * Writes a FreeSpaceBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box size (4 bytes)
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4

		// Write box type (4 bytes) - 'free' or 'skip'
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

