import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `urn ` box (`DataEntryUrnBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @param cursor - The write cursor
 * @param box - The `DataEntryUrnBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeUrn.test.ts#example}
 *
 * @public
 */
export function writeUrn(cursor: IsoBoxWriteCursor, box: DataEntryUrnBox): void {
	const start = beginIsoFullBox(cursor, 'urn ', box.version, box.flags)

	if (!(box.flags & 0x000001)) {
		writeTerminatedUtf8(cursor, box.name)

		if (box.location !== undefined) {
			writeTerminatedUtf8(cursor, box.location)
		}
	}

	endIsoBox(cursor, start)
}
