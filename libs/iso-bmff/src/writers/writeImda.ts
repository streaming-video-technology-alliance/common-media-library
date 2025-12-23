import type { Fields } from '../boxes/Fields.ts'
import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import { writeBoxHeader } from './writeBoxHeader.ts'
import { writeUint } from './writeUint.ts'

/**
 * Write an IdentifiedMediaDataBox to a Uint8Array.
 *
 * @param box - The IdentifiedMediaDataBox fields to write
 *
 * @returns A Uint8Array containing the encoded box
 *
 * @beta
 */
export function writeImda(box: Fields<IdentifiedMediaDataBox>): Uint8Array {
	const headerSize = 8
	const imdaIdentifierSize = 4
	const dataSize = box.data.length
	const totalSize = headerSize + imdaIdentifierSize + dataSize

	const buffer = new ArrayBuffer(totalSize)
	const dataView = new DataView(buffer)
	const result = new Uint8Array(buffer)

	let offset = 0
	offset += writeBoxHeader(dataView, offset, 'imda', totalSize)

	writeUint(dataView, offset, 4, box.imdaIdentifier)
	offset += 4

	result.set(box.data, offset)

	return result
}

