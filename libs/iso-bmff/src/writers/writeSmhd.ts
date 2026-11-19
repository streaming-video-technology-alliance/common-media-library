import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SoundMediaHeaderBox } from '../boxes/SoundMediaHeaderBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeTemplate16 } from '../cursor/writeTemplate16.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `smhd` box (`SoundMediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.2
 *
 * @param cursor - The write cursor
 * @param box - The `SoundMediaHeaderBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeSmhd.test.ts#example}
 *
 * @public
 */
export function writeSmhd(cursor: IsoBoxWriteCursor, box: SoundMediaHeaderBox): void {
	const start = beginIsoFullBox(cursor, 'smhd', box.version, box.flags)

	writeTemplate16(cursor, box.balance)
	writeUint16(cursor, 0)
	endIsoBox(cursor, start)
}
