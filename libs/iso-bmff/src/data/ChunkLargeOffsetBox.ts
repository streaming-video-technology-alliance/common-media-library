import { UINT } from '../fields/UINT.ts'
import type { IsoView } from '../IsoView.ts'
import { FullBox } from './FullBox.ts'
import type { IsoDataWriter } from './IsoDataWriter.ts'

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
	 * Writes a ChunkLargeOffsetBox to an IsoDataView
	 *
	 * ISO/IEC 14496-12:2012 - 8.7.1.1 Chunk Large Offset Box
	 */
	static write(box: ChunkLargeOffsetBox, view: IsoDataWriter): void {
		view.writeBoxHeader(box)
		view.writeFullBoxHeader(box)
		view.writeUint(box.entryCount, 4)
		for (const chunkOffset of box.chunkOffset) {
			view.writeUint(chunkOffset, 8)
		}
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
