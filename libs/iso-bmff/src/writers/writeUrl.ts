import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `url ` box (`DataEntryUrlBox`).
 *
 * The writer omits `location` when flag `0x000001` is set.
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @param cursor - The write cursor
 * @param box - The `DataEntryUrlBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeUrl.test.ts#example}
 *
 * @public
 */
export function writeUrl(cursor: IsoBoxWriteCursor, box: DataEntryUrlBox): void {
	const start = beginIsoFullBox(cursor, 'url ', box.version, box.flags)

	if (!(box.flags & 0x000001)) {
		writeTerminatedUtf8(cursor, box.location as string)
	}

	endIsoBox(cursor, start)
}
