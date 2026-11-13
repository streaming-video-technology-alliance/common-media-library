import type { UserDataBox, UserDataBoxChild } from '../boxes/UserDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `UserDataBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `udta` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `UserDataBox`
 *
 * @public
 */
export function readUdta(view: IsoBoxReadView<IsoInt64>): UserDataBox {
	return {
		type: 'udta',
		boxes: view.readBoxes<UserDataBoxChild>(),
	}
}
