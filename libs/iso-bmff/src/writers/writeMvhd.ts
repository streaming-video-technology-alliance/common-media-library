import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeInt16 } from '../cursor/writeInt16.ts'
import { writeInt32 } from '../cursor/writeInt32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'
import { writeMatrix } from '../cursor/writeMatrix.ts'

/**
 * Write the `mvhd` box (`MovieHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.2.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `MovieHeaderBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @example
 * {@includeCode ../../test/writers/writeMvhd.test.ts#example}
 *
 * @public
 */
export function writeMvhd(cursor: IsoBoxWriteCursor, box: MovieHeaderBox<IsoInt64>): void {
	const size = box.version === 1 ? 8 : 4
	const preDefined = box.preDefined ?? []
	const start = beginIsoFullBox(cursor, 'mvhd', box.version, box.flags)

	writeWideUint(cursor, box.creationTime, size)
	writeWideUint(cursor, box.modificationTime, size)
	writeUint32(cursor, box.timescale)
	writeWideUint(cursor, box.duration, size)
	writeInt32(cursor, Math.round(box.rate * 0x10000))
	writeInt16(cursor, Math.round(box.volume * 0x100))
	writeUint16(cursor, 0)
	writeUint32(cursor, 0)
	writeUint32(cursor, 0)
	writeMatrix(cursor, box.matrix)

	for (let i = 0; i < 6; i++) {
		writeUint32(cursor, preDefined[i] ?? 0)
	}

	writeUint32(cursor, box.nextTrackId)
	endIsoBox(cursor, start)
}
