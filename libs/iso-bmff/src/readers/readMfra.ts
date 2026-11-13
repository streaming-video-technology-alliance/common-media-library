import type {
	MovieFragmentRandomAccessBox,
	MovieFragmentRandomAccessBoxChild,
} from '../boxes/MovieFragmentRandomAccessBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `MovieFragmentRandomAccessBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `mfra` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `MovieFragmentRandomAccessBox`
 *
 * @public
 */
export function readMfra(view: IsoBoxReadView): MovieFragmentRandomAccessBox {
	return {
		type: 'mfra',
		boxes: view.readBoxes<MovieFragmentRandomAccessBoxChild>(),
	}
}
