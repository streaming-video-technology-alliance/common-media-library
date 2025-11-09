import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.1 Chunk Offset Box
 */
export class ChunkOffsetBox extends FullBox {
	entryCount: number
	chunkOffset: number[]

	constructor(version: number, flags: number, entryCount: number, chunkOffset: number[] = []) {
		super('stco', version, flags)
		this.entryCount = entryCount
		this.chunkOffset = chunkOffset
	}

	/**
	 * Reads a ChunkOffsetBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1 Chunk Offset Box
	 */
	static read(view: IsoView): ChunkOffsetBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const chunkOffset = view.readArray(UINT, 4, entryCount)
		return new ChunkOffsetBox(version, flags, entryCount, chunkOffset)
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (chunkOffset.length * 4)
		return 16 + (this.chunkOffset.length * 4)
	}

	/**
	 * Writes a ChunkOffsetBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1 Chunk Offset Box
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

		// Write entryCount (4 bytes)
		writeUint(dataView, cursor, 4, this.entryCount)
		cursor += 4

		// Write chunk offsets
		for (const offset of this.chunkOffset) {
			writeUint(dataView, cursor, 4, offset)
			cursor += 4
		}

		return cursor - bufferOffset
	}
}

