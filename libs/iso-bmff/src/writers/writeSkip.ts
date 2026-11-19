import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `skip` box (`FreeSpaceBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.2
 *
 * @param cursor - The write cursor
 * @param box - The `FreeSpaceBox` fields to write
 *
 * @public
 */
export function writeSkip(cursor: IsoBoxWriteCursor, box: FreeSpaceBox<'skip'>): void {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoBoxWriteView('skip', totalSize)
	writer.writeBytes(box.data)

	writeLegacyView(cursor, writer)
}
