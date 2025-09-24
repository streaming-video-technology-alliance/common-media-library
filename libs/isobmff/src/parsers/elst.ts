import type { EditListBox } from '../boxes/EditListBox.js';
import type { EditListEntry } from '../boxes/EditListEntry.js';
import type { Fields } from '../boxes/Fields.js';
import type { IsoView } from '../IsoView.js';

/**
 * Parse a Box from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function elst(view: IsoView): Fields<EditListBox> {
	const { version, flags } = view.readFullBox();
	const v1 = version === 1;
	const size = v1 ? 8 : 4;

	const entryCount = view.readUint(4);
	const entries = view.readEntries<EditListEntry>(entryCount, () => ({
		segmentDuration: view.readUint(size),
		mediaTime: view.readInt(size),
		mediaRateInteger: view.readInt(2),
		mediaRateFraction: view.readInt(2),
	}));

	return {
		version,
		flags,
		entryCount,
		entries,
	};
};
