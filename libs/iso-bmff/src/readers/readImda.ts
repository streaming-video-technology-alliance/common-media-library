import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a IdentifiedMediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed IdentifiedMediaDataBox
 *
 * @public
 */
export function readImda(view: IsoBoxReadView): IdentifiedMediaDataBox {
	return {
		type: 'imda',
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	}
};
