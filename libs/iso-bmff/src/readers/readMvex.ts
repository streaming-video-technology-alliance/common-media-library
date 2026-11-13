import type { MovieExtendsBox, MovieExtendsBoxChild } from '../boxes/MovieExtendsBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieExtendsBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `mvex` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieExtendsBox`
 *
 * @public
 */
export function readMvex(view: IsoBoxReadView): MovieExtendsBox {
	return {
		type: 'mvex',
		boxes: view.readBoxes<MovieExtendsBoxChild>(),
	}
}
