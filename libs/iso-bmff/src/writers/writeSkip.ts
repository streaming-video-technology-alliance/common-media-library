import type { Fields } from '../boxes/Fields.ts'
import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a FreeSpaceBox (skip variant) to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 * @param box - The FreeSpaceBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeSkip(box: Fields<FreeSpaceBox<'skip'>>): IsoBoxWriteView {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('skip', totalSize)
	writer.writeBytes(box.data)

	return writer
}
