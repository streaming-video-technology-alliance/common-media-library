import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { Fields } from '../boxes/Fields.ts'
import type { UrnBox } from '../boxes/UrnBox.ts'

/**
 * Parse a UrnBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed UrnBox
 *
 * @public
 */
export function readUrn(view: IsoBoxReadView): Fields<UrnBox> {
	return {
		...view.readFullBox(),
		name: view.readString(-1),
		location: view.readString(-1),
	}
};
