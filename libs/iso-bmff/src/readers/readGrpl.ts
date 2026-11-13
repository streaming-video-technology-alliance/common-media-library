import type { GroupsListBox, GroupsListBoxChild } from '../boxes/GroupsListBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `GroupsListBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `grpl` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `GroupsListBox`
 *
 * @public
 */
export function readGrpl(view: IsoBoxReadView<IsoInt64>): GroupsListBox {
	return {
		type: 'grpl',
		boxes: view.readBoxes<GroupsListBoxChild>(),
	}
}
