import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBoxBase } from './FullBoxBase.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.1 Chunk Offset Box
 */
export class stco extends FullBoxBase<ChunkOffsetBox> {
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
		return new stco(version, flags, entryCount, chunkOffset)
	}

	/**
	 * Writes a ChunkOffsetBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1 Chunk Offset Box
	 */
	static write(box: ChunkOffsetBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const chunkOffset of box.chunkOffset) {
			view.writeUint(chunkOffset, 4)
		}
	}

	entryCount: number
	chunkOffset: number[]

	constructor(version: number, flags: number, entryCount: number, chunkOffset: number[] = []) {
		super('stco', version, flags)
		this.entryCount = entryCount
		this.chunkOffset = chunkOffset
	}

	override get size(): number {
		// 4 (entryCount) + (chunkOffset.length * 4)
		return 4 + (this.chunkOffset.length * 4)
	}
}
