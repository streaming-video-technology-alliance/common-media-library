import type { MovieBox, MovieBoxChild } from '../boxes/MovieBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `moov` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieBox`
 *
 * @public
 */
export function readMoov(view: IsoBoxReadView): MovieBox {
	return {
		type: 'moov',
		boxes: view.readBoxes<MovieBoxChild>(),
	}
}
