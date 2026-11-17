import type { MovieExtendsBox, MovieExtendsBoxChild } from '../boxes/MovieExtendsBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `MovieExtendsBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `mvex` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * The 64-bit integer fields of the child boxes have the type that the `int64` option of the view returns.
 * With no option, they are numbers.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieExtendsBox`
 *
 * @public
 */
export function readMvex<V extends IsoInt64>(view: IsoBoxReadView<V>): MovieExtendsBox<V> {
	return {
		type: 'mvex',
		boxes: view.readBoxes<MovieExtendsBoxChild<V>>(),
	}
}
