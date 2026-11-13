import type { MovieFragmentHeaderBox } from '../boxes/MovieFragmentHeaderBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MovieFragmentHeaderBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentHeaderBox`
 *
 * @public
 */
export function readMfhd(view: IsoBoxReadView<IsoInt64>): MovieFragmentHeaderBox {
	return {
		type: 'mfhd',
		...view.readFullBox(),
		sequenceNumber: view.readUint(4),
	}
}
