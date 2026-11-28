import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { ProtectionSystemSpecificHeaderBox } from '../boxes/ProtectionSystemSpecificHeaderBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeBytes } from '../cursor/writeBytes.ts'
import { endIsoBox } from '../endIsoBox.ts'
import { writeFixedBytes } from '../cursor/writeFixedBytes.ts'

/**
 * Write the `pssh` box (`ProtectionSystemSpecificHeaderBox`).
 *
 * ISO/IEC 23001-7:2016 - 8.1
 *
 * @param cursor - The write cursor
 * @param box - The `ProtectionSystemSpecificHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writePssh.test.ts#example}
 *
 * @public
 */
export function writePssh(cursor: IsoBoxWriteCursor, box: ProtectionSystemSpecificHeaderBox): void {
	const start = beginIsoFullBox(cursor, 'pssh', box.version, box.flags)

	writeFixedBytes(cursor, box.systemId, 16, 'systemId')

	if (box.version > 0) {
		writeUint32(cursor, box.kid.length)

		for (const kid of box.kid) {
			writeFixedBytes(cursor, kid, 16, 'kid')
		}
	}

	writeUint32(cursor, box.data.length)
	writeBytes(cursor, box.data)
	endIsoBox(cursor, start)
}
