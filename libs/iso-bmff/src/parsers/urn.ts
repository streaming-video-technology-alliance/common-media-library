import type { IsoView } from '../IsoView.js';
import type { Fields } from '../boxes/Fields.js';
import type { UrnBox } from '../boxes/UrnBox.js';

/**
 * Parse a UrnBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrnBox
 *
 *
 * @beta
 */
export function urn(view: IsoView): Fields<UrnBox> {
	return {
		...view.readFullBox(),
		name: view.readString(-1),
		location: view.readString(-1),
	};
};
