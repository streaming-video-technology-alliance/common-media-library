import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mfhd` box (`MovieFragmentHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.5
 *
 * @param cursor - The write cursor
 * @param box - The `MovieFragmentHeaderBox` fields to write
 *
 * @public
 */
export function writeMfhd(cursor: IsoBoxWriteCursor, box: MovieFragmentHeaderBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const sequenceNumberSize = 4
	const totalSize = headerSize + fullBoxSize + sequenceNumberSize

	const writer = new IsoBoxWriteView('mfhd', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.sequenceNumber, 4)

	writeLegacyView(cursor, writer)
}
