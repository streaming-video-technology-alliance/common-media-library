import type { Fields } from '../boxes/Fields.ts'
import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write an IdentifiedMediaDataBox to an IsoDataWriter.
 *
 * @param box - The IdentifiedMediaDataBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeImda(box: Fields<IdentifiedMediaDataBox>): IsoDataWriter {
	const headerSize = 8
	const imdaIdentifierSize = 4
	const dataSize = box.data.length
	const totalSize = headerSize + imdaIdentifierSize + dataSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('imda', totalSize)
	writer.writeUint(box.imdaIdentifier, 4)
	writer.writeBytes(box.data)

	return writer
}
