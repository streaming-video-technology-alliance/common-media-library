import type { Fields } from '../boxes/types/Fields.ts'
import type { IdentifiedMediaDataBox } from '../boxes/types/IdentifiedMediaDataBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write an IdentifiedMediaDataBox to an IsoDataWriter.
 *
 * @param box - The IdentifiedMediaDataBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeImda(box: Fields<IdentifiedMediaDataBox>): IsoBoxWriteView {
	const headerSize = 8
	const imdaIdentifierSize = 4
	const dataSize = box.data.length
	const totalSize = headerSize + imdaIdentifierSize + dataSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('imda', totalSize)
	writer.writeUint(box.imdaIdentifier, 4)
	writer.writeBytes(box.data)

	return writer
}
