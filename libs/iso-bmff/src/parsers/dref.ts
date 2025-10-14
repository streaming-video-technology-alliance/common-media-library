import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts';
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts';
import type { DataReferenceBox } from '../boxes/DataReferenceBox.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { IsoView } from '../IsoView.ts';

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
