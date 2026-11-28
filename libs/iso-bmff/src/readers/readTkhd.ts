import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readInt16 } from '../cursor/readInt16.ts'
import { readTemplate32 } from '../cursor/readTemplate32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'
import { readMatrix } from '../cursor/readMatrix.ts'

/**
 * Read the `tkhd` box (`TrackHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackHeaderBox`
 *
 * @public
 */
export function readTkhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): TrackHeaderBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const size = version === 1 ? 8 : 4
	const creationTime = readWideUint(cursor, size)
	const modificationTime = readWideUint(cursor, size)
	const trackId = readUint32(cursor)

	cursor.pos += 4

	const duration = readWideUint(cursor, size)

	cursor.pos += 8

	const layer = readInt16(cursor)
	const alternateGroup = readInt16(cursor)
	const volume = readInt16(cursor) / 0x100

	cursor.pos += 2

	return {
		type: 'tkhd',
		version,
		flags,
		creationTime,
		modificationTime,
		trackId,
		duration,
		layer,
		alternateGroup,
		volume,
		matrix: readMatrix(cursor),
		width: readTemplate32(cursor),
		height: readTemplate32(cursor),
	}
}
