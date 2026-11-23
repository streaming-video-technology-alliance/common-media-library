import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SubsegmentIndexBox } from '../boxes/SubsegmentIndexBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { writeUint24 } from '../cursor/writeUint24.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `ssix` box (`SubsegmentIndexBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.4
 *
 * @param cursor - The write cursor
 * @param box - The `SubsegmentIndexBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeSsix(cursor: IsoBoxWriteCursor, box: SubsegmentIndexBox): void {
	const start = beginIsoFullBox(cursor, 'ssix', box.version, box.flags)

	writeUint32(cursor, box.subsegments.length)

	for (const { ranges } of box.subsegments) {
		writeUint32(cursor, ranges.length)

		for (const range of ranges) {
			writeUint8(cursor, range.level)
			writeUint24(cursor, range.rangeSize)
		}
	}

	endIsoBox(cursor, start)
}
