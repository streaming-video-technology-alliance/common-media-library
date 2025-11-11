import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.6.3.1 Compact Sample Size Box
 */
export class CompactSampleSizeBox extends FullBox {
	static readonly type = 'stz2'

	/**
	 * Reads a CompactSampleSizeBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.3.1 Compact Sample Size Box
	 */
	static read(view: IsoView): CompactSampleSizeBox {
		const { version, flags } = view.readFullBox()
		const fieldSize = view.readUint(1) & 0x0F // lower 4 bits
		view.readUint(3) // reserved (3 bytes)
		const sampleCount = view.readUint(4)

		// Determine byte size per entry based on fieldSize
		const fieldSizeBytes = fieldSize === 4 ? 1 : fieldSize === 8 ? 1 : fieldSize === 16 ? 2 : 1
		const entrySize = view.readArray(UINT, fieldSizeBytes, sampleCount)

		return new CompactSampleSizeBox(version, flags, fieldSize, sampleCount, entrySize)
	}

	/**
	 * Writes a CompactSampleSizeBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.6.3.1 Compact Sample Size Box
	 */
	static write(box: CompactSampleSizeBox, dataView: DataView, offset: number = 0): number {
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

		// Write fieldSize (1 byte, lower 4 bits)
		writeUint(dataView, cursor, 1, box.fieldSize & 0x0F)
		cursor += 1

		// Write reserved (3 bytes)
		writeUint(dataView, cursor, 1, 0)
		cursor += 1
		writeUint(dataView, cursor, 1, 0)
		cursor += 1
		writeUint(dataView, cursor, 1, 0)
		cursor += 1

		// Write sampleCount (4 bytes)
		writeUint(dataView, cursor, 4, box.sampleCount)
		cursor += 4

		// Write entrySize array
		const fieldSizeBytes = box.fieldSize === 4 ? 1 : box.fieldSize === 8 ? 1 : box.fieldSize === 16 ? 2 : 1
		for (const value of box.entrySize) {
			writeUint(dataView, cursor, fieldSizeBytes, value)
			cursor += fieldSizeBytes
		}

		return cursor - bufferOffset
	}

	fieldSize: number
	sampleCount: number
	entrySize: number[]

	constructor(version: number, flags: number, fieldSize: number, sampleCount: number, entrySize: number[] = []) {
		super('stz2', version, flags)
		this.fieldSize = fieldSize
		this.sampleCount = sampleCount
		this.entrySize = entrySize
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 1 (fieldSize) + 3 (reserved) + 4 (sampleCount) + (entrySize.length * fieldSize bytes)
		const fieldSizeBytes = this.fieldSize === 4 ? 1 : this.fieldSize === 8 ? 1 : this.fieldSize === 16 ? 2 : 0
		return 20 + (this.entrySize.length * fieldSizeBytes)
	}
}
