import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { ChunkOffsetBox } from '../boxes/ChunkOffsetBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `stco` box (`ChunkOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.5
 *
 * @param cursor - The write cursor
 * @param box - The `ChunkOffsetBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeStco.test.ts#example}
 *
 * @public
 */
export function writeStco(cursor: IsoBoxWriteCursor, box: ChunkOffsetBox): void {
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

	writeLegacyView(cursor, writer)
}
