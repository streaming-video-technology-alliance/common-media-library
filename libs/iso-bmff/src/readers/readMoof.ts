import type { MovieFragmentBox, MovieFragmentBoxChild } from '../boxes/MovieFragmentBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieFragmentBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `moof` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentBox`
 *
 * @public
 */
export function readMoof(view: IsoBoxReadView): MovieFragmentBox {
	return {
		type: 'moof',
		boxes: view.readBoxes<MovieFragmentBoxChild>(),
	}
}
