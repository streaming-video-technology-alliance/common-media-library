import type { Fields } from '../boxes/Fields.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a FreeSpaceBox (skip variant) to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 * @param box - The FreeSpaceBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeSkip(box: Fields<FreeSpaceBox<'skip'>>): IsoDataWriter {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('skip', totalSize)
	writer.writeBytes(box.data)

	return writer
}
