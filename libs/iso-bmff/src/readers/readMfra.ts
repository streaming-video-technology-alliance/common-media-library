import type { MovieFragmentRandomAccessBox } from '../boxes/MovieFragmentRandomAccessBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `mfra` box (`MovieFragmentRandomAccessBox`).
 *
 * The `readers` map does not need an entry for the `mfra` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieFragmentRandomAccessBox`
 *
 * @public
 */
export function readMfra<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): MovieFragmentRandomAccessBox<V> {
	return {
		type: 'mfra',
		boxes: readChildBoxes(cursor),
	}
}
