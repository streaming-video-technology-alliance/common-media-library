import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SegmentTypeBox } from '../boxes/SegmentTypeBox.ts'
import { beginIsoBox } from '../beginIsoBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeFourCc } from '../cursor/writeFourCc.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `styp` box (`SegmentTypeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.2
 *
 * @param cursor - The write cursor
 * @param box - The `SegmentTypeBox` fields to write
 *
 * @throws RangeError if `majorBrand` or a compatible brand does not have 4 characters.
 *
 * @public
 */
export function writeStyp(cursor: IsoBoxWriteCursor, box: SegmentTypeBox): void {
	const start = beginIsoBox(cursor, 'styp')

	writeFourCc(cursor, box.majorBrand)
	writeUint32(cursor, box.minorVersion)

	for (const brand of box.compatibleBrands) {
		writeFourCc(cursor, brand)
	}

	endIsoBox(cursor, start)
}
