import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readEntryBoxes } from '../cursor/readEntryBoxes.ts'

/**
 * Read the `dref` box (`DataReferenceBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `DataReferenceBox`
 *
 * @throws RangeError if the box has fewer complete child boxes than `entry_count`.
 *
 * @public
 */
export function readDref<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): DataReferenceBox<V> {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)

	return {
		type: 'dref',
		version,
		flags,
		boxes: readEntryBoxes(cursor, 'dref'),
	}
}
