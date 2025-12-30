import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
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
export function readUrn(view: IsoBoxReadView): DataEntryUrnBox {
	return {
		type: 'urn ',
		...view.readFullBox(),
		name: view.readString(-1),
		location: view.readString(-1),
	}
};
