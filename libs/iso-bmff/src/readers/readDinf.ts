import type { DataInformationBox, DataInformationBoxChild } from '../boxes/DataInformationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `DataInformationBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `dinf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `DataInformationBox`
 *
 * @public
 */
export function readDinf(view: IsoBoxReadView): DataInformationBox {
	return {
		type: 'dinf',
		boxes: view.readBoxes<DataInformationBoxChild>(),
	}
}
