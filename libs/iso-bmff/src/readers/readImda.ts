import type { Fields } from '../boxes/types/Fields.ts'
import type { IdentifiedMediaDataBox } from '../boxes/types/IdentifiedMediaDataBox.ts'
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
export function readImda(view: IsoBoxReadView): Fields<IdentifiedMediaDataBox> {
	return {
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	}
};
