import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readWideUint } from '../cursor/readWideUint.ts'

/**
 * Read the `mehd` box (`MovieExtendsHeaderBox`).
 *
 * The 64-bit integer fields of the result have the type that the `int64` function of the cursor returns.
 * With no option, they are numbers.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `MovieExtendsHeaderBox`
 *
 * @public
 */
export function readMehd<V extends IsoInt64>(
	cursor: IsoBoxReadCursor<V>,
): MovieExtendsHeaderBox<V> {
	const version = readUint8(cursor)

	return {
		type: 'mehd',
		version,
		flags: readUint24(cursor),
		fragmentDuration: readWideUint(cursor, version === 1 ? 8 : 4),
	}
}
