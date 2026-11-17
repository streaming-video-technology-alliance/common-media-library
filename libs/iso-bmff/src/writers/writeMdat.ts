import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mdat` box (`MediaDataBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.1.1
 *
 * @param box - The `MediaDataBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMdat(box: MediaDataBox): IsoBoxWriteView {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoBoxWriteView('mdat', totalSize)
	writer.writeBytes(box.data)

	return writer
}
