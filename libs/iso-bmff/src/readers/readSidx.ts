import type { SegmentIndexBox } from '../boxes/SegmentIndexBox.ts'
import type { SegmentIndexReference } from '../boxes/SegmentIndexReference.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `sidx` box (`SegmentIndexBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SegmentIndexBox`
 *
 * @public
 */
export function readSidx<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SegmentIndexBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const size = version === 0 ? 4 : 8
	const referenceId = readUint32(cursor)
	const timescale = readUint32(cursor)
	const earliestPresentationTime = readWideUint(cursor, size)
	const firstOffset = readWideUint(cursor, size)

	cursor.pos += 2

	const referenceCount = readUint16(cursor)
	const references: SegmentIndexReference[] = []

	for (let i = 0; i < referenceCount; i++) {
		const reference = readUint32(cursor)
		const subsegmentDuration = readUint32(cursor)
		const sap = readUint32(cursor)

		references.push({
			subsegmentDuration,
			referenceType: (reference >> 31) & 0x00000001,
			referencedSize: reference & 0x7fffffff,
			startsWithSap: (sap >> 31) & 0x00000001,
			sapType: (sap >> 28) & 0x00000007,
			sapDeltaTime: sap & 0x0fffffff,
		})
	}

	return {
		type: 'sidx',
		version,
		flags,
		referenceId,
		timescale,
		earliestPresentationTime,
		firstOffset,
		references,
	}
}
