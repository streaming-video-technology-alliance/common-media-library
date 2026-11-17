import type {
	MovieFragmentRandomAccessBox,
	MovieFragmentRandomAccessBoxChild,
} from '../boxes/MovieFragmentRandomAccessBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MovieFragmentRandomAccessBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `mfra` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentRandomAccessBox`
 *
 * @public
 */
export function readMfra<V extends IsoInt64>(
	view: IsoBoxReadView<V>,
): MovieFragmentRandomAccessBox<V> {
	return {
		type: 'mfra',
		boxes: view.readBoxes<MovieFragmentRandomAccessBoxChild<V>>(),
	}
}
