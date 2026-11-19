import type { MetaBox } from '../boxes/MetaBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readChildBoxes } from '../readChildBoxes.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `meta` box (`MetaBox`).
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MetaBox`
 *
 * @public
 */
export function readMeta<V extends IsoInt64>(cursor: IsoBoxReadCursor<V>): MetaBox<V> {
	return {
		type: 'meta',
		version: readUint8(cursor),
		flags: readUint24(cursor),
		boxes: readChildBoxes(cursor),
	}
}
