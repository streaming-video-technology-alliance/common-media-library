import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

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
	const view = new IsoBoxReadView(cursor)

	const { version, flags } = view.readFullBox()

	return {
		type: 'mehd',
		version,
		flags,
		fragmentDuration: view.readWideUint(version === 1 ? 8 : 4),
	}
}
