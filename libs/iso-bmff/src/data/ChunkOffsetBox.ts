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
	static readonly type = 'stco'

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

	/**
	 * Writes a ChunkOffsetBox to a DataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1 Chunk Offset Box
	 */
	static write(box: ChunkOffsetBox, dataView: DataView, offset: number = 0): number {
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

		// Write chunk offsets
		for (const chunkOffset of box.chunkOffset) {
			writeUint(dataView, cursor, 4, chunkOffset)
			cursor += 4
		}

		return cursor - bufferOffset
	}

	entryCount: number
	chunkOffset: number[]

	constructor(version: number, flags: number, entryCount: number, chunkOffset: number[] = []) {
		super('stco', version, flags)
		this.entryCount = entryCount
		this.chunkOffset = chunkOffset
	}

	override get size(): number {
		// 8 (box header) + 4 (FullBox) + 4 (entryCount) + (chunkOffset.length * 4)
		return 16 + (this.chunkOffset.length * 4)
	}
}
