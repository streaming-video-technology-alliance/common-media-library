import type {
	AdditionalMetadataContainerBox,
	AdditionalMetadataContainerBoxChild,
} from '../boxes/AdditionalMetadataContainerBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `AdditionalMetadataContainerBox` from an `IsoBoxReadView`.
 *
 * The `readers` map does not need an entry for the `meco` box type.
 * `readIsoBoxes` returns the same box with this reader and without this reader.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AdditionalMetadataContainerBox`
 *
 * @public
 */
export function readMeco(view: IsoBoxReadView<IsoInt64>): AdditionalMetadataContainerBox {
	return {
		type: 'meco',
		boxes: view.readBoxes<AdditionalMetadataContainerBoxChild>(),
	}
}
