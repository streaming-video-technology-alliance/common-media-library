import type { MediaDataBox } from '../boxes/MediaDataBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a MediaDataBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.1.1 Media Data Box
 *
 * @param box - The MediaDataBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeMdat(box: MediaDataBox): IsoDataWriter {
	const headerSize = 8
	const dataSize = box.data.length
	const totalSize = headerSize + dataSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('mdat', totalSize)
	writer.writeBytes(box.data)

	return writer
}
