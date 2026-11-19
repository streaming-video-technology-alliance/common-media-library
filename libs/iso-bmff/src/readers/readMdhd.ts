import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `mdhd` box (`MediaHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MediaHeaderBox`
 *
 * @public
 */
export function readMdhd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MediaHeaderBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const size = version == 1 ? 8 : 4
	const creationTime = readWideUint(cursor, size)
	const modificationTime = readWideUint(cursor, size)
	const timescale = readUint32(cursor)
	const duration = readWideUint(cursor, size)
	const lang = readUint16(cursor)
	const language = String.fromCharCode(
		((lang >> 10) & 0x1f) + 0x60,
		((lang >> 5) & 0x1f) + 0x60,
		(lang & 0x1f) + 0x60,
	)

	return {
		type: 'mdhd',
		version,
		flags,
		creationTime,
		modificationTime,
		timescale,
		duration,
		language,
		preDefined: readUint16(cursor),
	}
}
