import type { Fields } from '../boxes/Fields.js';
import type { IdentifiedMediaDataBox } from '../boxes/IdentifiedMediaDataBox.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a IdentifiedMediaDataBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed IdentifiedMediaDataBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function imda(view: IsoView): Fields<IdentifiedMediaDataBox> {
	return {
		imdaIdentifier: view.readUint(4),
		data: view.readData(-1),
	};
};
