import type { SubTrackDefinition } from '../boxes/SubTrackDefinition.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `strd` box (`SubTrackDefinition`).
 *
 * The `readers` map does not need an entry for the `strd` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubTrackDefinition`
 *
 * @public
 */
export function readStrd<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SubTrackDefinition<V> {
	return {
		type: 'strd',
		boxes: readChildBoxes(cursor),
	}
}
