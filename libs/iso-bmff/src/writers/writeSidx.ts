import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeWideUint } from '../cursor/writeWideUint.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `sidx` box (`SegmentIndexBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.3
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `SegmentIndexBox` fields to write
 *
 * @public
 */
export function writeSidx(cursor: IsoBoxWriteCursor, box: SegmentIndexBox<IsoInt64>): void {
	const { references } = box
	const size = box.version === 0 ? 4 : 8

	if (references.length > 0xffff) {
		throw new RangeError(`The sidx box has ${references.length} references, and the limit is 65535`)
	}

	const start = beginIsoFullBox(cursor, 'sidx', box.version, box.flags)

	writeUint32(cursor, box.referenceId)
	writeUint32(cursor, box.timescale)
	writeWideUint(cursor, box.earliestPresentationTime, size)
	writeWideUint(cursor, box.firstOffset, size)
	writeUint16(cursor, 0)
	writeUint16(cursor, references.length)

	for (const ref of references) {
		writeUint32(cursor, ((ref.referenceType & 0x1) << 31) | (ref.referencedSize & 0x7fffffff))
		writeUint32(cursor, ref.subsegmentDuration)
		writeUint32(
			cursor,
			((ref.startsWithSap & 0x1) << 31) |
				((ref.sapType & 0x7) << 28) |
				(ref.sapDeltaTime & 0x0fffffff),
		)
	}

	endIsoBox(cursor, start)
}
