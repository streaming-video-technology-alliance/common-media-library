import type { IsoView } from '../IsoView.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { UrnBox } from '../boxes/UrnBox.ts';

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
