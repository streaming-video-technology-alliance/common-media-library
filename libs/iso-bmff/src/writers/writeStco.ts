import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `ChunkOffsetBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.7.5 Chunk Offset Box
 *
 * @param box - The `ChunkOffsetBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeStco(box: ChunkOffsetBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entriesSize = box.entryCount * 4
	const totalSize = headerSize + fullBoxSize + entryCountSize + entriesSize

	const writer = new IsoBoxWriteView('stco', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.entryCount, 4)

	for (const offset of box.chunkOffset) {
		writer.writeUint(offset, 4)
	}

	return writer
}
