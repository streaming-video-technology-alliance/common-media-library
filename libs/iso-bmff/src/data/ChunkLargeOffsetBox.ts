import { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.7.1.1 Chunk Large Offset Box
 */
export class ChunkLargeOffsetBox extends FullBox {
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
