import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeInt16 } from '../cursor/writeInt16.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `smhd` box (`SoundMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.2
 *
 * @param cursor - The write cursor
 * @param box - The `SoundMediaHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeSmhd.test.ts#example}
 *
 * @public
 */
export function writeSmhd(cursor: IsoBoxWriteCursor, box: SoundMediaHeaderBox): void {
	const start = beginIsoFullBox(cursor, 'smhd', box.version, box.flags)

	writeInt16(cursor, Math.round(box.balance * 0x100))
	writeUint16(cursor, 0)
	endIsoBox(cursor, start)
}
