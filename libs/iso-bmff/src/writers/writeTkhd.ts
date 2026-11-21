import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeInt16 } from '../cursor/writeInt16.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeTemplate16 } from '../cursor/writeTemplate16.ts'
import { writeTemplate32 } from '../cursor/writeTemplate32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'
import { writeMatrix } from '../cursor/writeMatrix.ts'

/**
 * Write the `tkhd` box (`TrackHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackHeaderBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeTkhd.test.ts#example}
 *
 * @public
 */
export function writeTkhd(cursor: IsoBoxWriteCursor, box: TrackHeaderBox<IsoInt64>): void {
	const size = box.version === 1 ? 8 : 4
	const start = beginIsoFullBox(cursor, 'tkhd', box.version, box.flags)

	writeWideUint(cursor, box.creationTime, size)
	writeWideUint(cursor, box.modificationTime, size)
	writeUint32(cursor, box.trackId)
	writeUint32(cursor, 0)
	writeWideUint(cursor, box.duration, size)
	writeUint32(cursor, 0)
	writeUint32(cursor, 0)
	writeInt16(cursor, box.layer)
	writeInt16(cursor, box.alternateGroup)
	writeTemplate16(cursor, box.volume)
	writeUint16(cursor, 0)
	writeMatrix(cursor, box.matrix)
	writeTemplate32(cursor, box.width)
	writeTemplate32(cursor, box.height)
	endIsoBox(cursor, start)
}
