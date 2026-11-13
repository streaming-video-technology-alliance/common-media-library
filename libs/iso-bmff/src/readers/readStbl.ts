import type { SampleTableBox, SampleTableBoxChild } from '../boxes/SampleTableBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `SampleTableBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `stbl` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SampleTableBox`
 *
 * @public
 */
export function readStbl(view: IsoBoxReadView<IsoInt64>): SampleTableBox {
	return {
		type: 'stbl',
		boxes: view.readBoxes<SampleTableBoxChild>(),
	}
}
