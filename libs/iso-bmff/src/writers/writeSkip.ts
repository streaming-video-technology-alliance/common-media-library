import type { FreeSpaceBox } from '../boxes/FreeSpaceBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `skip` box (`FreeSpaceBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.2
 *
 * @param box - The `FreeSpaceBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeSkip(box: FreeSpaceBox<'skip'>): IsoBoxWriteView {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoBoxWriteView('skip', totalSize)
	writer.writeBytes(box.data)

	return writer
}
