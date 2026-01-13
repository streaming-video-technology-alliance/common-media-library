import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `FreeSpaceBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.1.2 Free Space Box
 *
 * @param box - The `FreeSpaceBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeFree(box: FreeSpaceBox<'free'>): IsoBoxWriteView {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoBoxWriteView('free', totalSize)
	writer.writeBytes(box.data)

	return writer
}
