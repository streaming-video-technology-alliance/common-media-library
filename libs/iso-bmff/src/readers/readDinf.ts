import type { DataInformationBox } from '../boxes/DataInformationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `dinf` box (`DataInformationBox`).
 *
 * The `readers` map does not need an entry for the `dinf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `DataInformationBox`
 *
 * @public
 */
export function readDinf<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): DataInformationBox<V> {
	return {
		type: 'dinf',
		boxes: readChildBoxes(cursor),
	}
}
