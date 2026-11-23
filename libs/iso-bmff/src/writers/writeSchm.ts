import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SchemeTypeBox } from '../boxes/SchemeTypeBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeFourCc } from '../cursor/writeFourCc.ts'
import { writeTerminatedUtf8 } from '../cursor/writeTerminatedUtf8.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `schm` box (`SchemeTypeBox`).
 *
 * When flag `0x000001` is set, the writer writes `schemeUri`.
 *
 * ISO/IEC 14496-12:2015 - 8.12.5
 *
 * @param cursor - The write cursor
 * @param box - The `SchemeTypeBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 * @throws RangeError if `schemeType` does not have 4 characters.
 *
 * @example
 * {@includeCode ../../test/writers/writeSchm.test.ts#example}
 *
 * @public
 */
export function writeSchm(cursor: IsoBoxWriteCursor, box: SchemeTypeBox): void {
	const start = beginIsoFullBox(cursor, 'schm', box.version, box.flags)

	writeFourCc(cursor, box.schemeType)
	writeUint32(cursor, box.schemeVersion)

	if (box.flags & 0x000001) {
		writeTerminatedUtf8(cursor, box.schemeUri as string)
	}

	endIsoBox(cursor, start)
}
