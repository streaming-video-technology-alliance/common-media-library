import type { UserDataBox, UserDataBoxChild } from '../boxes/UserDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `udta` box (`UserDataBox`).
 *
 * The `readers` map does not need an entry for the `udta` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `UserDataBox`
 *
 * @public
 */
export function readUdta<V extends IsoInt64>(view: IsoBoxReadView<V>): UserDataBox<V> {
	return {
		type: 'udta',
		boxes: view.readBoxes<UserDataBoxChild<V>>(),
	}
}
