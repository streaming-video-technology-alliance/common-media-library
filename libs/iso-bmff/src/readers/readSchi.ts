import type {
	SchemeInformationBox,
	SchemeInformationBoxChild,
} from '../boxes/SchemeInformationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `SchemeInformationBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `schi` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `SchemeInformationBox`
 *
 * @public
 */
export function readSchi(view: IsoBoxReadView): SchemeInformationBox {
	return {
		type: 'schi',
		boxes: view.readBoxes<SchemeInformationBoxChild>(),
	}
}
