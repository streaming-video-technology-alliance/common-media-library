import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mfhd` box (`MovieFragmentHeaderBox`).
 *
 * ISO/IEC 14496-12:2012 - 8.8.5 Movie Fragment Header Box
 *
 * @param box - The `MovieFragmentHeaderBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMfhd(box: MovieFragmentHeaderBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const sequenceNumberSize = 4
	const totalSize = headerSize + fullBoxSize + sequenceNumberSize

	const writer = new IsoBoxWriteView('mfhd', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.sequenceNumber, 4)

	return writer
}
