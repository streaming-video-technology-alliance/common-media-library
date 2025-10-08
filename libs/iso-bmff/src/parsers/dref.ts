import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.js';
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.js';
import type { DataReferenceBox } from '../boxes/DataReferenceBox.js';
import type { Fields } from '../boxes/Fields.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a DataReferenceBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed DataReferenceBox
 *
 *
 * @beta
 */
export function dref(view: IsoView): Fields<DataReferenceBox> {
	const { version, flags } = view.readFullBox();
	const entryCount = view.readUint(4);
	const entries = view.readBoxes<DataEntryUrlBox | DataEntryUrnBox>(entryCount);

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
