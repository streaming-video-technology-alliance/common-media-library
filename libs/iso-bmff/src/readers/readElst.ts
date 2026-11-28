import type { EditListBox } from '../boxes/EditListBox.ts'
import type { EditListEntry } from '../boxes/EditListEntry.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readInt16 } from '../cursor/readInt16.ts'
import { readWideUint } from '../cursor/readWideUint.ts'
import { readWideInt } from '../cursor/readWideInt.ts'

/**
 * Read the `elst` box (`EditListBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `EditListBox`
 *
 * @public
 */
export function readElst<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): EditListBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const size = version === 1 ? 8 : 4
	const entryCount = readUint32(cursor)
	const entries: EditListEntry<V>[] = []

	for (let i = 0; i < entryCount; i++) {
		entries.push({
			segmentDuration: readWideUint(cursor, size),
			mediaTime: readWideInt(cursor, size),
			mediaRateInteger: readInt16(cursor),
			mediaRateFraction: readInt16(cursor),
		})
	}

	return {
		type: 'elst',
		version,
		flags,
		entries,
	}
}
