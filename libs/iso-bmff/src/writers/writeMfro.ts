import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mfro` box (`MovieFragmentRandomAccessOffsetBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.11
 *
 * The writer writes the stored `mfraSize`. Set `mfraSize` after a change to the children of the `mfra` box.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieFragmentRandomAccessOffsetBox` fields to write
 *
 * @public
 */
export function writeMfro(
	cursor: IsoBoxWriteCursor,
	box: MovieFragmentRandomAccessOffsetBox,
): void {
	const headerSize = 8
	const fullBoxSize = 4
	const mfraSizeSize = 4
	const totalSize = headerSize + fullBoxSize + mfraSizeSize

	const writer = new IsoBoxWriteView('mfro', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.mfraSize, 4)

	writeLegacyView(cursor, writer)
}
