import type {
	ProtectionSchemeInformationBox,
	ProtectionSchemeInformationBoxChild,
} from '../boxes/ProtectionSchemeInformationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a `ProtectionSchemeInformationBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `sinf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ProtectionSchemeInformationBox`
 *
 * @public
 */
export function readSinf(view: IsoBoxReadView): ProtectionSchemeInformationBox {
	return {
		type: 'sinf',
		boxes: view.readBoxes<ProtectionSchemeInformationBoxChild>(),
	}
}
