import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mdat` box (`MediaDataBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.1
 *
 * @param cursor - The write cursor
 * @param box - The `MediaDataBox` fields to write
 *
 * @public
 */
export function writeMdat(cursor: IsoBoxWriteCursor, box: MediaDataBox): void {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoBoxWriteView('mdat', totalSize)
	writer.writeBytes(box.data)

	writeLegacyView(cursor, writer)
}
