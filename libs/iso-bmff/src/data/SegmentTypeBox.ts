import { STRING } from '../fields/STRING.ts'
import type { IsoView } from '../IsoView.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { Box } from './Box.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
 */
export class SegmentTypeBox extends Box {
	constructor() {
		super('styp')
	}

	/**
	 * Reads a SegmentTypeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
	 */
	static read(view: IsoView): SegmentTypeBox {
		// SegmentTypeBox has the same structure as FileTypeBox
		const size = 4
		view.readString(4) // majorBrand
		view.readUint(4) // minorVersion
		const length = view.bytesRemaining / size
		view.readArray(STRING, size, length) // compatibleBrands
		return new SegmentTypeBox()
	}

	override get size(): number {
		// 8 bytes header minimum
		return 8
	}

	/**
	 * Writes a SegmentTypeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.16.2 Segment Type Box
	 */
	write(dataView: DataView, offset: number = 0): number {
		const bufferOffset = dataView.byteOffset + offset
		let cursor = bufferOffset

		// Write box size (4 bytes)
		writeUint(dataView, cursor, 4, this.size)
		cursor += 4

		// Write box type (4 bytes) - 'styp'
		writeString(dataView, cursor, 4, this.type)
		cursor += 4

		return cursor - bufferOffset
	}
}

