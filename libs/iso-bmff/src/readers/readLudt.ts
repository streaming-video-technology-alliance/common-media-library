import type { LoudnessBox } from '../boxes/LoudnessBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `ludt` box (`LoudnessBox`).
 *
 * The `readers` map does not need an entry for the `ludt` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `LoudnessBox`
 *
 * @public
 */
export function readLudt<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): LoudnessBox<V> {
	return {
		type: 'ludt',
		boxes: readChildBoxes(cursor),
	}
}
