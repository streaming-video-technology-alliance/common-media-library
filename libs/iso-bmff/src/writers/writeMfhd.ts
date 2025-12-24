import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a MovieFragmentHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 *
 * @param box - The MovieFragmentHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeMfhd(box: MovieFragmentHeaderBox): IsoDataWriter {
	const headerSize = 8
	const fullBoxSize = 4
	const sequenceNumberSize = 4
	const totalSize = headerSize + fullBoxSize + sequenceNumberSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('mfhd', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.sequenceNumber, 4)

	return writer
}
