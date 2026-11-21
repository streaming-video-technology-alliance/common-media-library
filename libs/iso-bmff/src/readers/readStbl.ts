import type { SampleTableBox } from '../boxes/SampleTableBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `stbl` box (`SampleTableBox`).
 *
 * The `readers` map does not need an entry for the `stbl` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SampleTableBox`
 *
 * @public
 */
export function readStbl<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): SampleTableBox<V> {
	return {
		type: 'stbl',
		boxes: readChildBoxes(cursor),
	}
}
