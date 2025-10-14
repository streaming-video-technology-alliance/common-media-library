import type { Fields } from '../boxes/Fields.ts'
import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.ts'
import type { IsoView } from '../IsoView.ts'

/**
 * Parse a IdentifiedMediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed IdentifiedMediaDataBox
 *
 *
 * @beta
 */
export function imda(view: IsoView): Fields<IdentifiedMediaDataBox> {
	return {
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	}
};
