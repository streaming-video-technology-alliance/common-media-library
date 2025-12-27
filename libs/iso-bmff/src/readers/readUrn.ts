import type { Fields } from '../boxes/types/Fields.ts'
import type { UrnBox } from '../boxes/types/UrnBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

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
