import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { ParsedIsoBox } from '../ParsedIsoBox.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import { readUint32 } from './readUint32.ts'

/**
 * Reads the `entry_count` field and at most that number of child boxes.
 *
 * ISO/IEC 14496-12:2015 - 8.5.2 and 8.7.2: the count is the number of child boxes.
 *
 * @throws RangeError if the box has fewer complete child boxes than `entry_count`.
 *
 * @internal
 */
export function readEntryBoxes<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
	type: string,
): ParsedIsoBox<V>[] {
	const entryCount = readUint32(cursor)
	const boxes = readChildBoxes(cursor, entryCount)

	if (boxes.length < entryCount) {
		throw new RangeError(
			`The ${type} box has an entry_count of ${entryCount}, and the number of complete child boxes is ${boxes.length}`,
		)
	}

	return boxes
}
