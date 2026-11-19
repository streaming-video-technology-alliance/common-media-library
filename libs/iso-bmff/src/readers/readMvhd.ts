import type { MovieHeaderBox } from '../boxes/MovieHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readInt16 } from '../cursor/readInt16.ts'
import { readInt32 } from '../cursor/readInt32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'
import { readMatrix } from '../cursor/readMatrix.ts'

/**
 * Read the `mvhd` box (`MovieHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieHeaderBox`
 *
 * @public
 */
export function readMvhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MovieHeaderBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const size = version == 1 ? 8 : 4
	const creationTime = readWideUint(cursor, size)
	const modificationTime = readWideUint(cursor, size)
	const timescale = readUint32(cursor)
	const duration = readWideUint(cursor, size)
	const rate = readInt32(cursor) / 0x10000
	const volume = readInt16(cursor) / 0x100

	cursor.pos += 10

	const matrix = readMatrix(cursor)
	const preDefined: number[] = []

	for (let i = 0; i < 6; i++) {
		preDefined.push(readUint32(cursor))
	}

	return {
		type: 'mvhd',
		version,
		flags,
		creationTime,
		modificationTime,
		timescale,
		duration,
		rate,
		volume,
		matrix,
		preDefined,
		nextTrackId: readUint32(cursor),
	}
}
