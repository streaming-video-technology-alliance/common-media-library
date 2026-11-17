import type { MovieFragmentBox, MovieFragmentBoxChild } from '../boxes/MovieFragmentBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MovieFragmentBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `moof` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentBox`
 *
 * @public
 */
export function readMoof<V extends IsoInt64>(view: IsoBoxReadView<V>): MovieFragmentBox<V> {
	return {
		type: 'moof',
		boxes: view.readBoxes<MovieFragmentBoxChild<V>>(),
	}
}
