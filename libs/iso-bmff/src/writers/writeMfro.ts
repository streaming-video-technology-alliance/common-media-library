import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

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
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeMfro(
	cursor: IsoBoxWriteCursor,
	box: MovieFragmentRandomAccessOffsetBox,
): void {
	const start = beginIsoFullBox(cursor, 'mfro', box.version, box.flags)

	writeUint32(cursor, box.mfraSize)
	endIsoBox(cursor, start)
}
