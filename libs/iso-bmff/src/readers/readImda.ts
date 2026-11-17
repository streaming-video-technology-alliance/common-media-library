import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `IdentifiedMediaDataBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `IdentifiedMediaDataBox`
 *
 * @public
 */
export function readImda(view: IsoBoxReadView<IsoInt64>): IdentifiedMediaDataBox {
	return {
		type: 'imda',
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	}
}
