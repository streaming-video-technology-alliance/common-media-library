import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `imda` box (`IdentifiedMediaDataBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `IdentifiedMediaDataBox` fields to write
 *
 * @public
 */
export function writeImda(cursor: IsoBoxWriteCursor, box: IdentifiedMediaDataBox): void {
	const headerSize = 8
	const imdaIdentifierSize = 4
	const dataSize = box.data.length
	const totalSize = headerSize + imdaIdentifierSize + dataSize

	const writer = new IsoBoxWriteView('imda', totalSize)
	writer.writeUint(box.imdaIdentifier, 4)
	writer.writeBytes(box.data)

	writeLegacyView(cursor, writer)
}
