import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an `IdentifiedMediaDataBox` to an `IsoBoxWriteView`.
 *
 * @param box - The `IdentifiedMediaDataBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeImda(box: IdentifiedMediaDataBox): IsoBoxWriteView {
	const headerSize = 8
	const imdaIdentifierSize = 4
	const dataSize = box.data.length
	const totalSize = headerSize + imdaIdentifierSize + dataSize

	const writer = new IsoBoxWriteView('imda', totalSize)
	writer.writeUint(box.imdaIdentifier, 4)
	writer.writeBytes(box.data)

	return writer
}
