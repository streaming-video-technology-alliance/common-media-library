import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { EditListBox } from '../boxes/EditListBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeInt16 } from '../cursor/writeInt16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { writeWideInt } from '../cursor/writeWideInt.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `elst` box (`EditListBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.6.6
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `EditListBox` fields to write
 *
 * @public
 */
export function writeElst(cursor: IsoBoxWriteCursor, box: EditListBox<IsoInt64>): void {
	const size = box.version === 1 ? 8 : 4
	const start = beginIsoFullBox(cursor, 'elst', box.version, box.flags)

	writeUint32(cursor, box.entries.length)

	for (const entry of box.entries) {
		writeWideUint(cursor, entry.segmentDuration, size)
		writeWideInt(cursor, entry.mediaTime, size)
		writeInt16(cursor, entry.mediaRateInteger)
		writeInt16(cursor, entry.mediaRateFraction)
	}

	endIsoBox(cursor, start)
}
