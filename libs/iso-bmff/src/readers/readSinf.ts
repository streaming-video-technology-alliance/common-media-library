import type {
	ProtectionSchemeInfoBox,
	ProtectionSchemeInfoBoxChild,
} from '../boxes/ProtectionSchemeInfoBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `sinf` box (`ProtectionSchemeInfoBox`).
 *
 * The `readers` map does not need an entry for the `sinf` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `ProtectionSchemeInfoBox`
 *
 * @public
 */
export function readSinf(view: IsoBoxReadView<IsoInt64>): ProtectionSchemeInfoBox {
	return {
		type: 'sinf',
		boxes: view.readBoxes<ProtectionSchemeInfoBoxChild>(),
	}
}
