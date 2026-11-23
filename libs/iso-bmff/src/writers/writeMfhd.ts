import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `mfhd` box (`MovieFragmentHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.5
 *
 * @param cursor - The write cursor
 * @param box - The `MovieFragmentHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeMfhd(cursor: IsoBoxWriteCursor, box: MovieFragmentHeaderBox): void {
	const start = beginIsoFullBox(cursor, 'mfhd', box.version, box.flags)

	writeUint32(cursor, box.sequenceNumber)
	endIsoBox(cursor, start)
}
