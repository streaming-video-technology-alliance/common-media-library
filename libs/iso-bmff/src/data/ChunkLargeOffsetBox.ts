import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { writeFullBoxHeader } from '../writers/writeFullBox.ts'
import { writeString } from '../writers/writeString.ts'
import { writeUint } from '../writers/writeUint.ts'
import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.1.1 Chunk Large Offset Box
 */
export class ChunkLargeOffsetBox extends FullBox {
	static readonly type = 'co64'

	/**
	 * Reads a ChunkLargeOffsetBox from an IsoView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1.1 Chunk Large Offset Box
	 */
	static read(view: IsoView): ChunkLargeOffsetBox {
		const { version, flags } = view.readFullBox()
		const entryCount = view.readUint(4)
		const chunkOffset = view.readArray(UINT, 8, entryCount)
		return new ChunkLargeOffsetBox(version, flags, entryCount, chunkOffset)
	}

	/**
	 * Writes a ChunkLargeOffsetBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1.1 Chunk Large Offset Box
	 */
	static write(box: ChunkLargeOffsetBox, dataView: DataView, offset: number = 0): number {
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

		// Write entryCount (4 bytes)
		writeUint(dataView, cursor, 4, box.entryCount)
		cursor += 4

		// Write chunk offsets (8 bytes each)
		for (const chunkOffset of box.chunkOffset) {
			writeUint(dataView, cursor, 8, chunkOffset)
			cursor += 8
		}

		return cursor - bufferOffset
	}

	entryCount: number
	chunkOffset: number[]

	constructor(version: number, flags: number, entryCount: number, chunkOffset: number[] = []) {
		super('co64', version, flags)
		this.entryCount = entryCount
		this.chunkOffset = chunkOffset
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (chunkOffset.length * 8)
		return 16 + (this.chunkOffset.length * 8)
	}
}
