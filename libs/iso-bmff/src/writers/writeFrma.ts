import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeFourCc } from '../cursor/writeFourCc.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `frma` box (`OriginalFormatBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.12.2
 *
 * @param cursor - The write cursor
 * @param box - The `OriginalFormatBox` fields to write
 *
 * @throws RangeError if `dataFormat` does not have 4 characters.
 *
 * @public
 */
export function writeFrma(cursor: IsoBoxWriteCursor, box: OriginalFormatBox): void {
	const start = beginIsoBox(cursor, 'frma')

	writeFourCc(cursor, box.dataFormat)
	endIsoBox(cursor, start)
}
